// FILE: app/_components/ui/prediction/main.tsx
"use client";

import { useMemo, useState } from "react";

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
} from "./types/types";

import type { PredictionBundle } from "@/src/entities/models/prediction";

// UI helpers
import { BASES, normalizeCommodity } from "@/lib/prediction/options";
import { toNumberLoose } from "@/lib/prediction/normalize";
import { mapPayloadToResult } from "@/lib/prediction/mappers";
import { LS_COMMODITY, clearPredictionStorage } from "@/lib/prediction/storage";
import { cx } from "@/lib/prediction/utils";

// UI sections
import { RiskAnalysisPanel } from "./sections/risk-analysis";
import { DetailedBidAnalysis } from "./sections/detailed-bid-analysis";
import { PredictionSidebar } from "./sections/prediction-sidebar";
import { ForecastResultsCard } from "./sections/forecasting-result";
import { RunTimeline } from "./sections/run-timeline";

type JustTab = "drivers" | "risk" | "evidence" | "cali";

type RunPredictionActionOut = { bundle: PredictionBundle };

function normalizeBasisKeyForApi(k: string) {
  return String(k ?? "")
    .trim()
    .toLowerCase()
    .replace(/-+/g, " ")
    .replace(/\s+/g, " ");
}

export default function PredictionMain() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const [commodity, setCommodity] = useState<string>("sulphur");
  const [futureDate, setFutureDate] = useState<string>("");

  const [basis, setBasis] = useState<string[]>(["middle-east"]);
  const [basePricesByBasis, setBasePricesByBasis] = useState<Record<string, string>>({});

  const [bundle, setBundle] = useState<PredictionBundle | null>(null);

  const [justTab, setJustTab] = useState<JustTab>("cali");
  const [legendOpen, setLegendOpen] = useState(false);

  const MAX_BASIS = 2;

  const [runTl, setRunTl] = useState<RunTimelineState>({
    visible: false,
    steps: { report: "pending", forecast: "pending", refresh: "pending" },
    message: "",
  });

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
    try {
      window.localStorage.setItem(LS_COMMODITY, next.toLowerCase());
      window.dispatchEvent(new Event("ai:commodity"));
    } catch {}
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

  async function runPrediction() {
    if (!canRun || runBusy) return;

    setStatus("loading");
    setError(null);
    setBundle(null);
    setJustTab("cali");

    tlReset();
    tlStep("report", "running", "Checking AI signals…");

    try {
      const basisKeys = (basis ?? []).filter(Boolean).slice(0, MAX_BASIS);

      const basisLabels = basisKeys.map((k) => BASES.find((b) => b.value === k)?.label ?? k);

      const selectedBasePrices = basisKeys.map((b) => toNumberLoose(basePricesByBasis?.[b] ?? ""));

      // Keep current UX: require all base prices.
      if (selectedBasePrices.some((x) => x == null)) {
        throw new Error("Missing base price for one or more selected bases.");
      }

      tlStep("forecast", "running", "Running forecast…");

      // UI sends normalized keys to API (spaces), but keeps dashed keys locally for UI labels.
      const basisKeysNormalized = basisKeys.map(normalizeBasisKeyForApi);

      const out = (await runPredictionAction({
        commodity: commodity.trim().toLowerCase(),
        futureDate,
        basisKeys: basisKeysNormalized,
        basisLabels,
        basePrices: selectedBasePrices as number[],
        region: "global",
      })) as RunPredictionActionOut;

      if (!out || !out.bundle) throw new Error("Invalid API response: missing bundle");

      tlStep("report", "done", "Signals ready.");
      tlStep("forecast", "done", "Forecast complete.");
      tlStep("refresh", "done", "Done.");
      tlHideSoon();

      setBundle(out.bundle);
      setStatus("success");
    } catch (e: any) {
      const msg = e?.message || "Forecast failed";
      tlStep("forecast", "error", msg);
      setStatus("error");
      setError(msg);
    }
  }

  // Derived UI data
  const result = useMemo(() => (bundle ? mapPayloadToResult(bundle as any) : null), [bundle]);

  const tenderUnit = result?.currency ? String(result.currency) : "USD/t";
  const sentimentScore = (bundle as any)?.tender?.signals?.sentimentScore ?? null;

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

  const expectedRange = (bundle as any)?.expectedRange ?? null;
  const p10 = expectedRange?.p10 ?? null;
  const p90 = expectedRange?.p90 ?? null;

  const caliRows = useMemo(
    () => (Array.isArray((bundle as any)?.caliBidTable) ? ((bundle as any).caliBidTable as any[]) : []),
    [bundle]
  );

  const optimalRow = useMemo(() => {
    const rows = caliRows;
    return rows.find((r: any) => String(r?.assessment ?? "").toLowerCase().includes("optimal")) ?? rows[0] ?? null;
  }, [caliRows]);

  const priceWindow = useMemo(() => {
    const w = (bundle as any)?.market?.price_window;
    return Array.isArray(w) ? w : [];
  }, [bundle]);

  const lastChange = useMemo(() => {
    const w = priceWindow;
    if (!w.length) return null;
    const x = Number((w as any)[w.length - 1]?.change);
    return Number.isFinite(x) ? x : null;
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
      explanation: lastChange == null ? "No price change data available." : `Most recent change is ${lastChange > 0 ? "+" : ""}${lastChange} USD/t.`,
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
    const anchor = Number((bundle as any)?.market?.anchorPrice ?? (bundle as any)?.market?.basePrice ?? NaN);

    const anchorDir: Direction =
      !Number.isFinite(anchor) || !hasBand ? "Neutral" : anchor < (p10 as number) ? "Bearish" : anchor > (p90 as number) ? "Bullish" : "Neutral";

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

    const bid = Number((bundle as any)?.tender?.tenderPredictedPrice);
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

  const evidenceRows: EvidenceRow[] = useMemo(() => {
    if (!bundle) return [];

    const raw =
      (Array.isArray((bundle as any)?.evidence) && (bundle as any).evidence) ||
      (Array.isArray((bundle as any)?.news?.events) && (bundle as any).news.events) ||
      [];

    const items = (raw ?? []).filter((x: any) => {
      const s = Number(x?.importance_score);
      return Number.isFinite(s) ? s >= 0.3 : true;
    });

    return items.map((x: any) => {
      const dirRaw = String(x?.impact_direction ?? x?.direction ?? "neutral").toLowerCase();
      const dir: Direction = dirRaw.includes("bear") ? "Bearish" : dirRaw.includes("bull") ? "Bullish" : "Neutral";

      const type = String(x?.event_type ?? x?.type ?? "event");
      const head = String(x?.headline ?? "—");
      const summary = String(x?.evidence_summary ?? x?.relevance ?? "—");

      return { event: head, type, direction: dir, relevance: summary } as EvidenceRow;
    });
  }, [bundle]);

  function handlePrint() {
    if (status !== "success") return;
    window.print();
  }

  return (
    <AppShell title="Prediction">
      <div className="cp-root">
        <div className="cp-container">
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
          />

          <main className="cp-main">
            <div className="cp-card cp-rec-card">
              <div className="cp-rec-header">
                <div className="cp-rec-text">
                  <h2>
                    <ArrowRight size={14} className="th-inline" /> Recommended Action:
                    <strong>
                      {bundle?.tender?.tenderAction ? String(bundle.tender.tenderAction) : "—"} at{" "}
                      {optimalRow?.caliBidRangeFob ? String(optimalRow.caliBidRangeFob).replace(/\s*-\s*/g, "–") : "—"}{" "}
                      {tenderUnit}
                      {" - "}
                      {selectedBases?.[0]?.label ?? "—"}
                    </strong>
                  </h2>

                  <p>
                    <strong>Rationale:</strong>{" "}
                    {optimalRow ? (
                      <>
                        {String((optimalRow as any)?.chanceToWin ?? "—")} win probability + balanced margin (
                        {String((optimalRow as any)?.marginPerTon ?? "—")})
                      </>
                    ) : bundle?.tender?.rationale ? (
                      String(bundle.tender.rationale)
                    ) : (
                      "Run a forecast to generate rationale."
                    )}
                  </p>
                </div>

                <div className="cp-rec-card">
                  <RunTimeline state={runTl} cx={cx} />
                </div>

                <div className="cp-actions">
                  <button className="cp-btn-outline" type="button" disabled={status !== "success"}>
                    <Download size={14} /> EXPORT
                  </button>

                  <button className="cp-btn-outline" type="button" onClick={handlePrint} disabled={status !== "success"}>
                    <Printer size={14} /> PRINT
                  </button>

                  <button className="cp-btn-outline" type="button" disabled>
                    <Share2 size={14} /> SHARE
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              <ForecastResultsCard
                bundle={bundle as any}
                tenderUnit={tenderUnit}
                p10={p10}
                p90={p90}
                sentimentScore={sentimentScore}
                direction={direction}
                strength={strength}
              />
              <RiskAnalysisPanel risk={(bundle as any)?.riskAnalysis ?? { items: [] }} />
            </div>

            <DetailedBidAnalysis
              justTab={justTab as any}
              setJustTab={setJustTab as any}
              legendOpen={legendOpen}
              setLegendOpen={setLegendOpen}
              driversRows={driversRows}
              risksRows={risksRows}
              evidenceRows={evidenceRows}
              caliRows={caliRows as any}
              rawEvidenceEvents={
                Array.isArray((bundle as any)?.news?.events)
                  ? (bundle as any).news.events
                  : Array.isArray((bundle as any)?.evidence)
                    ? (bundle as any).evidence
                    : []
              }
            />
          </main>
        </div>
      </div>
    </AppShell>
  );
}
