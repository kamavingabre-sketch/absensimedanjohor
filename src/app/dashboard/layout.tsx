import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, LayoutDashboard, QrCode, Users, Landmark } from "lucide-react";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import { formatTanggalLengkap } from "@/lib/utils";
import { NavLink } from "@/components/dashboard/nav-link";
import { LogoutButton } from "@/components/dashboard/logout-button";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Saat Supabase belum dikonfigurasi, biarkan halaman anak yang
  // mengarahkan ke login (agar parameter "next" tetap terbawa).
  if (!supabaseTerkonfigurasi()) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) redirect("/login?panel=dashboard");

  const { data: profile } = await supabase!
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/absensi");

  const nama = String(profile.full_name ?? "");
  const initials = nama
    .split(/\s+/)
    .slice(0, 2)
    .map((s: string) => s.replace(/[^A-Za-z]/g, "").charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* ===== Sidebar ===== */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white md:flex print:hidden">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-950 text-gold-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-brand-950">
                Absensi Digital
              </p>
              <p className="truncate text-[11px] text-slate-500">Kecamatan Medan Johor</p>
            </div>
          </div>

          <div className="px-3 pt-4">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Menu Utama
            </p>
            <nav className="space-y-1">
              <NavLink href="/dashboard" label="Ringkasan" icon={<LayoutDashboard />} exact />
              <NavLink href="/dashboard/kegiatan" label="Kegiatan" icon={<CalendarDays />} />
              <NavLink href="/dashboard/pegawai" label="Data Pegawai" icon={<Users />} />
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-200 p-3">
            <div className="mb-2 flex items-center gap-3 rounded-md bg-slate-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                {initials || "AD"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {profile.full_name}
                </p>
                <p className="truncate text-[11px] text-slate-500">Administrator</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </aside>

        {/* ===== Konten ===== */}
        <div className="flex min-h-screen w-full flex-col md:pl-64">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 print:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-950 text-gold-400 md:hidden">
                <Landmark className="h-4 w-4" />
              </div>
              <p className="hidden text-xs text-slate-500 sm:block">
                {formatTanggalLengkap(new Date())}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 sm:inline">
                Panel Dashboard
              </span>
              <Link
                href="/absensi"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Lihat sebagai Pegawai
              </Link>
            </div>
          </header>

          {/* Nav bawah untuk mobile */}
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden print:hidden">
            <NavLink href="/dashboard" label="Ringkasan" icon={<LayoutDashboard />} exact />
            <NavLink href="/dashboard/kegiatan" label="Kegiatan" icon={<QrCode />} />
            <NavLink href="/dashboard/pegawai" label="Pegawai" icon={<Users />} />
          </nav>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0">{children}</main>

          <footer className="px-4 pb-6 text-center text-[11px] text-slate-400 sm:px-6 print:hidden">
            © 2026 Pemerintah Kecamatan Medan Johor · Kota Medan
          </footer>
        </div>
      </div>
    </div>
  );
}
