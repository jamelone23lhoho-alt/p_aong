export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) {
    return Response.json(
      { ok: false, error: "ยังไม่ได้ตั้งค่า APPS_SCRIPT_URL ในระบบ" },
      { status: 500 }
    );
  }
  try {
    const res = await fetch(`${url}?action=options`, { cache: "no-store" });
    const data = await res.json();
    return Response.json(data, { status: res.ok ? 200 : 502 });
  } catch (err) {
    return Response.json(
      { ok: false, error: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ" },
      { status: 502 }
    );
  }
}
