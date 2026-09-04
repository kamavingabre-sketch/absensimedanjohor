"use server";

import { redirect } from "next/navigation";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  success?: boolean;
}

function nextValid(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export async function signInPanel(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const panel = String(formData.get("panel") || "absensi");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = nextValid(formData.get("next") as string | null);

  if (!supabaseTerkonfigurasi()) {
    return {
      error: "Supabase belum dikonfigurasi. Isi variabel environment terlebih dahulu (lihat .env.example).",
    };
  }
  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase!.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Email atau password salah. Periksa kembali." };
  }

  const { data: userData } = await supabase!.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { error: "Sesi tidak valid. Silakan coba lagi." };

  const { data: prof } = await supabase!.from("profiles").select("*").eq("id", userId).single();

  if (!prof) {
    return { error: "Akun Anda belum terdaftar dalam data pegawai. Hubungi operator kecamatan." };
  }
  if (!prof.active) {
    return { error: "Akun Anda sedang nonaktif. Hubungi operator kecamatan." };
  }

  if (panel === "dashboard" && prof.role !== "admin") {
    return {
      error: "Akun ini tidak memiliki akses Dashboard. Silakan masuk melalui panel Absensi.",
    };
  }

  redirect(next ?? (panel === "dashboard" ? "/dashboard" : "/absensi"));
}

export async function signOut(): Promise<void> {
  if (!supabaseTerkonfigurasi()) {
    redirect("/login");
    return;
  }
  const supabase = await createClient();
  await supabase!.auth.signOut();
  redirect("/login");
}
