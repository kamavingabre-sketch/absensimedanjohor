"use server";

import { revalidatePath } from "next/cache";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";

export interface CheckInState {
  error?: string;
  time?: string;
}

interface CheckInPayload {
  kegiatanId: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  deviceInfo?: string;
}

export async function checkIn(
  _prev: CheckInState,
  payload: CheckInPayload
): Promise<CheckInState> {
  if (!supabaseTerkonfigurasi()) {
    return { error: "Supabase belum dikonfigurasi." };
  }
  const supabase = await createClient();
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData.user) return { error: "Sesi tidak valid. Silakan masuk kembali." };
  const userId = userData.user.id;

  const { data: kegiatan } = await supabase!
    .from("kegiatan")
    .select("*")
    .eq("id", payload.kegiatanId)
    .single();

  if (!kegiatan) return { error: "Kegiatan tidak ditemukan." };
  if (!kegiatan.is_active) return { error: "Kegiatan ini telah diakhiri oleh petugas." };

  const now = new Date();
  const start = new Date(kegiatan.starts_at);
  const end = new Date(kegiatan.ends_at);
  if (now < start) return { error: "Kegiatan belum dimulai. Silakan absen setelah kegiatan dibuka." };
  if (now > end) return { error: "Waktu absen kegiatan ini telah selesai." };

  const { data: existing } = await supabase!
    .from("absensi")
    .select("id")
    .eq("kegiatan_id", kegiatan.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return { error: "Anda sudah tercatat hadir untuk kegiatan ini." };
  }

  const { error: insertError } = await supabase!.from("absensi").insert({
    kegiatan_id: kegiatan.id,
    user_id: userId,
    latitude: payload.latitude ?? null,
    longitude: payload.longitude ?? null,
    accuracy: payload.accuracy ?? null,
    device_info: payload.deviceInfo ?? null,
  });

  if (insertError) {
    // Kemungkinan absen ganda (sudah tercatat)
    if (String(insertError.code) === "23505") {
      return { error: "Anda sudah tercatat hadir untuk kegiatan ini." };
    }
    return { error: "Absensi gagal disimpan. Coba lagi." };
  }

  revalidatePath("/absensi");
  revalidatePath("/absensi/riwayat");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/kegiatan");
  revalidatePath(`/dashboard/kegiatan/${kegiatan.id}`);

  return {
    time: new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now).replace(".", ":"),
  };
}
