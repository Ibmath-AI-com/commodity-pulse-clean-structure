"use client";

import * as React from "react";
import { ArrowDownAZ, ArrowUpAZ, X } from "lucide-react";

import type { UploadPriceRecord } from "@/app/(protected)/upload/actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  rows: UploadPriceRecord[];
  loading?: boolean;
};

type SortKey =
  | "commodityGroup"
  | "basis"
  | "region"
  | "marketLabel"
  | "currency"
  | "unit"
  | "priceDate"
  | "timing"
  | "price"
  | "change"
  | "priceLow"
  | "priceHigh";

type SortState = {
  key: SortKey;
  dir: "asc" | "desc";
};

function fmtNumber(value: number | null) {
  if (value == null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function fmtDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function toSortValue(row: UploadPriceRecord, key: SortKey): string | number {
  switch (key) {
    case "commodityGroup":
      return row.commodityGroup || "";
    case "basis":
      return row.basis || "";
    case "region":
      return row.region || "";
    case "marketLabel":
      return row.marketLabel || "";
    case "currency":
      return row.currency || "";
    case "unit":
      return row.unit || "";
    case "priceDate":
      return row.priceDate || "";
    case "timing":
      return row.timing || "";
    case "price":
      return row.price ?? Number.NEGATIVE_INFINITY;
    case "change":
      return row.change ?? Number.NEGATIVE_INFINITY;
    case "priceLow":
      return row.priceLow ?? Number.NEGATIVE_INFINITY;
    case "priceHigh":
      return row.priceHigh ?? Number.NEGATIVE_INFINITY;
    default:
      return "";
  }
}

export function PricesRecordsDialog({
  open,
  onOpenChange,
  fileName,
  rows,
  loading = false,
}: Props) {
  const [sort, setSort] = React.useState<SortState>({
    key: "priceDate",
    dir: "desc",
  });

  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  const sortedRows = React.useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const left = toSortValue(a, sort.key);
      const right = toSortValue(b, sort.key);

      let cmp = 0;
      if (typeof left === "number" && typeof right === "number") {
        cmp = left - right;
      } else {
        cmp = String(left).localeCompare(String(right), undefined, {
          numeric: true,
          sensitivity: "base",
        });
      }

      return sort.dir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [rows, sort]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  function SortHead({
    label,
    sortKey,
  }: {
    label: string;
    sortKey: SortKey;
  }) {
    const active = sort.key === sortKey;
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-left text-inherit"
        onClick={() => toggleSort(sortKey)}
      >
        <span>{label}</span>
        {active ? (
          sort.dir === "asc" ? (
            <ArrowUpAZ className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownAZ className="h-3.5 w-3.5" />
          )
        ) : null}
      </button>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(15,92,58,0.08)] p-3 pt-14 backdrop-blur-[1px] sm:p-5 sm:pt-16"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="flex max-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[30px] bg-[#fbfdfb] shadow-[0_18px_48px_rgba(15,92,58,0.10)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5ebe7] bg-[#f1f4f2] px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-slate-900">{fileName}</div>
            <div className="mt-1 text-xs text-slate-500">{rows.length} price records</div>
          </div>

          <button type="button" className="cp-btn-outline" onClick={() => onOpenChange(false)}>
            <X className="icon16" />
            Close
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
              Loading price records...
            </div>
          ) : !rows.length ? (
            <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
              No price records found.
            </div>
          ) : (
            <div className="tableWrap">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th><SortHead label="Commodity Group" sortKey="commodityGroup" /></th>
                    <th><SortHead label="Basis" sortKey="basis" /></th>
                    <th><SortHead label="Region" sortKey="region" /></th>
                    <th><SortHead label="Market Label" sortKey="marketLabel" /></th>
                    <th><SortHead label="Currency" sortKey="currency" /></th>
                    <th><SortHead label="Unit" sortKey="unit" /></th>
                    <th><SortHead label="Price Date" sortKey="priceDate" /></th>
                    <th><SortHead label="Timing" sortKey="timing" /></th>
                    <th><SortHead label="Price" sortKey="price" /></th>
                    <th><SortHead label="Change" sortKey="change" /></th>
                    <th><SortHead label="Price Low" sortKey="priceLow" /></th>
                    <th><SortHead label="Price High" sortKey="priceHigh" /></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, idx) => (
                    <tr key={`${row.sourceFile}-${row.marketLabel}-${row.priceDate}-${idx}`}>
                      <td>{row.commodityGroup || "-"}</td>
                      <td>{row.basis || "-"}</td>
                      <td>{row.region || "-"}</td>
                      <td>{row.marketLabel || "-"}</td>
                      <td>{row.currency || "-"}</td>
                      <td>{row.unit || "-"}</td>
                      <td>{fmtDate(row.priceDate)}</td>
                      <td>{row.timing || "-"}</td>
                      <td>{fmtNumber(row.price)}</td>
                      <td>{fmtNumber(row.change)}</td>
                      <td>{fmtNumber(row.priceLow)}</td>
                      <td>{fmtNumber(row.priceHigh)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
