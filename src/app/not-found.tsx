import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-card">
        <FileQuestion className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        Halaman yang Anda cari tidak ada atau tautan QR tidak dikenal. Periksa
        kembali tautannya.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-10 items-center rounded-md bg-brand-900 px-5 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Kembali ke Halaman Masuk
      </Link>
      <p className="mt-10 text-[11px] text-slate-400">
        © 2026 Pemerintah Kecamatan Medan Johor · Kota Medan
      </p>
    </div>
  );
}
