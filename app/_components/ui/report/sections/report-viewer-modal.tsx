import React from "react";
import { X, FileText } from "lucide-react";
import { normalizeCleanReport } from "@/src/application/use-cases/report/normalize-report";
import type { SummarySection } from "@/src/entities/models/normalized-report";

export type ReportViewerModalProps = {
    isOpen: boolean;
    onClose: () => void;
    loading: boolean;
    error: string | null;
    jsonData: any | null;
};

function toTitleCase(s: string) {
    const x = String(s ?? "").trim();
    if (!x) return "";
    return x.charAt(0).toUpperCase() + x.slice(1);
}

function metaSeparator(items: Array<string | null | undefined>) {
    return items.filter(Boolean).join(" • ");
}

// --- View Component for the Report ---
function ReportWordDoc({ json }: { json: any }) {
    const doc = normalizeCleanReport(json);

    const mainTheme = (doc.main_theme ?? "").trim();
    const summary: SummarySection[] = Array.isArray(doc.document_summary) ? doc.document_summary : [];
    const events = Array.isArray(doc.events) ? doc.events : [];

    const hasStructure = Boolean(mainTheme) || summary.length > 0 || events.length > 0;

    return (
        <div className="font-serif text-slate-900 text-[13.5px] leading-relaxed">
            {!hasStructure ? (
                <>
                    <h2 className="font-sans text-base font-extrabold m-0 mt-5 mb-2.5 tracking-tight">Structured Report</h2>
                    <div className="font-sans text-xs text-slate-500 mb-4">Raw Report Fallback</div>
                    <div className="h-px bg-slate-400/50 my-3.5" />
                    <pre className="font-mono text-xs bg-slate-50 p-4 rounded border border-slate-200 whitespace-pre-wrap break-words">
                        {JSON.stringify(json, null, 2)}
                    </pre>
                </>
            ) : (
                <>
                    {mainTheme ? (
                        <>
                            <h2 className="font-sans text-base font-extrabold m-0 mt-5 mb-2.5 tracking-tight">Main theme</h2>
                            <p className="m-0 mb-2.5 whitespace-pre-wrap break-words">{mainTheme}</p>
                        </>
                    ) : null}

                    {summary.length > 0 ? (
                        <>
                            <div className="h-px bg-slate-400/50 my-3.5" />
                            <h2 className="font-sans text-base font-extrabold mt-5 mb-2.5 tracking-tight">Document summary</h2>
                            {summary.map((s, idx) => (
                                <div key={idx}>
                                    <h3 className="font-sans text-[13px] font-extrabold mt-4 mb-1.5">
                                        {s.section_title?.trim() ? s.section_title.trim() : `Section ${idx + 1}`}
                                    </h3>
                                    <p className="m-0 mb-2.5 whitespace-pre-wrap break-words">{String(s.content ?? "").trim()}</p>
                                </div>
                            ))}
                        </>
                    ) : null}

                    {events.length > 0 ? (
                        <>
                            <div className="h-px bg-slate-400/50 my-3.5" />
                            <h2 className="font-sans text-base font-extrabold mt-5 mb-2.5 tracking-tight">Key events</h2>
                            {events.map((e: any, idx: number) => {
                                const headline = String(e?.headline ?? "").trim() || `Event ${idx + 1}`;
                                const eventType = String(e?.event_type ?? "").trim();
                                const impact = String(e?.impact_direction ?? "").trim();
                                const date = String(e?.event_date ?? "").trim();
                                const score = typeof e?.importance_score === "number" ? e.importance_score : null;
                                const evidence = String(e?.evidence_summary ?? e?.summary ?? "").trim();
                                const regions = Array.isArray(e?.regions) ? e.regions : [];

                                const meta = metaSeparator([
                                    eventType ? toTitleCase(eventType) : null,
                                    impact ? toTitleCase(impact) : null,
                                    date || null,
                                    score != null ? `Score ${score.toFixed(2)}` : null,
                                    regions.length ? `Regions: ${regions.join(", ")}` : null,
                                ]);

                                return (
                                    <div key={idx} className="py-3 border-t border-slate-400/40 first:border-0 first:pt-0">
                                        <div className="font-sans font-extrabold text-sm mb-1">{headline}</div>
                                        {meta ? <div className="font-sans text-[11px] text-slate-500 mb-2.5">{meta}</div> : null}
                                        {evidence ? <p className="m-0 mb-2.5 whitespace-pre-wrap break-words">{evidence}</p> : null}

                                        {Array.isArray(e?.numbers) && e.numbers.length ? (
                                            <table className="w-full border-collapse mt-2 font-sans text-xs">
                                                <thead>
                                                    <tr>
                                                        <th className="w-[22%] border-t border-slate-400/50 p-2 text-left align-top text-[10px] tracking-widest uppercase text-slate-600 font-extrabold bg-sky-600/5">Value</th>
                                                        <th className="w-[18%] border-t border-slate-400/50 p-2 text-left align-top text-[10px] tracking-widest uppercase text-slate-600 font-extrabold bg-sky-600/5">Unit</th>
                                                        <th className="border-t border-slate-400/50 p-2 text-left align-top text-[10px] tracking-widest uppercase text-slate-600 font-extrabold bg-sky-600/5">Context</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {e.numbers.map((n: any, j: number) => (
                                                        <tr key={j}>
                                                            <td className="border-t border-slate-400/40 p-2 text-left align-top">{String(n?.value ?? "")}</td>
                                                            <td className="border-t border-slate-400/40 p-2 text-left align-top">{String(n?.unit ?? "")}</td>
                                                            <td className="border-t border-slate-400/40 p-2 text-left align-top">{String(n?.context ?? "")}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </>
                    ) : null}
                </>
            )}
        </div>
    );
}

// --- Main Modal Component ---
export function ReportViewerModal({
    isOpen,
    onClose,
    loading,
    error,
    jsonData,
}: ReportViewerModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[13000]">
            <div
                className="absolute inset-0 bg-[#091e42]/35"
                onClick={onClose}
                aria-hidden="true"
            />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-[980px] bg-white border border-slate-200 max-h-[90vh] flex flex-col rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 shrink-0 rounded-t-lg">
                        <div className="flex justify-between items-center gap-3">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-sky-600" />
                                <div className="font-extrabold text-base text-slate-800 tracking-tight">Generated Report</div>
                            </div>
                            <button
                                className="toolbar-btn text-sm flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors"
                                type="button"
                                onClick={onClose}
                                title="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto grow bg-white">
                        {error ? (
                            <div className="p-3 border border-red-200 bg-red-50 text-red-700 font-bold rounded">
                                {error}
                            </div>
                        ) : loading ? (
                            <div className="p-3 text-slate-500 flex items-center justify-center h-full">
                                Loading…
                            </div>
                        ) : (
                            <ReportWordDoc json={jsonData} />
                        )}
                    </div>

                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0 rounded-b-lg">
                        <button
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-medium transition-colors cursor-pointer"
                            type="button"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
