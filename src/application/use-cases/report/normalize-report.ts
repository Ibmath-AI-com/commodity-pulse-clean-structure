import type { NormalizedReport, SummarySection } from "@/src/entities/models/normalized-report";

function tryParseJson(v: any) {
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

export function normalizeCleanReport(raw: any): NormalizedReport {
    const out: NormalizedReport = {
        main_theme: "",
        document_summary: [],
        events: [],
    };

    const applyNormalized = (obj: any) => {
        if (!obj || typeof obj !== "object") return;

        if (typeof obj.main_theme === "string") out.main_theme = obj.main_theme.trim();

        const ds = obj.document_summary;
        if (Array.isArray(ds)) {
            out.document_summary = ds
                .map((s: any): SummarySection => ({
                    section_title: String(s?.section_title ?? s?.title ?? "").trim(),
                    content: String(s?.content ?? s?.text ?? "").trim(),
                }))
                .filter((s: SummarySection) => Boolean(s.section_title || s.content));
        }

        const ev = obj.events;
        if (Array.isArray(ev)) out.events = ev;
    };

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        if (Array.isArray((raw as any).json) && (raw as any).json.length) {
            applyNormalized((raw as any).json[0]);
            if (out.main_theme || out.document_summary.length || out.events.length) return out;
        }

        applyNormalized(raw);
        if (out.main_theme || out.document_summary.length || out.events.length) return out;
    }

    if (Array.isArray(raw) && raw.length && raw[0] && typeof raw[0] === "object") {
        if (
            typeof (raw[0] as any).main_theme === "string" ||
            Array.isArray((raw[0] as any).document_summary) ||
            Array.isArray((raw[0] as any).events)
        ) {
            applyNormalized(raw[0]);
            if (out.main_theme || out.document_summary.length || out.events.length) return out;
        }
    }

    let root = raw;
    if (Array.isArray(root) && root.length) root = root[0];

    const steps: any[] | null = Array.isArray(root?.data) ? root.data : null;
    if (!steps) return out;

    for (const step of steps) {
        const rawOut = step?.output;
        const obj1 = tryParseJson(rawOut) ?? rawOut;
        if (!obj1 || typeof obj1 !== "object") continue;

        if (typeof (obj1 as any).main_theme === "string" && (obj1 as any).main_theme.trim()) {
            out.main_theme = (obj1 as any).main_theme.trim();
        }

        const msg = (obj1 as any).message;
        const msgParsed1: any = tryParseJson(msg) ?? msg;
        const msgParsed2: any = tryParseJson(msgParsed1) ?? msgParsed1;

        const ds =
            (obj1 as any).document_summary ??
            msgParsed2?.document_summary ??
            msgParsed1?.document_summary;

        if (Array.isArray(ds) && ds.length) {
            out.document_summary = ds
                .map((s: any): SummarySection => ({
                    section_title: String(s?.section_title ?? s?.title ?? "").trim(),
                    content: String(s?.content ?? s?.text ?? "").trim(),
                }))
                .filter((s: SummarySection) => Boolean(s.section_title || s.content));
        }

        const ev = (obj1 as any).events ?? (obj1 as any)?.message?.events ?? msgParsed2?.events;
        if (Array.isArray(ev) && ev.length) out.events = ev;
    }

    return out;
}
