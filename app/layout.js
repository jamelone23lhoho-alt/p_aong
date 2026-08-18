import "./globals.css";

export const metadata = {
  title: "Energy on the Rocks · Tamca Night Party",
  description: "ลงทะเบียนบัตรเข้าพักงาน Energy on the Rocks · Tamca Night Party"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#060a12"
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&family=Kanit:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
