"use client";

import { useEffect, useMemo, useState } from "react";
import Spinner from "@/components/Spinner";
import SavingOverlay from "@/components/SavingOverlay";
import Segmented from "@/components/Segmented";
import FlatpickrField from "@/components/FlatpickrField";

const TIER_COLOR = {
  STANDARD: { c: "#6b7280", s: "rgba(107,114,128,0.14)" },
  GOLD: { c: "#b3892f", s: "rgba(179,137,47,0.16)" },
  PLATINUM: { c: "#8793a8", s: "rgba(135,147,168,0.16)" }
};

const EMPTY = {
  cardNo: "",
  tier: "",
  firstName: "",
  lastName: "",
  role: "",
  phone: "",
  company: "",
  hotel: "",
  checkinDate: "",
  checkinTime: ""
};

export default function RegistrationForm() {
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState("");
  const [options, setOptions] = useState({ tiers: [], roles: [], hotels: [], companies: [] });
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [savedNo, setSavedNo] = useState("");

  const loadOptions = async () => {
    setStatus("loading");
    setLoadError("");
    try {
      const res = await fetch("/api/options", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "โหลดตัวเลือกไม่สำเร็จ");
      setOptions({
        tiers: data.tiers?.length ? data.tiers : ["STANDARD", "GOLD", "PLATINUM"],
        roles: data.roles?.length ? data.roles : ["ผู้เข้าพักหลัก", "ผู้เข้าร่วมพัก"],
        hotels: data.hotels || [],
        companies: data.companies || []
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

  const tierStyle = useMemo(() => {
    const t = TIER_COLOR[form.tier] || TIER_COLOR.STANDARD;
    return { "--tier": t.c, "--tier-soft": t.s };
  }, [form.tier]);

  const set = (key) => (val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!/^\d{3}$/.test(form.cardNo)) e.cardNo = true;
    if (!form.tier) e.tier = true;
    if (!form.firstName.trim()) e.firstName = true;
    if (!form.lastName.trim()) e.lastName = true;
    if (!form.role) e.role = true;
    if (!/^\d{9,10}$/.test(form.phone.replace(/\D/g, ""))) e.phone = true;
    if (!form.company.trim()) e.company = true;
    if (!form.hotel) e.hotel = true;
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
    setStatus("saving");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      setSavedNo(form.cardNo);
      setStatus("done");
    } catch (err) {
      setSubmitError(err.message || "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง");
      setStatus("ready");
    }
  };

  const reset = () => {
    setForm(EMPTY);
    setErrors({});
    setSubmitError("");
    setSavedNo("");
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
      <div className="success" style={tierStyle}>
        <div className="success__mark">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2>ลงทะเบียนเรียบร้อย</h2>
        <p>บันทึกข้อมูลบัตรเข้าพักของคุณเข้าสู่ระบบแล้ว แล้วเจอกันที่งานปาร์ตี้</p>
        <div className="receipt">
          <span>บัตรเลขที่</span>
          <span>{savedNo}</span>
        </div>
        <div>
          <button type="button" className="link-btn" onClick={reset}>
            ลงทะเบียนอีกคน
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={tierStyle}>
      {status === "saving" && <SavingOverlay />}

      <div className="pass" aria-hidden="false">
        <div className="pass__row">
          <div>
            <div className="pass__label">หมายเลขบัตรเข้าพัก</div>
            <div className="pass__no">{form.cardNo || "— — —"}</div>
          </div>
          <div className="pass__tier">{form.tier || "เลือกบัตร"}</div>
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
              className={errors.cardNo ? "input input--pin field-error" : "input input--pin"}
              inputMode="numeric"
              maxLength={3}
              placeholder="000"
              value={form.cardNo}
              onChange={(e) => set("cardNo")(e.target.value.replace(/\D/g, "").slice(0, 3))}
            />
          </div>

          <div className="group">
            <span className="field-label">ประเภทบัตร</span>
            <Segmented
              options={options.tiers}
              value={form.tier}
              onChange={set("tier")}
              tier
              ariaLabel="ประเภทบัตร"
            />
          </div>

          <div className="grid-2">
            <div className="group">
              <label className="field-label" htmlFor="firstName">ชื่อ</label>
              <input
                id="firstName"
                className={errors.firstName ? "input field-error" : "input"}
                placeholder="ชื่อจริง"
                value={form.firstName}
                onChange={(e) => set("firstName")(e.target.value)}
              />
            </div>
            <div className="group">
              <label className="field-label" htmlFor="lastName">นามสกุล</label>
              <input
                id="lastName"
                className={errors.lastName ? "input field-error" : "input"}
                placeholder="นามสกุล"
                value={form.lastName}
                onChange={(e) => set("lastName")(e.target.value)}
              />
            </div>
          </div>

          <div className="group">
            <span className="field-label">สถานะการเข้าพัก</span>
            <Segmented
              options={options.roles}
              value={form.role}
              onChange={set("role")}
              ariaLabel="สถานะการเข้าพัก"
            />
          </div>

          <div className="group">
            <label className="field-label" htmlFor="phone">เบอร์โทร</label>
            <input
              id="phone"
              className={errors.phone ? "input field-error" : "input"}
              inputMode="tel"
              placeholder="08x-xxx-xxxx"
              value={form.phone}
              onChange={(e) => set("phone")(e.target.value)}
            />
          </div>

          <div className="group">
            <label className="field-label" htmlFor="company">บริษัท</label>
            <input
              id="company"
              className={errors.company ? "input field-error" : "input"}
              placeholder="ชื่อบริษัทหรือทีมออกบูธ"
              list="company-list"
              value={form.company}
              onChange={(e) => set("company")(e.target.value)}
            />
            <datalist id="company-list">
              {options.companies.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="group">
            <label className="field-label" htmlFor="hotel">โรงแรมที่เข้าพัก</label>
            <select
              id="hotel"
              className={errors.hotel ? "select field-error" : "select"}
              value={form.hotel}
              onChange={(e) => set("hotel")(e.target.value)}
            >
              <option value="" disabled>
                เลือกโรงแรม
              </option>
              {options.hotels.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="group">
              <label className="field-label" htmlFor="checkinDate">วันที่เข้าพัก</label>
              <FlatpickrField
                id="checkinDate"
                mode="date"
                value={form.checkinDate}
                onValueChange={set("checkinDate")}
                placeholder="เลือกวันที่"
              />
              {errors.checkinDate && (
                <span style={{ fontSize: 12, color: "var(--danger)" }}>กรุณาเลือกวันที่</span>
              )}
            </div>
            <div className="group">
              <label className="field-label" htmlFor="checkinTime">
                เวลาเช็คอิน <small>ถ้ามี</small>
              </label>
              <FlatpickrField
                id="checkinTime"
                mode="time"
                value={form.checkinTime}
                onValueChange={set("checkinTime")}
                placeholder="เช่น 14:00"
              />
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
