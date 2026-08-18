export default function Spinner({ small = false }) {
  return <span className={small ? "spinner spinner--sm" : "spinner"} role="status" aria-label="กำลังโหลด" />;
}
