import type { ICrashReporterService } from "@/src/application/services/crash-reporter.service.interface";

export class NoopCrashReporterService implements ICrashReporterService {
  report(_: unknown): string {
    return "";
  }
}
