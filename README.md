# ลงทะเบียนบัตรเข้าพัก · Booth Crew Night

เว็บฟอร์มลงทะเบียนบัตรเข้าพักสำหรับงานปาร์ตี้ของทีมออกบูธ สร้างด้วย **Next.js** (App Router) ใช้ **Google Sheet เป็นฐานข้อมูล** ผ่าน Google Apps Script และ deploy บน **Vercel**

## สิ่งที่มีในเว็บ
- ฟอร์มตามเนื้อหาใน PDF (หมายเลขบัตร 3 หลัก, ประเภทบัตร STANDARD/GOLD/PLATINUM, ชื่อ-นามสกุล, สถานะการเข้าพัก, เบอร์โทร, อีเมล, บริษัท, โรงแรม) โดยเบอร์โทร/อีเมล/บริษัท/โรงแรม เป็นช่องพิมพ์กรอกเอง เพิ่มวันที่/เวลาเช็คอินเพื่อรองรับการจัดที่พัก
- Spinner ตอนโหลดฟอร์ม และ Overlay กันปิดจอตอนกำลังบันทึก
- วันที่/เวลาใช้ flatpickr (วันที่ภาษาไทย, เวลาแบบ 24 ชั่วโมง)
- ใช้ toggle แทน radio button
- รองรับมือถือ + มี transition
- การ์ดพรีวิวบัตรที่เปลี่ยนสีตามระดับบัตร
- ธีม "Energy on the Rocks" (พื้นดำ + สายฟ้าน้ำเงิน) ฟอนต์ Kanit + Anuphan โลโก้/รูปวง/เวิร์ดมาร์ก bodyslam/โลโก้ผู้สนับสนุน ดึงจากไฟล์ .psd ของงานจริง (อยู่ใน `public/assets/`)
- ใช้ Tailwind CSS v4 + แพทเทิร์น floating-label จาก HyperUI (MIT)
- สร้าง QR ประจำตัว (รหัสสุ่มไม่ซ้ำต่อคน) พร้อมปุ่มดาวน์โหลดรูปหลังลงทะเบียนเสร็จ
- ส่งอีเมลยืนยันอัตโนมัติพร้อม QR + ฟังก์ชันส่งอีเมลประกาศถึงทุกคน

## โครงสร้าง
```
app/                หน้าเว็บและ API route (proxy ไป Apps Script)
components/          ฟอร์ม, toggle, flatpickr, spinner, overlay
google-apps-script/ Code.gs สำหรับวางใน Apps Script ของ Google Sheet
```

## ขั้นตอนที่ 1 — ตั้งค่า Google Sheet + Apps Script
1. สร้าง Google Sheet ใหม่ 1 ไฟล์
2. เมนู **ส่วนขยาย (Extensions) → Apps Script**
3. ลบโค้ดเดิม แล้ววางเนื้อหาจาก `google-apps-script/Code.gs` ทั้งหมด แล้วบันทึก
4. รันฟังก์ชัน `initialize` หนึ่งครั้ง (กดอนุญาตสิทธิ์) หรือกลับมาที่ชีทแล้วใช้เมนู **ระบบลงทะเบียน → Initialize ชีท**
   - จะได้ชีทเดียวชื่อ `_database` แบ่งเป็น 2 ตารางในแผ่นเดียว: ตารางตัวเลือก (สำหรับ toggle ประเภทบัตร/สถานะการเข้าพัก) 2 คอลัมน์ เว้น 1 คอลัมน์ แล้วตารางบันทึกข้อมูล 12 คอลัมน์
   - แก้รายการประเภทบัตร/สถานะการเข้าพักได้ในตารางตัวเลือกฝั่งซ้าย
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. คัดลอก **Web app URL** ที่ลงท้าย `/exec`

> การอ่าน/เขียนใช้คำสั่ง `getValues` / `setValues` แบบ batch ทั้งบล็อก และไม่มีการเรียก `file.setSharing` (ไม่แตะ Google Drive)

## ขั้นตอนที่ 2 — รันในเครื่อง (ถ้าต้องการ)
```
npm install
cp .env.example .env.local
```
เปิด `.env.local` แล้วใส่ URL จากขั้นตอนที่ 1
```
APPS_SCRIPT_URL=https://script.google.com/macros/s/xxxx/exec
```
จากนั้น
```
npm run dev
```

## ขั้นตอนที่ 3 — ขึ้น GitHub + Vercel
1. push โฟลเดอร์นี้ขึ้น GitHub repo
2. เข้า Vercel → **Add New → Project** → เลือก repo → Framework ตรวจพบ **Next.js** อัตโนมัติ
3. ที่ **Environment Variables** เพิ่ม
   - Key: `APPS_SCRIPT_URL`
   - Value: Web app URL จากขั้นตอนที่ 1
4. กด **Deploy**

เว็บจะเรียก Apps Script ผ่าน API route ฝั่งเซิร์ฟเวอร์ ทำให้ไม่ติดปัญหา CORS และไม่เปิดเผย URL ของ Apps Script บนฝั่ง client

## อีเมล & QR (Amazon SES)

**QR ประจำตัว** — ตอนกดยืนยัน ระบบสุ่มรหัส (token) ให้แต่ละคนไม่ซ้ำกัน แล้วสร้าง QR จาก `เลขบัตร-รหัสสุ่ม` โชว์ในหน้าสำเร็จ (บันทึกลงเครื่อง/แกลเลอรีได้ผ่านปุ่มหรือกดค้างที่รูป) และเก็บในคอลัมน์ "รหัส QR" ของชีท

ระบบส่งอีเมลทำผ่าน Apps Script โดยยิงเข้า Amazon SES API v2 (`/v2/email/outbound-emails`) พร้อมเซ็น request แบบ AWS Signature V4 ในโค้ดให้แล้ว (ไม่ต้องใช้ไลบรารีนอก) รูป QR ในอีเมลดึงจาก api.qrserver.com จึงไม่ต้องแตะ Google Drive

ตั้งค่าก่อนใช้งาน:
1. ใน AWS Console เปิด Amazon SES เลือก region ที่ต้องการ (ค่าเริ่มต้นในโค้ดคือ `ap-southeast-1` สิงคโปร์ — แก้ที่ตัวแปร `AWS_REGION` ได้)
2. **Verify identity**: ยืนยันโดเมนผู้ส่ง (ตั้ง DKIM/SPF) หรืออย่างน้อยยืนยันอีเมลผู้ส่ง แล้วแก้ `MAIL_FROM` / `MAIL_FROM_NAME` ให้ตรง
3. **ออกจาก Sandbox**: บัญชี SES ใหม่จะอยู่ในโหมด sandbox (ส่งได้เฉพาะอีเมลที่ verify แล้ว) ต้องกด Request production access เพื่อส่งถึงผู้เข้าร่วมทั่วไปได้
4. สร้าง IAM user ที่มีสิทธิ์ `ses:SendEmail` แล้วเอา Access Key ID / Secret Access Key มาใส่ผ่านเมนู **ระบบลงทะเบียน → ตั้งค่า Amazon SES Key** (เก็บใน Script Properties ไม่ฝังในโค้ด)
5. เปิด/ปิดอีเมลยืนยันอัตโนมัติได้ที่ตัวแปร `SEND_CONFIRMATION`

**ส่งอีเมลประกาศถึงทุกคน** — แก้ข้อความที่ `ANNOUNCE_SUBJECT` / `ANNOUNCE_HTML` แล้วใช้เมนู **ระบบลงทะเบียน → ส่งอีเมลประกาศถึงทุกคน** ระบบส่งทีละคน ข้ามคนที่ส่งไปแล้ว (คอลัมน์ "สถานะส่งประกาศ") และหยุดเองเมื่อใกล้ครบเวลา 5 นาที ให้รันซ้ำจนครบ

### เรื่องปริมาณ (วันละ ~1000)
- Amazon SES ราคาถูกมาก ~$0.10 ต่อ 1,000 อีเมล (30k/เดือน ≈ $3)
- ต้องออกจาก sandbox ก่อน และโควตาการส่งเริ่มต้นจะค่อย ๆ เพิ่มตามชื่อเสียงการส่ง (rate เริ่มต้นมักพอสำหรับ 1000/วันหลังได้ production access)
- ยืนยันโดเมน (DKIM/SPF/DMARC) ให้ครบเพื่อ deliverability ที่ดี
