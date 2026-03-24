// FILE: app/_components/ui/upload/main.tsx
"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { AppShell } from "@/app/_components/app-shell";
import {
  listUploadsAction,
  initUploadAction,
  deleteUploadsAction,
  archiveUploadsAction,
  getUploadNewsDetailsAction,
} from "@/app/(protected)/upload/actions";

import { useSearchParams } from "next/navigation";

import { UploadSidebar } from "./sections/upload-sidebar";
import { DocsCard } from "./sections/docs-card";
import { PricesCard } from "./sections/prices-card";
import { DeleteModal } from "./sections/delete-modal";
import { ArchiveModal } from "./sections/archive-modal"
import { NewsDetailsDialog } from "./sections/news-details-dialog";

import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";

import type {
  ListUploadsResult,
  UploadListItem,
  InitUploadResult,
  DeleteUploadsResult,
  ArchiveUploadsResult,
  UploadKind,
} from "@/src/entities/models/upload";
import type { DocumentNewsDetails } from "@/src/entities/models/news";

import type { Busy, Mode, UploadModalState } from "./types/types";

const DATE_FMT = new Intl.DateTimeFormat("en-AU", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  timeZone: "Australia/Sydney",
});

const LS_COMMODITY = "ai_commodity_selected";

const COMMODITIES = [
  { value: "sulphur", label: "Sulphur" },
  { value: "ethylene", label: "Ethylene" },
  { value: "pygas", label: "Pygas" },
  { value: "naphtha", label: "Naphtha" },
  { value: "urea", label: "Urea" },
];

function normalizeCommodity(input: string) {
  const v = (input ?? "").trim().toLowerCase();
  const hit = COMMODITIES.find((c) => c.value === v || c.label.toLowerCase() === v);
  return hit ? hit.value : "sulphur";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function inferContentType(file: File) {
  const browserType = (file.type || "").trim();
  if (browserType) return browserType;

  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (name.endsWith(".csv")) return "text/csv";
  if (name.endsWith(".tsv")) return "text/tab-separated-values";
  return "application/octet-stream";
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : DATE_FMT.format(d);
}

function baseName(path?: string) {
  if (!path) return "-";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "-";
}

function isPdfRow(r: { name: string; contentType?: string }) {
  const n = (r.name || "").toLowerCase();
  const ct = (r.contentType || "").toLowerCase();
  return n.endsWith(".pdf") || ct === "application/pdf";
}

function isExcelRow(r: { name: string; contentType?: string }) {
  const n = (r.name || "").toLowerCase();
  const ct = (r.contentType || "").toLowerCase();
  if (n.endsWith(".xlsx") || n.endsWith(".xls") || n.endsWith(".csv")) return true;

  return (
    ct === "application/vnd.ms-excel" ||
    ct === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    ct === "text/csv" ||
    ct === "application/csv"
  );
}

function kindFromItem(it: UploadListItem): UploadKind {
  return (it.kind ?? "general") as UploadKind;
}

function isAllowedReportFile(f: File) {
  return (f.name || "").toLowerCase().endsWith(".pdf");
}

function isAllowedPricesFile(f: File) {
  const n = (f.name || "").toLowerCase();
  return n.endsWith(".csv") || n.endsWith(".xls") || n.endsWith(".xlsx");
}

export default function UploadMain() {
  const [commodity, setCommodity] = useState<string>(() => {
    if (typeof window === "undefined") return "sulphur";
    const v = window.localStorage.getItem(LS_COMMODITY);
    return normalizeCommodity((v ?? "sulphur").trim());
  });

  const [region] = useState("global");

  const [introOpen, setIntroOpen] = useState(true);

  const [rows, setRows] = useState<UploadListItem[]>([]);
  const [eventSignalsExists, setEventSignalsExists] = useState(false);

  const [busyReport, setBusyReport] = useState<Busy>("idle");
  const [busyPrices, setBusyPrices] = useState<Busy>("idle");
  const [listBusy, setListBusy] = useState(false);

  const [generatingReportFor, setGeneratingReportFor] = useState<string | null>(null);
  const [generatingPricesFor, setGeneratingPricesFor] = useState<string | null>(null);

  const [reportFiles, setReportFiles] = useState<File[]>([]);
  const [pricesFile, setPricesFile] = useState<File | null>(null);

  const [refreshTick, setRefreshTick] = useState(0);

  const [msgReport, setMsgReport] = useState("");
  const [msgPrices, setMsgPrices] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<UploadListItem | null>(null);
  const [selectedNews, setSelectedNews] = useState<DocumentNewsDetails | null>(null);
  const [isNewsPending, startNewsTransition] = useTransition();

  const reportInputRef = useRef<HTMLInputElement | null>(null);
  const pricesInputRef = useRef<HTMLInputElement | null>(null);

  const searchParams = useSearchParams();
  const [deleteModal, setDeleteModal] = useState<UploadModalState>(null);
  const [archiveModal, setArchiveModal] = useState<UploadModalState>(null);


  function getBusy(mode: Mode): Busy {
    return mode === "report" ? busyReport : busyPrices;
  }

  function setBusyFor(mode: Mode, v: Busy) {
    if (mode === "report") setBusyReport(v);
    else setBusyPrices(v);
  }

  function busyLabel(mode: Mode) {
    const b = getBusy(mode);
    if (b === "init") return "Preparing…";
    if (b === "uploading") return "Uploading…";
    if (b === "verifying") return "Working…";
    if (b === "listing") return "Refreshing…";
    return "";
  }

  useEffect(() => {
    if (!msgReport) return;
    const ok = msgReport.startsWith("✓") || msgReport.includes("triggered");
    const ms = ok ? 4000 : 8000;
    const t = window.setTimeout(() => setMsgReport(""), ms);
    return () => window.clearTimeout(t);
  }, [msgReport]);

  useEffect(() => {
    if (!msgPrices) return;
    const ok = msgPrices.startsWith("✓") || msgPrices.includes("triggered");
    const ms = ok ? 4000 : 8000;
    const t = window.setTimeout(() => setMsgPrices(""), ms);
    return () => window.clearTimeout(t);
  }, [msgPrices]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = window.localStorage.getItem("upload:introDismissed");
    if (v === "1") setIntroOpen(false);
  }, []);

  function closeIntro() {
    setIntroOpen(false);
    try {
      window.localStorage.setItem("upload:introDismissed", "1");
    } catch {}
  }

  useEffect(() => {
    const fromUrl = searchParams?.get("commodity");
    const fromLs = typeof window !== "undefined" ? window.localStorage.getItem(LS_COMMODITY) : null;
    const picked = (fromUrl ?? fromLs ?? "sulphur").trim();
    setCommodity(normalizeCommodity(picked));
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = commodity.trim().toLowerCase();
    if (!v) return;
    window.localStorage.setItem(LS_COMMODITY, v);
    window.dispatchEvent(new Event("ai:commodity"));
  }, [commodity]);

  async function refreshList() {
    if (listBusy) return;
    setListBusy(true);

    try {
      const out: ListUploadsResult = await listUploadsAction({
        commodity: commodity.trim().toLowerCase(),
        region: region.trim().toLowerCase(),
      });

      if (!out.ok) {
        setRows([]);
        setEventSignalsExists(false);
        setMsgReport(out.error);
        setMsgPrices(out.error);
        return;
      }

      setRows(Array.isArray(out.items) ? out.items : []);
      setEventSignalsExists(Boolean(out.eventSignalsExists));
      setRefreshTick((v) => v + 1);
    } catch (e) {
      const err = e instanceof Error ? e.message : "List failed";
      setRows([]);
      setEventSignalsExists(false);
      setMsgReport(err);
      setMsgPrices(err);
    } finally {
      setListBusy(false);
    }
  }

  useEffect(() => {
    void refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commodity, region]);

  function openDeleteModal(args: {
    mode: Mode;
    objectNames: string[];
    displayName: string;
    alsoDeletesGenerated: boolean;
  }) {
    setDeleteModal({ open: true, action: "delete", ...args });
  }

  function openArchiveModal(args: {
    mode: Mode;
    objectNames: string[];
    displayName: string;
    alsoDeletesGenerated: boolean;
  }) {
    setArchiveModal({ open: true, action: "archive", ...args });
  }

  function closeDeleteModal() {
    setDeleteModal(null);
  }

  function closeArchiveModal(){
    setArchiveModal(null)
  } 

  async function deleteFilesNow(objectNames: string[], mode: Mode, displayName: string) {
    const names = objectNames.map((s) => String(s ?? "").trim()).filter(Boolean);
    if (!names.length) return;

    const setMsg = mode === "report" ? setMsgReport : setMsgPrices;
    setMsg("");
    setBusyFor(mode, "verifying");

    try {
      const out: DeleteUploadsResult = await deleteUploadsAction({ objectNames: names });

      if (!out.ok) {
        setMsg(out.error);
        return;
      }

      setMsg(`✓ Deleted: ${displayName}`);
      await refreshList();
    } catch (e) {
      const err = e instanceof Error ? e.message : "Delete failed";
      setMsg(err);
    } finally {
      setBusyFor(mode, "idle");
    }
  }

  async function archiveFilesNow(objectNames: string[], mode: Mode, displayName: string) {
    const names = objectNames.map((s) => String(s ?? "").trim()).filter(Boolean);
    if (!names.length) return;

    const setMsg = mode === "report" ? setMsgReport : setMsgPrices;
    setMsg("");
    setBusyFor(mode, "verifying");

    try {
      const out: ArchiveUploadsResult = await archiveUploadsAction({ objectNames: names });

      if (!out.ok) {
        setMsg(out.error);
        return;
      }

      setMsg(`✓ Archive: ${displayName}`);
      await refreshList();
    } catch (e) {
      const err = e instanceof Error ? e.message : "Archive failed";
      setMsg(err);
    } finally {
      setBusyFor(mode, "idle");
    }
  }

  function openNews(row: UploadListItem) {
    setSelectedRow(row);
    setSelectedNews(null);
    setDialogOpen(true);

    startNewsTransition(async () => {
      try {
        const details = await getUploadNewsDetailsAction({
          commodity: row.commodity,
          sourcePath: row.path,
        });
        setSelectedNews(details);
      } catch {
        setSelectedNews(null);
      }
    });
  }

  const pdfRows = useMemo(() => {
    return rows
      .filter((r) => isPdfRow(r) && kindFromItem(r) === "doc")
      .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
  }, [rows]);
  

  const excelRows = useMemo(() => {
    return rows
      .filter((r) => isExcelRow(r) && kindFromItem(r) === "rdata")
      .sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
  }, [rows]);

  async function uploadFile(mode: Mode) {
    const files = mode === "report" ? reportFiles : pricesFile ? [pricesFile] : [];
    if (!files.length) return;

    const setMsg = mode === "report" ? setMsgReport : setMsgPrices;
    setMsg("");
    setBusyFor(mode, "init");

    try {
      for (const file of files) {
        const contentType = inferContentType(file);

        const initOut: InitUploadResult = await initUploadAction({
          commodity,
          region,
          filename: file.name,
          contentType,
        });

        if (!initOut.ok) {
          setMsg(initOut.error);
          return;
        }

        setBusyFor(mode, "uploading");

        const putRes = await fetch(initOut.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });

        if (!putRes.ok) {
          const text = await putRes.text().catch(() => "");
          throw new Error(`Upload failed (HTTP ${putRes.status}): ${text || "Unknown error"}`);
        }
      }

      setMsg(`✓ Uploaded ${files.length} file(s)`);
      if (mode === "report") setReportFiles([]);
      else setPricesFile(null);

      await refreshList();
    } catch (e) {
      const err = e instanceof Error ? e.message : "Upload failed";
      setMsg(err);
    } finally {
      setBusyFor(mode, "idle");
    }
  }

  function Banner({ msg }: { msg: string }) {
    if (!msg) return null;
    const ok = msg.startsWith("✓") || msg.includes("triggered");
    return (
      <div className={cx("banner", ok ? "bannerOk" : "bannerBad")}>
        {ok ? <CheckCircle2 className="bannerIcon" /> : <XCircle className="bannerIcon" />}
        <span className="bannerText">{msg}</span>
      </div>
    );
  }

  const disableAll = listBusy || busyReport !== "idle" || busyPrices !== "idle";

  return (
    <AppShell title="Upload">
      <div className="cp-root">
        <input
          ref={reportInputRef}
          className="hidden"
          type="file"
          accept=".pdf"
          multiple
          disabled={disableAll}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;

            const invalid = files.find((f) => !isAllowedReportFile(f));
            if (invalid) {
              setMsgReport("All report files must be PDF.");
              e.currentTarget.value = "";
              return;
            }

            setReportFiles(files);
            setMsgReport("");
            e.currentTarget.value = "";
          }}
        />

        <input
          ref={pricesInputRef}
          className="hidden"
          type="file"
          accept=".csv,.xls,.xlsx"
          multiple={false}
          disabled={disableAll}
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (!f) return;

            if (!isAllowedPricesFile(f)) {
              setMsgPrices("Prices must be CSV, XLS, or XLSX.");
              e.currentTarget.value = "";
              return;
            }

            setPricesFile(f);
            setMsgPrices("");
            e.currentTarget.value = "";
          }}
        />

        <div className="cp-container">
          <UploadSidebar
            commodity={commodity}
            commodities={COMMODITIES}
            disableAll={disableAll}
            onCommodityChange={(v) => setCommodity(normalizeCommodity(v))}
            infoValue={`${pdfRows.length + excelRows.length} files detected.`}
            onOpenIntro={() => setIntroOpen(true)}
            banner={<Banner msg={msgReport || msgPrices} />}
          />

          <main className="cp-main">
            <div className="cp-card cp-rec-card">
              <div className="cp-rec-header">
                <div className="cp-rec-text">
                  <h2>
                    <ArrowRight size={14} className="th-inline" /> UPLOAD SOURCES FOR THE FORECAST:
                  </h2>
                  <p style={{ marginTop: 10, color: "#5e6c84" }}>
                    The report is used to extract events and produce a clear written summary. The prices file calibrates
                    the forecast with real market history.
                  </p>
                </div>
              </div>
            </div>

            <DocsCard
              disableAll={disableAll}
              listBusy={listBusy}
              refreshTick={refreshTick}
              pdfRows={pdfRows}
              reportFiles={reportFiles}
              busyReport={busyReport}
              generatingReportFor={generatingReportFor}
              onRefreshList={refreshList}
              onPickReportFile={() => reportInputRef.current?.click()}
              onUploadReportFile={() => uploadFile("report")}
              onClearReportFile={() => setReportFiles([])}
              hasEventSignals={eventSignalsExists}
              baseName={baseName}
              fmtDate={fmtDate}
              openDeleteModal={openDeleteModal}
              openArchiveModal={openArchiveModal}
              busyLabel={busyLabel}
              cx={cx}
              onOpenNews={openNews}
            />

            <PricesCard
              disableAll={disableAll}
              refreshTick={refreshTick}
              excelRows={excelRows}
              pricesFile={pricesFile}
              busyPrices={busyPrices}
              generatingPricesFor={generatingPricesFor}
              onPickPricesFile={() => pricesInputRef.current?.click()}
              onUploadPricesFile={() => uploadFile("prices")}
              onClearPricesFile={() => setPricesFile(null)}
              onGeneratePrices={async () => {}}
              baseName={baseName}
              fmtDate={fmtDate}
              openDeleteModal={openDeleteModal}
              busyLabel={busyLabel}
              cx={cx}
              banner={<Banner msg={msgPrices} />}
            />
          </main>
        </div>

        <DeleteModal
          state={deleteModal}
          onClose={closeDeleteModal}
          onConfirmDelete={async ({ objectNames, mode, displayName }) => {
            await deleteFilesNow(objectNames, mode, displayName);
          }}
        />

        <ArchiveModal
          state={archiveModal}
          onClose={closeArchiveModal}
          onConfirmArchive={async ({ objectNames, mode, displayName }) => {
            await archiveFilesNow(objectNames, mode, displayName);
          }}
        />

        <NewsDetailsDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setSelectedRow(null);
              setSelectedNews(null);
            }
          }}
          fileName={selectedRow?.name || ""}
          data={selectedNews}
          loading={isNewsPending}
        />
      </div>
    </AppShell>
  );
}