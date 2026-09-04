import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, QrCode, CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import {
  formatJam,
  formatTanggal,
  formatTanggalJam,
  statusKegiatan,
  type Kegiatan,
} from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StatusKegiatanBadge } from "@/components/status-badge";
import { CheckInButton } from "@/components/absensi/check-in-button";

export const dynamic = "force-dynamic";

export default async function KodeKegiatanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = supabaseTerkonfigurasi() ? await createClient() : null;
  if (!supabase) redirect(`/login?panel=absensi&next=/absensi/${code}`);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?panel=absensi&next=/absensi/${code}`);

  const { data: kegiatan } = await supabase!
    .from("kegiatan")
    .select("*")
    .ilike("code", code)
    .single();

  if (!kegiatan) notFound();

  const k = kegiatan as Kegiatan;
  const status = statusKegiatan(k);

  const { data: sudah } = await supabase!
    .from("absensi")
    .select("checked_in_at")
    .eq("kegiatan_id", k.id)
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <Link
        href="/absensi"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke beranda absensi
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand-950 text-gold-400">
          <QrCode className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Kode Kegiatan
          </p>
          <p className="font-mono text-lg font-bold tracking-[0.15em] text-brand-950">
            {k.code}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="max-w-md text-xl font-extrabold leading-snug tracking-tight text-slate-900">
              {k.name}
            </h1>
            <StatusKegiatanBadge kegiatan={k} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-slate-600">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              {formatTanggal(k.starts_at)} · {formatJam(k.starts_at)}–
              {formatJam(k.ends_at)} WIB
            </span>
            {k.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400" />
                {k.location}
              </span>
            )}
          </div>

          {k.description && (
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {k.description}
            </p>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            {sudah ? (
              <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4">
                <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">
                    Anda sudah tercatat hadir
                  </p>
                  <p className="mt-0.5 text-xs text-emerald-700">
                    Jam absen: {formatTanggalJam(sudah.checked_in_at)} WIB
                  </p>
                </div>
              </div>
            ) : status === "ditiadakan" ? (
              <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Kegiatan ini telah diakhiri oleh petugas, sehingga tidak dapat
                lagi digunakan untuk absen.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-slate-600">
                  Tekan tombol di bawah untuk mencatat kehadiran Anda pada
                  kegiatan ini.
                </p>
                <CheckInButton kegiatanId={k.id} size="lg" label="Hadir — Catat Kehadiran" />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
