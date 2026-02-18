// E:\AI Projects\commodity-clean-structure\di\types.ts
import type { IAuthServerService } from "@/src/application/services/auth-server.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ICrashReporterService } from "@/src/application/services/crash-reporter.service.interface";
import type { IPredictionEngineService } from "@/src/application/services/prediction-engine.service.interface";
import type { IReportGeneratorService } from "@/src/application/services/report-generator.service.interface";
import type { IUploadListService } from "@/src/application/services/upload-list.service.interface";
import type { IN8nService } from "@/src/application/services/n8n.service.interface";
import type { IGcsService } from "@/src/application/services/gcs.service.interface";


import type { IPredictionsRepository } from "@/src/application/repositories/predictions.repository.interface";
import type { IPredictionsDashboardRepository } from "@/src/application/repositories/predictions-dashboard.repository.interface";
import type { IUserProfilesRepository } from "@/src/application/repositories/user-profiles.repository.interface";


import type { ILoginUseCase } from "@/src/application/use-cases/auth/login.use-case";
import type { ILogoutUseCase } from "@/src/application/use-cases/auth/logout.use-case";
import type { IGetDashboardHistoryUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-history.use-case";
import type { IGetDashboardKpisUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-kpis.use-case";
import type { IGetDashboardInsightsUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-insights.use-case";
import type { IExecutePredictionUseCase } from "@/src/application/use-cases/prediction/execute-prediction.use-case";
import type { IGenerateReportUseCase } from "@/src/application/use-cases/prediction/generate-report.use-case";
import type { IGetUploadListUseCase } from "@/src/application/use-cases/prediction/get-upload-list.use-case";
import type { IEnsureSignalsUseCase } from "@/src/application/use-cases/prediction/ensure-signals.use-case";


import type { ILoginController } from "@/src/interface-adapters/controllers/auth/login.controller";
import type { ILogoutController } from "@/src/interface-adapters/controllers/auth/logout.controller";
import type { IGetDashboardController } from "@/src/interface-adapters/controllers/dashboard/get-dashboard.controller";
import type { IRunPredictionController } from "@/src/interface-adapters/controllers/prediction/execute-prediction.controller";
import type { IGenerateReportController } from "@/src/interface-adapters/controllers/prediction/generate-report.controller";
import type { IGetUploadListController } from "@/src/interface-adapters/controllers/prediction/get-upload-list.controller";


export const DI_SYMBOLS = {
  IAuthServerService: Symbol.for("IAuthServerService"),
  ISessionService: Symbol.for("ISessionService"),
  IInstrumentationService: Symbol.for("IInstrumentationService"),
  ICrashReporterService: Symbol.for("ICrashReporterService"),
  IPredictionEngineService: Symbol.for("IPredictionEngineService"),
  IReportGeneratorService: Symbol.for("IReportGeneratorService"),
  IUploadListService: Symbol.for("IUploadListService"),
  IN8nService: Symbol.for("IN8nService"),
  IGcsService: Symbol.for("IGcsService"),


  IUserProfilesRepository: Symbol.for("IUserProfilesRepository"),
  IPredictionsDashboardRepository: Symbol.for("IPredictionsDashboardRepository"),
  IPredictionsRepository: Symbol.for("IPredictionsRepository"),



  // Use-Cases
  ILoginUseCase: Symbol.for("ILoginUseCase"),
  ILogoutUseCase: Symbol.for("ILogoutUseCase"),
  
  IGetDashboardHistoryUseCase: Symbol.for("IGetDashboardHistoryUseCase"),
  IGetDashboardKpisUseCase: Symbol.for("IGetDashboardKpisUseCase"),
  IGetDashboardInsightsUseCase: Symbol.for("IGetDashboardInsightsUseCase"),

  IExecutePredictionUseCase: Symbol.for("IExecutePredictionUseCase"),
  IGenerateReportUseCase: Symbol.for("IGenerateReportUseCase"),
  IGetUploadListUseCase: Symbol.for("IGetUploadListUseCase"),
  IEnsureSignalsUseCase: Symbol.for("IEnsureSignalsUseCase"),

  // Controllers
  ILoginController: Symbol.for("ILoginController"),
  ILogoutController: Symbol.for("ILogoutController"),
  IGetDashboardController: Symbol.for("IGetDashboardController"),
  IExecutePredictionController: Symbol.for("IExecutePredictionController"),
  IGenerateReportController: Symbol.for("IGenerateReportController"),
  IGetUploadListController: Symbol.for("IGetUploadListController"),
} as const;

export interface DI_RETURN_TYPES {
  IAuthServerService: IAuthServerService;
  ISessionService: ISessionService;
  IInstrumentationService: IInstrumentationService;
  ICrashReporterService: ICrashReporterService;

  IPredictionEngineService: IPredictionEngineService;
  IReportGeneratorService: IReportGeneratorService;
  IUploadListService: IUploadListService;
  IN8nService: IN8nService;
  IGcsService: IGcsService;


  IPredictionsRepository: IPredictionsRepository;
  IUserProfilesRepository: IUserProfilesRepository;
  IPredictionsDashboardRepository: IPredictionsDashboardRepository;

  ILoginUseCase: ILoginUseCase;
  ILogoutUseCase: ILogoutUseCase;
  IGetDashboardHistoryUseCase: IGetDashboardHistoryUseCase;
  IGetDashboardKpisUseCase: IGetDashboardKpisUseCase;
  IGetDashboardInsightsUseCase: IGetDashboardInsightsUseCase;

  IExecutePredictionUseCase: IExecutePredictionUseCase;
  IGenerateReportUseCase: IGenerateReportUseCase;
  IGetUploadListUseCase: IGetUploadListUseCase;
  IEnsureSignalsUseCase: IEnsureSignalsUseCase;

  ILoginController: ILoginController;
  ILogoutController: ILogoutController;
  IGetDashboardController: IGetDashboardController;
  IExecutePredictionController: IRunPredictionController;
  IGenerateReportController: IGenerateReportController;
  IGetUploadListController: IGetUploadListController;
}
