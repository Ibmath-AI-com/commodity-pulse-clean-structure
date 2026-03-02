"use server";

import { getInjection } from "@/di/container";
import { DI_SYMBOLS } from "@/di/types";

export async function getReportsAction() {
    try {
        const controller = getInjection("IReportsController");
        const items = await controller.listReports();
        return { ok: true, items };
    } catch (error: any) {
        return { ok: false, error: error.message || "Failed to list reports" };
    }
}

export async function getSignedUrlAction(objectName: string) {
    try {
        const controller = getInjection("IReportsController");
        const url = await controller.getReportUrl(objectName);
        return { ok: true, url };
    } catch (error: any) {
        return { ok: false, error: error.message || "Failed to generate signed URL" };
    }
}

export async function readReportAction(objectName: string) {
    try {
        const controller = getInjection("IReportsController");
        const data = await controller.readReport(objectName);
        return { ok: true, ...data }; // { kind, json, text }
    } catch (error: any) {
        return { ok: false, error: error.message || "Failed to read report" };
    }
}
