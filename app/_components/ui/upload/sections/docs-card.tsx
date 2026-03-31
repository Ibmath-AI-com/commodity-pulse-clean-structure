"use client";

import * as React from "react";
import { RefreshCw, Plus, Eye, Loader2, Archive, Trash2, Newspaper, Upload, X } from "lucide-react";
import { DocsRow } from "../types/types";

function isArchivedName(objectName: string) {
  return String(objectName || "").includes(".archived.");
}

export function DocsCard({
  disableAll,
  listBusy,
  refreshTick,

  pdfRows,
  reportFiles,
  busyReport,
  generatingReportFor,
  hasEventSignals,

  onRefreshList,
  onPickReportFile,
  onUploadReportFile,
  onClearReportFile,

  openDeleteModal,
  openArchiveModal,
  onOpenNews,

  baseName,
  fmtDate,
  busyLabel,
  cx,
}: {
  disableAll: boolean;
  listBusy: boolean;
  refreshTick: number;

  pdfRows: DocsRow[];
  reportFiles: File[];
  busyReport: "idle" | "init" | "uploading" | "verifying" | "listing";
  generatingReportFor: string | null;
  hasEventSignals: boolean;

  onRefreshList: () => void;
  onPickReportFile: () => void;
  onUploadReportFile: () => void;
  onClearReportFile: () => void;

  openDeleteModal: (args: {
    mode: "report";
    objectNames: string[];
    displayName: string;
    alsoDeletesGenerated: boolean;
  }) => void;

  openArchiveModal: (args: {
    mode: "report";
    objectNames: string[];
    displayName: string;
    alsoDeletesGenerated: boolean;
  }) => void;

  onOpenNews: (row: DocsRow) => void;

  baseName: (path?: string) => string;
  fmtDate: (iso?: string) => string;
  busyLabel: (mode: "report") => string;
  cx: (...classes: Array<string | false | null | undefined>) => string;
}) {
  function openViewer(objectName: string) {
    const w = 1100;
    const h = 820;

    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));

    const features = [
      "popup=yes",
      `width=${w}`,
      `height=${h}`,
      `left=${left}`,
      `top=${top}`,
      "scrollbars=yes",
      "resizable=yes",
      "noopener=yes",
      "noreferrer=yes",
    ].join(",");

    window.open(
      `/report/view?objectName=${encodeURIComponent(objectName)}`,
      "report_view_popup",
      features
    );
  }

  return (
    <section className="cp-card">
      <div className="mainCardTop">
        <div>
          <div className="h2">MARKET INTELLIGENCE</div>
        </div>

        <div className="flex items-center gap-2 justify-start">
          <button
            className="cp-btn-outline upload-refresh-btn"
            type="button"
            onClick={onRefreshList}
            disabled={disableAll}
            title="Refresh list"
          >
            <RefreshCw className={cx("icon16", listBusy && "spin")} />
            <span className="hidden sm:inline">{listBusy ? "REFRESHING..." : "REFRESH"}</span>
          </button>

          <button className="ui-primary-sm-button" type="button" disabled={disableAll} onClick={onPickReportFile}>
            <Plus className="icon16" />
            Upload File
          </button>
        </div>
      </div>
      
      {reportFiles.length ? (
        <div className="pendingRow">
          <div className="pendingLeft">
            <div className="fileBadgePdf">PDF</div>

            <div className="pendingStack">
              {reportFiles.map((f) => (
                <div key={f.name} className="pendingItem">
                  <div className="pendingName">{f.name}</div>
                  <div className="pendingMeta">Pending upload</div>
                </div>
              ))}
            </div>
          </div>

          <div className="pendingRight">
            <button className="ui-primary-sm-button" type="button" onClick={onUploadReportFile} disabled={busyReport !== "idle"}>
              <Upload className="icon16" />
              {busyReport === "idle" ? `Upload ${reportFiles.length} file(s)` : busyLabel("report")}
            </button>

            <button className="cp-btn-outline" type="button" onClick={onClearReportFile} disabled={busyReport !== "idle"}>
              <X className="icon16" />
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <div className="tableWrap" key={`pdf-${refreshTick}`}>
        <table className="cp-table cp-mobile-records">
          <thead>
            <tr>
              <th className="thActive">Active</th>
              <th>File Name</th>
              <th>Date Uploaded</th>
              <th>News</th>
              <th>AI Status</th>
              <th className="thActions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {pdfRows.length ? (
              pdfRows.map((r) => {
                const archived = isArchivedName(r.name);
                const genExists = !!r.reportExists;
                const isProcessing = generatingReportFor === r.name && busyReport !== "idle";

                const status = isProcessing
                ? { text: "PROCESSING", cls: "badgeOrange", spinning: true }
                : genExists
                  ? { text: "GENERATED", cls: "badgeGreen", spinning: false }
                  : { text: "PROCESSING", cls: "badgeOrange", spinning: true };

                const canView = !!r.reportObjectName;
                const activeNews = r.newsSummary?.active ?? 0;
                const totalNews = r.newsSummary?.total ?? 0;

                return (
                  <tr key={r.name}>
                    <td className="tdCenter" data-label="Active">
                      <input type="checkbox" className="checkbox" checked={!archived} readOnly />
                    </td>

                    <td data-label="File Name">
                      <div className="fileCell">
                        <i className="fa-regular fa-xl fa-file-pdf text-red-500" aria-hidden="true" />
                        <div className="fileText">
                          <div className="fileName" title={r.name}>
                            {baseName(r.name)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="muted" data-label="Date Uploaded">{fmtDate(r.updatedAt ?? r.updated)}</td>

                    <td className="tdCenter" data-label="News">
                      <button
                        className="inline-flex min-w-[72px] items-center justify-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        type="button"
                        disabled={disableAll}
                        title="Active / Total news"
                        onClick={() => onOpenNews(r)}
                      >
                        <Newspaper className="h-3.5 w-3.5" />
                        {activeNews}/{totalNews}
                      </button>
                    </td>

                    <td data-label="AI Status">
                      <span className={cx("badge", status.cls)}>
                        {status.spinning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {status.text}
                      </span>
                    </td>

                    <td className="actionsCell" data-label="Actions">
                      <div className="cp-mobile-actionRow" style={{ gap: "0.9rem" }}>
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-transparent text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={disableAll || !canView}
                          title={canView ? "View generated report" : "Generate AI News Analysis first"}
                          onClick={() => {
                            if (!r.reportObjectName) return;
                            openViewer(r.reportObjectName);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-transparent text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={disableAll || archived}
                          title={archived ? "Already archived" : "Archive"}
                          onClick={() => {
                            openArchiveModal({
                              mode: "report",
                              objectNames: [r.path],
                              displayName: baseName(r.name),
                              alsoDeletesGenerated: false,
                            });
                          }}
                        >
                          <Archive className="h-4 w-4" />
                        </button>

                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-transparent text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={disableAll}
                          onClick={() => {
                            openDeleteModal({
                              mode: "report",
                              objectNames: [r.path],
                              displayName: baseName(r.name),
                              alsoDeletesGenerated: false,
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="muted tdCenter">
                  No reports uploaded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
