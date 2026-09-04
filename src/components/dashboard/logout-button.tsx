"use client";

import { signOut } from "@/app/actions/auth";

export function LogoutButton({ className = "" }: { className?: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 " +
          className
        }
      >
        <span className="[&>svg]:h-[18px] [&>svg]:w-[18px]">
          <LogoutIcon />
        </span>
        Keluar
      </button>
    </form>
  );
}

function LogoutIcon() {
  // lucide LogOut digambar langsung agar aman di client component sederhana
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
