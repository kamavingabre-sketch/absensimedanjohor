import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, MapPin, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import {
  first,
  formatTanggal,
  formatJam,
  formatTanggalJam,
  jenisKegiatan,
  jenisPegawai,
  labelJenis,
  type Kegiatan,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusKegiatanBadge } from "@/components/status-badge";
import { BadgeJenis } from "@/components/jenis-badge";
import { Badge } from "@/components/ui/badge";
import { QrCard } from "@/components/dashboard/qr-card";
import { KegiatanRowActions } from "@/components/dashboard/kegiatan-row-actions";

/** Nama bucket Storage tempat foto bukti kehadiran (lihat supabase/schema.sql). */
const BUCKET_BUKTI = "bukti-kehadiran";

export const dynamic = "force-dynamic";

export default async function KegiatanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = supabaseTerkonfigurasi() ? await createClient() : null;
  if (!supabase) redirect("/login?panel=dashboard&next=/dashboard/kegiatan");

  const { data: kegiatan } = await supabase!
    .from("kegiatan")
    .select("*")
    .eq("id", id)
    .single();

  if (!kegiatan) notFound();

  const k = kegiatan as Kegiatan;

  const { data: hadirRaw } = await supabase!
    .from("absensi")
    .select(
      "id, checked_in_at, foto_bukti, profiles!absensi_user_id_fkey(full_name, jabatan, unit, staff_type, staff_status)"
    )
    .eq("kegiatan_id", k.id)
    .order("checked_in_at", { ascending: true });

  const hadir = (hadirRaw ?? []).map((r) => ({
    ...r,
    profiles: first(r.profiles),
  }));

  // Buat signed URL sementara untuk foto bukti (bucket privat) — admin
  // berhak melihat semua foto lewat policy Storage di schema.sql.
  const fotoUrls = new Map<string, string>();
  const fotoPaths = hadir
    .map((a) => String(a.foto_bukti ?? "").trim())
    .filter((p): p is string => Boolean(p));
  if (fotoPaths.length) {
    const { data: signed } = await supabase!.storage
      .from(BUCKET_BUKTI)
      .createSignedUrls([...new Set(fotoPaths)], 60 * 60);
    for (const item of signed ?? []) {
      if (item?.path && item.signedUrl) fotoUrls.set(item.path, item.signedUrl);
    }
  }

  return (
    <div className="space-y-6">
      <div className="no-print">
        <Link
          href="/dashboard/kegiatan"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali ke daftar kegiatan
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {k.name}
            </h1>
            <StatusKegiatanBadge kegiatan={k} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              {formatTanggal(k.starts_at)} · {formatJam(k.starts_at)}–{formatJam(k.ends_at)}{" "}
              WIB
            </span>
            {k.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {k.location}
              </span>
            )}
            <span className="font-mono text-slate-400">{k.code}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold">Jenis peserta:</span>
            <BadgeJenis kategori={k.kategori} />
          </div>
          {k.description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              {k.description}
            </p>
          )}
        </div>
        <div className="no-print">
          <KegiatanRowActions id={k.id} isTerakhir={!k.is_active} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <QrCard
            code={k.code}
            kegiatanName={k.name}
            subtitle={`Jenis: ${labelJenis(jenisKegiatan(k))} · ${formatTanggal(k.starts_at)} · ${formatJam(k.starts_at)}–${formatJam(k.ends_at)} WIB${k.location ? ` · ${k.location}` : ""}`}
          />
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-700" />
              Pegawai Hadir
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {(hadir ?? []).length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(hadir ?? []).length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-xs leading-relaxed text-slate-500">
                Belum ada pegawai yang absen untuk kegiatan ini.
              </p>
            ) : (
              <div className="max-h-[480px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead className="whitespace-nowrap">Jam</TableHead>
                      <TableHead className="whitespace-nowrap">Foto Bukti</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(hadir ?? []).map((a, i) => {
                      const jenis = jenisPegawai(a.profiles);
                      const fotoPath = String(a.foto_bukti ?? "").trim();
                      const fotoUrl = fotoUrls.get(fotoPath) ?? null;
                      return (
                        <TableRow key={a.id ?? i}>
                          <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-slate-800">
                              {a.profiles?.full_name}
                            </p>
                            <p className="text-[11px] text-slate-400">{a.profiles?.unit}</p>
                          </TableCell>
                          <TableCell>
                            {jenis.length ? (
                              <div className="flex flex-wrap gap-1">
                                {jenis.map((t) => (
                                  <Badge
                                    key={t}
                                    variant={
                                      t === "ASN"
                                        ? "info"
                                        : t === "PPPK"
                                          ? "success"
                                          : t === "PPPSU"
                                            ? "warning"
                                            : "default"
                                    }
                                  >
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <p className="truncate text-xs text-slate-600">
                              {a.profiles?.jabatan}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs font-semibold text-emerald-600">
                            {formatTanggalJam(a.checked_in_at)}
                          </TableCell>
                          <TableCell>
                            {fotoPath ? (
                              fotoUrl ? (
                                <a
                                  href={fotoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Lihat foto bukti kehadiran (buka di tab baru)"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={fotoUrl}
                                    alt={`Foto bukti kehadiran ${a.profiles?.full_name ?? ""}`}
                                    className="h-10 w-10 rounded-md border border-slate-200 bg-slate-100 object-cover"
                                  />
                                </a>
                              ) : (
                                <span
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-400"
                                  title="Foto tersimpan, tautan sedang tidak tersedia"
                                >
                                  <Camera className="h-4 w-4" />
                                </span>
                              )
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
