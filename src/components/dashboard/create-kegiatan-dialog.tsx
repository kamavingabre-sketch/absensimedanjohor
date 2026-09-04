"use client";

import * as React from "react";
import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createKegiatan, type KegiatanState } from "@/app/actions/kegiatan";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function hariIniWIB(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts;
}

export function CreateKegiatanDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState<KegiatanState, FormData>(
    createKegiatan,
    {}
  );

  React.useEffect(() => {
    if (state.createdId) {
      setOpen(false);
      router.push(`/dashboard/kegiatan/${state.createdId}`);
      router.refresh();
    }
  }, [state.createdId, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus /> Kegiatan Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kegiatan Baru</DialogTitle>
          <DialogDescription>
            Setelah disimpan, kode QR kegiatan langsung tersedia untuk dipindai
            pegawai.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="k-name" className="text-slate-700">
              Nama Kegiatan
            </Label>
            <Input
              id="k-name"
              name="name"
              required
              placeholder="Contoh: Apel Pagi & Koordinasi Bulanan"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="k-desc" className="text-slate-700">
              Deskripsi <span className="font-normal text-slate-400">(opsional)</span>
            </Label>
            <textarea
              id="k-desc"
              name="description"
              rows={2}
              placeholder="Catatan singkat tentang kegiatan"
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="k-loc" className="text-slate-700">
              Lokasi <span className="font-normal text-slate-400">(opsional)</span>
            </Label>
            <Input
              id="k-loc"
              name="location"
              placeholder="Contoh: Aula Kantor Kecamatan"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="k-date" className="text-slate-700">
                Tanggal
              </Label>
              <Input id="k-date" name="date" type="date" required min={hariIniWIB()} />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="k-ts" className="text-slate-700">
                Jam Mulai
              </Label>
              <Input id="k-ts" name="time_start" type="time" required defaultValue="08:00" />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="k-te" className="text-slate-700">
                Jam Selesai
              </Label>
              <Input id="k-te" name="time_end" type="time" required defaultValue="09:00" />
            </div>
          </div>

          {state.error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
            >
              {state.error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan & Buat QR"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
