"use client";

export default function FloatingInput({
  id,
  label,
  value,
  onChange,
  error,
  inputMode,
  maxLength,
  autoComplete,
  type = "text"
}) {
  const wrap =
    "relative block rounded-xl border bg-field px-4 pt-5 pb-2 transition duration-200 focus-within:bg-fieldfocus focus-within:ring-4 focus-within:ring-brass/15 " +
    (error ? "border-danger" : "border-line focus-within:border-brass");

  return (
    <label htmlFor={id} className={wrap}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        placeholder={label}
        className="peer block h-6 w-full border-none bg-transparent p-0 font-body text-[15px] leading-6 text-ink placeholder:text-transparent focus:outline-none focus:ring-0"
      />
      <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 font-body text-[15px] text-inkfaint transition-all duration-200 peer-focus:top-[13px] peer-focus:text-xs peer-focus:text-brassdeep peer-[:not(:placeholder-shown)]:top-[13px] peer-[:not(:placeholder-shown)]:text-xs">
        {label}
      </span>
    </label>
  );
}
