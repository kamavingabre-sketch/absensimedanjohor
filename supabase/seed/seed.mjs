#!/usr/bin/env node
/**
 * Seed akun pegawai Kecamatan Medan Johor ke Supabase.
 *
 * Prasyarat:
 *   1. Project Supabase sudah dibuat dan supabase/schema.sql sudah dijalankan.
 *   2. Variabel lingkungan terisi (lihat .env.example):
 *        - SUPABASE_URL (atau NEXT_PUBLIC_SUPABASE_URL)
 *        - SUPABASE_SERVICE_ROLE_KEY
 *      File .env di root proyek akan dibaca otomatis.
 *
 * Jalankan:  npm run seed
 *
 * Hasil:
 *   - Semua akun pegawai + admin dibuat (idempotent: aman dijalankan ulang).
 *   - CSV berisi email & password tiap pegawai di supabase/seed/output/akun-pegawai.csv
 *     (folder output sudah di-gitignore; JANGAN dibagikan ke luar lingkungan kerja).
 */

import { createRequire } from "node:module";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ---------------------------------------------------------------- env
try {
  process.loadEnvFile(path.join(ROOT, ".env"));
} catch {
  /* tidak ada file .env — gunakan environment yang sudah ada */
}

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const EMAIL_DOMAIN = (process.env.SEED_EMAIL_DOMAIN || "medanjohor.go.id").trim();
const UNIFORM_PASSWORD = (process.env.SEED_PASSWORD || "").trim();
const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || `admin@${EMAIL_DOMAIN}`).trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✖ SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi.");
  console.error("  Salin .env.example menjadi .env lalu isi kedua variabel tersebut.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------- data
function bacaJSON(nama) {
  return JSON.parse(readFileSync(path.join(__dirname, "data", nama), "utf8"));
}

const DATASETS = [
  { file: "asn.json", tipe: "ASN" },
  { file: "pppk.json", tipe: "PPPK" },
  { file: "pppsu.json", tipe: "PPPSU" },
  { file: "kepling.json", tipe: "Kepling" },
];

/** Bagian nama sebelum tanda koma (buang gelar) untuk slug email. */
function namaBasis(nama) {
  return nama.split(",")[0].trim();
}

function slugify(nama) {
  return namaBasis(nama)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9 .]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(".")
    .replace(/\.{2,}/g, ".");
}

/** Kunci dedup: huruf+angka saja, dari nama tanpa gelar. */
function kunci(nama) {
  return namaBasis(nama).toLowerCase().replace(/[^a-z0-9]/g, "");
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
function passwordAcak(panjang = 10) {
  let out = "";
  for (let i = 0; i < panjang; i++) {
    out += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return out;
}

// Gabungkan semua daftar, dedup berdasarkan nama (tanpa gelar).
// Urutan ASN → PPPK → PPPSU → Kepling; nama yang sama di dua daftar
// digabung menjadi satu akun dengan status gabungan (mis. PPPK/PPPSU).
const orang = new Map();
for (const { file, tipe } of DATASETS) {
  for (const entry of bacaJSON(file)) {
    const k = kunci(entry.name);
    const existing = orang.get(k);
    if (existing) {
      if (!existing.status.includes(tipe)) existing.status.push(tipe);
      // jabatan & unit dari kemunculan pertama dipertahankan
    } else {
      orang.set(k, {
        nama: entry.name,
        jabatan: entry.jabatan,
        unit: entry.unit || "Kecamatan Medan Johor",
        status: [tipe],
      });
    }
  }
}

// Beri email unik (suffix .2, .3 bila ada nama yang slug-nya sama).
const emailDipakai = new Set();
const emailOrang = new Map(); // nama → email
for (const { nama } of orang.values()) {
  const base = slugify(nama);
  let email = `${base}@${EMAIL_DOMAIN}`;
  let i = 2;
  while (emailDipakai.has(email)) {
    email = `${base}.${i}@${EMAIL_DOMAIN}`;
    i++;
  }
  emailDipakai.add(email);
  emailOrang.set(nama, email);
}

// ---------------------------------------------------------------- user yang sudah ada
console.log("· Mengambil daftar user yang sudah ada di Supabase…");
const existingByEmail = new Map();
for (let page = 1; page <= 10; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) {
    console.error("✖ Gagal mengambil daftar user:", error.message);
    process.exit(1);
  }
  for (const u of data.users) existingByEmail.set(u.email.toLowerCase(), u);
  if (data.users.length < 1000) break;
}
console.log(`· Ditemukan ${existingByEmail.size} user existing.`);

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

function escapeCsv(v) {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ---------------------------------------------------------------- proses
const rows = [];
let dibuat = 0;
let sudahAda = 0;
let profile = 0;
const errors = [];

const semua = [...orang.values()];

for (const p of semua) {
  const email = emailOrang.get(p.nama).toLowerCase();
  const password = UNIFORM_PASSWORD || passwordAcak();
  const dibuatSebelum = dibuat;
  let userId = null;

  try {
    const existing = existingByEmail.get(email);
    if (existing) {
      userId = existing.id;
      sudahAda++;
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: p.nama },
      });
      if (error) throw error;
      userId = data.user.id;
      existingByEmail.set(email, data.user);
      dibuat++;
    }

    const { error: pErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: p.nama,
        jabatan: p.jabatan,
        unit: p.unit,
        staff_type: p.status[0],
        staff_status: p.status,
        email,
        role: "staff",
        active: true,
      },
      { onConflict: "id" }
    );
    if (pErr) throw pErr;
    profile++;

    rows.push({
      Nama: p.nama,
      Jabatan: p.jabatan,
      Unit: p.unit,
      Kategori: p.status.join(" / "),
      Email: email,
      Password: password,
      Status: dibuatSebelum === dibuat ? "sudah ada" : "baru",
    });

    if ((dibuat + sudahAda) % 25 === 0) {
      console.log(`  … ${dibuat + sudahAda}/${semua.length} (dibuat: ${dibuat}, sudah ada: ${sudahAda})`);
    }
    await tidur(40);
  } catch (e) {
    errors.push({ nama: p.nama, email, pesan: e.message });
    rows.push({ Nama: p.nama, Jabatan: p.jabatan, Unit: p.unit, Kategori: p.status.join(" / "), Email: email, Password: password, Status: `GAGAL: ${e.message}` });
  }
}

// ---------------------------------------------------------------- admin
let adminPassword = UNIFORM_PASSWORD ? "(seragam)" : null;
let adminStatus = "sudah ada";
try {
  const existing = existingByEmail.get(ADMIN_EMAIL.toLowerCase());
  if (existing) {
    adminStatus = "sudah ada (user existing)";
    if (!process.env.SEED_ADMIN_PASSWORD) adminPassword = "—(sudah ada, tidak diubah)";
  } else {
    if (!process.env.SEED_ADMIN_PASSWORD) adminPassword = passwordAcak(14);
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD || adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "Administrator Absensi" },
    });
    if (error) throw error;
    existingByEmail.set(ADMIN_EMAIL.toLowerCase(), data.user);
    adminStatus = "dibuat";
  }
  const uid = existingByEmail.get(ADMIN_EMAIL.toLowerCase()).id;
  const { error: pErr } = await supabase.from("profiles").upsert(
    {
      id: uid,
      full_name: "Administrator Absensi",
      jabatan: "Operator Sistem Absensi",
      unit: "Kecamatan Medan Johor",
      staff_type: "Admin",
      staff_status: ["Admin"],
      email: ADMIN_EMAIL,
      role: "admin",
      active: true,
    },
    { onConflict: "id" }
  );
  if (pErr) throw pErr;
  rows.push({
    Nama: "Administrator Absensi",
    Jabatan: "Operator Sistem Absensi",
    Unit: "Kecamatan Medan Johor",
    Kategori: "Admin",
    Email: ADMIN_EMAIL,
    Password: process.env.SEED_ADMIN_PASSWORD || adminPassword,
    Status: adminStatus,
  });
} catch (e) {
  errors.push({ nama: "admin", email: ADMIN_EMAIL, pesan: e.message });
}

// ---------------------------------------------------------------- output CSV
const outDir = path.join(__dirname, "output");
mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "akun-pegawai.csv");
const header = "Nama;Jabatan;Unit;Kategori;Email;Password;Status";
const body = rows
  .map((r) =>
    [r.Nama, r.Jabatan, r.Unit, r.Kategori, r.Email, r.Password, r.Status]
      .map(escapeCsv)
      .join(";")
  )
  .join("\n");
writeFileSync(outPath, "\uFEFF" + header + "\n" + body + "\n", "utf8");

// ---------------------------------------------------------------- ringkasan
console.log("\n════════════════════════════════════════════");
console.log("RINGKASAN SEED");
console.log("════════════════════════════════════════════");
console.log(`  Total orang (setelah dedup) : ${semua.length}`);
console.log(`  Akun baru dibuat            : ${dibuat}`);
console.log(`  Akun sudah ada              : ${sudahAda}`);
console.log(`  Baris profile tersimpan     : ${profile + 1} (termasuk admin)`);
console.log(`  Gagal                       : ${errors.length}`);
if (errors.length) {
  console.log("\n  Daftar kegagalan:");
  for (const e of errors) console.log(`   - ${e.nama} (${e.email}): ${e.pesan}`);
}
console.log("\n  Akun admin dashboard:");
console.log(`    Email   : ${ADMIN_EMAIL}`);
if (process.env.SEED_ADMIN_PASSWORD) {
  console.log("    Password: (menggunakan SEED_ADMIN_PASSWORD dari .env)");
} else if (adminPassword && adminPassword !== "—(sudah ada, tidak diubah)") {
  console.log(`    Password: ${adminPassword}`);
  console.log("    ⚠ Simpan baik-baik — hanya ditampilkan sekali di sini & CSV.");
} else {
  console.log("    Password: tidak diubah (user sudah ada)");
}
console.log(`\n  File CSV akun & password  : ${outPath}`);
console.log("\n  Langkah berikutnya:");
console.log("  1. Buka aplikasi (npm run dev) atau deploy ke Vercel.");
console.log("  2. Isi environment di Vercel: NEXT_PUBLIC_SUPABASE_URL,");
console.log("     NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL.");
console.log("  3. Bagikan CSV kepada operator untuk distribusi ke pegawai.");
