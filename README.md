# Absensi Digital — Kecamatan Medan Johor

Sistem kehadiran dan kegiatan pegawai Kecamatan Medan Johor, Kota Medan.
Pembangunannya memakai **Next.js (App Router) + TypeScript + Tailwind CSS**,
autentikasi dan database di **Supabase**, dan deploy di **Vercel**.

## Alur pemakaian

1. **Petugas (admin)** masuk lewat **Panel Dashboard**, lalu membuat
   **Kegiatan Baru** (nama, tanggal, jam, lokasi) dan **wajib memilih jenis
   kegiatan/peserta**: ASN, PPPK, PPPSU, dan/atau Kepling. Absensi dibedakan
   per jenis — kegiatan ASN hanya bisa diabsensi pegawai ASN, dst. Sistem
   langsung menghasilkan **kode QR** untuk kegiatan tersebut.
2. QR ditunjukkan/dicetak. **Pegawai** memindai QR (kamera ponsel atau
   tombol *Pindai QR* di aplikasi) → otomatis terbuka halaman absen kegiatan.
   Kegiatan yang bukan untuk kategori akunnya tidak dapat diabsensi.
3. Pegawai **mengambil/mengirim foto bukti kehadiran** (swafoto di lokasi
   atau dokumentasi kegiatan). Foto diunggah ke penyimpanan aman, **baru
   setelah foto berhasil terkirim kehadiran dicatat** — nama, jabatan, jam
   (WIB), titik GPS perangkat, dan tautan foto bukti. Satu pegawai hanya
   bisa absen satu kali per kegiatan.
4. Pegawai dapat melihat **riwayat absensi**-nya; admin dapat melihat daftar
   pegawai yang hadir per kegiatan (termasuk **foto bukti kehadiran**),
   data pegawai, dan ringkasan kehadiran.

## Keamanan

- Login: email + password Supabase (email wajib tervalidasi saat seed).
- **Row Level Security** aktif di semua tabel:
  - `profiles` — semua yang login boleh membaca; hanya admin mengubah.
  - `kegiatan` — semua yang login boleh membaca; hanya admin menulis.
  - `absensi` — pegawai hanya bisa mem-baca data **sendiri** dan hanya boleh
    memasukkan absen atas nama **dirinya** (dicek di server + constraint unik).
- **Foto bukti kehadiran** disimpan di bucket Storage privat
  `bukti-kehadiran`; pegawai hanya bisa mengunggah ke folder miliknya dan
  hanya bisa melihat fotonya sendiri. Admin bisa melihat semua untuk
  verifikasi. File tidak publik — ditampilkan lewat *signed URL*.
- Server action absen **menolak** bila foto bukti belum terkirim dan bila
  kategori kegiatan tidak sesuai kategori akun (dicek dua kali: tampilan +
  server).
- Middleware Next membatasi `/dashboard` hanya untuk role `admin`.
- Service role key **tidak** dipakai di aplikasi — hanya sekali saat seed.

## Persiapan

Butuh: Node.js ≥ 18, akun Supabase, akun Vercel.

### 1. Buat project Supabase & jalankan schema

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor → New query**, tempel seluruh isi
   [`supabase/schema.sql`](supabase/schema.sql), lalu **Run**.

> Schema berisi migrasi aman + bucket Storage `bukti-kehadiran` (privat)
> beserta kebijakan aksesnya. **Project yang sudah berjalan cukup
> menjalankan ulang file ini** — kolom `kegiatan.kategori`,
> `absensi.foto_bukti`, dan bucket Storage akan dibuat/dilengkapi otomatis.

### 2. Konfigurasi environment

Salin file contoh lalu isi:

```bash
cp .env.example .env
```

| Variabel | Dipakai untuk |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key (dipakai aplikasi di browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **khusus seed** — membuat akun massal |
| `NEXT_PUBLIC_APP_URL` | URL publik aplikasi (isi setelah tahu domain Vercel; dipakai untuk isi tautan QR) |
| `SEED_EMAIL_DOMAIN` | domain email akun pegawai (default `medanjohor.go.id`) |
| `SEED_PASSWORD` | opsional: password seragam semua pegawai |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | opsional: akun admin dashboard |

### 3. Daftarkan akun pegawai (seed)

```bash
npm install
npm run seed
```

Skrip akan:

- Membuat akun untuk **83 ASN, 110 PPPK, 38 PPPSU, dan 79 Kepala Lingkungan**
  (data asli dari daftar kecamatan — nama yang sama di dua daftar, mis.
  PPPK & PPPSU, digabung menjadi satu akun dengan status gabungan).
- Membuat akun **admin dashboard** (default `admin@medanjohor.go.id`).
- Menulis **`supabase/seed/output/akun-pegawai.csv`** berisi
  `Nama;Jabatan;Unit;Kategori;Email;Password;Status` — file ini **hanya di
  komputer lokal** (sudah di-gitignore). Bagikan ke operator kecamatan.

Skrip bersifat **idempotent**: aman dijalankan ulang; akun yang sudah ada
tidak dibuat ganda. Password default **acak per orang** (10 karakter).

> Catatan data: entri "Suriadi" (muncul dua kali dengan jabatan berbeda di
> daftar PPPK) digabung menjadi satu akun; penulisan jelas salah ketik
> (mis. "Muhammmad") dirapikan pada data seed.

### 4. Jalankan lokal

```bash
npm run dev
```

Buka `http://localhost:3000` → langsung ke halaman login dua panel
(**Dashboard** untuk petugas, **Absensi** untuk pegawai).

### 5. Deploy ke Vercel

1. Push repository ini, lalu **Add New Project** di Vercel (framework
   terdeteksi otomatis: Next.js).
2. Isi **Environment Variables** untuk environment Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://<domain-vercel-anda>`
   (jangan isi `SUPABASE_SERVICE_ROLE_KEY` di Vercel)
3. Deploy. Setelah domain final diketahui, **update** `NEXT_PUBLIC_APP_URL`
   (jika sebelumnya diisi lain) lalu re-deploy — variabel ini tertanam di
   sisi klien, jadi perubahan membutuhkan deploy ulang.
4. Jalankan `npm run seed` **setelah** schema dijalankan (bisa sebelum atau
   sesudah deploy, tidak memengaruhi).

## Struktur proyek

```
src/
  app/
    login/               Halaman masuk dua panel (Dashboard & Absensi)
    dashboard/           Panel admin: ringkasan, kegiatan + QR, data pegawai
    absensi/             Panel pegawai: kegiatan aktif, riwayat, /absensi/<kode>
    actions/             Server actions (login, buat kegiatan, absen)
  components/
    ui/                  Komponen dasar (button, card, table, dialog, dll)
    dashboard/           Komponen panel admin
    absensi/             Form absen + foto bukti, pemindai QR (kamera)
    jenis-badge.tsx      Badge kategori kegiatan (ASN/PPPK/PPPSU/Kepling)
  lib/supabase/          Client Supabase (server, browser, middleware)
                         + unggah-bukti.ts (kompres & unggah foto ke Storage)
supabase/
  schema.sql             Tabel + RLS (jalan di SQL Editor Supabase)
  seed/                  Data pegawai (JSON) + skrip seed (node)
```

## Detail teknis

- **Kode QR**: token acak per kegiatan (mis. `KJ-7F3QZ2`); isi QR adalah
  tautan `https://<app>/absensi/<kode>`. Halaman QR dapat dicetak (tombol
  Cetak) atau tautannya disalin.
- **Jenis kegiatan**: saat membuat kegiatan, admin memilih kategori peserta
  (ASN / PPPK / PPPSU / Kepling). Daftar kegiatan di panel pegawai otomatis
  disaring sesuai kategori akun; pemindaian QR jenis lain ditolak, dan
  server action memvalidasi ulang kategori + foto.
- **Foto bukti kehadiran wajib**: pegawai mengambil/memilih foto → foto
  dikompres & diunggah ke bucket Storage privat `bukti-kehadiran` (path
  `<uuid-user>/<…>.jpg`) → **setelah unggah berhasil**, server action baru
  mencatat absen (insert ditolak server bila `foto_bukti` kosong).
  Foto lama tanpa foto tetap tampil dengan tanda "—".
- **Absen** tervalidasi di server: kegiatan harus aktif, kategori akun harus
  cocok, foto bukti harus sudah terkirim, jam absen harus dalam rentang
  kegiatan, dan satu pegawai satu absen per kegiatan (unique constraint).
- **Lokasi GPS** dicatat bila perangkat mengizinkannya; tidak diwajibkan.
- **Foto di Dashboard**: tabel "Pegawai Hadir" menampilkan thumbnail foto
  bukti lewat *signed URL* (berlaku sementara) dari bucket privat.
- Semua waktu ditampilkan dalam **WIB (Asia/Jakarta)**.
- Font: **Plus Jakarta Sans**.

## Lisensi

Proprietary — Pemerintah Kecamatan Medan Johor.
