"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { checkIn, type CheckInState } from "@/app/actions/absensi";

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

export function AutoCheckIn({ kegiatanId }: { kegiatanId: string }) {
  const [state, formAction] = useActionState<CheckInState, Parameters<typeof checkIn>[1]>(
    checkIn,
    {}
  );
  const [memproses, setMemproses] = React.useState(true);

  React.useEffect(() => {
    let aktif = true;

    (async () => {
      const loc = await ambilLokasi();
      if (!aktif) return;

      formAction({
        kegiatanId,
        latitude: loc?.latitude,
        longitude: loc?.longitude,
        accuracy: loc?.accuracy,
        deviceInfo:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      });

      if (aktif) setMemproses(false);
    })();

    return () => {
      aktif = false;
    };
  }, [kegiatanId, formAction]);

  if (memproses) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 py-4">
        <Loader2 className="h-8 w-8 shrink-0 animate-spin text-blue-600" />
        <div>
          <p className="text-sm font-bold text-blue-800">
            Mencatat kehadiran…
          </p>
          <p className="mt-0.5 text-xs text-blue-600">
            Sedang memproses absensi Anda, mohon tunggu.
          </p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-4">
        <AlertTriangle className="h-8 w-8 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-bold text-red-800">
            Absensi gagal dicatat
          </p>
          <p className="mt-0.5 text-xs text-red-600">{state.error}</p>
        </div>
      </div>
    );
  }

  if (state.time) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4">
        <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-bold text-emerald-800">
            Kehadiran tercatat ✓
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-emerald-700">
            <MapPin className="h-3 w-3" />
            Jam absen: {state.time} WIB
          </p>
        </div>
      </div>
    );
  }

  return null;
}
