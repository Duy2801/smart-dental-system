import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { AppProvider } from "@/providers";
import "./globals.css";

const patientFont = Be_Vietnam_Pro({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-patient",
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
      className={`${patientFont.variable} ${patientFont.className} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-[#0863c5]">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
