"use client";

import * as React from "react";

import { cx } from "@/app/_components/utils";
import { BASES } from "@/lib/common/options";
import { CommoditySelect } from "../../commodity-dropdown";

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
  } = props;

  return (
    <aside className="cp-sidebar">
      <div className="cp-sidebar-section">
        <h3>Forecast Parameters</h3>

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
        <h3>Basis Selection</h3>

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
          ● ACTIVE:{" "}
          {(
            basis[0]
              ? BASES.find((x) => x.value === basis[0])?.label ?? basis[0]
              : "—"
          ).toUpperCase()}
        </div>
      </div>

      <button className="cp-run-btn" onClick={runPrediction} disabled={!canRun}>
        {status === "loading" ? "RUNNING..." : "RUN FORECAST"}
      </button>

      {status === "error" ? (
        <div className="cp-error">{error ?? "Something went wrong."}</div>
      ) : null}
    </aside>
  );
}