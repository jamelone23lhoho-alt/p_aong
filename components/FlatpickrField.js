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
      disableMobile: true,
      onChange: (_dates, dateStr) => cbRef.current(dateStr)
    };

    const config =
      mode === "time"
        ? { ...base, enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true }
        : {
            ...base,
            locale: Thai,
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "j F Y",
            altInputClass: className
          };

    fpRef.current = flatpickr(inputRef.current, config);
    return () => {
      if (fpRef.current) fpRef.current.destroy();
    };
  }, [mode, className]);

  useEffect(() => {
    if (fpRef.current && value !== fpRef.current.input.value) {
      fpRef.current.setDate(value || "", false);
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
