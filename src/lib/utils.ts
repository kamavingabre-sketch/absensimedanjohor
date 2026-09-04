import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type KegiatanStatus = "terjadwal" | "berlangsung" | "selesai" | "ditiadakan";

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

/**
 * Supabase mengembalikan relasi tertanam sebagai array —
 * ambil elemennya yang pertama dengan aman.
 */
export function first<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
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
