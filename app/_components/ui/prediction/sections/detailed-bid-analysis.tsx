"use client";

import * as React from "react";
import { Info, FileText, XCircle } from "lucide-react";

import { cx } from "@/lib/prediction/utils";
import { AssessmentLegendTooltip } from "../tooltip/implication-legend";

import type {
  DriverRow,
  RiskRow,
  EvidenceRow,
  Direction,
} from "../types/types";

/**
 * UI-only types (keep OUT of entities).
 * If you want, move these to: app/_components/ui/prediction/types.ts
 */
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
  justTab: JustTab;
  setJustTab: (t: JustTab) => void;

  legendOpen: boolean;
  setLegendOpen: (v: boolean) => void;

  driversRows: DriverRow[];
  risksRows: RiskRow[];
  evidenceRows: EvidenceRow[];

  caliRows: CaliBidRow[];

  rawEvidenceEvents: Array<{
    headline?: string;
    impact_direction?: string;
    importance_score?: number;
    event_type?: string;
    event_date?: string;
    regions?: string[];
    evidence_summary?: string;
  }>;
}) {
  const {
    justTab,
    setJustTab,
    legendOpen,
    setLegendOpen,
    driversRows,
    risksRows,
    evidenceRows,
    caliRows,
    rawEvidenceEvents,
  } = props;

  const [evOpen, setEvOpen] = React.useState(false);
  const [evTitle, setEvTitle] = React.useState<string>("");
  const [evItems, setEvItems] = React.useState<typeof rawEvidenceEvents>([]);

  function openAllEvidence() {
    setEvTitle("All linked events");
    setEvItems(Array.isArray(rawEvidenceEvents) ? rawEvidenceEvents : []);
    setEvOpen(true);
  }

  function closeEvidence() {
    setEvOpen(false);
    setEvTitle("");
    setEvItems([]);
  }

  return (
    <section className="cp-card pl-4 pr-4 pb-4">
      <div className="table-header">
        <div className="th-left">
          <div className="h2">DETAILED BID ANALYSIS</div>
        </div>

        <div className="th-right">
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

            <button
              className="toolbar-btn"
              type="button"
              onClick={openAllEvidence}
              disabled={!rawEvidenceEvents?.length}
              title="Open all linked events"
            >
              <FileText className="h-4 w-4" />
              Evidence
            </button>
          </div>
        </div>
      </div>

      {justTab !== "cali" ? (
        <>
          {justTab === "drivers" ? (
            <table className="cp-table">
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
                      <td>{r.driver}</td>
                      <td>
                        <span className={cx("status-label", statusClsFromDir(r.direction))}>
                          {r.direction.toUpperCase()}
                        </span>
                      </td>
                      <td>
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
                      <td>{r.explanation}</td>
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
            <table className="cp-table">
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
                      <td>{r.risk}</td>
                      <td>
                        <span className={cx("status-label", statusClsFromSeverity(r.severity))}>
                          {r.severity.toUpperCase()}
                        </span>
                      </td>
                      <td>{r.condition}</td>
                      <td>{r.impact}</td>
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
            <table className="cp-table">
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
                      <td>{r.event}</td>
                      <td>
                        <span className={cx("status-label", "status-info")}>
                          {String(r.type).replace(/_/g, " ").toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={cx("status-label", statusClsFromDir(r.direction))}>
                          {r.direction.toUpperCase()}
                        </span>
                      </td>
                      <td className="line-clamp-3">{r.relevance}</td>
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
        <table className="data-grid">
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
                    : "st-info";

                const highlight = a.includes("optimal");

                return (
                  <tr key={idx} className={highlight ? "cp-row-highlight" : undefined}>
                    <td>{row.caliBidRangeFob || "—"}</td>
                    <td>{row.chanceToWin || "—"}</td>
                    <td>{row.marginRiskDec || "—"}</td>
                    <td>
                      <span className={cx("status-label", cls)}>{String(row.assessment ?? "—").toLowerCase()}</span>
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

      {/* Evidence modal (global) */}
      {evOpen ? (
        <div className="fixed inset-0 z-[12000]">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(9,30,66,0.35)" }}
            onClick={closeEvidence}
            aria-hidden="true"
          />

          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div style={{ width: "100%", maxWidth: 980, background: "#fff", border: "1px solid #dfe1e6" }}>
              <div style={{ padding: "14px 16px", background: "#e9ecef", borderBottom: "1px solid #dfe1e6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>EVIDENCE</div>
                    <div style={{ marginTop: 2, fontSize: 12, color: "#42526e" }}>
                      <span style={{ fontWeight: 700, color: "#172b4d" }}>{evTitle || "—"}</span>
                    </div>
                    <div style={{ marginTop: 2, fontSize: 12, color: "#7a869a" }}>
                      {evItems.length ? `Showing ${evItems.length} linked events` : "No linked events available."}
                    </div>
                  </div>

                  <button className="toolbar-btn" type="button" onClick={closeEvidence} title="Close">
                    <XCircle className="h-4 w-4" />
                    Close
                  </button>
                </div>
              </div>

              <div style={{ padding: 12, maxHeight: "72vh", overflowY: "auto" }}>
                {evItems.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {evItems.map((e, i) => {
                      const impact = (e?.impact_direction ?? "neutral").toString().toLowerCase();
                      const impactTone =
                        impact.includes("bear") || impact === "down"
                          ? { bg: "#ffebe6", fg: "#de350b", bd: "#ffbdad" }
                          : impact.includes("bull") || impact === "up"
                          ? { bg: "#deebff", fg: "#019664ff", bd: "#22d499ff" }
                          : impact.includes("risk")
                          ? { bg: "#fffae6", fg: "#ff8b00", bd: "#ffe2bd" }
                          : { bg: "#f4f5f7", fg: "#42526e", bd: "#dfe1e6" };

                      return (
                        <div key={i} style={{ border: "1px solid #dfe1e6", background: "#fff", padding: 12 }}>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                height: 22,
                                padding: "0 8px",
                                borderRadius: 999,
                                border: `1px solid ${impactTone.bd}`,
                                background: impactTone.bg,
                                color: impactTone.fg,
                                fontSize: 11,
                                fontWeight: 800,
                                letterSpacing: 0.4,
                                textTransform: "uppercase",
                              }}
                            >
                              {(e?.impact_direction ?? "neutral").toString().toUpperCase()}
                            </span>

                            {typeof e?.importance_score === "number" ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  height: 22,
                                  padding: "0 8px",
                                  borderRadius: 999,
                                  border: "1px solid #dfe1e6",
                                  background: "#f4f5f7",
                                  color: "#42526e",
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                Importance {e.importance_score.toFixed(2)}
                              </span>
                            ) : null}

                            {e?.event_type ? (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  height: 22,
                                  padding: "0 8px",
                                  borderRadius: 999,
                                  border: "1px solid #dfe1e6",
                                  background: "#f4f5f7",
                                  color: "#42526e",
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                {e.event_type}
                              </span>
                            ) : null}

                            {e?.event_date ? (
                              <span style={{ marginLeft: "auto", fontSize: 12, color: "#7a869a" }}>{e.event_date}</span>
                            ) : null}
                          </div>

                          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#172b4d" }}>
                            {e?.headline ?? "—"}
                          </div>

                          {e?.evidence_summary ? (
                            <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, color: "#42526e", whiteSpace: "pre-line" }}>
                              {e.evidence_summary}
                            </div>
                          ) : null}

                          {Array.isArray(e?.regions) && e.regions.length ? (
                            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                              {e.regions.slice(0, 10).map((r: string, j: number) => (
                                <span
                                  key={j}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    height: 22,
                                    padding: "0 8px",
                                    borderRadius: 999,
                                    border: "1px solid #dfe1e6",
                                    background: "#f4f5f7",
                                    color: "#42526e",
                                    fontSize: 11,
                                    fontWeight: 700,
                                  }}
                                >
                                  {r}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ padding: 12, border: "1px solid #dfe1e6", background: "#f4f5f7", color: "#42526e" }}>
                    No evidence available.
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: 12,
                  background: "#f8f9fa",
                  borderTop: "1px solid #dfe1e6",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <button className="toolbar-btn" type="button" onClick={closeEvidence}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
