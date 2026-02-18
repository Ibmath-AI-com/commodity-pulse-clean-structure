import type { ICrashReporterService } from "@/src/application/services/crash-reporter.service.interface";

export class NoopCrashReporterService implements ICrashReporterService {
  report(_error: unknown): string {
    return "";
  }
}
