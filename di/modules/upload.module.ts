// FILE: di/modules/upload.module.ts
import { createModule } from "@evyweb/ioctopus";
import { DI_SYMBOLS } from "@/di/types";

import { S3StorageService } from "@/src/infrastructure/services/s3.service";
import { NewsStorageService } from "@/src/infrastructure/services/news-storage.service";

import type { IObjectStorageService } from "@/src/application/services/storage.service.interface";
import type { INewsStorageService } from "@/src/application/services/news-storage.service.interface";
import { OSUploadPageService } from "@/src/infrastructure/services/upload-page.service.os";

import { initUploadUseCase } from "@/src/application/use-cases/upload/init-upload.use-case";
import { listUploadsUseCase } from "@/src/application/use-cases/upload/list-uploads.use-case";
import { deleteUploadsUseCase } from "@/src/application/use-cases/upload/delete-uploads.use-case";
import { archiveUploadsUseCase } from "@/src/application/use-cases/upload/archive-uploads.use-case";
import { GetUploadNewsDetailsUseCase } from "@/src/application/use-cases/upload/get-upload-news-details.use-case";

import { initUploadController } from "@/src/interface-adapters/controllers/upload/init-upload.controller";
import { listUploadsController } from "@/src/interface-adapters/controllers/upload/list-uploads.controller";
import { deleteUploadsController } from "@/src/interface-adapters/controllers/upload/delete-uploads.controller";
import { archiveUploadsController } from "@/src/interface-adapters/controllers/upload/archive-uploads.controller";
import { getUploadNewsDetailsController } from "@/src/interface-adapters/controllers/upload/get-upload-news-details.controller";

export function createUploadModule() {
  const m = createModule();

  m.bind(DI_SYMBOLS.IObjectStorageService).toClass(S3StorageService);

  m.bind(DI_SYMBOLS.IUploadPageService).toHigherOrderFunction(
    (ost: IObjectStorageService) => new OSUploadPageService(ost),
    [DI_SYMBOLS.IObjectStorageService]
  );

  m.bind(DI_SYMBOLS.INewsStorageService).toHigherOrderFunction(
    (ost: IObjectStorageService) => new NewsStorageService(ost),
    [DI_SYMBOLS.IObjectStorageService]
  );

  m.bind(DI_SYMBOLS.IInitUploadUseCase).toHigherOrderFunction(
    initUploadUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IUploadPageService]
  );

  m.bind(DI_SYMBOLS.IListUploadsUseCase).toHigherOrderFunction(
    listUploadsUseCase,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.IUploadPageService,
      DI_SYMBOLS.INewsStorageService,
    ]
  );

  m.bind(DI_SYMBOLS.IDeleteUploadsUseCase).toHigherOrderFunction(
    deleteUploadsUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IUploadPageService]
  );

    m.bind(DI_SYMBOLS.IArchiveUploadsUseCase).toHigherOrderFunction(
    archiveUploadsUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IUploadPageService]
  );

  m.bind(DI_SYMBOLS.IGetUploadNewsDetailsUseCase).toHigherOrderFunction(
    (newsStorageService: INewsStorageService) =>
      new GetUploadNewsDetailsUseCase(newsStorageService),
    [DI_SYMBOLS.INewsStorageService]
  );

  m.bind(DI_SYMBOLS.IInitUploadController).toHigherOrderFunction(
    initUploadController,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.ISessionService,
      DI_SYMBOLS.IInitUploadUseCase,
    ]
  );

  m.bind(DI_SYMBOLS.IListUploadsController).toHigherOrderFunction(
    listUploadsController,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.ISessionService,
      DI_SYMBOLS.IListUploadsUseCase,
    ]
  );

  m.bind(DI_SYMBOLS.IDeleteUploadsController).toHigherOrderFunction(
    deleteUploadsController,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.ISessionService,
      DI_SYMBOLS.IGetCurrentUserUseCase,
      DI_SYMBOLS.IDeleteUploadsUseCase,
    ]
  );

  m.bind(DI_SYMBOLS.IArchiveUploadsController).toHigherOrderFunction(
    archiveUploadsController,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.ISessionService,
      DI_SYMBOLS.IGetCurrentUserUseCase,
      DI_SYMBOLS.IArchiveUploadsUseCase,
    ]
  );

  m.bind(DI_SYMBOLS.IGetUploadNewsDetailsController).toHigherOrderFunction(
    getUploadNewsDetailsController,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.ISessionService,
      DI_SYMBOLS.IGetUploadNewsDetailsUseCase,
    ]
  );

  return m;
}