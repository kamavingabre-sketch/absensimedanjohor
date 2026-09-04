import { Suspense } from "react";
import { Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
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
import { PegawaiFilter } from "@/components/dashboard/pegawai-filter";

export const dynamic = "force-dynamic";

const TYPE_BADGE: Record<string, "info" | "warning" | "success" | "danger" | "default"> = {
  ASN: "info",
  PPPK: "success",
  PPPSU: "warning",
  Kepling: "default",
  Admin: "danger",
};

export default async function PegawaiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipe?: string; unit?: string }>;
}) {
  const params = await searchParams;
  const supabase = supabaseTerkonfigurasi() ? await createClient() : null;
  if (!supabase) redirect("/login?panel=dashboard&next=/dashboard/pegawai");

  let query = supabase!
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (params.tipe) query = query.eq("staff_type", params.tipe);
  if (params.unit) query = query.eq("unit", params.unit);
  if (params.q) {
    // Buang karakter yang punya makna khusus di filter PostgREST
    const q = params.q.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
    if (q) query = query.or(`full_name.ilike.%${q}%,jabatan.ilike.%${q}%`);
  }

  const { data } = await query;
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Data Pegawai
          </h1>
          <Badge variant="info">{rows.length}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Pegawai Kecamatan Medan Johor beserta kelurahannya.
        </p>
      </div>

      <div className="relative">
        <Suspense>
          <PegawaiFilter />
        </Suspense>
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">Tidak ditemukan</p>
            <p className="mt-1 text-xs text-slate-500">
              Coba ubah kata kunci atau filter pencarian.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Email Login</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs text-slate-400">{i + 1}</TableCell>
                  <TableCell>
                    <p className="text-sm font-medium text-slate-800">{p.full_name}</p>
                    {Array.isArray(p.staff_status) && p.staff_status.length > 1 && (
                      <p className="text-[11px] text-slate-400">
                        {p.staff_status.join(" / ")}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <p className="truncate text-xs text-slate-600">{p.jabatan}</p>
                  </TableCell>
                  <TableCell>
                    <span className="whitespace-nowrap text-xs text-slate-600">
                      {p.unit}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TYPE_BADGE[p.staff_type] ?? "default"}>
                      {p.staff_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="break-all font-mono text-[11px] text-slate-500">
                      {p.email}
                    </span>
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
