import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import { first, formatTanggalJam } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function RiwayatPage() {
  const supabase = supabaseTerkonfigurasi() ? await createClient() : null;
  if (!supabase) redirect("/login?panel=absensi&next=/absensi/riwayat");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?panel=absensi");

  const { data } = await supabase!
    .from("absensi")
    .select(
      "id, checked_in_at, latitude, longitude, kegiatan:kegiatan(id, name, code, starts_at, location)"
    )
    .eq("user_id", user!.id)
    .order("checked_in_at", { ascending: false });

  const rows = (data ?? []).map((r) => ({
    ...r,
    kegiatan: first(r.kegiatan),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/absensi"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Kembali
        </Link>
        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Riwayat Absensi
          </h1>
          <Badge variant="info">{rows.length}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Seluruh kehadiran Anda pada kegiatan kecamatan.
        </p>
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              Belum ada riwayat
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Absensi Anda akan tercatat di sini.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Kegiatan</TableHead>
                <TableHead>Waktu Absen</TableHead>
                <TableHead>Lokasi GPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-800">
                      {r.kegiatan?.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                      {r.kegiatan?.code}
                      {r.kegiatan?.location ? ` · ${r.kegiatan.location}` : ""}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs font-semibold text-emerald-700">
                    {formatTanggalJam(r.checked_in_at)}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-slate-500">
                    {r.latitude != null && r.longitude != null
                      ? `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}`
                      : "—"}
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
