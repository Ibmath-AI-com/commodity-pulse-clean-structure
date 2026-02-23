// commodity-clean-structure\app\(protected)\dashboard\page.tsx
import { redirect } from "next/navigation";

import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";
import DashboardMain from "@/app/_components/ui/dashboard/main";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDashboard() {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "dashboard.page > getDashboard", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IGetDashboardController");
        return await controller();
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
}

export default async function DashboardPage() {
  const data = await getDashboard();

  return (
    <DashboardMain
      initialRows={data.rows}
      initialKpis={data.kpis}
      initialInsights={data.insights}
    />
  );
}