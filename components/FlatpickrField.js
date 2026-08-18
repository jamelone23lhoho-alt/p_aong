"use client";

export default function FlatpickrField({ id, mode = "date", value, onValueChange, className }) {
  return (
    <input
      id={id}
      type={mode === "time" ? "time" : "date"}
      className={className}
      value={value || ""}
      onChange={(e) => onValueChange(e.target.value)}
    />
  );
}
