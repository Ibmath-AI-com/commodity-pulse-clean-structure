// FILE: src/infrastructure/repositories/predictions-dashboard.repository.firestore.ts

import "server-only";

import type { IPredictionsDashboardRepository } from "@/src/application/repositories/predictions-dashboard.repository.interface";
import type { DashboardPrediction, Status } from "@/src/entities/models/dashboard";
import { adminDb } from "@/src/infrastructure/firebase/firebase.admin";

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "object" && typeof v.seconds === "number") return new Date(v.seconds * 1000);
  return null;
}

function toStrArray(v: any): string[] | null {
  return Array.isArray(v) ? v.map((x) => String(x)) : null;
}

function toNumArray(v: any): number[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  return out.length ? out : null;
}

function normStatus(v: any): Status {
  const s = String(v ?? "").toLowerCase();
  if (s === "success") return "success";
  if (s === "error") return "error";
  return "unknown";
}

export class FirestorePredictionsDashboardRepository implements IPredictionsDashboardRepository {
  async getPredictionsForUser(uid: string, limitN: number): Promise<DashboardPrediction[]> {
    const snap = await adminDb
      .collection("predictions")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(limitN)
      .get();

    return snap.docs.map((d) => {
      const x: any = d.data();

      return {
        id: d.id,
        uid: String(x?.uid ?? uid),

        createdAt: toDate(x?.createdAt),
        runtimeMs: typeof x?.runtimeMs === "number" ? x.runtimeMs : null,

        commodity: x?.commodity ?? null,
        futureDate: x?.futureDate ?? null,

        basisLabels: toStrArray(x?.basisLabels),
        basisKeys: toStrArray(x?.basisKeys),
        basePrices: toNumArray(x?.basePrices),

        status: normStatus(x?.status),
        n8nHttpStatus: typeof x?.n8nHttpStatus === "number" ? x.n8nHttpStatus : null,

        outputs: x?.outputs ?? null,
        error: x?.error ?? null,

        news: x?.news ?? null,
      };
    });
  }
}
