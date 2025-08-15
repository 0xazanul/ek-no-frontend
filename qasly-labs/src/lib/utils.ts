import { twMerge } from "tailwind-merge"
import { type ClassValue, clsx } from "clsx"
import { Finding } from "@/types/finding"; // Import Finding type

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  const g: any = (typeof globalThis !== "undefined" ? (globalThis as any) : undefined)?.crypto;
  if (g?.randomUUID) {
    try {
      return g.randomUUID();
    } catch {}
  }
  try {
    if (g?.getRandomValues) {
      const arr = new Uint8Array(16);
      g.getRandomValues(arr);
      arr[6] = (arr[6] & 0x0f) | 0x40; // version
      arr[8] = (arr[8] & 0x3f) | 0x80; // variant
      const hex = Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
      return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
    }
  } catch {}
  return `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function badge(sev: Finding["severity"]) {
  switch (sev) {
    case "critical":
      return "bg-red-500/15 text-red-600 border-red-500/30";
    case "high":
      return "bg-orange-500/15 text-orange-600 border-orange-500/30";
    case "medium":
      return "bg-amber-500/15 text-amber-700 border-amber-500/30";
    case "low":
      return "bg-blue-500/15 text-blue-700 border-blue-500/30";
    default:
      return "bg-gray-500/15 text-gray-700 border-gray-500/30";
  }
}
