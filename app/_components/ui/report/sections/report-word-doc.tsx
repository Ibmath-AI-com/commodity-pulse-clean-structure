type SummarySection = { sectionTitle: string; content: string };

type ReportNumber = {
  value: string;
  unit: string;
  context: string;
};

type ReportEvent = {
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

function baseName(path?: string) {
  if (!path) return "";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function toTitleCase(s: string) {
  const x = String(s ?? "").trim();
  if (!x) return "";
  return x.charAt(0).toUpperCase() + x.slice(1);
}

function metaSeparator(items: Array<string | null | undefined>) {
  return items.filter(Boolean).join(" • ");
}

export function ReportWordDoc({
  model,
  title,
  objectName,
}: {
  model: ReportViewModel;
  title: string;
  objectName: string;
}) {
  return (
    <div className="word-doc">
      <div className="doc-hero">
        <div className="eyebrow">Cali Commodity</div>
        <h1>{title || "Commodity Pulse Report"}</h1>
        <div className="subtitle">
          {metaSeparator([baseName(objectName), model.hasStructure ? "Structured report" : "Raw report"])}
        </div>
      </div>
      <div className="rule" />

      {model.mainTheme ? (
        <>
          <h2>Main theme</h2>
          <p>{model.mainTheme}</p>
        </>
      ) : null}

      {model.documentSummary.length > 0 ? (
        <>
          <h2>Document summary</h2>
          {model.documentSummary.map((s, idx) => (
            <div key={idx}>
              <h3>{s.sectionTitle?.trim() ? s.sectionTitle.trim() : `Section ${idx + 1}`}</h3>
              <p>{s.content}</p>
            </div>
          ))}
        </>
      ) : null}

      {model.events.length > 0 ? (
        <>
          <h2>Key events</h2>
          {model.events.map((e, idx) => {
            const meta = metaSeparator([
              e.eventType ? toTitleCase(e.eventType) : null,
              e.impactDirection ? toTitleCase(e.impactDirection) : null,
              e.eventDate || null,
              e.importanceScore != null ? `Score ${e.importanceScore.toFixed(2)}` : null,
              e.regions.length ? `Regions: ${e.regions.join(", ")}` : null,
            ]);

            return (
              <div key={idx} className="event">
                <div className="event-title">{e.headline || `Event ${idx + 1}`}</div>
                {meta ? <div className="event-meta">{meta}</div> : null}
                {e.evidenceSummary ? <p>{e.evidenceSummary}</p> : null}

                {e.numbers.length ? (
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: "22%" }}>Value</th>
                        <th style={{ width: "18%" }}>Unit</th>
                        <th>Context</th>
                      </tr>
                    </thead>
                    <tbody>
                      {e.numbers.map((n, j) => (
                        <tr key={j}>
                          <td>{n.value}</td>
                          <td>{n.unit}</td>
                          <td>{n.context}</td>
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

      {!model.hasStructure ? (
        <>
          <h2>Note</h2>
          <p>
            The report JSON did not match the expected structured schema. Adjust the normalizer if your n8n output shape
            changes.
          </p>
        </>
      ) : null}
    </div>
  );
}
