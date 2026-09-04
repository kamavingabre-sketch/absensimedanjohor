"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ScanLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function ScannerInner({ onDetect }: { onDetect: (code: string) => void }) {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const doneRef = React.useRef(false);

  React.useEffect(() => {
    let scanner: import("html5-qrcode").Html5Qrcode | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        scanner = new Html5Qrcode("qr-reader-box");
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => {
            if (doneRef.current) return;
            const m = text.match(/absensi\/([A-Za-z0-9-]{4,})/);
            if (m) {
              doneRef.current = true;
              onDetect(m[1]);
            } else {
              toast.error("Kode QR tidak dikenali sebagai kode kegiatan.");
            }
          },
          () => {}
        );
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError(
            "Kamera tidak dapat diakses. Pastikan izin kamera diizinkan dan koneksi Anda aman (HTTPS)."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner!.clear())
          .catch(() => {});
      }
    };
  }, [onDetect]);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md bg-slate-900">
        <div id="qr-reader-box" className="w-full [&_video]:w-full" />
      </div>
      {loading && !error && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyalakan kamera…
        </p>
      )}
      {error && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          {error}
        </p>
      )}
    </div>
  );
}

export function QrScannerDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const handleDetect = React.useCallback(
    (code: string) => {
      setOpen(false);
      router.push(`/absensi/${code}`);
      router.refresh();
    },
    [router]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full sm:w-auto">
          <ScanLine /> Pindai QR Kegiatan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pindai QR Kegiatan</DialogTitle>
          <DialogDescription>
            Arahkan kamera ke kode QR yang ditunjukkan petugas. Anda juga bisa
            memindai langsung dengan aplikasi kamera ponsel, lalu membuka
            tautan yang muncul.
          </DialogDescription>
        </DialogHeader>
        {open && <ScannerInner onDetect={handleDetect} />}
      </DialogContent>
    </Dialog>
  );
}
