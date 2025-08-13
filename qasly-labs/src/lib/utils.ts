import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
