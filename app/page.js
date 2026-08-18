export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        gap: "8px",
      }}
    >
      <h1 style={{ margin: 0 }}>Deploy สำเร็จแล้ว 🎉</h1>
      <p style={{ color: "#666", margin: 0 }}>Next.js is running on Vercel</p>
    </main>
  );
}
