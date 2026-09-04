import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginView } from "@/components/login/login-view";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string; next?: string }>;
}) {
  const params = await searchParams;
  const configured = supabaseTerkonfigurasi();

  // Sudah login? Langsung arahkan ke panelnya.
  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();
    if (user) {
      const { data: prof } = await supabase!
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      redirect(prof?.role === "admin" ? "/dashboard" : "/absensi");
    }
  }

  const panel = params.panel === "dashboard" ? "dashboard" : "absensi";
  const next =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : null;

  return (
    <LoginView
      panel={panel}
      next={next}
      configured={configured}
      isQrScan={Boolean(next && /^\/absensi\/[A-Za-z0-9-]{4,}$/.test(next))}
    />
  );
}
