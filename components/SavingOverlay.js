"use client";

import { useEffect } from "react";

export default function SavingOverlay({ message = "กำลังบันทึกข้อมูล…" }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="overlay" role="alertdialog" aria-live="assertive" aria-busy="true">
      <div className="overlay__spin" />
      <p>{message}</p>
    </div>
  );
}
