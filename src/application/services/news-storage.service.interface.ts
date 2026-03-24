// FILE: src/application/services/news-storage.service.interface.ts

import type {
  DocumentNewsDetails,
  DocumentNewsSummary,
} from "@/src/entities/models/news";

export interface INewsStorageService {
  getDocumentNewsSummary(input: {
    commodity: string;
    sourcePath: string;
  }): Promise<DocumentNewsSummary>;

  getDocumentNewsDetails(input: {
    commodity: string;
    sourcePath: string;
  }): Promise<DocumentNewsDetails>;
}