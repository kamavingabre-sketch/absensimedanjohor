import { Badge } from "@/components/ui/badge";
import { jenisKegiatan, JENIS_LABEL, type JenisAbsen } from "@/lib/utils";

const VARIANT: Record<JenisAbsen, "info" | "success" | "warning" | "default"> = {
  ASN: "info",
  PPPK: "success",
  PPPSU: "warning",
  Kepling: "default",
};

/**
 * Badge kategori peserta kegiatan (ASN / PPPK / PPPSU / Kepling).
 * Kegiatan lama tanpa kategori ditampilkan sebagai "Semua Jenis".
 */
export function BadgeJenis({
  kategori,
  className,
}: {
  kategori?: string[] | null;
  className?: string;
}) {
  const list = jenisKegiatan({ kategori });

  if (list.length >= 4) {
    return (
      <span className={`inline-flex flex-wrap items-center gap-1 ${className ?? ""}`}>
        <Badge variant="muted">Semua Jenis</Badge>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${className ?? ""}`}>
      {list.map((t) => (
        <Badge key={t} variant={VARIANT[t] ?? "default"}>
          {JENIS_LABEL[t] ?? t}
        </Badge>
      ))}
    </span>
  );
}
