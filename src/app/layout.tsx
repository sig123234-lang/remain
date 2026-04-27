import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "remAIn",
  description: "한국 요양원 회상치료 AI 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
