"use client";

import { Printer } from "lucide-react";

export function ReportToolbar({ title }: { title: string }) {
  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 16mm;
        }
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          [data-print-hide] {
            display: none !important;
          }
          html,
          body {
            background: white !important;
          }
        }

        .word-doc {
          font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
          color: #0f172a;
          font-size: 13.5px;
          line-height: 1.75;
        }
        .word-doc h1 {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans",
            "Apple Color Emoji", "Segoe UI Emoji";
          font-size: 24px;
          line-height: 1.15;
          font-weight: 700;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }
        .word-doc .subtitle {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans";
          font-size: 12px;
          color: #475569;
          margin: 0 0 18px 0;
        }
        .word-doc h2 {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans";
          font-size: 16px;
          font-weight: 700;
          margin: 22px 0 10px 0;
          letter-spacing: -0.01em;
        }
        .word-doc h3 {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans";
          font-size: 13px;
          font-weight: 700;
          margin: 16px 0 6px 0;
        }
        .word-doc p {
          margin: 0 0 10px 0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .word-doc .rule {
          height: 1px;
          background: rgba(148, 163, 184, 0.55);
          margin: 14px 0 18px 0;
        }
        .word-doc .event {
          padding: 12px 0;
          border-top: 1px solid rgba(148, 163, 184, 0.45);
        }
        .word-doc .event:first-of-type {
          border-top: 0;
          padding-top: 0;
        }
        .word-doc .event-title {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans";
          font-weight: 700;
          font-size: 14px;
          margin: 0 0 4px 0;
        }
        .word-doc .event-meta {
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans";
          font-size: 11px;
          color: #64748b;
          margin: 0 0 10px 0;
        }
        .word-doc table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0 0 0;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans";
          font-size: 12px;
        }
        .word-doc th,
        .word-doc td {
          border-top: 1px solid rgba(148, 163, 184, 0.45);
          padding: 8px 10px;
          text-align: left;
          vertical-align: top;
        }
        .word-doc thead th {
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #475569;
          font-weight: 700;
          background: rgba(2, 132, 199, 0.06);
          border-top: 1px solid rgba(148, 163, 184, 0.55);
        }
        .toolbar-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: white;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #0f172a;
        }
      `}</style>

      <div data-print-hide className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
            <div className="truncate text-[11px] text-slate-500">Viewer mode. Print for PDF.</div>
          </div>

          <button
            onClick={() => window.print()}
            className="toolbar-btn"
            type="button"
            title="Print"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>
    </>
  );
}