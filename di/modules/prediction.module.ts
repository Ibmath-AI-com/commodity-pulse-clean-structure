// E:\AI Projects\commodity-clean-structure\di\modules\prediction.module.ts
import { createModule } from "@evyweb/ioctopus";
import { DI_SYMBOLS } from "@/di/types";
import type { Pool } from "pg";

import { HttpN8nService } from "@/src/infrastructure/services/n8n.service.http";
import { OSUploadPageService } from "@/src/infrastructure/services/upload-page.service.os";

import { N8nPredictionEngineService } from "@/src/infrastructure/services/prediction-engine.service.n8n";

import type { IN8nService } from "@/src/application/services/n8n.service.interface";

import type { IObjectStorageService } from "@/src/application/services/storage.service.interface";
import { S3StorageService } from "@/src/infrastructure/services/s3.service";

//import { FirestorePredictionsRepository } from "@/src/infrastructure/repositories/predictions.repository.firestore";
import { PostgresPredictionsRepository } from "@/src/infrastructure/repositories/postgres-predictions.repository";

import { executePredictionUseCase } from "@/src/application/use-cases/prediction/execute-prediction.use-case";
import { getUploadListUseCase } from "@/src/application/use-cases/prediction/get-upload-list.use-case";

import { runPredictionController } from "@/src/interface-adapters/controllers/prediction/execute-prediction.controller";
import { getUploadListController } from "@/src/interface-adapters/controllers/prediction/get-upload-list.controller";

import { PostgresDocumentGenerationStatusRepository } from "@/src/infrastructure/repositories/postgres-document-generation-status.repository";
import { checkDocumentGenerationStatusUseCase } from "@/src/application/use-cases/prediction/check-document-generation-status.use-case";

export function createPredictionModule() {
  const m = createModule();

  // -----------------------
  // Repositories
  // -----------------------
  m.bind(DI_SYMBOLS.IPredictionsRepository).toHigherOrderFunction(
    (pool: Pool) => new PostgresPredictionsRepository(pool),
    [DI_SYMBOLS.IPostgresPool]
  );

  m.bind(DI_SYMBOLS.IDocumentGenerationStatusRepository).toHigherOrderFunction(
    (pool: Pool) => new PostgresDocumentGenerationStatusRepository(pool),
    [DI_SYMBOLS.IPostgresPool]
  );

  // -----------------------
  // Infra
  // -----------------------
  m.bind(DI_SYMBOLS.IN8nService).toClass(HttpN8nService);
  m.bind(DI_SYMBOLS.IObjectStorageService).toClass(S3StorageService);

  m.bind(DI_SYMBOLS.IPredictionEngineService).toHigherOrderFunction(
    (n8n: IN8nService) => new N8nPredictionEngineService(n8n),
    [DI_SYMBOLS.IN8nService]
  );

  m.bind(DI_SYMBOLS.IUploadListService).toHigherOrderFunction(
    (ost: IObjectStorageService) => new OSUploadPageService(ost),
    [DI_SYMBOLS.IObjectStorageService]
  );

  // -----------------------
  // Use cases
  // -----------------------
  m.bind(DI_SYMBOLS.ICheckDocumentGenerationStatusUseCase).toHigherOrderFunction(
    checkDocumentGenerationStatusUseCase,
    [DI_SYMBOLS.IDocumentGenerationStatusRepository]
  );

  m.bind(DI_SYMBOLS.IExecutePredictionUseCase).toHigherOrderFunction(
    executePredictionUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IPredictionEngineService]
  );

  m.bind(DI_SYMBOLS.IGetUploadListUseCase).toHigherOrderFunction(
    getUploadListUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IUploadListService]
  );


  m.bind(DI_SYMBOLS.IExecutePredictionController).toHigherOrderFunction(
    runPredictionController,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.ISessionService,
      DI_SYMBOLS.IGetCurrentUserUseCase,
      DI_SYMBOLS.ICheckDocumentGenerationStatusUseCase,
      DI_SYMBOLS.IExecutePredictionUseCase,
      DI_SYMBOLS.IPredictionsRepository,
    ]
  );

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