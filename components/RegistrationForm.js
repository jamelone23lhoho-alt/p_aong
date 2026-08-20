"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Spinner from "@/components/Spinner";
import SavingOverlay from "@/components/SavingOverlay";
import Segmented from "@/components/Segmented";
import FlatpickrField from "@/components/FlatpickrField";
import FloatingInput from "@/components/FloatingInput";

const EMPTY = {
  cardNo: "",
  firstName: "",
  lastName: "",
  role: "",
  phone: "",
  email: "",
  company: "",
  hotel: "",
  checkinDate: "",
  checkinTime: ""
};

const box = (err) =>
  "w-full rounded-xl border bg-field px-4 py-3.5 font-body text-[15px] text-ink placeholder:text-inkfaint transition duration-200 focus:bg-fieldfocus focus:outline-none focus:ring-4 focus:ring-brass/15 " +
  (err ? "border-danger" : "border-line focus:border-brass");

function genToken() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function RegistrationForm() {
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [options, setOptions] = useState({ roles: [] });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [savedNo, setSavedNo] = useState("");
  const [savedToken, setSavedToken] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const captureRef = useRef(null);

  const loadOptions = async () => {
    setStatus("loading");
    setLoadError("");
    try {
      const res = await fetch("/api/options", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "โหลดตัวเลือกไม่สำเร็จ");
      setOptions({
        roles: data.roles?.length ? data.roles : ["ผู้เข้าพักหลัก", "ผู้เข้าร่วมพัก"]
      });
      setStatus("ready");
    } catch (err) {
      setLoadError(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      setStatus("error");
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (status === "done" && savedToken) {
      QRCode.toDataURL(`${savedNo}-${savedToken}`, {
        width: 480,
        margin: 1,
        color: { dark: "#1f1a26", light: "#ffffff" }
      })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [status, savedToken, savedNo]);

  const themeStyle = { "--tier": "#33a9e8", "--tier-soft": "rgba(51,169,232,0.16)" };

  const set = (key) => (val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!/^\d{3}$/.test(form.cardNo)) e.cardNo = true;
    if (!form.firstName.trim()) e.firstName = true;
    if (!form.lastName.trim()) e.lastName = true;
    if (!form.role) e.role = true;
    if (!/^\d{9,10}$/.test(form.phone.replace(/\D/g, ""))) e.phone = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = true;
    if (!form.company.trim()) e.company = true;
    if (!form.hotel.trim()) e.hotel = true;
    if (!form.checkinDate) e.checkinDate = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setSubmitError("");
    if (!validate()) {
      setSubmitError("กรุณากรอกข้อมูลให้ครบและถูกต้องก่อนยืนยัน");
      return;
    }
    const token = genToken();
    setStatus("saving");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, token })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setSavedNo(form.cardNo);
      setSavedToken(token);
      setStatus("done");
    } catch (err) {
      setSubmitError(err.message || "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
      setStatus("ready");
    }
  };

  const saveQR = async () => {
    const node = captureRef.current;
    if (!node) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(node, { backgroundColor: "#0a1524", scale: 2, useCORS: true });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) return;
      const file = new File([blob], `temca-pass-${savedNo}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Temca Night Party", text: "บัตรเลขที่ " + savedNo });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `temca-pass-${savedNo}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setErrors({});
    setSubmitError("");
    setSavedNo("");
    setSavedToken("");
    setQrDataUrl("");
    setStatus("ready");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (status === "loading") {
    return (
      <div className="center-state">
        <Spinner />
        <p>กำลังเตรียมแบบฟอร์ม…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="center-state">
        <p>{loadError}</p>
        <button type="button" className="link-btn" onClick={loadOptions}>
          ลองโหลดใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="success" style={themeStyle}>
        <div ref={captureRef} className="capture">
          <div className="success__mark">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>ลงทะเบียนเรียบร้อย</h2>
          <p>นี่คือ QR ประจำตัวของคุณ ใช้แสดงตอนเข้าที่พัก แล้วเจอกันที่งานปาร์ตี้</p>
          <p className="event-name">Energy on the Rocks · Temca Night Party</p>

          <div className="qr-box">
            {qrDataUrl && <img src={qrDataUrl} alt="QR บัตรเข้าพัก" className="qr-img" />}
          </div>
        </div>

        <div className="receipt">
          <span>บัตรเลขที่</span>
          <span>{savedNo}</span>
        </div>

        <p className="qr-note">กดปุ่มด้านล่างเพื่อบันทึกบัตรทั้งใบลงเครื่อง (หรือแคปหน้าจอไว้ก็ได้)</p>

        <button type="button" className="submit" onClick={saveQR}>
          บันทึกบัตรลงเครื่อง
        </button>
        <div style={{ marginTop: 10 }}>
          <button type="button" className="link-btn" onClick={reset}>
            ลงทะเบียนอีกคน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={themeStyle}>
      {status === "saving" && <SavingOverlay />}

      <div className="pass" aria-hidden="false">
        <div className="pass__row">
          <div>
            <div className="pass__label">หมายเลขบัตรเข้าพัก</div>
            <div className="pass__no">{form.cardNo || "— — —"}</div>
          </div>
        </div>
        <div className="pass__name">
          {form.firstName || form.lastName ? (
            `${form.firstName} ${form.lastName}`.trim()
          ) : (
            <span>ชื่อผู้ถือบัตร</span>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <div className="form">
          <div className="group">
            <label className="field-label" htmlFor="cardNo">
              หมายเลขบัตรเข้าพัก <small>ออกโดยสมาคม · เลข 3 หลัก</small>
            </label>
            <input
              id="cardNo"
              className={box(errors.cardNo) + " text-center font-display text-3xl font-semibold tracking-[0.35em] py-4"}
              inputMode="numeric"
              maxLength={3}
              placeholder="000"
              value={form.cardNo}
              onChange={(e) => set("cardNo")(e.target.value.replace(/\D/g, "").slice(0, 3))}
            />
          </div>

          <div className="grid-2">
            <FloatingInput id="firstName" label="ชื่อ" value={form.firstName} onChange={(e) => set("firstName")(e.target.value)} error={errors.firstName} />
            <FloatingInput id="lastName" label="นามสกุล" value={form.lastName} onChange={(e) => set("lastName")(e.target.value)} error={errors.lastName} />
          </div>

          <div className="group">
            <span className="field-label">สถานะการเข้าพัก</span>
            <Segmented options={options.roles} value={form.role} onChange={set("role")} ariaLabel="สถานะการเข้าพัก" />
          </div>

          <div className="grid-2">
            <FloatingInput id="phone" label="เบอร์โทร" value={form.phone} onChange={(e) => set("phone")(e.target.value)} error={errors.phone} inputMode="tel" autoComplete="tel" />
            <FloatingInput id="email" label="อีเมล" value={form.email} onChange={(e) => set("email")(e.target.value)} error={errors.email} inputMode="email" autoComplete="email" />
          </div>

          <FloatingInput id="company" label="บริษัท / ทีมออกบูธ" value={form.company} onChange={(e) => set("company")(e.target.value)} error={errors.company} />

          <FloatingInput id="hotel" label="โรงแรมที่เข้าพัก" value={form.hotel} onChange={(e) => set("hotel")(e.target.value)} error={errors.hotel} />

          <div className="grid-2">
            <div className="group">
              <label className="field-label" htmlFor="checkinDate">วันที่เข้าพัก</label>
              <FlatpickrField id="checkinDate" mode="date" value={form.checkinDate} onValueChange={set("checkinDate")} placeholder="เลือกวันที่" className={box(errors.checkinDate) + " cursor-pointer"} />
            </div>
            <div className="group">
              <label className="field-label" htmlFor="checkinTime">
                เวลาเช็คอิน <small>ถ้ามี</small>
              </label>
              <FlatpickrField id="checkinTime" mode="time" value={form.checkinTime} onValueChange={set("checkinTime")} placeholder="เช่น 14:00" className={box(false) + " cursor-pointer"} />
            </div>
          </div>

          {submitError && <div className="error">{submitError}</div>}

          <button type="button" className="submit" onClick={submit}>
            ยืนยันการลงทะเบียน
          </button>
          <p className="hint">ตรวจสอบข้อมูลให้ครบก่อนกดยืนยัน · ข้อมูลจะถูกบันทึกเข้าระบบทันที</p>
        </div>
      </div>
    </div>
  );
}
