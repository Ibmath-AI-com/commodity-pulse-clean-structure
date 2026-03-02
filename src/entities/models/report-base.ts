export type Source = "incoming" | "archive";

export type ReportBase = {
    id: string;
    createdAt: string; // ISO string
    commodity: string;
    region: string; // "-" if none
    fileName: string;

    source: Source;
    active: boolean;

    objectName: string;      // incoming/... or archive/...
    cleanObjectName: string; // clean/.../<base>.json
    hasClean: boolean;
};
