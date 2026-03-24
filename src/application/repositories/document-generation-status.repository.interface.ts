// FILE: src/application/repositories/document-generation-status.repository.interface.ts

import type { DocumentGenerationStatus } from "@/src/entities/models/document-generation-status";

export interface IDocumentGenerationStatusRepository {
  findByCommodity(commodity: string): Promise<DocumentGenerationStatus[]>;
}