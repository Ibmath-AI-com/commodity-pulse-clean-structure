"use client";

import * as React from "react";
import { RefreshCw, Plus, Eye, Loader2 } from "lucide-react";
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
          <div className="h2">MARKET INTELLIGENCE (DOCUMENTS)</div>
        </div>

        <button
          className="cp-btn-outline"
          type="button"
          onClick={onRefreshList}
          disabled={disableAll}
          title="Refresh list"
        >
          <RefreshCw className={cx("icon16", listBusy && "spin")} />
          {listBusy ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>

      <div className="actionsRow">
        <button className="primaryBtn" type="button" disabled={disableAll} onClick={onPickReportFile}>
          <Plus className="icon16" />
          Upload Files
        </button>
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
            <button className="primaryBtn" type="button" onClick={onUploadReportFile} disabled={busyReport !== "idle"}>
              {busyReport === "idle" ? `Upload ${reportFiles.length} file(s)` : busyLabel("report")}
            </button>

            <button className="secondaryBtn" type="button" onClick={onClearReportFile} disabled={busyReport !== "idle"}>
              Clear
            </button>
          </div>
        </div>
      ) : null}

      <div className="tableWrap" key={`pdf-${refreshTick}`}>
        <table className="cp-table">
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
                    <td className="tdCenter">
                      <input type="checkbox" className="checkbox" checked={!archived} readOnly />
                    </td>

                    <td>
                      <div className="fileCell">
                        <i className="fa-regular fa-xl fa-file-pdf text-red-500" aria-hidden="true" />
                        <div className="fileText">
                          <div className="fileName" title={r.name}>
                            {baseName(r.name)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="muted">{fmtDate(r.updatedAt ?? r.updated)}</td>

                    <td className="tdCenter">
                      <button
                        className="secondaryBtn-bl"
                        type="button"
                        disabled={disableAll}
                        title="Active / Total news"
                        onClick={() => onOpenNews(r)}
                      >
                        {activeNews}/{totalNews}
                      </button>
                    </td>

                    <td>
                      <span className={cx("badge", status.cls)}>
                        {status.spinning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {status.text}
                      </span>
                    </td>

                    <td className="actionsCell">
                      <button
                        className="secondaryBtn-bl"
                        type="button"
                        disabled={disableAll || !canView}
                        title={canView ? "View generated report" : "Generate AI News Analysis first"}
                        onClick={() => {
                          if (!r.reportObjectName) return;
                          openViewer(r.reportObjectName);
                        }}
                      >
                        <Eye className="icon16" />
                      </button>

                      <button
                        className="secondaryBtn-bl"
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
                        <i className="fa fa-archive" aria-hidden="true" />
                      </button>

                      <button
                        className="dangerBtn"
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
                        <i className="fa-regular fa-trash-can" aria-hidden="true" />
                      </button>
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