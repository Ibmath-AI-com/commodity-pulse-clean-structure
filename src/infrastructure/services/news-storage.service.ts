// FILE: src/infrastructure/services/news-storage.service.ts
import "server-only";

import type { INewsStorageService } from "@/src/application/services/news-storage.service.interface";
import type { IObjectStorageService } from "@/src/application/services/storage.service.interface";
import type {
  DocumentNewsDetails,
  DocumentNewsSummary,
  NewsEvent,
  NewsNumber,
} from "@/src/entities/models/news";

type RawEvent = {
  document_id?: unknown;
  commodity?: unknown;
  importance_score?: unknown;
  event_type?: unknown;
  headline?: unknown;
  impact_direction?: unknown;
  regions?: unknown;
  event_date?: unknown;
  numbers?: unknown;
  evidence_summary?: unknown;
  retention_type?: unknown;
  active?: unknown;
  expiry_date?: unknown;
  archive?: unknown;
};

type RawEnvelope = unknown;

function safeDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapNumber(input: unknown): NewsNumber | null {
  if (!input || typeof input !== "object") return null;

  const row = input as Record<string, unknown>;
  const value = row.value != null ? String(row.value) : "";

  if (!value) return null;

  return {
    value,
    unit: row.unit != null ? String(row.unit) : undefined,
    context: row.context != null ? String(row.context) : undefined,
  };
}

function mapEvent(input: RawEvent): NewsEvent | null {
  const headline = input.headline != null ? String(input.headline).trim() : "";
  if (!headline) return null;

  const documentId =
    input.document_id != null && String(input.document_id).trim()
      ? String(input.document_id).trim()
      : "unknown_document";

  const importanceScore =
    typeof input.importance_score === "number"
      ? input.importance_score
      : input.importance_score != null && input.importance_score !== ""
        ? Number(input.importance_score)
        : undefined;

  return {
    documentId,
    commodity: input.commodity != null ? String(input.commodity) : undefined,
    importanceScore: Number.isFinite(importanceScore) ? importanceScore : undefined,
    eventType: input.event_type != null ? String(input.event_type) : undefined,
    headline,
    impactDirection:
      input.impact_direction != null ? String(input.impact_direction) : undefined,
    regions: Array.isArray(input.regions) ? input.regions.map(String) : [],
    eventDate: input.event_date != null ? String(input.event_date) : undefined,
    numbers: Array.isArray(input.numbers)
      ? input.numbers.map(mapNumber).filter((x): x is NewsNumber => x !== null)
      : [],
    evidenceSummary:
      input.evidence_summary != null ? String(input.evidence_summary) : undefined,
    retentionType:
      input.retention_type != null ? String(input.retention_type) : undefined,
    active: input.active === true,
    expiryDate: input.expiry_date != null ? String(input.expiry_date) : undefined,
    archive: input.archive === true,
  };
}

function parseJson(body: string): RawEnvelope {
  return JSON.parse(body) as unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toRawEventsArray(value: unknown): RawEvent[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((row): row is RawEvent => isObject(row))
    .filter(
      (row) =>
        row.headline != null ||
        row.document_id != null ||
        row.event_type != null ||
        row.importance_score != null
    );
}

function mapRawEvents(events: RawEvent[]): NewsEvent[] {
  return events.map(mapEvent).filter((x): x is NewsEvent => x !== null);
}

function extractEvents(payload: RawEnvelope): NewsEvent[] {
  if (!payload) return [];

  // 1) Direct array of event rows
  const directArrayEvents = toRawEventsArray(payload);
  if (directArrayEvents.length > 0) {
    return mapRawEvents(directArrayEvents);
  }

  // 2) Array of wrapper objects
  if (Array.isArray(payload)) {
    const nestedEvents = payload.flatMap((row) => {
      if (!isObject(row)) return [];

      // Supports [{ output: { message: { events: [...] } } }]
      const output = isObject(row.output) ? row.output : undefined;
      const outputMessage = output && isObject(output.message) ? output.message : undefined;
      const outputEvents = toRawEventsArray(outputMessage?.events);
      if (outputEvents.length > 0) return outputEvents;

      // Supports [{ message: { events: [...] } }]
      const message = isObject(row.message) ? row.message : undefined;
      const messageEvents = toRawEventsArray(message?.events);
      if (messageEvents.length > 0) return messageEvents;

      // Supports [{ events: [...] }]
      return toRawEventsArray(row.events);
    });

    if (nestedEvents.length > 0) {
      return mapRawEvents(nestedEvents);
    }
  }

  // 3) Top-level object: { output: { message: { events: [...] } } }
  if (isObject(payload)) {
    const output = isObject(payload.output) ? payload.output : undefined;
    const outputMessage = output && isObject(output.message) ? output.message : undefined;
    const outputEvents = toRawEventsArray(outputMessage?.events);
    if (outputEvents.length > 0) {
      return mapRawEvents(outputEvents);
    }
  }

  // 4) Top-level object: { message: { events: [...] } }
  if (isObject(payload)) {
    const message = isObject(payload.message) ? payload.message : undefined;
    const messageEvents = toRawEventsArray(message?.events);
    if (messageEvents.length > 0) {
      return mapRawEvents(messageEvents);
    }
  }

  // 5) Top-level object: { events: [...] }
  if (isObject(payload)) {
    const directEvents = toRawEventsArray(payload.events);
    if (directEvents.length > 0) {
      return mapRawEvents(directEvents);
    }
  }

  return [];
}
function stripExt(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function toCandidateJsonPaths(sourcePath: string, commodity: string): string[] {
  const normalized = sourcePath.replace(/\\/g, "/");
  const fileName = normalized.split("/").pop() || "";
  const base = stripExt(fileName);

  return [
    `clean/${commodity}/eventsignals/${base}_events.json`,
    `clean/${commodity}/doc/${base}.json`,
  ];
}

function buildFallbackDocumentId(objectKey: string): string {
  return `doc_${objectKey.replace(/[^\w]+/g, "_").toLowerCase()}`;
}

function isEventActive(event: NewsEvent, now = new Date()): boolean {
  if (event.archive === true) return false;

  const expiry = safeDate(event.expiryDate);
  const isExpired = expiry ? expiry.getTime() < now.getTime() : false;

  if (isExpired) return false;

  return event.active === true;
}

function sortEventsByDateDesc(events: NewsEvent[]): NewsEvent[] {
  return [...events].sort((a, b) => {
    const aTs = safeDate(a.eventDate)?.getTime() ?? 0;
    const bTs = safeDate(b.eventDate)?.getTime() ?? 0;
    return bTs - aTs;
  });
}

function summarize(documentId: string, events: NewsEvent[], now = new Date()): DocumentNewsDetails {
  const activeEvents: NewsEvent[] = [];
  const inactiveEvents: NewsEvent[] = [];

  for (const event of events) {
    if (isEventActive(event, now)) activeEvents.push(event);
    else inactiveEvents.push(event);
  }

  return {
    documentId,
    active: activeEvents.length,
    inactive: inactiveEvents.length,
    total: events.length,
    activeEvents: sortEventsByDateDesc(activeEvents),
    inactiveEvents: sortEventsByDateDesc(inactiveEvents),
  };
}

export class NewsStorageService implements INewsStorageService {
  constructor(private readonly storage: IObjectStorageService) {}

  async getDocumentNewsSummary(input: {
    commodity: string;
    sourcePath: string;
  }): Promise<DocumentNewsSummary> {
    const details = await this.getDocumentNewsDetails(input);

    return {
      documentId: details.documentId,
      active: details.active,
      inactive: details.inactive,
      total: details.total,
    };
  }

  async getDocumentNewsDetails(input: {
    commodity: string;
    sourcePath: string;
  }): Promise<DocumentNewsDetails> {
    const candidates = toCandidateJsonPaths(input.sourcePath, input.commodity);

    for (const objectKey of candidates) {
      try {

        const body = await this.storage.readObjectAsText("active", objectKey);

        const payload = parseJson(body);

        console.log("[news] payload type =", Array.isArray(payload) ? "array" : typeof payload);
        console.log("[news] payload keys =", typeof payload === "object" && payload ? Object.keys(payload as Record<string, unknown>) : []);
        const events = extractEvents(payload);
        console.log("[news] extracted events =", events.length);

        if (!events.length) {
          continue;
        }

        const documentId = events[0]?.documentId ?? buildFallbackDocumentId(objectKey);
        return summarize(documentId, events);
      } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          console.log("[news] sourcePath =", input.sourcePath);
          console.log("[news] commodity  =", input.commodity);
          console.log("[news] candidate failed =", objectKey);
          console.log("[news] error =", message);
      }
    }

    return {
      documentId: buildFallbackDocumentId(candidates[0]),
      active: 0,
      inactive: 0,
      total: 0,
      activeEvents: [],
      inactiveEvents: [],
    };
  }
}