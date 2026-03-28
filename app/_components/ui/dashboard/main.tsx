// FILE: app/_components/ui/dashboard/main.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";

import { AppShell } from "@/app/_components/app-shell";
import { normalizeCommodity } from "@/lib/common/options";
import { CpFiltersAside } from "@/app/_components/ui/dashboard/sections/side-panel";
import { CpKpiRow } from "@/app/_components/ui/dashboard/sections/kpi";
import { CpInsightsCard } from "@/app/_components/ui/dashboard/sections/insights";
import { CpMarketChartCard } from "@/app/_components/ui/dashboard/sections/chart/market-chart-card";
import { CpRecentPredictions } from "@/app/_components/ui/dashboard/sections/recent-predictions";
import {
  marketChartOptions,
  makeMarketChartData,
} from "@/app/_components/ui/dashboard/sections/chart/marketChart.config";
import {
  DEFAULT_COMMODITY,
  getStoredCommodity,
  setStoredCommodity,
  subscribeStoredCommodity,
} from "@/lib/common/commodity-preference";

import type {
  DashboardChartPoint,
  DashboardKpis,
  DashboardPrediction,
  Insight,
} from "@/src/entities/models/dashboard";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTooltip,
  ChartLegend,
  Filler
);

export default function DashboardMain(props: {
  initialRows: Array<
    Omit<DashboardPrediction, "createdAt"> & { createdAt: string | null }
  >;
  initialChart: DashboardChartPoint[];
  initialKpis: DashboardKpis;
  initialInsights: Insight[];
}) {
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
  const [chart, setChart] = useState<DashboardChartPoint[]>(props.initialChart);
  const [kpis, setKpis] = useState<DashboardKpis>(props.initialKpis);
  const [insights, setInsights] = useState<Insight[]>(props.initialInsights);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [qText, setQText] = useState("");
  const [commodity, setCommodity] = useState(() =>
    typeof window === "undefined" ? DEFAULT_COMMODITY : getStoredCommodity()
  );

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<DashboardPrediction | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => subscribeStoredCommodity((value) => setCommodity(value)), []);

  useEffect(() => {
    setStoredCommodity(commodity || DEFAULT_COMMODITY);

    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commodity]);

  async function refresh() {
    setBusy(true);
    setErr(null);

    try {
      const data = await refreshDashboardAction({
        commodity: commodity.trim() || undefined,
      });

      const nextRows: DashboardPrediction[] = (data.rows ?? []).map((r) => ({
        ...r,
        createdAt: r.createdAt ? new Date(r.createdAt) : null,
      }));

      setRows(nextRows);
      setChart(data.chart ?? []);
      setKpis(data.kpis);
      setInsights(data.insights);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to refresh dashboard.");
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const searchText = qText.trim().toLowerCase();
    const selectedCommodity = commodity.trim().toLowerCase();

    return rows.filter((r) => {
      const matchesCommodity = !selectedCommodity
        ? true
        : String(r.commodity ?? "").toLowerCase() === selectedCommodity;

      if (!matchesCommodity) return false;

      if (!searchText) return true;

      const hay = [
        r.commodity,
        r.futureDate,
        ...(r.basisLabels ?? []),
        ...(r.basisKeys ?? []),
        r.status,
      ]
        .map((x) => String(x ?? "").toLowerCase())
        .join(" | ");

      return hay.includes(searchText);
    });
  }, [rows, qText, commodity]);

  const filteredChart = useMemo(() => chart, [chart]);

  const recent = useMemo(() => filtered.slice(0, 4), [filtered]);

  function showDetails(r: DashboardPrediction) {
    setActive(r);
    setOpen(true);
  }

  function clearFilters() {
    setQText("");
    setCommodity(DEFAULT_COMMODITY);
  }

  function handleCommodityChange(nextRaw: string) {
    const next = normalizeCommodity(nextRaw);
    if (next === commodity) return;

    setCommodity(next);
  }

  return (
    <AppShell title="Dashboard" onOpenMobileSidebar={() => setSidebarOpen(true)}>
      <div className="cp-root">
        <div className="cp-container cp-mobile-layout">
          {sidebarOpen ? (
            <button
              type="button"
              className="cp-mobile-sidebar-backdrop"
              aria-label="Close filters"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <CpFiltersAside
            qText={qText}
            onQTextChange={setQText}
            filteredCount={filtered.length}
            totalCount={rows.length}
            busy={busy}
            uid={"server-session"}
            onClear={clearFilters}
            onRefresh={() => void refresh()}
            err={err}
            commodity={commodity}
            handleCommodityChange={handleCommodityChange}
            commodityDisabled={busy}
            mobileOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
          />

          <main className="cp-main">
            <CpKpiRow
              activeForecasts={kpis.activeForecasts}
              activeWowPct={kpis.wowPct}
              accuracyRatePct={kpis.forecastAccuracyPct30d}
              marketSignals={kpis.marketSignals}
              newSignalsToday={kpis.newSignalsToday}
              matchedPointCount30d={kpis.matchedPointCount30d}
              avgForecastErrorPct={kpis.avgForecastErrorPct30d}
            />

            <section className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
                <CpMarketChartCard>
                  <div className="h-[260px]">
                    <ChartLine
                      data={makeMarketChartData(filteredChart)}
                      options={marketChartOptions(filteredChart)}
                    />
                  </div>
                </CpMarketChartCard>

                <CpRecentPredictions
                  items={recent}
                  busy={busy}
                  onSelect={showDetails}
                />
              </div>

              <div className="col-span-12 lg:col-span-4">
                <CpInsightsCard items={insights} />
              </div>
            </section>

            {open && active ? null : null}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
