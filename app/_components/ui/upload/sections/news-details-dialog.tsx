"use client";

import * as React from "react";
import { ChevronDown, Clock3, X } from "lucide-react";

import type { DocumentNewsDetails, NewsEvent } from "@/src/entities/models/news";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  data: DocumentNewsDetails | null;
  loading?: boolean;
};

function EventCard({
  event,
  muted = false,
}: {
  event: NewsEvent;
  muted?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const direction = String(event.impactDirection || "unclear").toLowerCase();
  const directionClass = direction.includes("bull")
    ? "bg-emerald-100 text-emerald-800"
    : direction.includes("bear")
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700";
  const metaLine = [
    event.eventType || "other",
    event.impactDirection || "unclear",
    event.importanceScore != null ? `Score ${event.importanceScore}` : null,
    event.eventDate ? `Event ${event.eventDate}` : "Event -",
    event.expiryDate ? `Expiry ${event.expiryDate}` : "Expiry -",
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <div className="border-t border-[#e8efea] first:border-t-0">
      <button
        type="button"
        className={`flex w-full border-0 items-start justify-between gap-3 px-4 py-3 text-left transition ${
          muted ? "bg-slate-50 hover:bg-slate-100" : "bg-white hover:bg-emerald-50/40"
        }`}
        onClick={() => setOpen((value) => !value)}
      >
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-slate-900">{event.headline}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
            <span className="text-slate-600">{event.eventType || "other"}</span>
            <span className="text-slate-300">|</span>
            <span className={`rounded-full px-2 py-0.5 font-medium ${directionClass}`}>
              {event.impactDirection || "unclear"}
            </span>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {metaLine.split(" | ").slice(2).join(" | ")}
            </span>
          </div>
        </div>

        <span
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
            open
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open ? (
        <div className={`border-t px-4 py-3 ${muted ? "border-[#e8efea] bg-slate-50" : "border-[#e1eee5] bg-emerald-50/30"}`}>
          <div className="text-[13px] leading-6 text-slate-600">
            {event.evidenceSummary || "No summary available."}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ColumnSection({
  title,
  count,
  events,
  muted = false,
}: {
  title: string;
  count: number;
  events: NewsEvent[];
  muted?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-[#e3ebe5] bg-white shadow-[0_10px_24px_rgba(15,92,58,0.05)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#e8efea] bg-[#f1f4f2] px-4 py-3.5">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        </div>
        <span
          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-xl px-2.5 text-xs font-semibold ${
            muted ? "bg-slate-100 text-slate-700" : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {count}
        </span>
      </div>

      <div>
        {events.length === 0 ? (
          <div className="px-4 py-6 text-[13px] text-slate-500">
            No {muted ? "inactive" : "active"} news.
          </div>
        ) : (
          events.map((event, idx) => (
            <EventCard key={`${event.headline}-${idx}`} event={event} muted={muted} />
          ))
        )}
      </div>
    </section>
  );
}

export function NewsDetailsDialog({
  open,
  onOpenChange,
  fileName,
  data,
  loading = false,
}: Props) {
  React.useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(15,92,58,0.08)] p-3 pt-14 backdrop-blur-[1px] sm:p-5 sm:pt-16"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="flex max-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] bg-[#fbfdfb] shadow-[0_18px_48px_rgba(15,92,58,0.10)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e5ebe7] bg-[#f1f4f2] px-5 py-3.5 sm:px-6">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-slate-900">{fileName}</div>
          </div>

          <button
            type="button"
            className="cp-btn-outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="icon16" />
            Close
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
            Loading news details...
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-500">
            No news details found.
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-5 sm:p-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <ColumnSection
                title="Active news"
                count={data.active}
                events={data.activeEvents}
              />

              <ColumnSection
                title="Inactive news"
                count={data.inactive}
                events={data.inactiveEvents}
                muted
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
