//E:\AI Projects\commodity-clean-structure\app\_components\utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type TimestampLike = { seconds: number };

function isTimestampLike(v: unknown): v is TimestampLike {
  return (
    typeof v === "object" &&
    v !== null &&
    "seconds" in v &&
    typeof (v as { seconds: unknown }).seconds === "number"
  );
}

export function toDate(v: unknown): Date | null {
  if (!v) return null;

  if (v instanceof Date) {
    return Number.isFinite(v.getTime()) ? v : null;
  }

  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  if (isTimestampLike(v)) {
    const d = new Date(v.seconds * 1000);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  return null;
}

export function fmtDate(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function safeUpper(x: unknown) {
  const s = String(x ?? "").trim();
  return s ? s.toUpperCase() : "—";
}