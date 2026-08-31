import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProvider } from "@/providers";
import "./globals.css";

const nunito = localFont({
  src: [
    {
      path: "../../public/font/Nunito/Nunito-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../../public/font/Nunito/Nunito-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Smart Dental System",
    template: "%s | Smart Dental System",
  },
  description: "Smart Dental System - Hệ thống quản lý và chăm sóc sức khỏe nha khoa thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${nunito.variable} ${nunito.className} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-[#0863c5]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
