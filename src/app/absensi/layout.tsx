import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/dashboard/logout-button";

export const dynamic = "force-dynamic";

export default async function AbsensiLayout({
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
  if (!user) redirect("/login?panel=absensi");

  const { data: profile } = await supabase!
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login?panel=absensi");

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-950 text-gold-400">
              <Landmark className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-brand-950">
                Absensi Digital
              </p>
              <p className="truncate text-[11px] text-slate-500">Kecamatan Medan Johor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[200px] truncate text-sm font-semibold leading-tight text-slate-800">
                {profile.full_name}
              </p>
              <p className="max-w-[200px] truncate text-[11px] text-slate-500">
                {profile.jabatan}
              </p>
            </div>
            <LogoutButton className="h-9 px-2.5" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:py-8">{children}</main>

      <footer className="pb-6 text-center text-[11px] text-slate-400">
        © 2026 Pemerintah Kecamatan Medan Johor · Kota Medan
      </footer>
    </div>
  );
}
