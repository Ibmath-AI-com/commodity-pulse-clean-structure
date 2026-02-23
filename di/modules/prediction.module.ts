// E:\AI Projects\commodity-clean-structure\di\modules\prediction.module.ts
import { createModule } from "@evyweb/ioctopus";
import { DI_SYMBOLS } from "@/di/types";

import { HttpN8nService } from "@/src/infrastructure/services/n8n.service.http";
// FIX: path must match your actual file
import { HttpGcsService } from "@/src/infrastructure/services/gcs.service.http";

import { N8nPredictionEngineService } from "@/src/infrastructure/services/prediction-engine.service.n8n";
import { GcsUploadListService } from "@/src/infrastructure/services/upload-list.service.gcs";

//import { N8nReportGeneratorService } from "@/src/infrastructure/services/report-generator.service.n8n";

import type { IN8nService } from "@/src/application/services/n8n.service.interface";
// NOTE: keep type import if you want, but it is unused in this module
import type { IGcsService } from "@/src/application/services/gcs.service.interface";

import { FirestorePredictionsRepository } from "@/src/infrastructure/repositories/predictions.repository.firestore";

import { executePredictionUseCase } from "@/src/application/use-cases/prediction/execute-prediction.use-case";
//import { generateReportUseCase } from "@/src/application/use-cases/prediction/generate-report.use-case";
import { getUploadListUseCase } from "@/src/application/use-cases/prediction/get-upload-list.use-case";
import { ensureSignalsUseCase } from "@/src/application/use-cases/prediction/ensure-signals.use-case";

import { runPredictionController } from "@/src/interface-adapters/controllers/prediction/execute-prediction.controller";
//import { generateReportController } from "@/src/interface-adapters/controllers/prediction/generate-report.controller";
import { getUploadListController } from "@/src/interface-adapters/controllers/prediction/get-upload-list.controller";

export function createPredictionModule() {
  const m = createModule();

  // -----------------------
  // Infra: shared clients
  // -----------------------
  m.bind(DI_SYMBOLS.IN8nService).toClass(HttpN8nService);
  m.bind(DI_SYMBOLS.IGcsService).toClass(HttpGcsService);

  // -----------------------
  // Infra: services
  // -----------------------
  // FIX: bind prediction engine ONCE (constructor needs IN8nService)
  m.bind(DI_SYMBOLS.IPredictionEngineService).toHigherOrderFunction(
    (n8n: IN8nService) => new N8nPredictionEngineService(n8n),
    [DI_SYMBOLS.IN8nService]
  );

  m.bind(DI_SYMBOLS.IUploadListService).toHigherOrderFunction(
  (gcs: IGcsService) => new GcsUploadListService(gcs),
  [DI_SYMBOLS.IGcsService]
);

  // m.bind(DI_SYMBOLS.IReportGeneratorService).toClass(N8nReportGeneratorService);
  // m.bind(DI_SYMBOLS.IUploadListService).toClass(N8nUploadListService);

  // -----------------------
  // Infra: repositories
  // -----------------------
  m.bind(DI_SYMBOLS.IPredictionsRepository).toClass(FirestorePredictionsRepository);

  // -----------------------
  // Use-cases
  // -----------------------
  m.bind(DI_SYMBOLS.IExecutePredictionUseCase).toHigherOrderFunction(
    executePredictionUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IPredictionEngineService]
  );

  m.bind(DI_SYMBOLS.IGetUploadListUseCase).toHigherOrderFunction(
    getUploadListUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IUploadListService]
  );

  // m.bind(DI_SYMBOLS.IGetUploadListUseCase).toHigherOrderFunction(
  //   getUploadListUseCase,
  //   [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IUploadListService]
  // );

  // FIX: ensureSignalsUseCase requires 3 deps. If you keep this binding enabled, you MUST provide them.
  // Right now you commented them out, so this binding will fail.
  m.bind(DI_SYMBOLS.IEnsureSignalsUseCase).toHigherOrderFunction(
    ensureSignalsUseCase,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.IGetUploadListUseCase,
      // DI_SYMBOLS.IGenerateReportUseCase,
    ]
  );

  // -----------------------
  // Controllers
  // -----------------------
  m.bind(DI_SYMBOLS.IExecutePredictionController).toHigherOrderFunction(
    runPredictionController,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.ISessionService,
      DI_SYMBOLS.IEnsureSignalsUseCase,
      DI_SYMBOLS.IExecutePredictionUseCase,
      DI_SYMBOLS.IPredictionsRepository,
    ]
  );

  // m.bind(DI_SYMBOLS.IGenerateReportController).toHigherOrderFunction(
  //   generateReportController,
  //   [
  //     DI_SYMBOLS.IInstrumentationService,
  //     DI_SYMBOLS.ISessionService,
  //     DI_SYMBOLS.IGenerateReportUseCase,
  //   ]
  // );

   m.bind(DI_SYMBOLS.IGetUploadListController).toHigherOrderFunction(
     getUploadListController,
     [
       DI_SYMBOLS.IInstrumentationService,
       DI_SYMBOLS.ISessionService,
       DI_SYMBOLS.IGetUploadListUseCase,
     ]
   );

  return m;
}
