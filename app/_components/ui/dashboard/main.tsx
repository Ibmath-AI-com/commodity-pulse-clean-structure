// FILE: app/_components/ui/dashboard/main.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/app/_components/app-shell";

import { CpFiltersAside } from "@/app/_components/ui/dashboard/sections/side-panel";
import { CpKpiRow } from "@/app/_components/ui/dashboard/sections/kpi";
import { CpInsightsCard } from "@/app/_components/ui/dashboard/sections/insights";
import { CpMarketChartCard } from "@/app/_components/ui/dashboard/sections/chart/market-chart-card";
import { makeMarketChartData, marketChartOptions } from "@/app/_components/ui/dashboard/sections/chart/marketChart.config";

import { cx, fmtDate, safeUpper } from "@/lib/dashboard/utils";

import type { DashboardKpis, DashboardPrediction, Insight } from "@/src/entities/models/dashboard";
import { refreshDashboardAction } from "@/app/(protected)/dashboard/actions";

import { Line as ChartLine } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTooltip, ChartLegend, Filler);

const LS_COMMODITY = "ai_commodity_selected";

function trendTone(r: DashboardPrediction) {
  const t = String(r?.outputs?.signals?.trend ?? "").toLowerCase();
  if (t === "bullish") return "bg-emerald-50 border border-emerald-200 text-emerald-800";
  if (t === "bearish") return "bg-rose-50 border border-rose-200 text-rose-800";
  if (t) return "bg-slate-50 border border-slate-200 text-slate-700";
  return "bg-slate-50 border border-slate-200 text-slate-700";
}

export default function DashboardMain(props: {
  initialRows: Array<
    Omit<DashboardPrediction, "createdAt"> & { createdAt: string | null }
  >;
  initialKpis: DashboardKpis;
  initialInsights: Insight[];
}) {
  // normalize server DTO -> client model
 type DashboardPredictionDto =
  Omit<DashboardPrediction, "createdAt"> & { createdAt: string | null };

const seedRows = useMemo<DashboardPrediction[]>(
  () =>
    props.initialRows.map((r: DashboardPredictionDto) => ({
      ...r,
      createdAt: r.createdAt ? new Date(r.createdAt) : null,
    })),
  [props.initialRows]
);

  const [rows, setRows] = useState<DashboardPrediction[]>(seedRows);
  const [kpis, setKpis] = useState<DashboardKpis>(props.initialKpis);
  const [insights, setInsights] = useState<Insight[]>(props.initialInsights);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [qText, setQText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<DashboardPrediction | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setQText((prev) => {
      if (prev.trim()) return prev;
      return (window.localStorage.getItem(LS_COMMODITY) ?? "").trim();
    });
  }, []);

  async function refresh() {
    setBusy(true);
    setErr(null);
    try {
      const data = await refreshDashboardAction();

      const nextRows: DashboardPrediction[] = (data.rows ?? []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : null,
      }));

      setRows(nextRows);
      setKpis(data.kpis);
      setInsights(data.insights);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to refresh dashboard.");
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const t = qText.trim().toLowerCase();

    return rows.filter((r) => {
      if (statusFilter !== "all") {
        if ((r.status || "").toLowerCase() !== statusFilter) return false;
      }
      if (!t) return true;

      const hay = [r.commodity, r.futureDate, ...(r.basisLabels ?? []), ...(r.basisKeys ?? []), r.status]
        .map((x) => String(x ?? "").toLowerCase())
        .join(" | ");

      return hay.includes(t);
    });
  }, [rows, qText, statusFilter]);

  const recent = useMemo(() => filtered.slice(0, 4), [filtered]);

  // keep your urea demo item (until you wire real x-commodity chart data)
  const demoUrea: DashboardPrediction = useMemo(
    () => ({
      id: "__demo_urea__",
      uid: "__demo__",
      commodity: "urea",
      createdAt: new Date(),
      futureDate: "2026-02-05",
      basisLabels: ["Mediterranean"],
      basisKeys: ["mediterranean"],
      outputs: { tenderPredictedPrice: 348.0, signals: { trend: "bearish" } },
      status: "success",
      runtimeMs: null,
      basePrices: null,
      n8nHttpStatus: null,
      error: null,
      news: null,
    }),
    []
  );

  const recentWithDemo = recent?.length ? [...recent, demoUrea] : [demoUrea];

  function showDetails(r: DashboardPrediction) {
    setActive(r);
    setOpen(true);
  }

  function clearFilters() {
    setQText("");
    setStatusFilter("all");
  }

  return (
    <AppShell title="Dashboard">
      <div className="cp-root">
        <div className="cp-container">
          {/* LEFT SIDEBAR */}
          <CpFiltersAside
            qText={qText}
            onQTextChange={setQText}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            filteredCount={filtered.length}
            totalCount={rows.length}
            busy={busy}
            uid={"server-session"} // display-only; refresh guarded server-side
            onClear={clearFilters}
            onRefresh={() => void refresh()}
            err={err}
          />

          <main className="cp-main">
            <CpKpiRow
              activeForecasts={kpis.activeForecasts}
              activeWowPct={kpis.wowPct}
              accuracyRatePct={kpis.successRatePct}
              marketSignals={
                rows.reduce((acc, r) => acc + (typeof r.news?.count === "number" ? r.news!.count! : 0), 0)
              }
              newSignalsToday={
                (() => {
                  const today = new Date().toISOString().slice(0, 10);
                  return rows.reduce((acc, r) => {
                    const events = r.news?.events;
                    if (!Array.isArray(events)) return acc;
                    return acc + events.filter((e) => e?.event_date === today).length;
                  }, 0);
                })()
              }
            />

            <section className="grid grid-cols-12 gap-4">
              {/* LEFT COLUMN: Chart + Recent (stacked) */}
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                <CpMarketChartCard>
                  <div className="h-[260px]">
                    <ChartLine data={makeMarketChartData()} options={marketChartOptions} />
                  </div>
                </CpMarketChartCard>

                <div className="cp-card p-0 overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200">
                    <div className="h2">Recent Predictions</div>
                    <div className="text-[11px] font-bold text-slate-500">{recentWithDemo.length} items</div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {recentWithDemo.length ? (
                      recentWithDemo.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-4"
                          onClick={() => showDetails(r)}
                        >
                          <div className="min-w-0">
                            <div className="text-[12px] font-bold text-slate-600 truncate">
                              {safeUpper(r.commodity)}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                              <span>{fmtDate(r.createdAt)}</span>
                              <span>{r.futureDate || "—"}</span>
                              <span>
                                {safeUpper(
                                  ((r.basisLabels?.length ? r.basisLabels : r.basisKeys) ?? [])[0] ?? "—"
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-[12px] font-bold text-slate-600">
                                {typeof r.outputs?.tenderPredictedPrice === "number"
                                  ? `${r.outputs.tenderPredictedPrice.toFixed(1)} USD/t`
                                  : "—"}
                              </div>
                              <div
                                className={cx(
                                  "mt-1 inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase",
                                  trendTone(r)
                                )}
                              >
                                {safeUpper(r.outputs?.signals?.trend ?? "—")}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-[12px] font-semibold text-slate-500">
                        {busy ? "Loading..." : "No predictions yet. Run your first forecast from the Prediction page."}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Insights */}
              <div className="col-span-12 lg:col-span-4">
                <CpInsightsCard items={insights} />
              </div>
            </section>

            {/* details modal placeholder - keep your existing modal component if you have one */}
            {open && active ? null : null}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
