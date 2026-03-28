"use client";

import { X } from "lucide-react";
import { CommoditySelect } from "../commodity-dropdown";

export function ReportFilesSidebar({
  commodity,
  onCommodityChange,
  activeCount,
  archivedCount,
  totalCount,
  mobileOpen = false,
  onCloseMobile,
}: {
  commodity: string;
  onCommodityChange: (nextRaw: string) => void;
  activeCount: number;
  archivedCount: number;
  totalCount: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  return (
    <aside className={`cp-sidebar cp-mobile-sidebar ${mobileOpen ? "cp-mobile-sidebar-open" : ""}`}>
      <div className="cp-sidebar-section">
        <div className="cp-mobile-sidebar-close">
          <button className="cp-btn-outline" type="button" onClick={onCloseMobile}>
            <X className="icon16" />
            Close
          </button>
        </div>

        <div className="sidebar-label">Report Files</div>

        <CommoditySelect value={commodity} onChange={onCommodityChange} />

        <div className="cp-note">
          Showing <strong>{totalCount}</strong> files
        </div>
      </div>

      <div className="cp-sidebar-section">
        <div className="sidebar-label">Summary</div>

        <div className="grid gap-3">
          <div className="rounded-xl border border-[rgba(15,92,58,0.12)] bg-[rgba(15,92,58,0.04)] px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5a7a66]">Active</div>
            <div className="mt-1 text-2xl font-bold text-[#1c3328]">{activeCount}</div>
          </div>

          <div className="rounded-xl border border-[rgba(15,92,58,0.12)] bg-white px-4 py-3">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5a7a66]">Archived</div>
            <div className="mt-1 text-2xl font-bold text-[#1c3328]">{archivedCount}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
