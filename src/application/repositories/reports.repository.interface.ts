import type { ReportBase } from "@/src/entities/models/report-base";

export interface IReportsRepository {
    /**
     * List all report metadata, possibly filtered or paginated.
     */
    listReports(): Promise<ReportBase[]>;
}
