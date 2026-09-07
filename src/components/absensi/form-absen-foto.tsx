"use client";

import * as React from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Trash2,
} from "lucide-react";
import { checkIn, type CheckInState } from "@/app/actions/absensi";
import { unggahFotoBukti } from "@/lib/supabase/unggah-bukti";
import { Button } from "@/components/ui/button";

function ambilLokasi(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
} | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { timeout: 6000, maximumAge: 30000 }
    );
  });
}

/**
 * Absen dengan foto bukti kehadiran:
 *   1. Petugas/pegawai wajib mengambil/memilih foto terlebih dahulu.
 *   2. Foto diunggah ke Storage "bukti-kehadiran".
 *   3. Baru setelah foto berhasil terkirim, kehadiran dicatat (checkIn).
 */
export function FormAbsenFoto({ kegiatanId }: { kegiatanId: string }) {
  const kameraRef = React.useRef<HTMLInputElement>(null);
  const galeriRef = React.useRef<HTMLInputElement>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [tahap, setTahap] = React.useState<null | "foto" | "absen">(null);
  const [hasil, setHasil] = React.useState<CheckInState | null>(null);

  function pilihFile(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setHasil({ error: "File yang dipilih bukan gambar. Pilih foto berformat JPG/PNG/HEIC." });
      return;
    }
    setHasil(null);
    setFile(f);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  }

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function kirimAbsen() {
    if (!file) {
      setHasil({
        error:
          "Foto bukti kehadiran wajib dikirim. Silakan ambil/pilih foto terlebih dahulu.",
      });
      return;
    }

    setHasil(null);
    setTahap("foto");

    let path: string;
    try {
      path = await unggahFotoBukti(file);
    } catch (e) {
      setHasil({
        error:
          e instanceof Error ? e.message : "Foto gagal diunggah. Coba lagi.",
      });
      setTahap(null);
      return;
    }

    setTahap("absen");
    const loc = await ambilLokasi();
    const res = await checkIn({}, {
      kegiatanId,
      fotoBukti: path,
      latitude: loc?.latitude,
      longitude: loc?.longitude,
      accuracy: loc?.accuracy,
      deviceInfo:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
    setHasil(res);
    setTahap(null);
  }

  const sibuk = tahap !== null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3">
        <p className="flex items-start gap-2 text-sm font-semibold leading-relaxed text-brand-800">
          <Camera className="mt-0.5 h-4 w-4 shrink-0" />
          Foto bukti kehadiran wajib dikirim
        </p>
        <p className="mt-1 text-xs leading-relaxed text-brand-700">
          Kehadiran baru dicatat setelah foto bukti berhasil terkirim. Foto
          dapat berupa swafoto di lokasi kegiatan atau dokumentasi kegiatan.
        </p>
      </div>

      <div>
        {preview ? (
          <div className="overflow-hidden rounded-md border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Pratinjau foto bukti kehadiran"
              className="max-h-64 w-full bg-slate-100 object-contain"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <ImagePlus className="h-7 w-7 text-slate-400" />
            <p className="text-xs font-medium text-slate-500">
              Belum ada foto dipilih
            </p>
            <p className="text-[11px] text-slate-400">
              Gunakan tombol di bawah untuk mengambil atau memilih foto.
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            ref={kameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              pilihFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <input
            ref={galeriRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              pilihFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={sibuk}
            onClick={() => kameraRef.current?.click()}
          >
            <Camera /> {preview ? "Ambil Ulang" : "Ambil Foto"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={sibuk}
            onClick={() => galeriRef.current?.click()}
          >
            <ImagePlus /> Pilih dari Galeri
          </Button>
          {preview && (
            <Button
              type="button"
              variant="ghost"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={sibuk}
              onClick={() => {
                setFile(null);
                setPreview(null);
                setHasil(null);
              }}
            >
              <Trash2 /> Hapus
            </Button>
          )}
        </div>
      </div>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!file || sibuk}
        onClick={kirimAbsen}
      >
        {tahap === "foto" ? (
          <Loader2 className="animate-spin" />
        ) : tahap === "absen" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <CheckCircle2 />
        )}
        {tahap === "foto"
          ? "Mengunggah foto…"
          : tahap === "absen"
            ? "Mencatat kehadiran…"
            : "Kirim Foto & Catat Hadir"}
      </Button>

      {tahap && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          {tahap === "foto" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Foto sedang dikirim… mohon tunggu.
            </>
          ) : (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Foto terkirim — kehadiran sedang dicatat.
            </>
          )}
        </p>
      )}

      {hasil?.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-bold text-red-800">Absensi belum tercatat</p>
            <p className="mt-0.5 text-xs leading-relaxed text-red-700">
              {hasil.error}
            </p>
          </div>
        </div>
      )}

      {hasil?.time && !hasil.error && (
        <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4">
          <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-bold text-emerald-800">
              Kehadiran tercatat ✓
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700">
              <MapPin className="h-3 w-3" />
              Foto bukti terkirim. Jam absen: {hasil.time} WIB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
