"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { readReportAction } from "@/app/(protected)/report/view/actions";
import { ReportToolbar } from "./sections/report-toolbar";
import { ReportWordDoc } from "./sections/report-word-doc";
import { normalizeReportToViewModel, type ReportViewModel } from "@/lib/report/report-normalizer";

type ReadReportResult =
  | { ok: true; kind: "json"; objectName: string; json: unknown }
  | { ok: true; kind: "text"; objectName: string; text: string }
  | { ok: false; error: string };

function baseName(path?: string) {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function stripExt(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function metaSeparator(items: Array<string | null | undefined>) {
  return items.filter(Boolean).join(" | ");
}

export default function ReportViewMain() {
  const sp = useSearchParams();
  const objectName = useMemo(() => (sp.get("objectName") ?? "").trim(), [sp]);

  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState<ReadReportResult | null>(null);

  useEffect(() => {
    if (!objectName) {
      setBusy(false);
      setErr("Missing objectName");
      setData(null);
      return;
    }

    (async () => {
      setBusy(true);
      setErr("");
      setData(null);

      try {
        const out = (await readReportAction({ objectName })) as ReadReportResult;

        if (!out.ok) {
          setErr(out.error);
          setData(null);
          return;
        }

        setData(out);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed";
        setErr(msg);
        setData(null);
      } finally {
        setBusy(false);
      }
    })();
  }, [objectName]);

  const pageTitle = useMemo(() => stripExt(baseName(objectName)), [objectName]);

  const model: ReportViewModel | null = useMemo(() => {
    if (!data?.ok || data.kind !== "json") return null;
    return normalizeReportToViewModel(data.json);
  }, [data]);

  return (
    <div className="min-h-screen bg-[#edf5ef]">
      <ReportToolbar title={busy ? "Loading..." : pageTitle || "Report"} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {err ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
            {err}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_20px_55px_rgba(15,92,58,0.08)]">
          <div className="px-5 py-6 sm:px-10 sm:py-10">
            {!data ? (
              <p className="text-slate-500">{busy ? "Loading..." : "No data."}</p>
            ) : data.ok && data.kind === "text" ? (
              <div className="word-doc">
                <h1>{pageTitle || "Report"}</h1>
                <div className="subtitle">{metaSeparator([baseName(objectName), data.kind])}</div>
                <div className="rule" />
                <p>{data.text}</p>
              </div>
            ) : data.ok && data.kind === "json" && model ? (
              <ReportWordDoc model={model} title={pageTitle || "Report"} objectName={objectName} />
            ) : (
              <p className="text-slate-500">No data.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
