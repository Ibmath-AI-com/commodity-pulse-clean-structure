import "server-only";

import type {
  IPredictionsRepository,
  GetPredictionsQuery,
} from "@/src/application/repositories/predictions.repository.interface";
import type { PredictionRecord } from "@/src/entities/models/prediction";
import { adminDb } from "@/src/infrastructure/firebase/firebase.admin";

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

type ToDateLike = { toDate: () => Date };
function isToDateLike(v: unknown): v is ToDateLike {
  return isRecord(v) && typeof (v as { toDate?: unknown }).toDate === "function";
}

function toDateOrNull(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (isToDateLike(v)) return v.toDate();
  const d = new Date(v as never);
  return Number.isFinite(d.getTime()) ? d : null;
}

export class FirestorePredictionsRepository implements IPredictionsRepository {
  private col() {
    return adminDb.collection("predictions");
  }

  async save(prediction: PredictionRecord): Promise<void> {
    const { id, ...rest } = prediction;
    const docRef = id ? this.col().doc(id) : this.col().doc();

    await docRef.set(
      { ...rest, createdAt: rest.createdAt ?? new Date(), updatedAt: new Date() },
      { merge: true }
    );
  }

  async getByUser(query: GetPredictionsQuery): Promise<PredictionRecord[]> {
    if (!query?.uid) throw new Error("Missing uid");

    const rawLimit =
      typeof query.limit === "number" && Number.isFinite(query.limit)
        ? query.limit
        : 100;
    const lim = Math.max(1, Math.min(rawLimit, 200)); // cap to protect reads

    let q: FirebaseFirestore.Query = this.col().where("uid", "==", query.uid);

    if (query.commodity && query.commodity.trim()) {
      q = q.where("commodity", "==", query.commodity.trim().toLowerCase());
    }

    if (query.status) {
      q = q.where("status", "==", query.status);
    }

    // Must come after where() clauses
    q = q.orderBy("createdAt", "desc").limit(lim);

    const snap = await q.get();

    return snap.docs.map((d) => {
      const raw = d.data() as unknown;
      const x: UnknownRecord = isRecord(raw) ? raw : {};

      return {
        id: d.id,
        uid: x.uid as PredictionRecord["uid"],
        createdAt: toDateOrNull(x.createdAt),
        runtimeMs: typeof x.runtimeMs === "number" ? x.runtimeMs : null,
        commodity: (x.commodity ?? null) as PredictionRecord["commodity"],
        futureDate: (x.futureDate ?? null) as PredictionRecord["futureDate"],
        basisLabels: Array.isArray(x.basisLabels) ? (x.basisLabels as string[]) : null,
        basisKeys: Array.isArray(x.basisKeys) ? (x.basisKeys as string[]) : null,
        basePrices: Array.isArray(x.basePrices) ? (x.basePrices as number[]) : null,
        status: (x.status ?? "unknown") as PredictionRecord["status"],
        n8nHttpStatus: typeof x.n8nHttpStatus === "number" ? x.n8nHttpStatus : null,
        outputs: (x.outputs ?? null) as PredictionRecord["outputs"],
        error: (x.error ?? null) as PredictionRecord["error"],
        news: (x.news ?? null) as PredictionRecord["news"],
      } satisfies PredictionRecord;
    });
  }

  async getById(id: string): Promise<PredictionRecord | null> {
    const doc = await this.col().doc(id).get();
    if (!doc.exists) return null;

    const raw = doc.data() as unknown;
    const x: UnknownRecord = isRecord(raw) ? raw : {};

    return {
      id: doc.id,
      uid: x.uid as PredictionRecord["uid"],
      createdAt: toDateOrNull(x.createdAt),
      runtimeMs: typeof x.runtimeMs === "number" ? x.runtimeMs : null,
      commodity: (x.commodity ?? null) as PredictionRecord["commodity"],
      futureDate: (x.futureDate ?? null) as PredictionRecord["futureDate"],
      basisLabels: Array.isArray(x.basisLabels) ? (x.basisLabels as string[]) : null,
      basisKeys: Array.isArray(x.basisKeys) ? (x.basisKeys as string[]) : null,
      basePrices: Array.isArray(x.basePrices) ? (x.basePrices as number[]) : null,
      status: (x.status ?? "unknown") as PredictionRecord["status"],
      n8nHttpStatus: typeof x.n8nHttpStatus === "number" ? x.n8nHttpStatus : null,
      outputs: (x.outputs ?? null) as PredictionRecord["outputs"],
      error: (x.error ?? null) as PredictionRecord["error"],
      news: (x.news ?? null) as PredictionRecord["news"],
    };
  }
}