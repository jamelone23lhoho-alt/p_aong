import RegistrationForm from "@/components/RegistrationForm";

export default function Page() {
  return (
    <main className="shell">
      <header className="masthead">
        <p className="eyebrow">Booth Crew Night</p>
        <h1>ลงทะเบียนบัตรเข้าพัก</h1>
        <p>สำหรับทีมงานที่ร่วมออกบูธด้วยกัน กรอกข้อมูลบัตรของคุณเพื่อยืนยันที่พักในค่ำคืนงานเลี้ยง</p>
      </header>

      <RegistrationForm />

      <p className="footer-note">ระบบลงทะเบียนภายในทีม · ข้อมูลใช้สำหรับจัดที่พักเท่านั้น</p>
    </main>
  );
}
