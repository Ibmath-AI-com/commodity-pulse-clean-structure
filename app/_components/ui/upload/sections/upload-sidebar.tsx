// FILE: src/components/upload/upload-sidebar.tsx

"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";
import { CommodityOption } from "../types/types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function UploadSidebar({
  commodity,
  commodities,
  disableAll,
  onCommodityChange,
  infoValue,
  onOpenIntro,
  banner,
  mobileOpen = false,
  onCloseMobile,
}: {
  commodity: string;
  commodities: CommodityOption[];
  disableAll: boolean;
  onCommodityChange: (next: string) => void;
  infoValue: string;
  onOpenIntro: () => void;
  banner?: React.ReactNode;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  return (
    <aside className={cx("cp-sidebar", "cp-mobile-sidebar", mobileOpen && "cp-mobile-sidebar-open")}>
      <div className="cp-sidebar-section">
        <div className="cp-mobile-sidebar-close">
          <button className="cp-btn-outline" type="button" onClick={onCloseMobile}>
            <X className="icon16" />
            Close
          </button>
        </div>

        <h3>Upload Parameters</h3>

        <div className="cp-form-group">
          <label>Commodity</label>
          <div className="relative">
            <select
              className="select"
              value={commodity}
              onChange={(e) => onCommodityChange(e.target.value)}
              disabled={disableAll}
            >
              {commodities.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
        </div>

        <div className="cp-form-group">
          <label>Document Types</label>
          <div className="cp-note">market_report, weekly, outage, freight, tender, policy, prices</div>
        </div>

        <div className="cp-form-group">
          <label>Workflow Context</label>
          <div className="cp-note">{infoValue}</div>
          <div className="cp-note">Upload PDF + prices sheet, then run generation.</div>
        </div>
      </div>

      <div className={cx("sidebarMessages")}>{banner}</div>
    </aside>
  );
}
