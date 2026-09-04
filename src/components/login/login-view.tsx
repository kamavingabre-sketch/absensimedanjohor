"use client";

import * as React from "react";
import { useActionState } from "react";
import { Landmark, LayoutDashboard, ScanLine, Check, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInPanel, type AuthState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

interface LoginViewProps {
  panel: "dashboard" | "absensi";
  next: string | null;
  configured: boolean;
  isQrScan: boolean;
}

/* Pola batik parang samar untuk panel kiri */
const PATTERN =
  "data:image/svg+xml,%3Csvg width='56' height='56' viewBox='0 0 56 56' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='white' stroke-opacity='0.07' stroke-width='1.2'%3E%3Cpath d='M-8 64 C 8 48, 8 8, 24 -8'/%3E%3Cpath d='M8 64 C 24 48, 24 8, 40 -8'/%3E%3Cpath d='M24 64 C 40 48, 40 8, 56 -8'/%3E%3Cpath d='M40 64 C 56 48, 56 8, 72 -8'/%3E%3C/g%3E%3C/svg%3E";

const STAFF_STATS = [
  { label: "ASN", value: "83" },
  { label: "PPPK", value: "110" },
  { label: "PPPSU", value: "38" },
  { label: "Kepling", value: "79" },
];

function PanelForm({
  name,
  title,
  description,
  icon,
  active,
  highlight,
  next,
  buttonLabel,
}: {
  name: "dashboard" | "absensi";
  title: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  highlight?: string | null;
  next: string | null;
  buttonLabel: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signInPanel,
    {}
  );

  return (
    <Card
      className={cn(
        "relative flex flex-col p-6",
        active && "ring-2 ring-brand-600 ring-offset-1"
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand-800">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold leading-tight text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>

      {highlight && (
        <p className="mb-4 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-xs leading-relaxed text-brand-800">
          {highlight}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="panel" value={name} />
        {next && <input type="hidden" name="next" value={next} />}

        <div className="space-y-1.5">
          <Label htmlFor={`${name}-email`} className="text-slate-700">
            Email
          </Label>
          <Input
            id={`${name}-email`}
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@medanjohor.go.id"
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${name}-password`} className="text-slate-700">
            Password
          </Label>
          <Input
            id={`${name}-password`}
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10"
          />
        </div>

        {state.error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-relaxed text-red-700"
          >
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {buttonLabel}
        </Button>
      </form>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
        Lupa password? Hubungi operator kecamatan.
      </p>
    </Card>
  );
}

export function LoginView({ panel, next, configured, isQrScan }: LoginViewProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-12">
      {/* ===== Panel kiri: identitas ===== */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 lg:flex lg:col-span-7 xl:p-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: `url("${PATTERN}")` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-brand-900/60 to-transparent"
          aria-hidden
        />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50">
            Pemerintah Kota Medan
          </p>
          <div className="mt-3 h-px w-full bg-white/15" />
        </div>

        <div className="relative max-w-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-500/50">
              <Landmark className="h-6 w-6 text-gold-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
                Sistem Kehadiran Pegawai
              </p>
              <p className="text-lg font-bold text-white">Kecamatan Medan Johor</p>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-extrabold leading-tight tracking-tight text-white xl:text-[44px]">
            Absensi Digital
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Pencatatan kehadiran pegawai dan kegiatan kecamatan berbasis QR.
            Setiap kegiatan memiliki kode sendiri — petugas menyiapkan, pegawai
            memindai, kehadiran tercatat lengkap dengan waktu dan lokasi.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Satu kegiatan, satu kode QR yang disiapkan dari Dashboard",
              "Tercatat otomatis: nama, jabatan, jam, dan titik lokasi",
              "Riwayat kehadiran dapat ditelusuri kapan saja",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-500/20">
                  <Check className="h-2.5 w-2.5 text-gold-400" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="mb-6 flex gap-8">
            {STAFF_STATS.map((s) => (
              <div key={s.label}>
                <p className="text-xl font-extrabold text-white">{s.value}</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-white/40">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <div className="h-px w-full bg-white/15" />
          <p className="mt-4 text-xs text-white/40">
            © 2026 Pemerintah Kecamatan Medan Johor · Kota Medan
          </p>
        </div>
      </div>

      {/* ===== Panel kanan: formulir ===== */}
      <div className="flex min-h-screen flex-col bg-slate-50 lg:col-span-5">
        {/* Brand ringkas untuk layar kecil */}
        <div className="border-b border-slate-200 bg-white px-6 py-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-950 text-gold-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-950">Absensi Digital</p>
              <p className="text-xs text-slate-500">Kecamatan Medan Johor · Kota Medan</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-10 xl:px-14">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Masuk ke sistem
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Pilih panel sesuai peran Anda.
            </p>
          </div>

          {!configured && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Supabase belum dikonfigurasi</AlertTitle>
              <AlertDescription>
                Login akan aktif setelah kredensial Supabase diisi. Salin{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono">
                  .env.example
                </code>{" "}
                menjadi <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono">.env.local</code>{" "}
                lalu isi variabelnya, dan jalankan <code className="rounded bg-amber-100 px-1 py-0.5 text-[11px] font-mono">npm run seed</code>{" "}
                untuk mendaftarkan akun pegawai.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <PanelForm
              name="dashboard"
              title="Dashboard"
              description="Untuk petugas pengelola kegiatan dan absensi."
              icon={<LayoutDashboard className="h-5 w-5" />}
              active={panel === "dashboard"}
              next={next}
              buttonLabel="Masuk Dashboard"
            />
            <PanelForm
              name="absensi"
              title="Absensi"
              description="Untuk pegawai dan petugas kecamatan."
              icon={<ScanLine className="h-5 w-5" />}
              active={panel === "absensi"}
              next={next}
              highlight={
                isQrScan
                  ? "Anda memindai QR kegiatan. Selesaikan login untuk melanjutkan absen."
                  : null
              }
              buttonLabel="Masuk Absensi"
            />
          </div>

          <p className="mt-8 text-center text-xs text-slate-400 lg:hidden">
            © 2026 Pemerintah Kecamatan Medan Johor · Kota Medan
          </p>
        </div>
      </div>
    </div>
  );
}
