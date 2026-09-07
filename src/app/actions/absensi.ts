"use server";

import { revalidatePath } from "next/cache";
import { createClient, supabaseTerkonfigurasi } from "@/lib/supabase/server";
import {
  jenisKegiatan,
  jenisPegawai,
  labelJenis,
} from "@/lib/utils";

export interface CheckInState {
  error?: string;
  time?: string;
}

interface CheckInPayload {
  kegiatanId: string;
  /** Path objek di Storage bucket "bukti-kehadiran" — WAJIB diisi. */
  fotoBukti?: string | null;
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

  // --- Gerbang kategori peserta: kegiatan ASN hanya bisa diabsensi ASN, dst. ---
  const { data: profile } = await supabase!
    .from("profiles")
    .select("staff_type, staff_status")
    .eq("id", userId)
    .maybeSingle();

  const jenisPeserta = jenisKegiatan(kegiatan);
  const jenisAkun = jenisPegawai(profile);
  const diundang = jenisAkun.some((t) => jenisPeserta.includes(t));
  if (!diundang) {
    const akun = jenisAkun.length ? labelJenis(jenisAkun) : "bukan ASN/PPPK/PPPSU/Kepling";
    return {
      error:
        `Kegiatan ini khusus untuk kategori ${labelJenis(jenisPeserta)}, ` +
        `sedangkan akun Anda terdaftar sebagai ${akun}. Anda tidak dapat absen ` +
        "pada kegiatan ini.",
    };
  }

  // --- Foto bukti kehadiran wajib dikirim sebelum absen tercatat. ---
  const fotoBukti = String(payload.fotoBukti ?? "").trim();
  if (!fotoBukti || !fotoBukti.startsWith(`${userId}/`)) {
    return {
      error:
        "Foto bukti kehadiran wajib dikirim sebelum absen dapat tercatat. " +
        "Silakan ambil/pilih foto lalu kirim kembali.",
    };
  }

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
    foto_bukti: fotoBukti,
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
