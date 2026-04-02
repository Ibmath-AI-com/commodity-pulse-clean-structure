"use client";

import * as React from "react";
import { Info, FileText, XCircle } from "lucide-react";
import { getPredictionActiveNewsAction, type PredictionActiveNewsItem } from "@/app/(protected)/prediction/actions";

import { cx } from "@/app/_components/utils";
import { AssessmentLegendTooltip } from "../tooltip/implication-legend";

import type {
  DriverRow,
  RiskRow,
  EvidenceRow,
  Direction,
} from "../types/types";

export type JustTab = "drivers" | "risk" | "evidence" | "cali";

export type CaliBidRow = {
  caliBidRangeFob?: string | null;
  chanceToWin?: string | null;
  marginRiskDec?: string | null;
  assessment?: string | null;
  marginPerTon?: string | null;
  reportNewsInterpretation?: string | null;
};

function statusClsFromSeverity(s: "Low" | "Medium" | "High") {
  if (s === "High") return "status-danger";
  if (s === "Low") return "status-info";
  return "status-warning";
}

function statusClsFromDir(d: Direction) {
  if (d === "Bullish") return "status-optimal";
  if (d === "Bearish") return "status-danger";
  return "status-info";
}

export function DetailedBidAnalysis(props: {
  commodity: string;
  justTab: JustTab;
  setJustTab: (t: JustTab) => void;

  legendOpen: boolean;
  setLegendOpen: (v: boolean) => void;

  driversRows: DriverRow[];
  risksRows: RiskRow[];
  evidenceRows: EvidenceRow[];

  caliRows: CaliBidRow[];
}) {
  const {
    commodity,
    justTab,
    setJustTab,
    legendOpen,
    setLegendOpen,
    driversRows,
    risksRows,
    evidenceRows,
    caliRows,
  } = props;

  const [evOpen, setEvOpen] = React.useState(false);
  const [evTitle, setEvTitle] = React.useState<string>("");
  const [evItems, setEvItems] = React.useState<PredictionActiveNewsItem[]>([]);
  const [evLoading, setEvLoading] = React.useState(false);
  const [evError, setEvError] = React.useState("");

  async function openAllEvidence() {
    setEvTitle("Active linked news");
    setEvItems([]);
    setEvError("");
    setEvLoading(true);
    setEvOpen(true);

    try {
      const items = await getPredictionActiveNewsAction({ commodity });
      setEvItems(items);
    } catch (error) {
      setEvError(error instanceof Error ? error.message : "Failed to load active news.");
    } finally {
      setEvLoading(false);
    }
  }

  function closeEvidence() {
    setEvOpen(false);
    setEvTitle("");
    setEvItems([]);
    setEvLoading(false);
    setEvError("");
  }

  return (
    <section className="cp-card pl-4 pr-4 pb-4">
      <div className="analysisHeaderTop">
        <div className="th-left">
          <div className="h2">DETAILED BID ANALYSIS</div>
        </div>

        <button
          className="cp-btn-outline analysisEvidenceBtn"
          type="button"
          onClick={openAllEvidence}
          disabled={!commodity}
          title="Open all linked events"
        >
          <FileText className="h-4 w-4" />
          Evidence
        </button>
      </div>

      <div className="tt-sub-nav mt-3 mb-2">
        <button
          className={cx("tt-sub-navLink", justTab === "drivers" && "tt-navLinkActive")}
          onClick={() => setJustTab("drivers")}
          type="button"
        >
          DRIVERS
        </button>
        <button
          className={cx("tt-sub-navLink", justTab === "risk" && "tt-navLinkActive")}
          onClick={() => setJustTab("risk")}
          type="button"
        >
          RISKS
        </button>
        <button
          className={cx("tt-sub-navLink", justTab === "evidence" && "tt-navLinkActive")}
          onClick={() => setJustTab("evidence")}
          type="button"
        >
          EVIDENCE
        </button>
        <button
          className={cx("tt-sub-navLink", justTab === "cali" && "tt-navLinkActive")}
          onClick={() => setJustTab("cali")}
          type="button"
        >
          CALI BID
        </button>
      </div>

      {justTab !== "cali" ? (
        <>
          {justTab === "drivers" ? (
            <table className="cp-table cp-mobile-records">
              <thead>
                <tr>
                  <th>DRIVER</th>
                  <th>DIRECTION</th>
                  <th>STRENGTH</th>
                  <th>EXPLANATION</th>
                </tr>
              </thead>
              <tbody>
                {driversRows.length ? (
                  driversRows.map((r, idx) => (
                    <tr key={idx}>
                      <td data-label="Driver">{r.driver}</td>
                      <td data-label="Direction">
                        <span className={cx("status-label", statusClsFromDir(r.direction))}>
                          {r.direction.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Strength">
                        <span
                          className={cx(
                            "status-label",
                            r.strength === "Strong"
                              ? "status-optimal"
                              : r.strength === "Weak"
                              ? "status-info"
                              : "status-warning"
                          )}
                        >
                          {r.strength.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Explanation">{r.explanation}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="cp-empty">
                      No drivers available. Run a forecast.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : justTab === "risk" ? (
            <table className="cp-table cp-mobile-records">
              <thead>
                <tr>
                  <th>RISK</th>
                  <th>SEVERITY</th>
                  <th>CONDITION</th>
                  <th>IMPACT</th>
                </tr>
              </thead>
              <tbody>
                {risksRows.length ? (
                  risksRows.map((r, idx) => (
                    <tr key={idx}>
                      <td data-label="Risk">{r.risk}</td>
                      <td data-label="Severity">
                        <span className={cx("status-label", statusClsFromSeverity(r.severity))}>
                          {r.severity.toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Condition">{r.condition}</td>
                      <td data-label="Impact">{r.impact}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="cp-empty">
                      No risk analysis available. Run a forecast.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="cp-table cp-mobile-records">
              <thead>
                <tr>
                  <th>EVENT</th>
                  <th>TYPE</th>
                  <th>DIRECTION</th>
                  <th>RELEVANCE</th>
                </tr>
              </thead>
              <tbody>
                {evidenceRows.length ? (
                  evidenceRows.map((r, idx) => (
                    <tr key={idx}>
                      <td data-label="Event">{r.event}</td>
                      <td data-label="Type">
                        <span className={cx("status-label", "status-info")}>
                          {String(r.type).replace(/_/g, " ").toUpperCase()}
                        </span>
                      </td>
                      <td data-label="Direction">
                        <span className={cx("status-label", statusClsFromDir(r.direction))}>
                          {r.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="line-clamp-3" data-label="Relevance">{r.relevance}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="cp-empty">
                      No material news/event evidence was used for this forecast. Model relies on price action and statistical
                      bands.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <table className="cp-table cp-mobile-records cp-cali-mobile-records">
          <thead>
            <tr>
              <th className="w-[10%]">RANGE</th>
              <th className="w-[13%]">CHANCE</th>
              <th className="w-[13%]">RISK</th>
              <th>
                <span className="th-inline flex items-center gap-2">
                  ASSESSMENT
                  <span
                    className="relative inline-flex"
                    onMouseEnter={() => setLegendOpen(true)}
                    onMouseLeave={() => setLegendOpen(false)}
                  >
                    <Info size={16} className="text-slate-500 hover:text-slate-700 cursor-help" aria-label="Assessment legend" />
                    <AssessmentLegendTooltip open={legendOpen} align="left" />
                  </span>
                </span>
              </th>
              <th className="w-[10%]">MARGIN</th>
              <th>Report / News interpretation</th>
            </tr>
          </thead>
          <tbody>
            {(caliRows ?? []).length ? (
              (caliRows ?? []).map((row, idx) => {
                const a = (row.assessment || "").toLowerCase();
                const cls =
                  a.includes("optimal")
                    ? "status-optimal"
                    : a.includes("attractive")
                    ? "status-info"
                    : a.includes("avoid") || a.includes("risky")
                    ? "status-danger"
                    : a.includes("slight") || a.includes("recommended")
                    ? "status-warning"
                    : "status-info";

                const highlight = a.includes("optimal");

                return (
                  <tr key={idx} className={highlight ? "cp-row-highlight" : undefined}>
                    <td>{row.caliBidRangeFob || "—"}</td>
                    <td>{row.chanceToWin || "—"}</td>
                    <td>{row.marginRiskDec || "—"}</td>
                    <td className={cx("status-cell", cls)}>
                      <div className="status-label">{String(row.assessment ?? "—").toLowerCase()}</div>
                    </td>
                    <td>{row.marginPerTon || "—"}</td>
                    <td>
                      {row.reportNewsInterpretation ? (
                        <span className="line-clamp-2">{row.reportNewsInterpretation}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="cp-empty">
                  No CALI bid table returned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {evOpen ? (
        <div className="fixed inset-0 z-[12000]">
          <div
            className="absolute inset-0 bg-[rgba(15,92,58,0.08)] backdrop-blur-[1px]"
            onClick={closeEvidence}
            aria-hidden="true"
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="flex max-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] bg-[#fbfdfb] shadow-[0_18px_48px_rgba(15,92,58,0.10)]">
              <div className="flex items-center justify-between border-b border-[#e5ebe7] bg-[#f1f4f2] px-5 py-3.5 sm:px-6">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-slate-900">EVIDENCE</div>
                  <div className="mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{evTitle || "-"}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {evLoading
                      ? "Loading active news..."
                      : evItems.length
                      ? `Showing ${evItems.length} active news items`
                      : "No active news available."}
                  </div>
                </div>

                <button className="cp-btn-outline" type="button" onClick={closeEvidence} title="Close">
                  <XCircle className="h-4 w-4" />
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-auto p-5 sm:p-6">
                {evLoading ? (
                  <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
                    Loading active news...
                  </div>
                ) : evError ? (
                  <div className="flex items-center justify-center px-6 py-16 text-sm text-rose-600">
                    {evError}
                  </div>
                ) : evItems.length ? (
                  <div className="flex flex-col gap-4">
                    {evItems.map((e, i) => {
                      const impact = (e.impactDirection ?? "neutral").toLowerCase();
                      const impactTone = impact.includes("bear")
                        ? "bg-rose-100 text-rose-700"
                        : impact.includes("bull")
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-700";

                      return (
                        <div
                          key={`${e.documentId}-${e.headline}-${i}`}
                          className="overflow-hidden rounded-[24px] border border-[#e3ebe5] bg-white shadow-[0_10px_24px_rgba(15,92,58,0.05)]"
                        >
                          <div className="flex items-start justify-between gap-3 border-b border-[#e8efea] bg-[#f1f4f2] px-4 py-3.5">
                            <div className="min-w-0">
                              <div className="truncate text-[14px] font-semibold text-slate-900">{e.headline}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                Source document: <span className="font-medium text-slate-700">{e.documentName}</span>
                              </div>
                            </div>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${impactTone}`}>
                              {e.impactDirection || "unclear"}
                            </span>
                          </div>

                          <div className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
                              <span className="text-slate-600">{e.eventType || "other"}</span>
                              {e.importanceScore != null ? (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <span>Score {e.importanceScore}</span>
                                </>
                              ) : null}
                              {e.eventDate ? (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <span>{String(e.eventDate).slice(0, 10)}</span>
                                </>
                              ) : null}
                              {e.regions.length ? (
                                <>
                                  <span className="text-slate-300">|</span>
                                  <span>Regions {e.regions.join(", ")}</span>
                                </>
                              ) : null}
                            </div>

                            <div className="mt-3 text-[13px] leading-6 text-slate-600">
                              {e.evidenceSummary || "No summary available."}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
                    No active news available.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
