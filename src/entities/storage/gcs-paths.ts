// FILE: src/entities/storage/gcs-paths.ts

export type Root = "incoming" | "archive" | "clean";
export type SourceKind = "doc" | "rdata";

/**
 * NOTE: Your old API used `clean/${commodity}/eventsignals/` (no region).
 * Keep that canonical unless you deliberately change the writer.
 */
export function eventSignalsPrefix(commodity: string) {
  const c = normCommodity(commodity);
  return `clean/${c}/eventsignals/`;
}

export function incomingObjectPath(params: {
  commodity: string;
  kind: SourceKind;
  filename: string;
  region?: string; // optional
  root?: "incoming" | "archive";
}) {
  const commodity = normCommodity(params.commodity);
  const kind = params.kind;
  const safeFilename = safeBaseName(params.filename);
  const root = params.root ?? "incoming";
  const region = normOpt(params.region);

  // incoming/sulphur/doc/report.pdf OR incoming/sulphur/doc/global/report.pdf
  return region
    ? `${root}/${commodity}/${kind}/${region}/${safeFilename}`
    : `${root}/${commodity}/${kind}/${safeFilename}`;
}

export function cleanObjectPath(params: {
  commodity: string;
  kind: "doc" | "price";
  filename: string;
  region?: string; // optional
}) {
  const commodity = normCommodity(params.commodity);
  const kind = params.kind;
  const safeFilename = safeBaseName(params.filename);
  const region = normOpt(params.region);

  return region
    ? `clean/${commodity}/${kind}/${region}/${safeFilename}`
    : `clean/${commodity}/${kind}/${safeFilename}`;
}

function safeBaseName(filename: string) {
  return filename.replace(/[\\]/g, "/").split("/").pop() || "file";
}

function normCommodity(x: string) {
  const t = (x ?? "").trim().toLowerCase();
  if (!t) throw new Error("Missing commodity");
  return t;
}

function normOpt(x?: string) {
  const t = (x ?? "").trim().toLowerCase();
  return t ? t : "";
}
