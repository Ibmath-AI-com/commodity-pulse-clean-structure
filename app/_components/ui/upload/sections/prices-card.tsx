// FILE: src/components/upload/prices-card.tsx
"use client";

import * as React from "react";
import { Sheet, Trash2, UploadCloud, Wand2, Plus, Upload, X, Loader2 } from "lucide-react";
import { PricesRow } from "../types/types";

type PricesTab = "web" | "api" | "manual";

export function PricesCard({
  disableAll,
  refreshTick,

  excelRows,
  pricesFile,
  busyPrices,
  generatingPricesFor,

  onPickPricesFile,
  onUploadPricesFile,
  onClearPricesFile,
  onGeneratePrices,
  onOpenPriceRecords,

  baseName,
  fmtDate,
  openDeleteModal,

  busyLabel,
  cx,

  banner,
}: {
  disableAll: boolean;
  refreshTick: number;

  excelRows: PricesRow[];
  pricesFile: File | null;
  busyPrices: "idle" | "init" | "uploading" | "verifying" | "listing";
  generatingPricesFor: string | null;

  onPickPricesFile: () => void;
  onUploadPricesFile: () => void;
  onClearPricesFile: () => void;
  onGeneratePrices: (sourceObjectName: string) => void;
  onOpenPriceRecords: (row: PricesRow) => void;

  baseName: (path?: string) => string;
  fmtDate: (iso?: string) => string;

  openDeleteModal: (args: {
    mode: "prices";
    objectNames: string[];
    sourceFiles?: string[];
    displayName: string;
    alsoDeletesGenerated: boolean;
  }) => void;

  busyLabel: (mode: "prices") => string;

  cx: (...classes: Array<string | false | null | undefined>) => string;

  banner?: React.ReactNode;
}) {
  const [pricesTab, setPricesTab] = React.useState<PricesTab>("manual");

  const isManual = pricesTab === "manual";

  return (
    <section className="cp-card">
      <div className="">
        <div className="mainCardTop">
          <div>
            <div className="h2">PRICE CALIBRATION</div>
            <div className="upload-section-sub">Uploaded Excel or CSV price files and their generated calibration records.</div>
          </div>

          <div className="flex items-center gap-2 justify-start">
            <button className="ui-primary-sm-button" type="button" disabled={disableAll} onClick={onPickPricesFile}>
                <Plus className="icon16" />
                <span className="sm:hidden">Upload</span>
                <span className="hidden sm:inline">Upload File</span>
              </button>
          </div>
        </div>

        {/* Tabs styled like DetailedBidAnalysis */}
        <div className="tt-sub-nav ml-5">
          <button
            className={cx("tt-sub-navLink", pricesTab === "web" && "tt-navLinkActive")}
            type="button"
            onClick={() => setPricesTab("web")}
          >
            WEB SEARCH
          </button>
          <button
            className={cx("tt-sub-navLink", pricesTab === "api" && "tt-navLinkActive")}
            type="button"
            onClick={() => setPricesTab("api")}
          >
            API PROVIDER
          </button>
          <button
            className={cx("tt-sub-navLink", pricesTab === "manual" && "tt-navLinkActive")}
            type="button"
            onClick={() => setPricesTab("manual")}
          >
            MANUAL UPLOAD
          </button>
        </div>

        {/* Content switch per tab */}
        {!isManual ? (
          <div className="tableWrap">
            <div className="muted tdCenter" style={{ padding: 14 }}>
              {pricesTab === "web"
                ? "Web Search pricing source is not implemented yet."
                : "API Provider pricing source is not implemented yet."}
            </div>
          </div>
        ) : (
          <>
            {/* Actions row (manual only) */}
            <div className="actionsRow">
              
              
              {/*<button
                className="secondaryBtn"
                type="button"
                disabled={disableAll || !excelRows.length}
                onClick={() => {
                  const newest = excelRows[0];
                  if (newest?.name) onGeneratePrices(newest.name);
                }}
              >
                <Wand2 className="icon16 cp-purple" />
                
              </button>*/}
            </div>

            {/* Pending selected prices (not uploaded yet) */}
            {pricesFile ? (
              <div className="pendingRow">
                <div className="pendingLeft">
                  <div className="fileBadgeXls">XLS</div>

                  <div className="pendingStack">
                    <div className="pendingItem">
                      <div className="pendingName">{pricesFile.name}</div>
                      <div className="pendingMeta">Pending upload</div>
                    </div>
                  </div>
                </div>

                <div className="pendingRight">
                  <button className="ui-primary-sm-button" type="button" onClick={onUploadPricesFile} disabled={busyPrices !== "idle"}>
                    <Upload className="icon16" />
                    {busyPrices === "idle" ? "Upload 1 file" : busyLabel("prices")}
                  </button>

                  <button className="cp-btn-outline" type="button" onClick={onClearPricesFile} disabled={busyPrices !== "idle"}>
                    <X className="icon16" />
                    Clear
                  </button>
                </div>
              </div>
            ) : null}

            <div className="tableWrap" key={`xls-${refreshTick}`}>
              <table className="cp-table cp-mobile-records">
                <thead>
                  <tr>
                    <th className="thActive">Active</th>
                    <th>File Name</th>
                    <th>Date Uploaded</th>
                    <th>AI Status</th>
                    <th className="thActions">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {excelRows.length ? (
                    excelRows.map((r) => {
                      const genExists = !!r.pricesExists;
                      const isProcessing = generatingPricesFor === r.name && busyPrices !== "idle";

                      const statusLabel = isProcessing
                        ? { text: "PROCESSING", kind: "processing" as const }
                        : genExists
                        ? { text: "GENERATED", kind: "generated" as const }
                        : { text: "READY", kind: "ready" as const };

                      return (
                        <tr key={`xls-${r.name}`}>
                          <td className="tdCenter" data-label="Active">
                            <input type="checkbox" className="checkbox" defaultChecked />
                          </td>

                          <td data-label="File Name">
                            <div className="fileCell">
                               <i className="fa-regular fa-xl fa-file-excel text-green-500" aria-hidden="true" />
                              <div className="fileText">
                                <div className="fileName" title={r.name}>
                                  {baseName(r.name)}
                                </div>
                               
                              </div>
                            </div>
                          </td>

                          <td className="muted" data-label="Date Uploaded">{fmtDate(r.updatedAt ?? r.updated)}</td>

                          <td data-label="AI Status">
                            <span
                              className={cx(
                                "badge",
                                statusLabel.kind === "generated" && "badgeGreen",
                                statusLabel.kind === "processing" && "badgeOrange",
                                statusLabel.kind === "ready" && "badgeSlate"
                              )}
                            >
                              {statusLabel.text}
                            </span>
                          </td>

                          <td className="actionsCell" data-label="Actions">
                            <div className="cp-mobile-actionRow" style={{ gap: "0.9rem" }}>
                              {!genExists ? (
                                <button
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3 text-[12px] font-semibold text-violet-700 transition hover:bg-violet-50 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  type="button"
                                  disabled={disableAll}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onGeneratePrices(r.name);
                                  }}
                                >
                                  <Wand2 className="h-4 w-4" />
                                  Generate
                                </button>
                              ) : (
                                <button
                                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 sm:w-auto"
                                  type="button"
                                  title="View price records"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenPriceRecords(r);
                                  }}
                                >
                                  <Sheet className="h-4 w-4" />
                                  <span className="upload-action-label">Records</span>
                                </button>
                              )}

                              <button
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                style={{ marginLeft: "0.45rem" }}
                                type="button"
                                disabled={disableAll}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  const displayName = baseName(r.name);
                                  const sourceFileName = String(r.sourceFile ?? r.path ?? "").trim();
                                  const objectFileName = String(r.name ?? "").trim();
                                  const objectName = `incoming/${String(r.commodity ?? "").trim().toLowerCase()}/rdata/${objectFileName}`;
                                  openDeleteModal({
                                    mode: "prices",
                                    objectNames: [objectName],
                                    sourceFiles: [sourceFileName],
                                    displayName,
                                    alsoDeletesGenerated: false,
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="upload-action-label">Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : busyPrices !== "idle" ? (
                    <tr>
                      <td className="tdCenter">
                        <input type="checkbox" className="checkbox" disabled />
                      </td>
                      <td>
                        <div className="fileCell">
                          <div className="fileIcon">
                            <Loader2 className="icon16 animate-spin" />
                          </div>
                          <div className="fileText">
                            <div className="fileName">Loading uploaded prices...</div>
                            <div className="fileSub">Waiting for the file to appear in the grid</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted">-</td>
                      <td>
                        <span className={cx("badge", "badgeOrange")}>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          PROCESSING
                        </span>
                      </td>
                      <td className="actionsCell">
                        <span className="muted">Please wait...</span>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="tdCenter">
                        <input type="checkbox" className="checkbox" disabled />
                      </td>
                      <td>
                        <div className="fileCell">
                          <div className="fileIcon">
                            <Sheet className="icon16" />
                          </div>
                          <div className="fileText">
                            <div className="fileName">No prices uploaded</div>
                            <div className="fileSub">Prices (Excel / CSV)</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted">—</td>
                      <td>
                        <span className={cx("badge", "badgeSlate")}>MISSING</span>
                      </td>
                      <td className="actionsCell">
                        <button
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-3 text-[12px] font-semibold text-sky-700 transition hover:bg-sky-50 hover:text-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                          type="button"
                          disabled={disableAll}
                          onClick={onPickPricesFile}
                        >
                          <UploadCloud className="h-4 w-4" />
                          Select prices
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {banner}
          </>
        )}
      </div>
    </section>
  );
}
