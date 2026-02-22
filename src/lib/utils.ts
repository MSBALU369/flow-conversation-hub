import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Detects in-app browsers (WebViews) that block getUserMedia / microphone */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Instagram|FBAV|FBAN|Line\/|Twitter|MicroMessenger|Snapchat|LinkedIn|Threads/i.test(ua);
}
