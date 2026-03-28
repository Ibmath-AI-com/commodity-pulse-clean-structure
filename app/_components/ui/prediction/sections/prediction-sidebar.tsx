"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cx } from "@/app/_components/utils";
import { BASES } from "@/lib/common/options";
import { CommoditySelect } from "../../commodity-dropdown";
import { RunTimeline } from "./run-timeline";
import type { RunTimelineState } from "../types/types";

type BaseOption = { value: string; label: string };

export function PredictionSidebar(props: {
  commodity: string;
  futureDate: string;
  status: "idle" | "loading" | "success" | "error";

  basis: string[];
  maxBasis: number;

  selectedBases: BaseOption[];
  basePricesByBasis: Record<string, string>;

  canRun: boolean;
  error: string | null;

  handleCommodityChange: (nextRaw: string) => void;
  setFutureDate: (v: string) => void;

  setBasePriceText: (basisKey: string, v: string) => void;
  toggleBasis: (v: string) => void;

  runPrediction: () => void;
  runTl: RunTimelineState;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const {
    commodity,
    futureDate,
    status,
    basis,
    maxBasis,
    selectedBases,
    basePricesByBasis,
    canRun,
    error,
    handleCommodityChange,
    setFutureDate,
    setBasePriceText,
    toggleBasis,
    runPrediction,
    runTl,
    mobileOpen = false,
    onCloseMobile,
  } = props;

  const [basisOpen, setBasisOpen] = React.useState(false);

  return (
    <aside className={cx("cp-sidebar", "cp-mobile-sidebar", mobileOpen && "cp-mobile-sidebar-open")}>
      <div className="cp-sidebar-section">
        <div className="cp-mobile-sidebar-close">
          <button className="cp-btn-outline" type="button" onClick={onCloseMobile}>
            <X className="icon16" />
            Close
          </button>
        </div>

        <div className="sidebar-label">Forecast Parameters</div>

        <CommoditySelect
          value={commodity}
          onChange={handleCommodityChange}
          disabled={status === "loading"}
        />

        <div className="cp-form-group">
          <label>Future Date</label>
          <input
            type="date"
            value={futureDate}
            onChange={(e) => setFutureDate(e.target.value)}
            disabled={status === "loading"}
          />
        </div>

        <div className="cp-form-group">
          <label>Spot / Base Price (USD)</label>
          <div style={{ display: "grid", gap: 8 }}>
            {selectedBases.map((b) => (
              <input
                key={b.value}
                inputMode="decimal"
                placeholder={b.label}
                value={String(basePricesByBasis?.[b.value] ?? "")}
                onChange={(e) => setBasePriceText(b.value, e.target.value)}
                disabled={status === "loading"}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="cp-sidebar-section">
        <div className="sidebar-label">Basis Selection</div>

        <div className="cp-collapse">
          <button
            type="button"
            className="cp-collapse-trigger"
            onClick={() => setBasisOpen((v) => !v)}
            aria-expanded={basisOpen}
          >
            <span>Choose Basis</span>
            <span className={cx("cp-collapse-chevron", basisOpen && "is-open")} aria-hidden="true">
              ▾
            </span>
          </button>

          {basisOpen ? (
            <div className="cp-collapse-panel">
              <div className="cp-checkbox-group">
                {BASES.map((b) => {
                  const checked = basis.includes(b.value);
                  const limitReached = basis.length >= maxBasis && !checked;

                  return (
                    <label
                      key={b.value}
                      className={cx("cp-checkbox-item", checked && "selected")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBasis(b.value)}
                        disabled={status === "loading" || limitReached}
                      />
                      <span>{b.label}</span>
                      {checked && b.value === basis[0] ? (
                        <span className="cp-active-tag">ACTIVE</span>
                      ) : null}
                    </label>
                  );
                })}
              </div>

              <div className="cp-note">
                ACTIVE:{" "}
                {(
                  basis[0]
                    ? BASES.find((x) => x.value === basis[0])?.label ?? basis[0]
                    : "--"
                ).toUpperCase()}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="cp-rec-card mt-3 mb-3">
        <RunTimeline state={runTl} />
      </div>

      <button className="ui-primary-button" onClick={runPrediction} disabled={!canRun}>
        {status === "loading" ? "RUNNING..." : "RUN FORECAST"}
      </button>

      {status === "error" ? (
        <div className="cp-error">{error ?? "Something went wrong."}</div>
      ) : null}
    </aside>
  );
}
