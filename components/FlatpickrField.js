"use client";

import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import { Thai } from "flatpickr/dist/l10n/th.js";
import "flatpickr/dist/flatpickr.min.css";

export default function FlatpickrField({ id, mode = "date", value, onValueChange, placeholder, className }) {
  const inputRef = useRef(null);
  const fpRef = useRef(null);
  const cbRef = useRef(onValueChange);
  cbRef.current = onValueChange;

  useEffect(() => {
    const base = {
      allowInput: false,
      onChange: (_dates, dateStr) => cbRef.current(dateStr)
    };

    const config =
      mode === "time"
        ? { ...base, enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true }
        : { ...base, locale: Thai, dateFormat: "j F Y" };

    fpRef.current = flatpickr(inputRef.current, config);
    return () => {
      if (fpRef.current) {
        fpRef.current.destroy();
        fpRef.current = null;
      }
    };
  }, [mode]);

  useEffect(() => {
    const fp = fpRef.current;
    if (fp && value !== fp.input.value) {
      fp.setDate(value || "", false);
    }
  }, [value]);

  return (
    <input
      id={id}
      ref={inputRef}
      className={className}
      placeholder={placeholder}
      readOnly
    />
  );
}
