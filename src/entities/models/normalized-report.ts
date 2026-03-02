export type SummarySection = {
    section_title: string;
    content: string;
};

export type NormalizedReport = {
    main_theme: string;
    document_summary: SummarySection[];
    events: any[]; // The events can take many shapes in the raw data
};
