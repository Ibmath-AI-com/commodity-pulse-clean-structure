// FILE: src/application/use-cases/upload/get-upload-news-details.use-case.ts

import type { INewsStorageService } from "@/src/application/services/news-storage.service.interface";
import type { DocumentNewsDetails } from "@/src/entities/models/news";

export interface IGetUploadNewsDetailsUseCase {
  execute(input: {
    commodity: string;
    sourcePath: string;
  }): Promise<DocumentNewsDetails>;
}

export class GetUploadNewsDetailsUseCase implements IGetUploadNewsDetailsUseCase {
  constructor(private readonly newsStorageService: INewsStorageService) {}

  async execute(input: {
    commodity: string;
    sourcePath: string;
  }): Promise<DocumentNewsDetails> {
    return this.newsStorageService.getDocumentNewsDetails(input);
  }
}