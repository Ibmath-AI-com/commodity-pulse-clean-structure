// FILE: src/components/upload/upload-sidebar.tsx

"use client";

import * as React from "react";
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
}: {
  commodity: string;
  commodities: CommodityOption[];
  disableAll: boolean;
  onCommodityChange: (next: string) => void;
  infoValue: string;
  onOpenIntro: () => void;
  banner?: React.ReactNode;
}) {
  return (
    <aside className="cp-sidebar">
      <div className="cp-sidebar-section">
        <h3>Upload Parameters</h3>

        <div className="cp-form-group">
          <label>Commodity</label>
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

        <button type="button" className="secondaryBtn" onClick={onOpenIntro}>
          WHAT IS THIS PAGE?
        </button>
      </div>

      <div className={cx("sidebarMessages")}>{banner}</div>
    </aside>
  );
}