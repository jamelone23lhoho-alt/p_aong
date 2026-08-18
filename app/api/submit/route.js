export const dynamic = "force-dynamic";

export async function POST(req) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) {
    return Response.json(
      { ok: false, error: "ยังไม่ได้ตั้งค่า APPS_SCRIPT_URL ในระบบ" },
      { status: 500 }
    );
  }
  try {
    const record = await req.json();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "submit", record }),
      redirect: "follow",
      cache: "no-store"
    });
    const data = await res.json();
    return Response.json(data, { status: res.ok ? 200 : 502 });
  } catch (err) {
    return Response.json(
      { ok: false, error: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 502 }
    );
  }
}
