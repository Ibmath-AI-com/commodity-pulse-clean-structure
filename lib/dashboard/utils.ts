import { Timestamp } from "firebase/firestore";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type TimestampLike = { seconds: number };

function isTimestampLike(v: unknown): v is TimestampLike {
  return typeof v === "object" && v !== null && "seconds" in v && typeof (v as { seconds: unknown }).seconds === "number";
}

export function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  if (isTimestampLike(v)) return new Date(v.seconds * 1000);
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