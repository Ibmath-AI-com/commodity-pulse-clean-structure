export type InstrumentOpts = { recordResponse?: boolean };

export interface IInstrumentationService {
  startSpan<T>(
    span: { name: string; op?: string; attributes?: Record<string, unknown> },
    fn: () => Promise<T> | T
  ): Promise<T> | T;

  instrumentServerAction<T>(
    name: string,
    opts: InstrumentOpts,
    fn: () => Promise<T>
  ): Promise<T>;
}
