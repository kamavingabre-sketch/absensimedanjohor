"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const UNITS = [
  "Kecamatan Medan Johor",
  "Kel. Suka Maju",
  "Kel. Titi Kuning",
  "Kel. Kedai Durian",
  "Kel. Pangkalan Masyhur",
  "Kel. Gedung Johor",
  "Kel. Kwala Bekala",
];

export function PegawaiFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const tipe = params.get("tipe") ?? "";
  const unit = params.get("unit") ?? "";

  function apply(next: { q?: string; tipe?: string; unit?: string }) {
    const p = new URLSearchParams();
    const nq = next.q ?? q;
    const nt = next.tipe ?? tipe;
    const nu = next.unit ?? unit;
    if (nq) p.set("q", nq);
    if (nt) p.set("tipe", nt);
    if (nu) p.set("unit", nu);
    const qs = p.toString();
    router.replace(qs ? `/dashboard/pegawai?${qs}` : "/dashboard/pegawai");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1 sm:flex-none sm:basis-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          placeholder="Cari nama atau jabatan…"
          defaultValue={q}
          onChange={(e) => apply({ q: e.target.value })}
          className="h-9 pl-9"
        />
      </div>

      <select
        value={tipe}
        onChange={(e) => apply({ tipe: e.target.value })}
        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <option value="">Semua Kategori</option>
        <option value="ASN">ASN</option>
        <option value="PPPK">PPPK</option>
        <option value="PPPSU">PPPSU</option>
        <option value="Kepling">Kepling</option>
        <option value="Admin">Admin</option>
      </select>

      <select
        value={unit}
        onChange={(e) => apply({ unit: e.target.value })}
        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <option value="">Semua Unit</option>
        {UNITS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>

      {(q || tipe || unit) && (
        <button
          type="button"
          onClick={() => apply({ q: "", tipe: "", unit: "" })}
          className="h-9 rounded-md px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          Reset
        </button>
      )}
    </div>
  );
}
