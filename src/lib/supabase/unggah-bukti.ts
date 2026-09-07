import { createClient } from "@/lib/supabase/client";

export const BUCKET_BUKTI = "bukti-kehadiran";

const MAKS_SISI = 1600; // px — perbesar sisi terpanjang foto
const KUALITAS_JPEG = 0.82;

/** Baca file gambar lewat <img> (gagal untuk HEIC yang tidak didukung). */
function muatGambar(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("gagal-decode"));
    };
    img.src = url;
  });
}

/**
 * Kecilkan/kompres foto agar unggahan cepat: sisi terpanjang maks 1600 px,
 * disimpan sebagai JPEG. Bila gagal dibaca (mis. HEIC lama), file asli
 * dikirim apa adanya.
 */
export async function kecilkanFoto(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const img = await muatGambar(file);
    const { naturalWidth: w, naturalHeight: h } = img;
    const skala = Math.min(1, MAKS_SISI / Math.max(w, h));
    const cw = Math.max(1, Math.round(w * skala));
    const ch = Math.max(1, Math.round(h * skala));

    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // hindari latar hitam untuk PNG transparan
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", KUALITAS_JPEG)
    );
    URL.revokeObjectURL(img.src);
    if (!blob) return file;
    return blob;
  } catch {
    return file;
  }
}

function ekstensi(blob: Blob, namaAsli: string): string {
  const dariNama = namaAsli.toLowerCase().split(".").pop() ?? "";
  if (["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(dariNama)) {
    return dariNama === "jpeg" ? "jpg" : dariNama;
  }
  if (blob.type === "image/png") return "png";
  if (blob.type === "image/webp") return "webp";
  return "jpg";
}

/**
 * Unggah foto bukti kehadiran ke bucket privat "bukti-kehadiran".
 * Folder objek = <auth.uid()>/ sehingga policy Storage hanya mengizinkan
 * pegawai mengunggah ke folder miliknya.
 *
 * @returns path objek di Storage (disimpan ke kolom absensi.foto_bukti)
 */
export async function unggahFotoBukti(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali lalu coba lagi.");
  }

  const blob = await kecilkanFoto(file);
  const ext = ekstensi(blob, file.name);
  const nama = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${user.id}/${nama}`;

  const { error } = await supabase.storage.from(BUCKET_BUKTI).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    const pesan = String(error.message ?? "");
    if (/bucket/i.test(pesan) && /not found|does not exist/i.test(pesan)) {
      throw new Error(
        "Penyimpanan foto belum dibuat. Jalankan ulang supabase/schema.sql " +
          "(bagian Storage) atau hubungi operator."
      );
    }
    throw new Error("Foto gagal diunggah. Periksa koneksi internet lalu coba lagi.");
  }

  return path;
}
