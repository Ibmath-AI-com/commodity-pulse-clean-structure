// FILE: app/_components/ui/dashboard/side-panel.tsx
"use client";

import { RefreshCw, X } from "lucide-react";
import { CommoditySelect } from "../../commodity-dropdown";
import { cx } from "@/app/_components/utils";
import type { DashboardFiltersProps } from "@/src/entities/models/dashboard";

type CpFiltersAsideProps = DashboardFiltersProps & {
  commodity: string;
  handleCommodityChange: (nextRaw: string) => void;
  commodityDisabled?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
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
  mobileOpen = false,
  onCloseMobile,
}: CpFiltersAsideProps) {
  return (
    <aside className={cx("cp-sidebar", "cp-mobile-sidebar", mobileOpen && "cp-mobile-sidebar-open")}>
      <div className="cp-sidebar-section">
        <div className="cp-mobile-sidebar-close">
          <button className="cp-btn-outline" type="button" onClick={onCloseMobile}>
            <X className="icon16" />
            Close
          </button>
        </div>

        <div className="sidebar-label">Filters</div>

        <CommoditySelect
          value={commodity}
          onChange={handleCommodityChange}
          disabled={commodityDisabled}
        />

        <div className="cp-form-group">
          <label className="ui-form-label">
            Search
          </label>
          <input
            className="ui-form-control"
            placeholder="Commodity, basis, date, status..."
            value={qText}
            onChange={(e) => onQTextChange(e.target.value)}
          />
        </div>

        <div className="cp-note">
          Showing {filteredCount} / {totalCount}
        </div>

        <div className="mt-10 section-actions">
          <button
            className="ui-primary-button"
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
