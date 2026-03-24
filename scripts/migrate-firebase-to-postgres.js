require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");
const { Pool } = require("pg");

function isRecord(v) {
  return typeof v === "object" && v !== null;
}

function asString(v) {
  if (v == null) return null;
  if (typeof v === "string") {
    const s = v.trim();
    return s.length ? s : null;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

function asInt(v) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Math.trunc(Number(v));
  }
  return null;
}

function asFloat(v) {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

function toTimestamp(v) {
  if (!v) return null;

  if (isRecord(v) && typeof v.toDate === "function") {
    const d = v.toDate();
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  if (
    isRecord(v) &&
    typeof v._seconds === "number" &&
    typeof v._nanoseconds === "number"
  ) {
    const ms = v._seconds * 1000 + Math.floor(v._nanoseconds / 1e6);
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString();
  }

  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return null;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  return null;
}

function toDateOnly(v) {
  const ts = toTimestamp(v);
  return ts ? ts.slice(0, 10) : null;
}

function normalizeBasisKey(v) {
  return String(v).trim().toLowerCase().replace(/-+/g, " ").replace(/\s+/g, " ");
}

function extractBasisPrices(doc) {
  const basePrices = Array.isArray(doc.basePrices) ? doc.basePrices : [];
  const basisKeys = Array.isArray(doc.basisKeys) ? doc.basisKeys : [];
  const basisLabels = Array.isArray(doc.basisLabels) ? doc.basisLabels : [];

  if (!(basePrices.length === basisKeys.length && basisKeys.length === basisLabels.length)) {
    console.warn(
      `Basis array length mismatch for doc: basePrices=${basePrices.length}, basisKeys=${basisKeys.length}, basisLabels=${basisLabels.length}`
    );
  }

  const maxLen = Math.max(basePrices.length, basisKeys.length, basisLabels.length);
  const out = [];

  for (let i = 0; i < maxLen; i++) {
    const basePrice = asFloat(basePrices[i]);
    const basisKeyRaw = asString(basisKeys[i]);
    const basisLabel = asString(basisLabels[i]) ?? basisKeyRaw;

    if (basePrice == null || !basisKeyRaw || !basisLabel) continue;

    out.push({
      basis_key: normalizeBasisKey(basisKeyRaw),
      basis_label: basisLabel,
      base_price: basePrice,
    });
  }

  const dedup = new Map();
  for (const row of out) {
    dedup.set(row.basis_key, row);
  }

  return [...dedup.values()];
}

function extractEvents(doc) {
  const raw = Array.isArray(doc?.news?.events) ? doc.news.events : [];
  const out = [];

  raw.forEach((item, index) => {
    if (!isRecord(item)) return;

    const headline = asString(item.headline);
    if (!headline) return;

    let importanceScore = asFloat(item.importance_score);
    if (importanceScore != null) {
      importanceScore = Math.max(0, Math.min(9.999, importanceScore));
    }

    out.push({
      event_index: index,
      event_date: toTimestamp(item.event_date),
      event_type: asString(item.event_type) ?? "unknown",
      headline,
      evidence_summary: asString(item.evidence_summary),
      impact_direction: asString(item.impact_direction),
      importance_score: importanceScore,
    });
  });

  return out;
}

function buildPredictionRunRow(docId, doc) {
  const uid = asString(doc.uid);
  const commodity = asString(doc.commodity);
  const futureDate = toDateOnly(doc.futureDate);
  const status = asString(doc.status) ?? "unknown";

  if (!uid) throw new Error(`Document ${docId}: missing uid`);
  if (!commodity) throw new Error(`Document ${docId}: missing commodity`);
  if (!futureDate) throw new Error(`Document ${docId}: missing futureDate`);

  const createdAt = toTimestamp(doc.createdAt) ?? new Date().toISOString();
  const updatedAt = toTimestamp(doc.updatedAt) ?? createdAt;

  const newsEvents = Array.isArray(doc?.news?.events) ? doc.news.events : [];
  const newsCount = asInt(doc?.news?.count) ?? newsEvents.length;

  return {
    firestore_doc_id: docId,
    uid,
    commodity,
    future_date: futureDate,
    status,
    error: asString(doc.error),
    n8n_http_status: asInt(doc.n8nHttpStatus),
    runtime_ms: asInt(doc.runtimeMs),
    tender_predicted_price: asFloat(doc?.outputs?.tenderPredictedPrice),
    trend: asString(doc?.outputs?.trend),
    news_count: newsCount,
    created_at: createdAt,
    updated_at: updatedAt,
    raw_payload: doc,
  };
}

function initFirebase() {
  const b64 = process.env.FIREBASE_ADMIN_JSON_BASE64;
  if (!b64) throw new Error("Missing FIREBASE_ADMIN_JSON_BASE64");

  const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(json),
      projectId: process.env.FIREBASE_PROJECT_ID || json.project_id,
    });
  }

  return admin.firestore();
}

function initPg() {
  return new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: Number(process.env.DB_MAX || 10),
  });
}

async function upsertPredictionRun(client, row) {
  const sql = `
    INSERT INTO prediction_run (
      firestore_doc_id,
      uid,
      commodity,
      future_date,
      status,
      error,
      n8n_http_status,
      runtime_ms,
      tender_predicted_price,
      trend,
      news_count,
      created_at,
      updated_at,
      raw_payload
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb
    )
    ON CONFLICT (firestore_doc_id)
    DO UPDATE SET
      uid = EXCLUDED.uid,
      commodity = EXCLUDED.commodity,
      future_date = EXCLUDED.future_date,
      status = EXCLUDED.status,
      error = EXCLUDED.error,
      n8n_http_status = EXCLUDED.n8n_http_status,
      runtime_ms = EXCLUDED.runtime_ms,
      tender_predicted_price = EXCLUDED.tender_predicted_price,
      trend = EXCLUDED.trend,
      news_count = EXCLUDED.news_count,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at,
      raw_payload = EXCLUDED.raw_payload
    RETURNING id
  `;

  const values = [
    row.firestore_doc_id,
    row.uid,
    row.commodity,
    row.future_date,
    row.status,
    row.error,
    row.n8n_http_status,
    row.runtime_ms,
    row.tender_predicted_price,
    row.trend,
    row.news_count,
    row.created_at,
    row.updated_at,
    JSON.stringify(row.raw_payload),
  ];

  const res = await client.query(sql, values);
  return res.rows[0].id;
}

async function replaceBasisPrices(client, predictionRunId, basisRows) {
  await client.query(
    `DELETE FROM prediction_basis_price WHERE prediction_run_id = $1`,
    [predictionRunId]
  );

  for (const row of basisRows) {
    await client.query(
      `
      INSERT INTO prediction_basis_price (
        prediction_run_id,
        basis_key,
        basis_label,
        base_price
      )
      VALUES ($1,$2,$3,$4)
      `,
      [predictionRunId, row.basis_key, row.basis_label, row.base_price]
    );
  }
}

async function replaceNewsEvents(client, predictionRunId, eventRows) {
  await client.query(
    `DELETE FROM prediction_news_event WHERE prediction_run_id = $1`,
    [predictionRunId]
  );

  for (const row of eventRows) {
    await client.query(
      `
      INSERT INTO prediction_news_event (
        prediction_run_id,
        event_index,
        event_date,
        event_type,
        headline,
        evidence_summary,
        impact_direction,
        importance_score
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        predictionRunId,
        row.event_index,
        row.event_date,
        row.event_type,
        row.headline,
        row.evidence_summary,
        row.impact_direction,
        row.importance_score,
      ]
    );
  }
}

async function migrateOneDoc(client, docSnap) {
  const docId = docSnap.id;
  const doc = docSnap.data();

  if (!isRecord(doc)) {
    throw new Error(`Document ${docId}: not an object`);
  }

  const runRow = buildPredictionRunRow(docId, doc);
  const basisRows = extractBasisPrices(doc);
  const eventRows = extractEvents(doc);

  // Skip documents with no child rows at all
  if (basisRows.length === 0 && eventRows.length === 0) {
    return {
      docId,
      skipped: true,
      reason: "no_child_rows",
      basisCount: 0,
      eventCount: 0,
      uid: runRow.uid,
      commodity: runRow.commodity,
    };
  }

  await client.query("BEGIN");
  try {
    const predictionRunId = await upsertPredictionRun(client, runRow);
    await replaceBasisPrices(client, predictionRunId, basisRows);
    await replaceNewsEvents(client, predictionRunId, eventRows);
    await client.query("COMMIT");

    return {
      docId,
      skipped: false,
      predictionRunId,
      basisCount: basisRows.length,
      eventCount: eventRows.length,
      uid: runRow.uid,
      commodity: runRow.commodity,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

async function main() {
  const firestore = initFirebase();
  const pool = initPg();

  const collectionName = process.env.FIRESTORE_COLLECTION || "predictions";
  const batchSize = Number(process.env.MIGRATION_BATCH_SIZE || 200);

  console.log(`Starting migration from Firestore collection: ${collectionName}`);

  let migrated = 0;
  let failed = 0;
  let skipped = 0;
  let lastDoc = null;

  try {
    while (true) {
      let query = firestore
        .collection(collectionName)
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(batchSize);

      if (lastDoc) query = query.startAfter(lastDoc);

      const snap = await query.get();
      if (snap.empty) break;

    let skipped = 0;

for (const docSnap of snap.docs) {
  const client = await pool.connect();
  try {
    const result = await migrateOneDoc(client, docSnap);

    if (result.skipped) {
      skipped += 1;
      console.log(
        `SKIPPED doc=${result.docId} uid=${result.uid} commodity=${result.commodity} reason=${result.reason}`
      );
    } else {
      migrated += 1;
      console.log(
        `OK doc=${result.docId} uid=${result.uid} commodity=${result.commodity} run_id=${result.predictionRunId} basis=${result.basisCount} events=${result.eventCount}`
      );
    }
  } catch (err) {
    failed += 1;
    console.error(`FAILED doc=${docSnap.id} error=${err.message}`);
  } finally {
    client.release();
  }
}

      lastDoc = snap.docs[snap.docs.length - 1];
      if (snap.size < batchSize) break;
    }

    console.log(`Done. migrated=${migrated} skipped=${skipped} failed=${failed}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Fatal migration error:", err);
  process.exit(1);
});