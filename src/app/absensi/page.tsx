import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, MapPin, ScanLine } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import {
  first,
  formatJam,
  formatTanggal,
  formatTanggalJam,
  statusKegiatan,
  type Kegiatan,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusKegiatanBadge } from "@/components/status-badge";
import { CheckInButton } from "@/components/absensi/check-in-button";
import { QrScannerDialog } from "@/components/absensi/qr-scanner-dialog";

export const dynamic = "force-dynamic";

export default async function AbsensiPage({
  searchParams,
}: {
  searchParams: Promise<{ pesan?: string }>;
}) {
  const params = await searchParams;
  const supabase = supabaseTerkonfigurasi() ? await createClient() : null;
  if (!supabase) redirect("/login?panel=absensi&next=/absensi");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?panel=absensi");

  const kegiatanRes = await supabase!
    .from("kegiatan")
    .select("*")
    .eq("is_active", true)
    .order("starts_at", { ascending: true })
    .limit(30);

  const kegiatanIds = (kegiatanRes.data ?? []).map((k) => k.id);

  const [riwayatRes, absenAktifRes] = await Promise.all([
    supabase!
      .from("absensi")
      .select(
        "id, checked_in_at, kegiatan:kegiatan(id, name, starts_at, location, code)"
      )
      .eq("user_id", user!.id)
      .order("checked_in_at", { ascending: false })
      .limit(8),
    kegiatanIds.length
      ? supabase!
          .from("absensi")
          .select("kegiatan_id")
          .eq("user_id", user!.id)
          .in("kegiatan_id", kegiatanIds)
      : Promise.resolve({ data: [] as Array<{ kegiatan_id: string }> }),
  ]);

  const kegiatan: Kegiatan[] = kegiatanRes.data ?? [];
  const riwayat = (riwayatRes.data ?? []).map((r) => ({
    ...r,
    kegiatan: first(r.kegiatan),
  }));

  const sudahAbsenIds = new Set(
    (absenAktifRes.data ?? []).map((a) => a.kegiatan_id)
  );

  const berlangsung = kegiatan.filter((k) => statusKegiatan(k) === "berlangsung");
  const terjadwal = kegiatan.filter((k) => statusKegiatan(k) === "terjadwal");

  const namaDepan = user?.user_metadata?.full_name
    ? String(user.user_metadata.full_name).split(/\s+/).slice(0, 2).join(" ")
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {namaDepan ? `Selamat datang, ${namaDepan}` : "Selamat datang"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {formatTanggal(new Date())}. Aktivasi GPS pada perangkat Anda agar
          titik lokasi ikut tercatat.
        </p>
      </div>

      {params.pesan && (
        <div className="rounded-md border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {params.pesan}
        </div>
      )}

      {kegiatan.length === 0 ? (
        <Card>
          <CardContent className="px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Belum ada kegiatan aktif
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Anda akan melihat kegiatan di sini setelah petugas membuat kegiatan
              dari Dashboard. Anda juga dapat memindai QR kegiatan secara
              langsung.
            </p>
            <div className="mt-5 flex justify-center">
              <QrScannerDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Kegiatan Berlangsung
              </h2>
              <span className="text-xs text-slate-400">
                {berlangsung.length} kegiatan
              </span>
            </div>

            {berlangsung.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
                Tidak ada kegiatan yang sedang berlangsung saat ini.
              </p>
            ) : (
              berlangsung.map((k) => {
                const sudah = sudahAbsenIds.has(k.id);
                return (
                  <Card key={k.id}>
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                              {k.name}
                            </h3>
                            <StatusKegiatanBadge kegiatan={k} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {formatJam(k.starts_at)}–{formatJam(k.ends_at)} WIB
                            </span>
                            {k.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {k.location}
                              </span>
                            )}
                          </div>
                          {k.description && (
                            <p className="mt-2 max-w-xl text-xs leading-relaxed text-slate-600">
                              {k.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        {sudah ? (
                          <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                            <span className="text-base">✓</span>
                            Anda sudah tercatat hadir untuk kegiatan ini.
                          </div>
                        ) : (
                          <CheckInButton kegiatanId={k.id} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {terjadwal.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Terjadwal
              </h2>
              {terjadwal.map((k) => (
                <Card key={k.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{k.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatTanggal(k.starts_at)} · mulai {formatJam(k.starts_at)} WIB
                        {k.location ? ` · ${k.location}` : ""}
                      </p>
                    </div>
                    <Badge variant="warning">Belum dimulai</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Riwayat Absensi
          </h2>
          <Link
            href="/absensi/riwayat"
            className="flex items-center gap-0.5 text-xs font-semibold text-brand-700 hover:underline"
          >
            Semua <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {riwayat.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-xs text-slate-500">
            Belum ada riwayat absensi.
          </p>
        ) : (
          <Card>
            <CardContent className="p-2">
              <ul className="divide-y divide-slate-100">
                {riwayat.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {r.kegiatan?.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {r.kegiatan ? formatTanggal(r.kegiatan.starts_at) : ""}
                        {r.kegiatan?.code ? ` · ${r.kegiatan.code}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      {formatTanggalJam(r.checked_in_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ScanLine className="h-3.5 w-3.5" />
        Pindai QR langsung dari petugas melalui tombol di atas kegiatan, atau
        pakai aplikasi kamera ponsel.
      </p>
    </div>
  );
}
