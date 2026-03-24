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

function tryParseJson(v: unknown): any {
  if (v == null) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return null;

  const s = v.trim();
  if (!s) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function normalizeReportToViewModel(raw: unknown): ReportViewModel {
  const out: ReportViewModel = {
    mainTheme: "",
    documentSummary: [],
    events: [],
    hasStructure: false,
  };

  const applyNormalized = (obj: any) => {
    if (!obj || typeof obj !== "object") return;

    if (typeof obj.main_theme === "string") {
      out.mainTheme = obj.main_theme.trim();
    }

    if (Array.isArray(obj.document_summary)) {
      out.documentSummary = obj.document_summary
        .map((s: any) => ({
          sectionTitle: String(s?.section_title ?? s?.title ?? "").trim(),
          content: String(s?.content ?? s?.text ?? "").trim(),
        }))
        .filter((s: SummarySection) => Boolean(s.sectionTitle || s.content));
    }

    if (Array.isArray(obj.events)) {
      out.events = obj.events.map((e: any): ReportEvent => ({
        headline: String(e?.headline ?? "").trim(),
        eventType: String(e?.event_type ?? "").trim(),
        impactDirection: String(e?.impact_direction ?? "").trim(),
        eventDate: String(e?.event_date ?? "").trim(),
        importanceScore:
          typeof e?.importance_score === "number"
            ? e.importance_score
            : typeof e?.importance_score === "string" && e.importance_score.trim() !== ""
            ? Number(e.importance_score)
            : null,
        evidenceSummary: String(e?.evidence_summary ?? e?.summary ?? "").trim(),
        regions: Array.isArray(e?.regions) ? e.regions.map((x: any) => String(x)) : [],
        numbers: Array.isArray(e?.numbers)
          ? e.numbers.map((n: any) => ({
              value: String(n?.value ?? ""),
              unit: String(n?.unit ?? ""),
              context: String(n?.context ?? ""),
            }))
          : [],
      }));
    }
  };

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    if (Array.isArray((raw as any).json) && (raw as any).json.length) {
      applyNormalized((raw as any).json[0]);
    } else {
      applyNormalized(raw);
    }
  }

  if (!out.mainTheme && !out.documentSummary.length && !out.events.length && Array.isArray(raw) && raw.length) {
    const first = raw[0] as any;
    if (first && typeof first === "object") {
      applyNormalized(first);
    }
  }

  if (!out.mainTheme && !out.documentSummary.length && !out.events.length) {
    let root: any = raw;
    if (Array.isArray(root) && root.length) root = root[0];

    const steps = Array.isArray(root?.data) ? root.data : null;
    if (steps) {
      for (const step of steps) {
        const rawOut = step?.output;
        const obj1 = tryParseJson(rawOut) ?? rawOut;
        if (!obj1 || typeof obj1 !== "object") continue;

        if (typeof obj1.main_theme === "string" && obj1.main_theme.trim()) {
          out.mainTheme = obj1.main_theme.trim();
        }

        const msg = obj1.message;
        const msgParsed1 = tryParseJson(msg) ?? msg;
        const msgParsed2 = tryParseJson(msgParsed1) ?? msgParsed1;

        const ds = obj1.document_summary ?? msgParsed2?.document_summary ?? msgParsed1?.document_summary;
        if (Array.isArray(ds) && ds.length) {
          out.documentSummary = ds
            .map((s: any) => ({
              sectionTitle: String(s?.section_title ?? s?.title ?? "").trim(),
              content: String(s?.content ?? s?.text ?? "").trim(),
            }))
            .filter((s: SummarySection) => Boolean(s.sectionTitle || s.content));
        }

        const ev = obj1.events ?? obj1?.message?.events ?? msgParsed2?.events;
        if (Array.isArray(ev) && ev.length) {
          out.events = ev.map((e: any): ReportEvent => ({
            headline: String(e?.headline ?? "").trim(),
            eventType: String(e?.event_type ?? "").trim(),
            impactDirection: String(e?.impact_direction ?? "").trim(),
            eventDate: String(e?.event_date ?? "").trim(),
            importanceScore:
              typeof e?.importance_score === "number"
                ? e.importance_score
                : typeof e?.importance_score === "string" && e.importance_score.trim() !== ""
                ? Number(e.importance_score)
                : null,
            evidenceSummary: String(e?.evidence_summary ?? e?.summary ?? "").trim(),
            regions: Array.isArray(e?.regions) ? e.regions.map((x: any) => String(x)) : [],
            numbers: Array.isArray(e?.numbers)
              ? e.numbers.map((n: any) => ({
                  value: String(n?.value ?? ""),
                  unit: String(n?.unit ?? ""),
                  context: String(n?.context ?? ""),
                }))
              : [],
          }));
        }
      }
    }
  }

  out.hasStructure = Boolean(out.mainTheme) || out.documentSummary.length > 0 || out.events.length > 0;
  return out;
}