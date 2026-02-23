// FILE: src/infrastructure/repositories/predictions-dashboard.repository.firestore.ts

import "server-only";

import type { IPredictionsDashboardRepository } from "@/src/application/repositories/predictions-dashboard.repository.interface";
import type { DashboardPrediction, Status } from "@/src/entities/models/dashboard";
import { adminDb } from "@/src/infrastructure/firebase/firebase.admin";

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

type TimestampLike = { seconds: number };
function isTimestampLike(v: unknown): v is TimestampLike {
  return isRecord(v) && typeof (v as { seconds?: unknown }).seconds === "number";
}

type ToDateLike = { toDate: () => Date };
function isToDateLike(v: unknown): v is ToDateLike {
  return isRecord(v) && typeof (v as { toDate?: unknown }).toDate === "function";
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (isToDateLike(v)) return v.toDate();
  if (isTimestampLike(v)) return new Date(v.seconds * 1000);
  return null;
}

function toStrArray(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  return v.map((x) => String(x));
}

function toNumArray(v: unknown): number[] | null {
  if (!Array.isArray(v)) return null;
  const out = v
    .map((x) => (typeof x === "number" ? x : Number(x)))
    .filter((n) => Number.isFinite(n));
  return out.length ? out : null;
}

function normStatus(v: unknown): Status {
  const s = String(v ?? "").toLowerCase();
  if (s === "success") return "success";
  if (s === "error") return "error";
  return "unknown";
}

export class FirestorePredictionsDashboardRepository
  implements IPredictionsDashboardRepository
{
  async getPredictionsForUser(uid: string, limitN: number): Promise<DashboardPrediction[]> {
    const snap = await adminDb
      .collection("predictions")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limitN)
      .get();

    return snap.docs.map((d) => {
      const raw = d.data() as unknown;
      const x: UnknownRecord = isRecord(raw) ? raw : {};

      return {
        id: d.id,
        uid: String(x.uid ?? uid),

        createdAt: toDate(x.createdAt),
        runtimeMs: typeof x.runtimeMs === "number" ? x.runtimeMs : null,

        commodity: (x.commodity ?? null) as DashboardPrediction["commodity"],
        futureDate: (x.futureDate ?? null) as DashboardPrediction["futureDate"],

        basisLabels: toStrArray(x.basisLabels),
        basisKeys: toStrArray(x.basisKeys),
        basePrices: toNumArray(x.basePrices),

        status: normStatus(x.status),
        n8nHttpStatus: typeof x.n8nHttpStatus === "number" ? x.n8nHttpStatus : null,

        outputs: (x.outputs ?? null) as DashboardPrediction["outputs"],
        error: (x.error ?? null) as DashboardPrediction["error"],

        news: (x.news ?? null) as DashboardPrediction["news"],
      };
    });
  }
}