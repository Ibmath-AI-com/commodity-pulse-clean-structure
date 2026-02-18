import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";

export class NoopInstrumentationService implements IInstrumentationService {
  startSpan<T>(
    _span: { name: string; op?: string; attributes?: Record<string, unknown> },
    fn: () => Promise<T> | T
  ): Promise<T> | T {
    return fn();
  }

  async instrumentServerAction<T>(
    _name: string,
    _opts: { recordResponse?: boolean },
    fn: () => Promise<T>
  ): Promise<T> {
    return await fn();
  }
}
