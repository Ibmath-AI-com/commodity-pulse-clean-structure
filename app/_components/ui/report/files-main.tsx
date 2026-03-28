"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/app/_components/app-shell";
import {
  createReportSourceReadUrlAction,
  listReportFilesAction,
  type ReportSourceFile,
} from "@/app/(protected)/report/actions";
import {
  DEFAULT_COMMODITY,
  getStoredCommodity,
  setStoredCommodity,
  subscribeStoredCommodity,
} from "@/lib/common/commodity-preference";
import { normalizeCommodity } from "@/lib/common/options";

import { ReportFilesSidebar } from "./files-sidebar";
import { ReportFilesTableCard } from "./files-table-card";

export default function ReportFilesMain() {
  const [commodity, setCommodity] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_COMMODITY;
    return getStoredCommodity();
  });

  const [activeRows, setActiveRows] = useState<ReportSourceFile[]>([]);
  const [archivedRows, setArchivedRows] = useState<ReportSourceFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [openingKey, setOpeningKey] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setStoredCommodity(commodity || DEFAULT_COMMODITY);
  }, [commodity]);

  useEffect(() => subscribeStoredCommodity((value) => setCommodity(value)), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setBusy(true);
      setError("");

      try {
        const out = await listReportFilesAction({
          commodity,
        });

        if (cancelled) return;

        if (out.ok === false) {
          setActiveRows([]);
          setArchivedRows([]);
          setError(out.error);
          return;
        }

        setActiveRows(out.active);
        setArchivedRows(out.archived);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load report files";
        setActiveRows([]);
        setArchivedRows([]);
        setError(msg);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [commodity]);

  async function handleOpenFile(row: ReportSourceFile) {
    const key = `${row.bucket}:${row.objectName}`;
    setOpeningKey(key);
    setError("");

    try {
      const signed = await createReportSourceReadUrlAction({
        bucket: row.bucket,
        objectName: row.objectName,
      });

      window.open(signed.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to open file";
      setError(msg);
    } finally {
      setOpeningKey(null);
    }
  }

  const totalCount = useMemo(() => activeRows.length + archivedRows.length, [activeRows.length, archivedRows.length]);

  return (
    <AppShell title="Report" onOpenMobileSidebar={() => setSidebarOpen(true)}>
      <div className="cp-root">
        <div className="cp-container cp-mobile-layout">
          {sidebarOpen ? (
            <button
              type="button"
              className="cp-mobile-sidebar-backdrop"
              aria-label="Close report sidebar"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <ReportFilesSidebar
            commodity={commodity}
            onCommodityChange={(nextRaw) => setCommodity(normalizeCommodity(nextRaw))}
            activeCount={activeRows.length}
            archivedCount={archivedRows.length}
            totalCount={totalCount}
            mobileOpen={sidebarOpen}
            onCloseMobile={() => setSidebarOpen(false)}
          />

          <main className="cp-main">
            {error ? <div className="cp-error">{error}</div> : null}

            <ReportFilesTableCard
              title="Active Files"
              description={busy ? "Loading active source PDFs..." : "Original PDFs currently available in the active bucket."}
              rows={activeRows}
              openingKey={openingKey}
              onOpenFile={handleOpenFile}
            />

            <ReportFilesTableCard
              title="Archived Files"
              description={busy ? "Loading archived source PDFs..." : "Previously archived original PDFs for the selected commodity."}
              rows={archivedRows}
              openingKey={openingKey}
              onOpenFile={handleOpenFile}
            />
          </main>
        </div>
      </div>
    </AppShell>
  );
}
