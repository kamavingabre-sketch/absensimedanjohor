import { Badge } from "@/components/ui/badge";
import { statusKegiatan, type Kegiatan } from "@/lib/utils";

const LABEL: Record<string, string> = {
  terjadwal: "Terjadwal",
  berlangsung: "Berlangsung",
  selesai: "Selesai",
  ditiadakan: "Diakhiri",
};

const VARIANT: Record<string, "warning" | "success" | "muted" | "danger"> = {
  terjadwal: "warning",
  berlangsung: "success",
  selesai: "muted",
  ditiadakan: "danger",
};

export function StatusKegiatanBadge({ kegiatan }: { kegiatan: Kegiatan }) {
  const status = statusKegiatan(kegiatan);
  return (
    <Badge variant={VARIANT[status]}>
      <span
        className={
          "h-1.5 w-1.5 rounded-full " +
          (status === "berlangsung"
            ? "bg-emerald-500"
            : status === "terjadwal"
              ? "bg-amber-500"
              : status === "selesai"
                ? "bg-slate-400"
                : "bg-red-500")
        }
      />
      {LABEL[status]}
    </Badge>
  );
}
