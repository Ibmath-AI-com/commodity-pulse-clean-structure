// E:\AI Projects\commodity-pulse-clean-structure\app\_components\ui\dashboard\sections\chart\market-chart-card.tsx
"use client";

import type { ReactNode } from "react";

export function CpMarketChartCard({ children }: { children: ReactNode }) {
  return (
    <div className="cp-card col-span-12 lg:col-span-8 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h2">Market Chart</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-md p-1">
            <button className="px-3 py-1 rounded text-[11px] font-bold text-slate-600 hover:bg-white">7D</button>
            <button className="px-3 py-1 rounded bg-white text-[11px] font-extrabold text-slate-900 shadow-sm">
              1M
            </button>
            <button className="px-3 py-1 rounded text-[11px] font-bold text-slate-600 hover:bg-white">6M</button>
            <button className="px-3 py-1 rounded text-[11px] font-bold text-slate-600 hover:bg-white">3M</button>
          </div>
        </div>
      </div>

      <div className="mt-3">{children}</div>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-[2px] bg-slate-800" /> Actual
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-[2px]" style={{ borderTop: "2px dashed #3b82f6" }} /> Predicted
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