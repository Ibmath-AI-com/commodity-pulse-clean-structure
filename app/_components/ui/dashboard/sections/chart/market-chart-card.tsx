// E:\AI Projects\commodity-pulse-clean-structure\app\_components\ui\dashboard\sections\chart\market-chart-card.tsx
"use client";

import type { ReactNode } from "react";

export function CpMarketChartCard({ children }: { children: ReactNode }) {
  return (
    <div className="cp-card chart-card col-span-12 lg:col-span-8 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h2">Actual vs Forecast</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="timeframe-btns">
            <button className="tf-btn">7D</button>
            <button className="tf-btn active">1M</button>
            <button className="tf-btn">6M</button>
            <button className="tf-btn">3M</button>
          </div>
        </div>
      </div>

      <div className="mt-3">{children}</div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-[2px] bg-slate-800" /> Actual
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-[2px]" style={{ borderTop: "2px dashed #3bf6a8" }} /> Predicted
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-slate-200" /> Confidence
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-200" /> Confidence Band
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-[2px] bg-emerald-600" /> Error (4%)
        </div>
      </div>
    </div>
  );
}