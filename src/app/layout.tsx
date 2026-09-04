import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
      weight: "200 800",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-wght-normal.woff2",
      weight: "200 800",
      style: "normal",
    },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Absensi Digital · Kecamatan Medan Johor",
    template: "%s · Kecamatan Medan Johor",
  },
  description:
    "Sistem kehadiran dan kegiatan pegawai Kecamatan Medan Johor, Kota Medan. Pencatatan absensi berbasis QR per kegiatan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
