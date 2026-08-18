# ลงทะเบียนบัตรเข้าพัก · Booth Crew Nigh

เว็บฟอร์มลงทะเบียนบัตรเข้าพักสำหรับงานปาร์ตี้ของทีมออกบูธ สร้างด้วย **Next.js** (App Router) ใช้ **Google Sheet เป็นฐานข้อมูล** ผ่าน Google Apps Script และ deploy บน **Vercel**

## สิ่งที่มีในเว็บ
- ฟอร์มตามเนื้อหาใน PDF (หมายเลขบัตร 3 หลัก, ประเภทบัตร STANDARD/GOLD/PLATINUM, ชื่อ-นามสกุล, สถานะการเข้าพัก, เบอร์โทร, อีเมล, บริษัท, โรงแรม) โดยเบอร์โทร/อีเมล/บริษัท/โรงแรม เป็นช่องพิมพ์กรอกเอง เพิ่มวันที่/เวลาเช็คอินเพื่อรองรับการจัดที่พัก
- Spinner ตอนโหลดฟอร์ม และ Overlay กันปิดจอตอนกำลังบันทึก
- วันที่/เวลาใช้ flatpickr (วันที่ภาษาไทย, เวลาแบบ 24 ชั่วโมง)
- ใช้ toggle แทน radio button
- รองรับมือถือ + มี transition
- การ์ดพรีวิวบัตรที่เปลี่ยนสีตามระดับบัตร
- ใช้ Tailwind CSS v4 + แพทเทิร์น floating-label จาก HyperUI (MIT) ผสมกับธีมเดิม ฟอนต์ Trirong + Anuphan

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
