export class ReportNotFoundError extends Error {
    constructor(message: string = "Report not found") {
        super(message);
        this.name = "ReportNotFoundError";
    }
}

export class ReportReadError extends Error {
    constructor(message: string = "Failed to read report") {
        super(message);
        this.name = "ReportReadError";
    }
}
