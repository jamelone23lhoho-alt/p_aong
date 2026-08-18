import RegistrationForm from "@/components/RegistrationForm";

export default function Page() {
  return (
    <main className="shell">
      <header className="hero">
        <img className="hero__logo" src="/assets/logo.png" alt="Energy on the Rocks · Tamca Night Party" />
        <h1 className="lead">ชาร์จพลังคนพันธุ์ร็อค จุดระเบิดความมันส์</h1>
        <p className="lead__sub">
          ขอเชิญพี่น้องชาวอุตสาหกรรมช่างไฟฟ้า ลงทะเบียนบัตรเข้าพักเพื่อร่วมงานเลี้ยงสังสรรค์แห่งปี
        </p>
        <span className="eventchip">เสาร์ 22 สิงหาคม 2569 · Garden in the Sky (Hall 1) สวนนงนุช</span>
      </header>

      <RegistrationForm />

      <footer className="sponsors">
        <span className="sponsors__label">ผู้สนับสนุนงาน</span>
        <div className="sponsors__row">
          <span className="sponsor-chip">
            <img src="/assets/sponsor-1.png" alt="The One Next · TEMCA M&E Expo Thailand 2026" />
          </span>
          <span className="sponsor-chip">
            <img src="/assets/sponsor-2.png" alt="M&E Expo Thailand 2026" />
          </span>
        </div>
      </footer>
    </main>
  );
}
