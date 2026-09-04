"use client";

import { useTransition } from "react";
import { PencilLine } from "lucide-react";
import { setActiveKegiatan } from "@/app/actions/kegiatan";
import { Button } from "@/components/ui/button";

export function KegiatanRowActions({
  id,
  isTerakhir,
}: {
  id: string;
  isTerakhir: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={isTerakhir ? "outline" : "ghost"}
      disabled={pending}
      onClick={() => startTransition(() => setActiveKegiatan(id, isTerakhir))}
      title={isTerakhir ? "Aktifkan kembali kegiatan ini" : "Akhiri kegiatan ini"}
    >
      {isTerakhir ? "Aktifkan" : "Akhiri"}
    </Button>
  );
}
