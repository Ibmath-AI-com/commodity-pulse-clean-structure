// FILE: src/components/upload/prices-card.tsx
"use client";

import * as React from "react";
import { Eye, Sheet, Trash2, UploadCloud, Wand2, Plus } from "lucide-react";
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

  baseName: (path?: string) => string;
  fmtDate: (iso?: string) => string;

  openDeleteModal: (args: {
    mode: "prices";
    objectNames: string[];
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
            <div className="h2">PRICE CALIBRATION (DATA SOURCE)</div>
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
              <button className="primaryBtn" type="button" disabled={disableAll} onClick={onPickPricesFile}>
                <Plus className="icon16" />
                Upload File
              </button>
              
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
                  <button className="primaryBtn" type="button" onClick={onUploadPricesFile} disabled={busyPrices !== "idle"}>
                    {busyPrices === "idle" ? "Upload 1 file" : busyLabel("prices")}
                  </button>

                  <button className="secondaryBtn" type="button" onClick={onClearPricesFile} disabled={busyPrices !== "idle"}>
                    Clear
                  </button>
                </div>
              </div>
            ) : null}

            <div className="tableWrap" key={`xls-${refreshTick}`}>
              <table className="cp-table">
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
                          <td className="tdCenter">
                            <input type="checkbox" className="checkbox" defaultChecked />
                          </td>

                          <td>
                            <div className="fileCell">
                               <i className="fa-regular fa-xl fa-file-excel text-green-500" aria-hidden="true" />
                              <div className="fileText">
                                <div className="fileName" title={r.name}>
                                  {baseName(r.name)}
                                </div>
                               
                              </div>
                            </div>
                          </td>

                          <td className="muted">{fmtDate(r.updated)}</td>

                          <td>
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

                          <td className="actionsCell">
                            {!genExists ? (
                              <button
                                className="linkBtn"
                                type="button"
                                disabled={disableAll}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onGeneratePrices(r.name);
                                }}
                              >
                                <Wand2 className="icon16" />
                                Generate
                              </button>
                            ) : (
                              <button className="secondaryBtn-bl" type="button" disabled>
                                 <i className="fa fa-archive" aria-hidden="true" />
                              </button>
                            )}

                            <button
                              className="dangerBtn"
                              type="button"
                              disabled={disableAll}
                              onClick={(e) => {
                                e.stopPropagation();

                                const displayName = baseName(r.name);
                                const generatedObjectName = r.pricesObjectName;
                                const hasGenerated = !!generatedObjectName;

                                const toDelete: string[] = [r.name];
                                if (hasGenerated) toDelete.push(generatedObjectName);

                                openDeleteModal({
                                  mode: "prices",
                                  objectNames: toDelete,
                                  displayName,
                                  alsoDeletesGenerated: hasGenerated,
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
                        <button className="linkBtn" type="button" disabled={disableAll} onClick={onPickPricesFile}>
                          <UploadCloud className="icon16" />
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
