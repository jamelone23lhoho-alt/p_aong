export const metadata = {
  title: "Temp App",
  description: "Temporary deployment",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
