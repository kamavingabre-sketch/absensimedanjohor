"use server";

import { revalidatePath } from "next/cache";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import { buatTokenKegiatan } from "@/lib/utils";

export interface KegiatanState {
  error?: string;
  createdId?: string;
}

function hariIniWIB(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts;
}

export async function createKegiatan(
  _prev: KegiatanState,
  formData: FormData
): Promise<KegiatanState> {
  if (!supabaseTerkonfigurasi()) {
    return { error: "Supabase belum dikonfigurasi." };
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const date = String(formData.get("date") || "");
  const timeStart = String(formData.get("time_start") || "");
  const timeEnd = String(formData.get("time_end") || "");

  if (!name) return { error: "Nama kegiatan wajib diisi." };
  if (!date || !timeStart || !timeEnd) {
    return { error: "Tanggal dan jam mulai/selesai wajib diisi." };
  }

  // Tanggal & jam diambil dari form adalah waktu WIB —
  // pahami secara eksplisit +07:00 agar tidak terpengaruh timezone server.
  const startsAt = new Date(`${date}T${timeStart}:00+07:00`);
  const endsAt = new Date(`${date}T${timeEnd}:00+07:00`);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "Format tanggal atau jam tidak valid." };
  }
  if (endsAt <= startsAt) {
    return { error: "Jam selesai harus setelah jam mulai." };
  }
  if (date < hariIniWIB()) {
    return { error: "Tanggal kegiatan tidak boleh di masa lalu." };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) return { error: "Sesi tidak valid. Silakan masuk kembali." };

  const { data, error } = await supabase!
    .from("kegiatan")
    .insert({
      code: buatTokenKegiatan(),
      name,
      description,
      location,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      created_by: userData.user.id,
    })
    .select("id, code")
    .single();

  if (error || !data) {
    return { error: "Kegiatan gagal disimpan. Coba lagi." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/kegiatan");
  return { createdId: data.id };
}

export async function setActiveKegiatan(id: string, active: boolean): Promise<void> {
  if (!supabaseTerkonfigurasi()) return;
  const supabase = await createClient();
  await supabase!.from("kegiatan").update({ is_active: active }).eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/kegiatan");
  revalidatePath(`/dashboard/kegiatan/${id}`);
  revalidatePath("/absensi");
}
