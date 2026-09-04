import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  QrCode,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import {
  awalHariIniWIB,
  akhirHariIniWIB,
  first,
  formatJam,
  formatTanggal,
  statusKegiatan,
  type Kegiatan,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusKegiatanBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  ASN: "ASN",
  PPPK: "PPPK",
  PPPSU: "PPPSU",
  Kepling: "Kepala Lingkungan",
  Admin: "Administrator",
};

export default async function DashboardOverviewPage() {
  const supabase = supabaseTerkonfigurasi() ? await createClient() : null;
  if (!supabase) redirect("/login?panel=dashboard&next=/dashboard");

  const startHariIni = awalHariIniWIB().toISOString();
  const endHariIni = akhirHariIniWIB().toISOString();
  const awalBulan = new Date();
  awalBulan.setUTCDate(1);
  awalBulan.setUTCHours(0, 0, 0, 0);

  const [
    profilesRes,
    kegiatanRes,
    hadirRes,
    kegiatanBulanRes,
    terbaruRes,
  ] = await Promise.all([
    supabase!.from("profiles").select("staff_type"),
    supabase!
      .from("kegiatan")
      .select("*, absensi(count)")
      .order("starts_at", { ascending: false })
      .limit(60),
    supabase!
      .from("absensi")
      .select("id", { count: "exact", head: true })
      .gte("checked_in_at", startHariIni)
      .lte("checked_in_at", endHariIni),
    supabase!
      .from("kegiatan")
      .select("id", { count: "exact", head: true })
      .gte("starts_at", awalBulan.toISOString()),
    supabase!
      .from("absensi")
      .select(
        "id, checked_in_at, kegiatan:kegiatan(id, name), profiles!absensi_user_id_fkey(full_name, jabatan)"
      )
      .order("checked_in_at", { ascending: false })
      .limit(6),
  ]);

  const profiles = profilesRes.data ?? [];
  const kegiatan: Array<Kegiatan & { absensi: { count: number } }> =
    (kegiatanRes.data ?? []).map((k) => ({ ...k, absensi: first(k.absensi) ?? { count: 0 } }));
  const hadirHariIni = hadirRes.count ?? 0;
  const kegiatanBulan = kegiatanBulanRes.count ?? 0;
  const terbaru = (terbaruRes.data ?? []).map((r) => ({
    ...r,
    kegiatan: first(r.kegiatan),
    profiles: first(r.profiles),
  }));

  const countByType = profiles.reduce<Record<string, number>>((acc, p) => {
    acc[p.staff_type] = (acc[p.staff_type] ?? 0) + 1;
    return acc;
  }, {});

  const aktif = kegiatan.filter(
    (k) => statusKegiatan(k) === "berlangsung" || statusKegiatan(k) === "terjadwal"
  );

  const statCards = [
    {
      label: "Total Pegawai",
      value: profiles.filter((p) => p.staff_type !== "Admin").length,
      sub: "ASN · PPPK · PPPSU · Kepling",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Kegiatan Aktif",
      value: aktif.length,
      sub: "terjadwal & berlangsung",
      icon: <QrCode className="h-5 w-5" />,
    },
    {
      label: "Hadir Hari Ini",
      value: hadirHariIni,
      sub: formatTanggal(new Date()),
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      label: "Kegiatan Bulan Ini",
      value: kegiatanBulan,
      sub: "sejak awal bulan",
      icon: <CalendarDays className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ringkasan</h1>
        <p className="mt-1 text-sm text-slate-500">
          Kondisi kehadiran dan kegiatan Kecamatan Medan Johor.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {s.label}
                </p>
                <p className="mt-2 text-3xl font-extrabold text-brand-950">{s.value}</p>
                <p className="mt-1 text-xs text-slate-400">{s.sub}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                {s.icon}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Kegiatan Terkini</CardTitle>
            <Link
              href="/dashboard/kegiatan"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Kelola semua →
            </Link>
          </CardHeader>
          <CardContent>
            {kegiatan.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  Belum ada kegiatan
                </p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  Buat kegiatan pertama Anda untuk mendapatkan kode QR absensi.
                </p>
                <Link
                  href="/dashboard/kegiatan"
                  className="mt-4 inline-flex h-9 items-center rounded-md bg-brand-900 px-4 text-xs font-semibold text-white hover:bg-brand-800"
                >
                  Buat Kegiatan
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {kegiatan.slice(0, 6).map((k) => (
                  <li key={k.id}>
                    <Link
                      href={`/dashboard/kegiatan/${k.id}`}
                      className="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {k.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatTanggal(k.starts_at)} · {formatJam(k.starts_at)}–
                          {formatJam(k.ends_at)}
                          {k.location ? ` · ${k.location}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-xs text-slate-400 sm:inline">
                          {k.absensi.count} hadir
                        </span>
                        <StatusKegiatanBadge kegiatan={k} />
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Absensi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {terbaru.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-xs leading-relaxed text-slate-500">
                Belum ada absensi tercatat. Absensi pertama akan tampil di sini.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {terbaru.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {a.profiles?.full_name}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {a.kegiatan?.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-emerald-600">
                      {formatJam(a.checked_in_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pegawai per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(TYPE_LABEL).map(([type, label]) => (
              <div
                key={type}
                className="rounded-md border border-slate-200 bg-slate-50/60 px-4 py-3"
              >
                <p className="text-lg font-extrabold text-brand-950">
                  {countByType[type] ?? 0}
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
