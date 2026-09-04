"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Printer, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function QrCard({
  code,
  kegiatanName,
  subtitle,
}: {
  code: string;
  kegiatanName: string;
  subtitle: string;
}) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
    const origin = env || window.location.origin;
    setUrl(`${origin}/absensi/${code}`);
  }, [code]);

  function salin() {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("Tautan disalin ke papan klip.");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Gagal menyalin. Salin manual dari alamat di bawah."));
  }

  return (
    <div className="print-qr-area mx-auto w-full max-w-[420px] rounded-lg border border-slate-200 bg-white p-8 text-center shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Kecamatan Medan Johor
      </p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">{kegiatanName}</h3>
      <p className="text-xs text-slate-500">{subtitle}</p>

      <div className="mx-auto mt-6 w-fit rounded-lg border-2 border-slate-900 p-4">
        {url ? (
          <QRCodeSVG value={url} size={240} level="M" marginSize={0} />
        ) : (
          <div className="h-[240px] w-[240px] animate-pulse rounded-md bg-slate-100" />
        )}
      </div>

      <p className="mt-5 font-mono text-2xl font-bold tracking-[0.2em] text-brand-950">
        {code}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        Tunjukkan layar ini pada petugas/pegawai.
        <br />
        Pindai dengan kamera atau buka tautan berikut:
      </p>
      <p className="mt-2 break-all font-mono text-[11px] text-slate-500">{url || "…"}</p>

      <div className="no-print mt-6 flex justify-center gap-2">
        <Button size="sm" variant="outline" onClick={salin} disabled={!url}>
          {copied ? <Check /> : <Copy />}
          {copied ? "Tersalin" : "Salin Tautan"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer /> Cetak
        </Button>
      </div>
    </div>
  );
}
