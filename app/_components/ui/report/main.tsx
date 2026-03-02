"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/app/_components/app-shell";
import { RefreshCwIcon, RefreshCw, FileText, ArrowRight } from "lucide-react";

import { getReportsAction, getSignedUrlAction, readReportAction } from "@/app/(protected)/report/actions";
import type { ReportBase } from "@/src/entities/models/report-base";

import { ReportSidebar } from "./sections/report-sidebar";
import { ReportGrid } from "./sections/report-grid";
import { ReportViewerModal } from "./sections/report-viewer-modal";

export default function ReportMain() {
    const [generatedBy, setGeneratedBy] = useState("");

    const [items, setItems] = useState<ReportBase[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadErr, setLoadErr] = useState<string | null>(null);

    const [selected, setSelected] = useState<ReportBase | null>(null);

    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    const [viewOpen, setViewOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewErr, setViewErr] = useState<string | null>(null);
    const [viewJson, setViewJson] = useState<any | null>(null);

    async function openGeneratedReport(it: ReportBase) {
        if (!it.hasClean) return;

        setSelected(it);
        setViewOpen(true);
        setViewLoading(true);
        setViewErr(null);
        setViewJson(null);

        try {
            const res = await readReportAction(it.cleanObjectName);

            if (!res.ok) {
                throw new Error(res.error ?? "Read failed");
            }

            const successRes = res as any;

            setViewJson(
                successRes.kind === "json"
                    ? successRes.json
                    : { kind: successRes.kind, text: successRes.text }
            );
        } catch (e: any) {
            setViewErr(e?.message ?? "Failed to load generated report");
        } finally {
            setViewLoading(false);
        }
    }

    async function refresh() {
        setLoading(true);
        setLoadErr(null);
        try {
            const res = await getReportsAction();
            if (!res.ok) throw new Error(res.error ?? "List failed");
            setItems(Array.isArray(res.items) ? res.items : []);
        } catch (e: any) {
            setLoadErr(e?.message ?? "Failed to load");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    const rows = useMemo(() => {
        const genBy = generatedBy.trim().toLowerCase();

        const fromTs =
            fromDate && /^\d{4}-\d{2}-\d{2}$/.test(fromDate)
                ? new Date(fromDate + "T00:00:00").getTime()
                : null;

        const toTs =
            toDate && /^\d{4}-\d{2}-\d{2}$/.test(toDate)
                ? new Date(toDate + "T23:59:59").getTime()
                : null;

        return items.filter((it) => {
            const itGeneratedBy = "generatedBy" in it ? String((it as any).generatedBy) : "system";
            let okGeneratedBy = true;
            if (genBy === "system") {
                okGeneratedBy = itGeneratedBy.toLowerCase() === "system";
            } else if (genBy === "team") {
                okGeneratedBy = itGeneratedBy.toLowerCase() !== "system";
            }

            const isActive = Boolean(it.active);
            const okStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && isActive) ||
                (statusFilter === "inactive" && !isActive);

            const createdTs =
                typeof it.createdAt === "number" ? it.createdAt : new Date(String(it.createdAt ?? "")).getTime();

            const okDate =
                (fromTs == null || (Number.isFinite(createdTs) && createdTs >= fromTs)) &&
                (toTs == null || (Number.isFinite(createdTs) && createdTs <= toTs));

            return okGeneratedBy && okStatus && okDate;
        });
    }, [items, generatedBy, statusFilter, fromDate, toDate]);

    async function openSigned(objectName: string) {
        try {
            const data = await getSignedUrlAction(objectName);
            if (!data.ok || !data.url) throw new Error(data.error ?? "Signed URL failed");
            window.open(data.url, "_blank", "noopener,noreferrer");
        } catch (error: any) {
            alert(error.message);
        }
    }

    return (
        <AppShell>
            <div className="flex p-5 gap-5 max-w-[1600px] mx-auto text-[14px] text-slate-800 bg-slate-50 min-h-[calc(100vh-101px)]">
                <ReportSidebar
                    generatedBy={generatedBy}
                    setGeneratedBy={setGeneratedBy}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    toDate={toDate}
                    setToDate={setToDate}
                    loadErr={loadErr}
                />

                <main className="flex-1 flex flex-col gap-5 min-w-0">
                    <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-base font-bold text-slate-900 uppercase tracking-wide">REPORT ARCHIVE</div>
                            <button
                                className="bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-3.5 py-1.5 rounded font-medium cursor-pointer flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-wider shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={refresh}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'REFRESHING...' : 'REFRESH'}
                            </button>
                        </div>
                        <p className="text-slate-700 text-[13px] leading-relaxed m-0 mb-4 max-w-3xl">
                            Reports are used for audit and review of forecast assumptions, extracted signals, and bid recommendations. Forecast integrity depends on having complete report records.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-sky-600 text-[11px] font-bold no-underline uppercase hover:text-sky-700 transition-colors">
                                VIEW REQUIREMENTS
                            </a>
                            <a href="#" className="text-sky-600 text-[11px] font-bold no-underline uppercase flex items-center gap-1.5 hover:text-sky-700 transition-colors">
                                <FileText className="h-3.5 w-3.5" />
                                FIND ALL RESULTS
                                <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    </div>

                    <ReportGrid
                        rows={rows}
                        loading={loading}
                        onDownload={openSigned}
                        onViewReport={openGeneratedReport}
                    />

                    <ReportViewerModal
                        isOpen={viewOpen}
                        onClose={() => setViewOpen(false)}
                        loading={viewLoading}
                        error={viewErr}
                        jsonData={viewJson}
                    />
                </main>
            </div>
        </AppShell>
    );
}
