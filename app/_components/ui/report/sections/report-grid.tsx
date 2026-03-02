import React, { useState } from "react";
import { Download, FileText, FileBarChart, RefreshCwIcon, Ban, Info, ChevronDown, Newspaper, ShieldHalf, Zap } from "lucide-react";
import type { ReportBase } from "@/src/entities/models/report-base";

const DATE_FMT = new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "Australia/Sydney",
});

function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return DATE_FMT.format(d);
}

export type ReportGridProps = {
    rows: ReportBase[];
    loading: boolean;
    onDownload: (objectName: string) => void;
    onViewReport: (item: ReportBase) => void;
};

export function ReportGrid({ rows, loading, onDownload, onViewReport }: ReportGridProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="bg-white border border-[#e2e8f0] rounded-[4px]">
            <div className="grid grid-cols-[1fr_2.5fr_1fr_1fr_1.5fr_1fr] px-5 py-[15px] bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-bold text-[#718096] uppercase">
                <div>Date</div>
                <div>File Name</div>
                <div>Type</div>
                <div>Coverage</div>
                <div>Forecast</div>
                <div className="text-right">Action</div>
            </div>

            <div className="flex flex-col">
                {rows.length ? (
                    rows.map((it) => (
                        <div key={it.id} className="border-b border-[#e2e8f0] bg-[#f7fafc]">
                            <div
                                className="grid grid-cols-[1fr_2.5fr_1fr_1fr_1.5fr_1fr] px-5 py-[15px] items-center text-[13px] cursor-pointer hover:bg-slate-50 transition-colors"
                                onClick={() => setExpandedId(expandedId === it.id ? null : it.id)}
                            >
                                <div suppressHydrationWarning>{formatDate(it.createdAt)}</div>

                                <div className="font-semibold text-[#1a202c] truncate pr-4" title={it.fileName}>
                                    {it.fileName}
                                </div>

                                <div>
                                    {it.active ? (
                                        <span className="bg-gradient-to-r from-[#4fd1c5] to-[#63b3ed] text-white px-2 py-1 rounded-[3px] text-[10px] font-semibold uppercase inline-block">
                                            <FileBarChart className="h-3 w-3 inline mr-1" />
                                            Set In LATEST FORECAST
                                        </span>
                                    ) : (
                                        <span className="bg-[#a0aec0] text-white px-2 py-1 rounded-[3px] text-[10px] font-semibold uppercase inline-flex items-center gap-1">
                                            <Ban className="h-3 w-3" />
                                            DEPRECATED
                                        </span>
                                    )}
                                </div>

                                <div></div>

                                <div></div>

                                <div className="flex justify-end gap-1.5">
                                    {it.hasClean ? (
                                        <button
                                            className="border border-[#cbd5e0] bg-white text-[#2b6cb0] px-2.5 py-1.5 rounded-[4px] text-[12px] font-medium cursor-pointer flex items-center gap-1 hover:bg-slate-50 transition-colors"
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onViewReport(it);
                                            }}
                                        >
                                            <FileText className="h-3.5 w-3.5" />
                                            View Report
                                        </button>
                                    ) : null}

                                    <button
                                        className="border border-[#cbd5e0] bg-white text-[#718096] w-[30px] h-[30px] flex items-center justify-center rounded-[4px] cursor-pointer hover:bg-slate-50 hover:text-slate-700 transition-colors"
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDownload(it.objectName);
                                        }}
                                        title="Download PDF"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Nested Details */}
                            {expandedId === it.id && (
                                <div className="bg-[#f7fafc] px-5 pb-5">
                                    <div className="nested-wrapper pt-3.5">
                                        <div className="bg-[#4c6ef5] text-white px-[15px] py-2 text-[13px] rounded-t-[4px] inline-flex items-center gap-2 min-w-[200px]">
                                            <Info className="h-3.5 w-3.5" />
                                            {it.active ? "Used in Latest Forecast" : "Superseded Report"}
                                            <ChevronDown className="h-3.5 w-3.5 ml-2" />
                                        </div>
                                        <div className="bg-white border border-[#e2e8f0] p-[15px] flex flex-col gap-2.5 rounded-b-[4px] rounded-tr-[4px] -mt-px relative z-10">
                                            <div className="flex justify-between items-start">
                                                <div className="text-[15px] font-semibold text-[#2d3748] flex items-center gap-2">
                                                    <Newspaper className="h-4 w-4 text-[#4c6ef5]" />
                                                    Market Signal Summary - {it.commodity ? it.commodity : "Unknown"}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5 text-[13px] text-[#4a5568] py-2.5">
                                                <span className={it.active ? "bg-[#9ae6b4] text-[#22543d] px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase" : "bg-[#d69e2e] text-white px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase"}>
                                                    {it.active ? "ACTIVE" : "ARCHIVED"}
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <ShieldHalf className={it.active ? "text-[#48bb78] h-3.5 w-3.5" : "text-[#718096] h-3.5 w-3.5"} />
                                                    Middle East, 03 Jan – 06 Jan
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <Zap className={it.active ? "text-[#48bb78] h-3.5 w-3.5" : "text-[#718096] h-3.5 w-3.5"} />
                                                    7 signals (3 Supply, 2 Demand, 2 Policy)
                                                </span>
                                                <span className="flex-1"></span>
                                                <button onClick={(e) => { e.stopPropagation(); onDownload(it.objectName); }} className="text-[#2b6cb0] font-semibold text-[12px] flex items-center gap-1.5 uppercase hover:underline">
                                                    <Download className="h-3.5 w-3.5" /> DOWNLOAD
                                                </button>
                                            </div>

                                            <div className="text-[11px] text-[#a0aec0] pt-2.5 border-t border-[#edf2f7] mt-1">
                                                Generated on {formatDate(it.createdAt)} by user@company.com &nbsp;|&nbsp; Model v5.12
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-[#718096] text-[13px]">
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <RefreshCwIcon className="h-4 w-4 animate-spin text-[#a0aec0]" />
                                Loading reports...
                            </div>
                        ) : (
                            "No reports match your filters."
                        )}
                    </div>
                )}
            </div>

            <div className="p-5 text-[12px] text-[#a0aec0]">
                Reports are retained for 1 year, older data is automatically purged.
            </div>
        </div>
    );
}
