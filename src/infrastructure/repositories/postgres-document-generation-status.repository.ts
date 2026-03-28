// FILE: src/infrastructure/repositories/postgres-document-generation-status.repository.ts

import "server-only";

import type { Pool } from "pg";
import type { IDocumentGenerationStatusRepository } from "@/src/application/repositories/document-generation-status.repository.interface";
import type {
  DocumentGenerationStatus,
  GenerationStatus,
} from "@/src/entities/models/document-generation-status";

type Row = {
  document_id: string;
  commodity: string;
  news_status: GenerationStatus;
  images_status: GenerationStatus;
  vectors_status: GenerationStatus;
  updated_at: Date;
};

function mapRow(row: Row): DocumentGenerationStatus {
  return {
    documentId: row.document_id,
    commodity: row.commodity,
    newsStatus: row.news_status,
    imagesStatus: row.images_status,
    vectorsStatus: row.vectors_status,
    updatedAt: row.updated_at,
  };
}

export class PostgresDocumentGenerationStatusRepository
  implements IDocumentGenerationStatusRepository
{
  constructor(private readonly pool: Pool) {}

  async findByCommodity(commodity: string): Promise<DocumentGenerationStatus[]> {
    const res = await this.pool.query<Row>(
      `
      select
        document_id,
        commodity,
        news_status,
        images_status,
        vectors_status,
        updated_at
      from document_generation_status
      where commodity = $1
      order by updated_at desc
      `,
      [commodity]
    );

    return res.rows.map(mapRow);
  }
}