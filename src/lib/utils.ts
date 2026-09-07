import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type KegiatanStatus = "terjadwal" | "berlangsung" | "selesai" | "ditiadakan";

/** Kategori pegawai yang absensinya dibedakan per kegiatan. */
export const JENIS_ABSEN = ["ASN", "PPPK", "PPPSU", "Kepling"] as const;
export type JenisAbsen = (typeof JENIS_ABSEN)[number];

export interface Kegiatan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  /** Kategori peserta yang boleh absen (kosong = semua jenis, perilaku lama). */
  kategori?: string[] | null;
}

export interface Profile {
  id: string;
  full_name: string;
  jabatan: string;
  unit: string;
  staff_type: string;
  staff_status: string[];
  email: string;
  role: "staff" | "admin";
  active: boolean;
}

export function statusKegiatan(k: Kegiatan, now: Date = new Date()): KegiatanStatus {
  if (!k.is_active) return "ditiadakan";
  const start = new Date(k.starts_at);
  const end = new Date(k.ends_at);
  if (now < start) return "terjadwal";
  if (now > end) return "selesai";
  return "berlangsung";
}

const TZ = "Asia/Jakarta";

const formatterDT = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const formatterD = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const formatterT = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const formatterDTT = new Intl.DateTimeFormat("id-ID", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatTanggalLengkap(d: Date | string) {
  return formatterDT.format(new Date(d)).replace(/\./g, "").replace(",", ",");
}
export function formatTanggal(d: Date | string) {
  return formatterD.format(new Date(d)).replace(/\./g, "").replace(",", ",");
}
export function formatJam(d: Date | string) {
  return formatterT.format(new Date(d)).replace(".", ":");
}
export function formatTanggalJam(d: Date | string) {
  return formatterDTT.format(new Date(d)).replace(".", ":");
}

/** Supabase mengembalikan relasi tertanam sebagai array —
 *  ambil elemennya yang pertama dengan aman. */
export function first<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/* ===================== Kategori / jenis pegawai & kegiatan ===================== */

/** Urutan kanonik label kategori (ASN → PPPK → PPPSU → Kepling). */
export const JENIS_LABEL: Record<string, string> = {
  ASN: "ASN",
  PPPK: "PPPK",
  PPPSU: "PPPSU",
  Kepling: "Kepling",
};

/** Kategori kegiatan yang valid; array kosong/`null` berarti semua jenis. */
export function jenisKegiatan(kegiatan: { kategori?: string[] | null } | null | undefined): JenisAbsen[] {
  const v = kegiatan?.kategori;
  const arr = Array.isArray(v)
    ? v.filter((x): x is JenisAbsen => (JENIS_ABSEN as readonly string[]).includes(x))
    : [];
  return arr.length ? [...new Set(arr)] : [...JENIS_ABSEN];
}

/** Kategori pegawai (gabungan staff_status + staff_type; fallback ke staff_type). */
export function jenisPegawai(
  profile: {
    staff_type?: string | null;
    staff_status?: string[] | null;
  } | null | undefined
): JenisAbsen[] {
  const s = profile?.staff_status;
  const arr = Array.isArray(s) && s.length ? s : profile?.staff_type ? [profile.staff_type] : [];
  const out = arr.filter((x): x is JenisAbsen => (JENIS_ABSEN as readonly string[]).includes(x));
  return [...new Set(out)];
}

/** Apakah pegawai boleh absen pada kegiatan dengan kategori tsb. */
export function bolehAbsenKegiatan(
  kegiatan: { kategori?: string[] | null } | null | undefined,
  profile: {
    staff_type?: string | null;
    staff_status?: string[] | null;
  } | null | undefined
): boolean {
  const kj = jenisKegiatan(kegiatan);
  const pj = jenisPegawai(profile);
  return pj.some((t) => kj.includes(t));
}

/** Label pendek daftar jenis, mis. "ASN · Kepling" atau "Semua Jenis". */
export function labelJenis(list: JenisAbsen[] | string[] | undefined | null): string {
  const arr = jenisKegiatan({ kategori: (list as string[] | undefined) ?? null });
  if (arr.length === JENIS_ABSEN.length) return "Semua Jenis";
  return arr.map((t) => JENIS_LABEL[t] ?? t).join(" · ");
}

/** Milisek awal hari ini (WIB) untuk kueri "hari ini". */
export function awalHariIniWIB(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(`${parts}T00:00:00+07:00`);
}

export function akhirHariIniWIB(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  return new Date(`${parts}T23:59:59+07:00`);
}

/** Buat token kegiatan acak, mis. KJ-7F3QZ2. */
export function buatTokenKegiatan(prefix = "KJ"): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint32Array(6);
  crypto.getRandomValues(bytes);
  let body = "";
  for (let i = 0; i < bytes.length; i++) body += alphabet[bytes[i] % alphabet.length];
  return `${prefix}-${body}`;
}

/** Basis URL aplikasi: env bila diisi, kosongkan untuk memakai origin saat runtime. */
export function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
}
