// FILE: app/_components/ui/dashboard/kpi-row.tsx
"use client";

import { Info } from "lucide-react";
import { cx } from "@/lib/dashboard/utils";
import type { DashboardKpiRowProps } from "@/src/entities/models/dashboard";

export function CpKpiRow(props: DashboardKpiRowProps) {
  const {
    activeForecasts,
    activeWowPct,
    accuracyRatePct,
    marketSignals,
    newSignalsToday,
    matchedPointCount30d,
    avgForecastErrorPct,
  } = props;

  return (
    <section className="grid grid-cols-12 gap-4">
      <div className="cp-card col-span-12 md:col-span-6 lg:col-span-3 p-4">
        <div className="flex items-start justify-between">
          <div className="cp-card-head">Active Forecasts</div>
          <Info className="w-4 h-4 text-slate-300" />
        </div>
        <div className="mt-2 stat-value">{activeForecasts}</div>
        <div className="mt-3 text-[11px]">
          {activeWowPct == null ? (
            <span className="stat-sub">—</span>
          ) : (
            <span
              className={cx(
                "stat-sub",
                activeWowPct >= 0 ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {activeWowPct >= 0 ? "▲" : "▼"} {Math.abs(activeWowPct)}%
            </span>
          )}
          <span className="stat-sub">this week</span>
        </div>
      </div>

      <div className="cp-card col-span-12 md:col-span-6 lg:col-span-3 p-4">
        <div className="flex items-start justify-between">
          <div className="cp-card-head">
            Forecast Accuracy <span className="text-slate-400 font-semibold">(30d)</span>
          </div>
          <Info className="w-4 h-4 text-slate-300" />
        </div>

        <div className="mt-2 stat-value">
          {accuracyRatePct == null ? "—" : `${accuracyRatePct}%`}
        </div>

        <div className="mt-3 text-[11px]">
          <span className="stat-sub">
            {matchedPointCount30d != null ? matchedPointCount30d : "—"}
          </span>
          <span className="stat-sub"> matched price points</span>
        </div>
      </div>

      <div className="cp-card col-span-12 md:col-span-6 lg:col-span-3 p-4">
        <div className="flex items-start justify-between">
          <div className="cp-card-head">
            Market Signals <span className="text-slate-400 font-semibold ml-3">(recent)</span>
          </div>
          <Info className="w-4 h-4 text-slate-300" />
        </div>

        <div className="mt-2 stat-value">{marketSignals}</div>

        <div className="mt-3 text-[11px]">
          <span className="stat-sub">▲ {newSignalsToday}</span>
          <span className="stat-sub"> new today</span>
        </div>
      </div>

      <div className="cp-card col-span-12 md:col-span-6 lg:col-span-3 p-4">
        <div className="flex items-start justify-between">
          <div className="cp-card-head">
            Avg Forecast Error <span className="text-slate-400 font-semibold ml-3">(30d)</span>
          </div>
          <Info className="w-4 h-4 text-slate-300" />
        </div>

        <div className="mt-2 stat-value">
          {avgForecastErrorPct == null ? "—" : `${avgForecastErrorPct}%`}
        </div>

        <div className="mt-3 text-[11px]">
          <span className="stat-sub">- Mean Absolute Percentage Error</span>
        </div>
      </div>
    </section>
  );
}