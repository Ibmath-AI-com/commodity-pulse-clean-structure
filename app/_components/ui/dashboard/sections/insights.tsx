// FILE: app/_components/ui/dashboard/insights-card.tsx
"use client";

import { ChevronDown } from "lucide-react";

import { cx } from "@/app/_components/utils";
import type { Insight } from "@/src/entities/models/dashboard";

export function CpInsightsCard({ items }: { items: Insight[] }) {
  return (
    <div className="cp-card col-span-12 lg:col-span-4 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="h2">Market Insights</div>

        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-full border border-[rgba(15,92,58,0.16)] bg-white px-3 text-[11px] font-bold text-[#0f5c3a] transition hover:bg-[#e8f5ee]"
        >
          Export <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="cursor-pointer rounded-xl border border-[rgba(15,92,58,0.12)] bg-white p-3 transition hover:bg-[#f7fbf8]"
          >
            <div className="flex items-center gap-2">
              {it.pills.map((p, i) => (
                <span key={i} className={cx("risk-badge", p.className)}>
                  {p.label}
                </span>
              ))}
              <span className="ml-auto text-[11px] font-semibold text-[#8aa091]">
                {it.meta}
              </span>
            </div>

            <div className="mt-2 text-[12px] font-bold leading-snug text-[#1c3328]">
              {it.title}
            </div>

            <div className="mt-1 text-[11px] leading-snug text-[#5a7a66]">
              {it.text}
            </div>

            <div className="mt-1 text-[11px] text-[#8aa091]">
              {it.footer.split("|")[0]?.trim()}
              <span className="opacity-60"> | </span>
              {it.footer.split("|")[1]?.trim() ?? ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
