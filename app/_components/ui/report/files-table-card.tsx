"use client";

import { ExternalLink } from "lucide-react";

import type { ReportSourceFile } from "@/app/(protected)/report/actions";

function fmtDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : new Intl.DateTimeFormat("en-AU", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "Australia/Sydney",
      }).format(d);
}

function fmtSize(size?: string | number) {
  const n = typeof size === "number" ? size : Number(size);
  if (!Number.isFinite(n) || n <= 0) return "-";
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

export function ReportFilesTableCard({
  title,
  description,
  rows,
  openingKey,
  onOpenFile,
}: {
  title: string;
  description: string;
  rows: ReportSourceFile[];
  openingKey?: string | null;
  onOpenFile: (row: ReportSourceFile) => void;
}) {
  return (
    <section className="cp-card">
      <div className="mainCardTop">
        <div>
          <div className="h2">{title}</div>
          <div className="sub">{description}</div>
        </div>
      </div>

      <div className="tableWrap">
        <table className="cp-table cp-mobile-records">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Date Uploaded</th>
              <th>Size</th>
              <th className="thActions">Open</th>
            </tr>
          </thead>

          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.bucket}:${row.objectName}`}>
                  <td data-label="File Name">
                    <div className="fileCell">
                      <i className="fa-regular fa-xl fa-file-pdf text-red-500" aria-hidden="true" />
                      <div className="fileText">
                        <div className="fileName" title={row.name}>
                          {row.name}
                        </div>
                        <div className="fileSub">{row.objectName}</div>
                      </div>
                    </div>
                  </td>

                  <td className="muted" data-label="Date Uploaded">{fmtDate(row.updated)}</td>
                  <td className="muted" data-label="Size">{fmtSize(row.size)}</td>

                  <td className="actionsCell" data-label="Open">
                    <button
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-[12px] font-semibold text-emerald-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                      type="button"
                      disabled={openingKey === `${row.bucket}:${row.objectName}`}
                      onClick={() => onOpenFile(row)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {openingKey === `${row.bucket}:${row.objectName}` ? "Opening..." : "Open PDF"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="muted tdCenter">
                  No files found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
