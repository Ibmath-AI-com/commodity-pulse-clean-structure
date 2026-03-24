// FILE: di/types.ts
import type { Pool } from "pg";

import type { IAuthServerService } from "@/src/application/services/auth-server.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ICrashReporterService } from "@/src/application/services/crash-reporter.service.interface";
import type { IPredictionEngineService } from "@/src/application/services/prediction-engine.service.interface";
import type { IReportGeneratorService } from "@/src/application/services/report-generator.service.interface";
import type { IUploadListService } from "@/src/application/services/upload-list.service.interface";
import type { IN8nService } from "@/src/application/services/n8n.service.interface";
import type { IObjectStorageService } from "@/src/application/services/storage.service.interface";
import type { IUploadPageService } from "@/src/application/services/upload.service.interface";
import type { IReportReaderService } from "@/src/application/services/report-reader.service.interface";
import type { INewsStorageService } from "@/src/application/services/news-storage.service.interface";
import type { IPasswordHasher } from "@/src/application/services/password-hasher.service.interface";
import type { ITokenService } from "@/src/application/services/token-service.interface";

import type { IPredictionsRepository } from "@/src/application/repositories/predictions.repository.interface";
import type { IPredictionsDashboardRepository } from "@/src/application/repositories/predictions-dashboard.repository.interface";
import type { IUserProfilesRepository } from "@/src/application/repositories/user-profiles.repository.interface";
import type { IUserRepository } from "@/src/application/repositories/user.repository.interface";
import type { ISessionRepository } from "@/src/application/repositories/session.repository.interface";
import type { IDocumentGenerationStatusRepository } from "@/src/application/repositories/document-generation-status.repository.interface";

import type { ILoginUseCase } from "@/src/application/use-cases/auth/login.use-case";
import type { ILogoutUseCase } from "@/src/application/use-cases/auth/logout.use-case";
import type { IGetCurrentUserUseCase } from "@/src/application/use-cases/auth/get-current-user.use-case";
import type { IGetDashboardHistoryUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-history.use-case";
import type { IGetDashboardKpisUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-kpis.use-case";
import type { IGetDashboardInsightsUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-insights.use-case";
import type { IExecutePredictionUseCase } from "@/src/application/use-cases/prediction/execute-prediction.use-case";
import type { IGenerateReportUseCase } from "@/src/application/use-cases/prediction/generate-report.use-case";
import type { IGetUploadListUseCase } from "@/src/application/use-cases/prediction/get-upload-list.use-case";
import type { IInitUploadUseCase } from "@/src/application/use-cases/upload/init-upload.use-case";
import type { IListUploadsUseCase } from "@/src/application/use-cases/upload/list-uploads.use-case";
import type { IDeleteUploadsUseCase } from "@/src/application/use-cases/upload/delete-uploads.use-case";
import type { IArchiveUploadsUseCase } from "@/src/application/use-cases/upload/archive-uploads.use-case";
import type { IGetUploadNewsDetailsUseCase } from "@/src/application/use-cases/upload/get-upload-news-details.use-case";
import type { IReadReportUseCase } from "@/src/application/use-cases/report/read-report.use-case";
import type { IGetDashboardChartUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-chart.use-case";
import type { ICheckDocumentGenerationStatusUseCase } from "@/src/application/use-cases/prediction/check-document-generation-status.use-case";
import type { ILoginController } from "@/src/interface-adapters/controllers/auth/login.controller";
import type { ILogoutController } from "@/src/interface-adapters/controllers/auth/logout.controller";
import type { IGetDashboardController } from "@/src/interface-adapters/controllers/dashboard/get-dashboard.controller";
import type { IRunPredictionController } from "@/src/interface-adapters/controllers/prediction/execute-prediction.controller";
import type { IGenerateReportController } from "@/src/interface-adapters/controllers/prediction/generate-report.controller";
import type { IGetUploadListController } from "@/src/interface-adapters/controllers/prediction/get-upload-list.controller";
import type { IInitUploadController } from "@/src/interface-adapters/controllers/upload/init-upload.controller";
import type { IListUploadsController } from "@/src/interface-adapters/controllers/upload/list-uploads.controller";
import type { IDeleteUploadsController } from "@/src/interface-adapters/controllers/upload/delete-uploads.controller";
import type { IArchiveUploadsController } from "@/src/interface-adapters/controllers/upload/archive-uploads.controller";
import type { IGetUploadNewsDetailsController } from "@/src/interface-adapters/controllers/upload/get-upload-news-details.controller";
import type { IReadReportController } from "@/src/interface-adapters/controllers/report/read-report.controller";


export const DI_SYMBOLS = {
  // legacy / existing services
  IAuthServerService: Symbol.for("IAuthServerService"),
  ISessionService: Symbol.for("ISessionService"),
  IInstrumentationService: Symbol.for("IInstrumentationService"),
  ICrashReporterService: Symbol.for("ICrashReporterService"),
  IPredictionEngineService: Symbol.for("IPredictionEngineService"),
  IReportGeneratorService: Symbol.for("IReportGeneratorService"),
  IUploadListService: Symbol.for("IUploadListService"),
  IN8nService: Symbol.for("IN8nService"),
  IObjectStorageService: Symbol.for("IObjectStorageService"),
  IUploadPageService: Symbol.for("IUploadPageService"),
  IReportReaderService: Symbol.for("IReportReaderService"),
  INewsStorageService: Symbol.for("INewsStorageService"),

  // existing repositories
  IUserProfilesRepository: Symbol.for("IUserProfilesRepository"),
  IPredictionsDashboardRepository: Symbol.for("IPredictionsDashboardRepository"),
  IPredictionsRepository: Symbol.for("IPredictionsRepository"),

  // new postgres auth
  IPostgresPool: Symbol.for("IPostgresPool"),
  IUserRepository: Symbol.for("IUserRepository"),
  ISessionRepository: Symbol.for("ISessionRepository"),
  IPasswordHasher: Symbol.for("IPasswordHasher"),
  ITokenService: Symbol.for("ITokenService"),

  IDocumentGenerationStatusRepository: Symbol.for("IDocumentGenerationStatusRepository"),

  // auth use-cases
  ILoginUseCase: Symbol.for("ILoginUseCase"),
  ILogoutUseCase: Symbol.for("ILogoutUseCase"),
  IGetCurrentUserUseCase: Symbol.for("IGetCurrentUserUseCase"),


  // dashboard use-cases
  IGetDashboardHistoryUseCase: Symbol.for("IGetDashboardHistoryUseCase"),
  IGetDashboardKpisUseCase: Symbol.for("IGetDashboardKpisUseCase"),
  IGetDashboardInsightsUseCase: Symbol.for("IGetDashboardInsightsUseCase"),
  IGetDashboardChartUseCase: Symbol.for("IGetDashboardChartUseCase"),

  // prediction use-cases
  IExecutePredictionUseCase: Symbol.for("IExecutePredictionUseCase"),
  IGenerateReportUseCase: Symbol.for("IGenerateReportUseCase"),
  IGetUploadListUseCase: Symbol.for("IGetUploadListUseCase"),

  
  ICheckDocumentGenerationStatusUseCase: Symbol.for("ICheckDocumentGenerationStatusUseCase"),

  // upload use-cases
  IInitUploadUseCase: Symbol.for("IInitUploadUseCase"),
  IListUploadsUseCase: Symbol.for("IListUploadsUseCase"),
  IDeleteUploadsUseCase: Symbol.for("IDeleteUploadsUseCase"),
  IArchiveUploadsUseCase: Symbol.for("IArchiveUploadsUseCase"),
  IGetUploadNewsDetailsUseCase: Symbol.for("IGetUploadNewsDetailsUseCase"),

  // report use-cases
  IReadReportUseCase: Symbol.for("IReadReportUseCase"),

  // controllers
  ILoginController: Symbol.for("ILoginController"),
  ILogoutController: Symbol.for("ILogoutController"),
  IGetDashboardController: Symbol.for("IGetDashboardController"),
  IExecutePredictionController: Symbol.for("IExecutePredictionController"),
  IGenerateReportController: Symbol.for("IGenerateReportController"),
  IGetUploadListController: Symbol.for("IGetUploadListController"),
  IInitUploadController: Symbol.for("IInitUploadController"),
  IListUploadsController: Symbol.for("IListUploadsController"),
  IDeleteUploadsController: Symbol.for("IDeleteUploadsController"),
  IArchiveUploadsController: Symbol.for("IArchiveUploadsController"),
  IGetUploadNewsDetailsController: Symbol.for("IGetUploadNewsDetailsController"),
  IReadReportController: Symbol.for("IReadReportController"),

} as const;

export interface DI_RETURN_TYPES {
  // legacy / existing services
  IAuthServerService: IAuthServerService;
  ISessionService: ISessionService;
  IInstrumentationService: IInstrumentationService;
  ICrashReporterService: ICrashReporterService;
  IPredictionEngineService: IPredictionEngineService;
  IReportGeneratorService: IReportGeneratorService;
  IUploadListService: IUploadListService;
  IN8nService: IN8nService;
  IObjectStorageService: IObjectStorageService;
  IUploadPageService: IUploadPageService;
  IReportReaderService: IReportReaderService;
  INewsStorageService: INewsStorageService;

  // existing repositories
  IPredictionsRepository: IPredictionsRepository;
  IUserProfilesRepository: IUserProfilesRepository;
  IPredictionsDashboardRepository: IPredictionsDashboardRepository;

  IDocumentGenerationStatusRepository: IDocumentGenerationStatusRepository;

  // new postgres auth
  IPostgresPool: Pool;
  IUserRepository: IUserRepository;
  ISessionRepository: ISessionRepository;
  IPasswordHasher: IPasswordHasher;
  ITokenService: ITokenService;

  // auth use-cases
  ILoginUseCase: ILoginUseCase;
  ILogoutUseCase: ILogoutUseCase;
  IGetCurrentUserUseCase: IGetCurrentUserUseCase;


  // dashboard use-cases
  IGetDashboardHistoryUseCase: IGetDashboardHistoryUseCase;
  IGetDashboardKpisUseCase: IGetDashboardKpisUseCase;
  IGetDashboardInsightsUseCase: IGetDashboardInsightsUseCase;
  IGetDashboardChartUseCase: IGetDashboardChartUseCase;

  // prediction use-cases
  ICheckDocumentGenerationStatusUseCase: ICheckDocumentGenerationStatusUseCase;

  // upload use-cases
  IInitUploadUseCase: IInitUploadUseCase;
  IListUploadsUseCase: IListUploadsUseCase;
  IDeleteUploadsUseCase: IDeleteUploadsUseCase;
  IArchiveUploadsUseCase: IArchiveUploadsUseCase;
  IGetUploadNewsDetailsUseCase: IGetUploadNewsDetailsUseCase;

  // prediction use-cases
  IExecutePredictionUseCase: IExecutePredictionUseCase;
  IGenerateReportUseCase: IGenerateReportUseCase;
  IGetUploadListUseCase: IGetUploadListUseCase;

  // report use-cases
  IReadReportUseCase: IReadReportUseCase;

  // controllers
  ILoginController: ILoginController;
  ILogoutController: ILogoutController;
  IGetDashboardController: IGetDashboardController;
  IExecutePredictionController: IRunPredictionController;
  IGenerateReportController: IGenerateReportController;
  IGetUploadListController: IGetUploadListController;
  IInitUploadController: IInitUploadController;
  IListUploadsController: IListUploadsController;
  IDeleteUploadsController: IDeleteUploadsController;
  IArchiveUploadsController: IArchiveUploadsController;
  IGetUploadNewsDetailsController: IGetUploadNewsDetailsController;
  IReadReportController: IReadReportController;
}