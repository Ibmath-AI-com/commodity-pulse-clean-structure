export type SummarySection = {
  sectionTitle: string;
  content: string;
};

export type ReportNumber = {
  value: string;
  unit: string;
  context: string;
};

export type ReportEvent = {
  headline: string;
  eventType: string;
  impactDirection: string;
  eventDate: string;
  importanceScore: number | null;
  evidenceSummary: string;
  regions: string[];
  numbers: ReportNumber[];
};

export type ReportViewModel = {
  mainTheme: string;
  documentSummary: SummarySection[];
  events: ReportEvent[];
  hasStructure: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function tryParseJson(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;

  const s = value.trim();
  if (!s) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return null;

    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => String(x));
}

function mapSummarySections(value: unknown): SummarySection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): SummarySection => {
      const obj = isRecord(item) ? item : {};
      return {
        sectionTitle: asTrimmedString(obj.section_title ?? obj.title),
        content: asTrimmedString(obj.content ?? obj.text),
      };
    })
    .filter((section) => Boolean(section.sectionTitle || section.content));
}

function mapReportNumbers(value: unknown): ReportNumber[] {
  if (!Array.isArray(value)) return [];

  return value.map((item): ReportNumber => {
    const obj = isRecord(item) ? item : {};
    return {
      value: String(obj.value ?? ""),
      unit: String(obj.unit ?? ""),
      context: String(obj.context ?? ""),
    };
  });
}

function mapReportEvents(value: unknown): ReportEvent[] {
  if (!Array.isArray(value)) return [];

  return value.map((item): ReportEvent => {
    const obj = isRecord(item) ? item : {};

    return {
      headline: asTrimmedString(obj.headline),
      eventType: asTrimmedString(obj.event_type),
      impactDirection: asTrimmedString(obj.impact_direction),
      eventDate: asTrimmedString(obj.event_date),
      importanceScore: asNullableNumber(obj.importance_score),
      evidenceSummary: asTrimmedString(obj.evidence_summary ?? obj.summary),
      regions: asStringArray(obj.regions),
      numbers: mapReportNumbers(obj.numbers),
    };
  });
}

function extractEventsFromMessageLike(value: unknown): unknown {
  if (!isRecord(value)) return undefined;
  if (Array.isArray(value.events)) return value.events;

  const nestedMessage = tryParseJson(value.message) ?? value.message;
  if (isRecord(nestedMessage) && Array.isArray(nestedMessage.events)) {
    return nestedMessage.events;
  }

  return undefined;
}

function applyNormalized(
  out: ReportViewModel,
  value: unknown
): void {
  if (!isRecord(value)) return;

  if (typeof value.main_theme === "string" && value.main_theme.trim()) {
    out.mainTheme = value.main_theme.trim();
  }

  const summary = mapSummarySections(value.document_summary);
  if (summary.length) {
    out.documentSummary = summary;
  }

  const events = mapReportEvents(value.events);
  if (events.length) {
    out.events = events;
  }
}

export function normalizeReportToViewModel(raw: unknown): ReportViewModel {
  const out: ReportViewModel = {
    mainTheme: "",
    documentSummary: [],
    events: [],
    hasStructure: false,
  };

  if (isRecord(raw)) {
    const jsonValue = raw.json;
    if (Array.isArray(jsonValue) && jsonValue.length > 0) {
      applyNormalized(out, jsonValue[0]);
    } else {
      applyNormalized(out, raw);
    }
  }

  if (!out.mainTheme && !out.documentSummary.length && !out.events.length && Array.isArray(raw) && raw.length > 0) {
    applyNormalized(out, raw[0]);
  }

  if (!out.mainTheme && !out.documentSummary.length && !out.events.length) {
    let root: unknown = raw;

    if (Array.isArray(root) && root.length > 0) {
      root = root[0];
    }

    if (isRecord(root) && Array.isArray(root.data)) {
      for (const step of root.data) {
        if (!isRecord(step)) continue;

        const rawOutput = step.output;
        const obj1 = tryParseJson(rawOutput) ?? rawOutput;
        if (!isRecord(obj1)) continue;

        if (typeof obj1.main_theme === "string" && obj1.main_theme.trim()) {
          out.mainTheme = obj1.main_theme.trim();
        }

        const rawMessage = obj1.message;
        const msgParsed1 = tryParseJson(rawMessage) ?? rawMessage;
        const msgParsed2 = tryParseJson(msgParsed1) ?? msgParsed1;

        const summarySource =
          obj1.document_summary ??
          (isRecord(msgParsed2) ? msgParsed2.document_summary : undefined) ??
          (isRecord(msgParsed1) ? msgParsed1.document_summary : undefined);

        const summary = mapSummarySections(summarySource);
        if (summary.length) {
          out.documentSummary = summary;
        }

        const eventsSource =
          obj1.events ??
          extractEventsFromMessageLike(obj1.message) ??
          (isRecord(msgParsed2) ? msgParsed2.events : undefined);

        const events = mapReportEvents(eventsSource);
        if (events.length) {
          out.events = events;
        }
      }
    }
  }

  out.hasStructure =
    Boolean(out.mainTheme) ||
    out.documentSummary.length > 0 ||
    out.events.length > 0;

  return out;
}