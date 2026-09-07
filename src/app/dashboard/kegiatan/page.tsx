import Link from "next/link";
import { QrCode, MapPin } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import { first, formatTanggal, formatJam, type Kegiatan } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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
import { CreateKegiatanDialog } from "@/components/dashboard/create-kegiatan-dialog";
import { KegiatanRowActions } from "@/components/dashboard/kegiatan-row-actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function KegiatanPage() {
  const supabase = supabaseTerkonfigurasi() ? await createClient() : null;
  if (!supabase) redirect("/login?panel=dashboard&next=/dashboard/kegiatan");
  const { data } = await supabase!
    .from("kegiatan")
    .select("*, absensi(count)")
    .order("starts_at", { ascending: false });

  const rows: Array<Kegiatan & { absensi: { count: number } }> = (data ?? []).map(
    (k) => ({ ...k, absensi: first(k.absensi) ?? { count: 0 } })
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Kegiatan
            </h1>
            <Badge variant="info">{rows.length}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Setiap kegiatan memiliki kode QR tersendiri. Pilih jenis pesertanya
            (ASN / PPPK / PPPSU / Kepling); kehadiran tercatat setelah peserta
            mengirimkan foto bukti.
          </p>
        </div>
        <CreateKegiatanDialog />
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              <QrCode className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Belum ada kegiatan
            </p>
            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
              Klik <span className="font-semibold">Kegiatan Baru</span> untuk membuat
              kegiatan pertama. Kode QR akan langsung tersedia untuk dipindai.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Kegiatan</TableHead>
                <TableHead className="whitespace-nowrap">Waktu</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Jenis Peserta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Hadir</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((k) => (
                <TableRow key={k.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/kegiatan/${k.id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-brand-700 hover:underline"
                    >
                      {k.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">{k.code}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-slate-600">
                    {formatTanggal(k.starts_at)}
                    <br />
                    <span className="text-slate-400">
                      {formatJam(k.starts_at)}–{formatJam(k.ends_at)} WIB
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{k.location ?? "—"}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <BadgeJenis kategori={k.kategori} />
                  </TableCell>
                  <TableCell>
                    <StatusKegiatanBadge kegiatan={k} />
                  </TableCell>
                  <TableCell className="text-center text-sm font-semibold text-slate-700">
                    {k.absensi.count}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <KegiatanRowActions
                        id={k.id}
                        isTerakhir={!k.is_active}
                      />
                      <Link
                        href={`/dashboard/kegiatan/${k.id}`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <QrCode className="h-3.5 w-3.5" /> QR
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
