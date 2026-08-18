"use client";

export default function Segmented({ options, value, onChange, tier = false, ariaLabel }) {
  return (
    <div
      className={tier ? "seg seg--tier" : "seg"}
      data-count={options.length}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            className="seg__btn"
            aria-pressed={active}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
