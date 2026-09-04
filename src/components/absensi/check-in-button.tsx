"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { checkIn, type CheckInState } from "@/app/actions/absensi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ambilLokasi(): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
} | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { timeout: 6000, maximumAge: 30000 }
    );
  });
}

export function CheckInButton({
  kegiatanId,
  size = "default",
  className,
  label = "Absen Sekarang",
}: {
  kegiatanId: string;
  size?: "default" | "lg";
  className?: string;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState<CheckInState, Parameters<typeof checkIn>[1]>(
    checkIn,
    {}
  );
  const [locating, setLocating] = React.useState(false);

  async function handleClick() {
    setLocating(true);
    const loc = await ambilLokasi();
    setLocating(false);
    formAction({
      kegiatanId,
      latitude: loc?.latitude,
      longitude: loc?.longitude,
      accuracy: loc?.accuracy,
      deviceInfo:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={pending || locating}
        size={size}
        className={cn("w-full", className)}
      >
        {pending || locating ? (
          <Loader2 className="animate-spin" />
        ) : (
          <CheckCircle2 />
        )}
        {pending ? "Menyimpan…" : locating ? "Membaca lokasi…" : label}
      </Button>

      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-relaxed text-red-700"
        >
          {state.error}
        </p>
      )}

      {state.time && !state.error && (
        <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <div>
            <p className="text-sm font-bold text-emerald-800">
              Kehadiran tercatat ✓
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700">
              <MapPin className="h-3 w-3" />
              Jam: {state.time} WIB
            </p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
      )}
    </div>
  );
}
