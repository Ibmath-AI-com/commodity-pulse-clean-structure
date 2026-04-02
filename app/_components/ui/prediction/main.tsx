"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/app/_components/app-shell";
import { runPredictionAction } from "@/app/(protected)/prediction/actions";

import { Download, Share2, Printer, ArrowRight } from "lucide-react";

import type {
  Status,
  Direction,
  Strength,
  DriverRow,
  RiskRow,
  EvidenceRow,
  RunTimelineState,
  RunStepKey,
  StepState,
  RiskPayload,
  RiskItem,
  RiskLevel,
} from "./types/types";

import type { PredictionBundle } from "@/src/entities/models/prediction";
import type { PredictionReadinessResult } from "@/src/entities/models/document-generation-status";

import { BASES, normalizeCommodity } from "@/lib/common/options";
import { toNumberLoose } from "@/lib/prediction/normalize";
import { mapPayloadToResult } from "@/lib/prediction/mappers";
import { clearPredictionStorage } from "@/lib/prediction/storage";
import { cx } from "@/app/_components/utils";
import {
  DEFAULT_COMMODITY,
  getStoredCommodity,
  setStoredCommodity,
  subscribeStoredCommodity,
} from "@/lib/common/commodity-preference";

import { RiskAnalysisPanel } from "./sections/risk-analysis";
import { DetailedBidAnalysis } from "./sections/detailed-bid-analysis";
import { PredictionSidebar } from "./sections/prediction-sidebar";
import { ForecastResultsCard } from "./sections/forecasting-result";
import { RunTimeline } from "./sections/run-timeline";

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

function asNumber(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function getNestedValue(root: unknown, path: string[]): unknown {
  let cur: unknown = root;
  for (const k of path) {
    if (!isRecord(cur)) return undefined;
    cur = cur[k];
  }
  return cur;
}

function getRowString(row: UnknownRecord | null, key: string): string | null {
  if (!row) return null;
  const v = row[key];
  return typeof v === "string" || typeof v === "number" ? String(v) : null;
}

function normalizeBasisKeyForApi(k: string) {
  return String(k ?? "")
    .trim()
    .toLowerCase()
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ");
}

type JustTab = "drivers" | "risk" | "evidence" | "cali";

type RunPredictionActionOut =
  | {
      type: "blocked";
      message: string;
    }
  | {
      type: "confirmation_required";
      message: string;
      status: PredictionReadinessResult;
    }
  | {
      type: "success";
      bundle: PredictionBundle;
    };

function toRiskPayload(v: unknown): RiskPayload {
  if (!isRecord(v)) return { items: [] };

  const rawItems = v.items;
  const items: RiskItem[] = Array.isArray(rawItems)
    ? rawItems
        .filter(isRecord)
        .map((it) => {
          const levelRaw = it.level;
          const level: RiskLevel | undefined =
            levelRaw === "HIGH" || levelRaw === "MEDIUM" || levelRaw === "LOW"
              ? levelRaw
              : undefined;

          return {
            key: typeof it.key === "string" ? it.key : undefined,
            title: typeof it.title === "string" ? it.title : undefined,
            level,
            bullet: typeof it.bullet === "string" ? it.bullet : undefined,
          };
        })
    : [];

  return {
    asOf: typeof v.asOf === "string" || v.asOf === null ? (v.asOf as string | null) : undefined,
    modelVersion: typeof v.modelVersion === "number" ? v.modelVersion : undefined,
    items,
  };
}

export default function PredictionMain() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const [commodity, setCommodity] = useState<string>(() =>
    typeof window === "undefined" ? DEFAULT_COMMODITY : getStoredCommodity()
  );
  const [futureDate, setFutureDate] = useState<string>("");

  const [basis, setBasis] = useState<string[]>(["middle-east"]);
  const [basePricesByBasis, setBasePricesByBasis] = useState<Record<string, string>>({});

  const [bundle, setBundle] = useState<PredictionBundle | null>(null);

  const [justTab, setJustTab] = useState<JustTab>("cali");
  const [legendOpen, setLegendOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message: string;
    status: PredictionReadinessResult | null;
  }>({
    open: false,
    message: "",
    status: null,
  });

  const MAX_BASIS = 2;

  const [runTl, setRunTl] = useState<RunTimelineState>({
    visible: false,
    steps: { report: "pending", forecast: "pending", refresh: "pending" },
    message: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => subscribeStoredCommodity((value) => setCommodity(value)), []);

  function tlReset(msg?: string) {
    setRunTl({
      visible: true,
      steps: { report: "pending", forecast: "pending", refresh: "pending" },
      message: msg ?? "",
    });
  }

  function tlStep(key: RunStepKey, st: StepState, msg?: string) {
    setRunTl((prev) => ({
      ...prev,
      visible: true,
      steps: { ...prev.steps, [key]: st },
      message: msg ?? prev.message,
    }));
  }

  function tlHideSoon(ms = 2500) {
    window.setTimeout(() => {
      setRunTl((prev) => ({ ...prev, visible: false, message: "" }));
    }, ms);
  }

  function handlePrint() {
    if (status !== "success") return;
    window.print();
  }

  const runBusy =
    runTl.visible &&
    (runTl.steps.forecast === "running" ||
      runTl.steps.report === "running" ||
      runTl.steps.refresh === "running");

  function toggleBasis(v: string) {
    setBasis((prev) => {
      const has = prev.includes(v);
      if (has) return prev.filter((x) => x !== v);
      if (prev.length >= MAX_BASIS) return prev;
      return [...prev, v];
    });
  }

  function resetPredictionScreenState() {
    setStatus("idle");
    setError(null);
    setBundle(null);
    setJustTab("cali");
    setFutureDate("");
    setBasis(["middle-east"]);
    setBasePricesByBasis({});
  }

  function handleCommodityChange(nextRaw: string) {
    const next = normalizeCommodity(nextRaw);
    if (next === commodity) return;

    clearPredictionStorage();
    resetPredictionScreenState();

    setCommodity(next);
    setStoredCommodity(next);
  }

  const selectedBases = useMemo(() => {
    return (basis ?? [])
      .map((v) => ({ value: v, label: BASES.find((b) => b.value === v)?.label ?? v }))
      .slice(0, MAX_BASIS);
  }, [basis]);

  function setBasePriceText(basisKey: string, v: string) {
    setBasePricesByBasis((prev) => ({ ...(prev ?? {}), [basisKey]: v }));
  }

  const canRun = Boolean(
    commodity.trim().length > 0 &&
      futureDate.trim().length > 0 &&
      (basis ?? []).length > 0 &&
      status !== "loading"
  );

  async function executePrediction(forceRun: boolean) {
    const basisKeys = (basis ?? []).filter(Boolean).slice(0, MAX_BASIS);
    const basisLabels = basisKeys.map((k) => BASES.find((b) => b.value === k)?.label ?? k);
    const selectedBasePrices = basisKeys.map((b) => toNumberLoose(basePricesByBasis?.[b] ?? ""));

    if (selectedBasePrices.some((x) => x == null)) {
      throw new Error("Missing base price for one or more selected bases.");
    }

    const basisKeysNormalized = basisKeys.map(normalizeBasisKeyForApi);

    return (await runPredictionAction({
      commodity: commodity.trim().toLowerCase(),
      futureDate,
      basisKeys: basisKeysNormalized,
      basisLabels,
      basePrices: selectedBasePrices as number[],
      region: "global",
      forceRun,
    })) as RunPredictionActionOut;
  }

  async function runPrediction() {
    if (!canRun || runBusy) return;

    setStatus("loading");
    setError(null);
    setBundle(null);
    setJustTab("cali");

    tlReset();
    tlStep("report", "running", "Checking documents…");

    try {
      const out = await executePrediction(false);

      if (out.type === "blocked") {
        tlStep("forecast", "error", out.message);
        setStatus("error");
        setError(out.message);
        return;
      }

      if (out.type === "confirmation_required") {
        tlStep("forecast", "pending", "User confirmation required.");
        setStatus("idle");
        setConfirmState({
          open: true,
          message: out.message,
          status: out.status,
        });
        return;
      }

      tlStep("report", "done", "Documents ready.");
      tlStep("forecast", "done", "Forecast complete.");
      tlStep("refresh", "done", "Done.");
      tlHideSoon();

      setBundle(out.bundle);
      setStatus("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Forecast failed";
      tlStep("forecast", "error", msg);
      setStatus("error");
      setError(msg);
    }
  }

  async function continueWithoutPendingDocs() {
    setConfirmState({ open: false, message: "", status: null });
    setStatus("loading");
    setError(null);
    tlReset();
    tlStep("forecast", "running", "Running forecast with ready documents only…");

    try {
      const out = await executePrediction(true);

      if (out.type === "blocked") {
        tlStep("forecast", "error", out.message);
        setStatus("error");
        setError(out.message);
        return;
      }

      if (out.type === "confirmation_required") {
        tlStep("forecast", "error", out.message);
        setStatus("error");
        setError(out.message);
        return;
      }

      tlStep("report", "done", "Documents checked.");
      tlStep("forecast", "done", "Forecast complete.");
      tlStep("refresh", "done", "Done.");
      tlHideSoon();

      setBundle(out.bundle);
      setStatus("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Forecast failed";
      tlStep("forecast", "error", msg);
      setStatus("error");
      setError(msg);
    }
  }

  const result = useMemo(() => (bundle ? mapPayloadToResult(bundle) : null), [bundle]);

  const tenderUnit = result?.currency ? String(result.currency) : "USD/t";
  const sentimentScore = bundle?.tender?.signals?.sentimentScore ?? null;
  const score = typeof sentimentScore === "number" && Number.isFinite(sentimentScore) ? sentimentScore : null;

  const direction: Direction =
    score == null ? "Neutral" : score > 0.15 ? "Bullish" : score < -0.15 ? "Bearish" : "Neutral";

  const strength: Strength =
    score == null
      ? "N/A"
      : Math.abs(score) >= 0.7
        ? "Strong"
        : Math.abs(score) >= 0.4
          ? "Moderate"
          : Math.abs(score) >= 0.15
            ? "Slight"
            : "N/A";

  const expectedRange = useMemo(() => {
    const er = getNestedValue(bundle, ["expectedRange"]);
    if (!isRecord(er)) return null;
    const p10 = asNumber(er.p10);
    const p90 = asNumber(er.p90);
    return { p10, p90 };
  }, [bundle]);

  const p10 = expectedRange?.p10 ?? null;
  const p90 = expectedRange?.p90 ?? null;

  type CaliRow = UnknownRecord;

  const caliRows = useMemo<CaliRow[]>(() => {
    const tbl = getNestedValue(bundle, ["caliBidTable"]);
    return asArray(tbl).filter(isRecord);
  }, [bundle]);

  const optimalRow = useMemo<CaliRow | null>(() => {
    if (!caliRows.length) return null;
    const found =
      caliRows.find((r) => asString(r.assessment)?.toLowerCase().includes("optimal")) ?? null;
    return found ?? caliRows[0] ?? null;
  }, [caliRows]);

  const priceWindow = useMemo<UnknownRecord[]>(() => {
    const pw = getNestedValue(bundle, ["market", "price_window"]);
    return asArray(pw).filter(isRecord);
  }, [bundle]);

  const lastChange = useMemo<number | null>(() => {
    if (!priceWindow.length) return null;
    const last = priceWindow[priceWindow.length - 1];
    return asNumber(last.change);
  }, [priceWindow]);

  const driversRows: DriverRow[] = useMemo(() => {
    if (!bundle) return [];

    const momentumDir: Direction =
      lastChange == null ? "Neutral" : lastChange > 0 ? "Bullish" : lastChange < 0 ? "Bearish" : "Neutral";

    const absLC = lastChange == null ? 0 : Math.abs(lastChange);
    const momentumStrength: "Weak" | "Moderate" | "Strong" =
      lastChange == null ? "Weak" : absLC >= 10 ? "Strong" : absLC >= 3 ? "Moderate" : "Weak";

    const rows: DriverRow[] = [];

    rows.push({
      driver: "Price momentum (latest move)",
      direction: momentumDir,
      strength: momentumStrength,
      explanation:
        lastChange == null
          ? "No price change data available."
          : `Most recent change is ${lastChange > 0 ? "+" : ""}${lastChange} USD/t.`,
    });

    const s = score;
    const newsDir: Direction = s == null ? "Neutral" : s > 0.15 ? "Bullish" : s < -0.15 ? "Bearish" : "Neutral";

    const absS = s == null ? 0 : Math.abs(s);
    const newsStrength: "Weak" | "Moderate" | "Strong" =
      s == null ? "Weak" : absS >= 0.7 ? "Strong" : absS >= 0.4 ? "Moderate" : "Weak";

    rows.push({
      driver: "News sentiment (short-term)",
      direction: newsDir,
      strength: newsStrength,
      explanation: s == null ? "No sentiment score provided." : `Sentiment score is ${s.toFixed(2)} (${newsDir}).`,
    });

    const hasBand = Number.isFinite(p10) && Number.isFinite(p90);
    const market = getNestedValue(bundle, ["market"]);
    const marketRec = isRecord(market) ? market : null;

    const anchorRaw = marketRec?.anchorPrice ?? marketRec?.basePrice;
    const anchor = typeof anchorRaw === "number" ? anchorRaw : Number(anchorRaw);

    const anchorDir: Direction =
      !Number.isFinite(anchor) || !hasBand
        ? "Neutral"
        : anchor < (p10 as number)
          ? "Bearish"
          : anchor > (p90 as number)
            ? "Bullish"
            : "Neutral";

    rows.push({
      driver: "Anchor positioning vs expected band",
      direction: anchorDir,
      strength: "Weak",
      explanation: Number.isFinite(anchor) && hasBand ? `Anchor ${anchor} USD/t vs band ${p10}–${p90}.` : "Anchor/band not available.",
    });

    return rows;
  }, [bundle, lastChange, score, p10, p90]);

  const risksRows: RiskRow[] = useMemo(() => {
    if (!bundle) return [];

    const rows: RiskRow[] = [];
    const hasBand = Number.isFinite(p10) && Number.isFinite(p90);

    const bidRaw = getNestedValue(bundle, ["tender", "tenderPredictedPrice"]);
    const bid = typeof bidRaw === "number" ? bidRaw : Number(bidRaw);
    const bidOk = Number.isFinite(bid);

    const bearishSent = typeof score === "number" && score < -0.15;
    const recentDown = typeof lastChange === "number" && lastChange < 0;

    const sev1: "Low" | "Medium" | "High" =
      bearishSent && recentDown ? "High" : bearishSent || recentDown ? "Medium" : "Low";

    rows.push({
      risk: "Downside continuation",
      severity: sev1,
      condition: hasBand ? `If market trades below ${p10} USD/t (band low).` : "If market weakens below recent support.",
      impact: "Margin erosion; recommended band becomes invalid.",
    });

    const sev2: "Low" | "Medium" | "High" =
      bearishSent && hasBand && bidOk && bid > (p90 as number) ? "High" : bearishSent ? "Medium" : "Low";

    rows.push({
      risk: "Overbidding vs news sentiment",
      severity: sev2,
      condition: hasBand && bidOk ? `If bid > ${p90} USD/t while sentiment is bearish.` : "If bid exceeds fair band while sentiment is bearish.",
      impact: "Higher win probability but weaker resale economics.",
    });

    rows.push({
      risk: "Event impact fades / remains neutral",
      severity: "Low",
      condition: "If reported disruptions/tenders do not tighten physical supply/demand.",
      impact: "Removes bullish support; price reverts to statistical band.",
    });

    return rows;
  }, [bundle, p10, p90, score, lastChange]);

  const riskPayload = useMemo<RiskPayload>(() => {
    const raw = getNestedValue(bundle, ["riskAnalysis"]);
    return toRiskPayload(raw);
  }, [bundle]);

  const rawEvidenceEvents = useMemo<UnknownRecord[]>(() => {
    const newsEvents = getNestedValue(bundle, ["news", "events"]);
    const evidence = getNestedValue(bundle, ["evidence"]);
    const arr = asArray(newsEvents).length ? asArray(newsEvents) : asArray(evidence);
    return arr.filter(isRecord);
  }, [bundle]);

  const evidenceRows: EvidenceRow[] = useMemo(() => {
    if (!bundle) return [];

    const items = rawEvidenceEvents.filter((x) => {
      const s = asNumber(x.importance_score);
      return s == null ? true : s >= 0.3;
    });

    return items.map((x) => {
      const dirRaw = (asString(x.impact_direction) ?? asString(x.direction) ?? "neutral").toLowerCase();
      const dir: Direction = dirRaw.includes("bear") ? "Bearish" : dirRaw.includes("bull") ? "Bullish" : "Neutral";

      const type = asString(x.event_type) ?? asString(x.type) ?? "event";
      const head = asString(x.headline) ?? "—";
      const summary = asString(x.evidence_summary) ?? asString(x.relevance) ?? "—";

      return { event: head, type, direction: dir, relevance: summary };
    });
  }, [bundle, rawEvidenceEvents]);


  return (
    <AppShell title="Prediction" onOpenMobileSidebar={() => setSidebarOpen(true)}>
      <div className="cp-root">
        <div className="cp-container cp-mobile-layout">
          {sidebarOpen ? (
            <button
              type="button"
              className="cp-mobile-sidebar-backdrop"
              aria-label="Close prediction sidebar"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <PredictionSidebar
            commodity={commodity}
            futureDate={futureDate}
            status={status}
            basis={basis}
            maxBasis={MAX_BASIS}
            selectedBases={selectedBases}
            basePricesByBasis={basePricesByBasis}
            canRun={Boolean(canRun)}
            error={error}
            handleCommodityChange={handleCommodityChange}
            setFutureDate={setFutureDate}
            setBasePriceText={setBasePriceText}
            toggleBasis={toggleBasis}
            runPrediction={runPrediction}
            runTl={runTl}
            mobileOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
          />

          <main className="cp-main">
            <div className="dashboard-grid">
              <ForecastResultsCard
                bundle={bundle}
                tenderUnit={tenderUnit}
                p10={p10}
                p90={p90}
                sentimentScore={sentimentScore}
                direction={direction}
                strength={strength}
                canPrint={status === "success"}
                onPrint={handlePrint}
              />
              <RiskAnalysisPanel risk={riskPayload} />
            </div>

            <DetailedBidAnalysis
              commodity={commodity}
              justTab={justTab}
              setJustTab={setJustTab}
              legendOpen={legendOpen}
              setLegendOpen={setLegendOpen}
              driversRows={driversRows}
              risksRows={risksRows}
              evidenceRows={evidenceRows}
              caliRows={caliRows}
            />
          </main>
        </div>

        {confirmState.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">Documents not fully ready</h3>
              <p className="mt-2 text-sm text-slate-600">{confirmState.message}</p>

             <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div>Ready: {confirmState.status?.readyDocuments.length ?? 0}</div>
                <div>Running: {confirmState.status?.runningDocuments.length ?? 0}</div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="cp-btn-outline"
                  onClick={() => setConfirmState({ open: false, message: "", status: null })}
                >
                  Wait
                </button>

                <button type="button" className="ui-primary-sm-button" onClick={continueWithoutPendingDocs}>
                  Continue without unavailable files
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
