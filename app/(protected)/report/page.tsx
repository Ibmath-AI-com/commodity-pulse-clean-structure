import { redirect } from "next/navigation";
import { getInjection } from "@/di/container";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

import ReportMain from "@/app/_components/ui/report/main";

export default async function ReportPage() {
    const instrumentation = getInjection("IInstrumentationService");

    await instrumentation.startSpan(
        { name: "report.page > guard", op: "function.nextjs" },
        async () => {
            try {
                const session = getInjection("ISessionService");
                void session; // If the impl inherently checks cookies, or depends on actions
            } catch (err) {
                if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
                    redirect("/sign-in");
                }
                const crash = getInjection("ICrashReporterService");
                crash.report(err);
                throw err;
            }
        }
    );

    return <ReportMain />;
}
