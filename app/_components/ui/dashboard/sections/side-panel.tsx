// FILE: app/_components/ui/dashboard/side-panel.tsx
"use client";

import { RefreshCw } from "lucide-react";
import { CommoditySelect } from "../../commodity-dropdown";
import { cx } from "@/app/_components/utils";
import type { DashboardFiltersProps } from "@/src/entities/models/dashboard";

type CpFiltersAsideProps = DashboardFiltersProps & {
  commodity: string;
  handleCommodityChange: (nextRaw: string) => void;
  commodityDisabled?: boolean;
};

export function CpFiltersAside({
  qText,
  onQTextChange,
  filteredCount,
  totalCount,
  busy,
  uid,
  onRefresh,
  err,
  commodity,
  handleCommodityChange,
  commodityDisabled = false,
}: CpFiltersAsideProps) {
  return (
    <aside className="cp-sidebar">
      <div className="cp-sidebar-section">
        <h3>Filters</h3>

        <CommoditySelect
          value={commodity}
          onChange={handleCommodityChange}
          disabled={commodityDisabled}
        />

        <div className="cp-form-group">
          <label>Search</label>
          <input
            className="w-full h-10 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-[12px] font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Commodity, basis, date, status..."
            value={qText}
            onChange={(e) => onQTextChange(e.target.value)}
          />
        </div>

        <div className="cp-note">
          Showing {filteredCount} / {totalCount}
        </div>

        <div className="section-actions">
          <button
            className="cp-run-btn"
            type="button"
            onClick={onRefresh}
            disabled={busy || !uid}
          >
            <RefreshCw className={cx("h-4 w-4", busy && "animate-spin")} />
            {busy ? "REFRESHING..." : "REFRESH"}
          </button>
        </div>

        {err ? (
          <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-[12px] font-bold text-rose-800">
            {err}
            <div className="mt-1 text-[11px] font-semibold text-rose-700">
              If you see an “index required” message, create the index using the
              link in the error.
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}