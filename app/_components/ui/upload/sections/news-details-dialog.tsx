"use client";

import * as React from "react";
import type { DocumentNewsDetails } from "@/src/entities/models/news";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  data: DocumentNewsDetails | null;
  loading?: boolean;
};

function EventCard({
  title,
  subtitle,
  eventDate,
  expiryDate,
  summary,
  muted = false,
}: {
  title: string;
  subtitle: string;
  eventDate?: string;
  expiryDate?: string;
  summary?: string;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${muted ? "opacity-70" : ""}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        Event: {eventDate || "-"} | Expiry: {expiryDate || "-"}
      </div>
      {summary ? <div className="mt-2 text-xs leading-5">{summary}</div> : null}
    </div>
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-6xl max-h-[85vh] overflow-hidden rounded-2xl border bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-base font-semibold">News details — {fileName}</div>
          <button
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Loading news details...
          </div>
        ) : !data ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No news details found.
          </div>
        ) : (
          <div className="grid max-h-[70vh] gap-6 overflow-auto p-5 md:grid-cols-2">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Active news</h3>
                <span className="rounded-md border px-2 py-1 text-xs">{data.active}</span>
              </div>

              <div className="space-y-3">
                {data.activeEvents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No active news.</div>
                ) : (
                  data.activeEvents.map((event, idx) => (
                    <EventCard
                      key={`${event.headline}-${idx}`}
                      title={event.headline}
                      subtitle={`${event.eventType || "other"} · ${event.impactDirection || "unclear"} · score ${event.importanceScore ?? "-"}`}
                      eventDate={event.eventDate}
                      expiryDate={event.expiryDate}
                      summary={event.evidenceSummary}
                    />
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Inactive news</h3>
                <span className="rounded-md border px-2 py-1 text-xs">{data.inactive}</span>
              </div>

              <div className="space-y-3">
                {data.inactiveEvents.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No inactive news.</div>
                ) : (
                  data.inactiveEvents.map((event, idx) => (
                    <EventCard
                      key={`${event.headline}-${idx}`}
                      title={event.headline}
                      subtitle={`${event.eventType || "other"} · ${event.impactDirection || "unclear"} · score ${event.importanceScore ?? "-"}`}
                      eventDate={event.eventDate}
                      expiryDate={event.expiryDate}
                      summary={event.evidenceSummary}
                      muted
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}