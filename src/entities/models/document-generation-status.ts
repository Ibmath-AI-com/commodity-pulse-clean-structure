// FILE: src/entities/models/document-generation-status.ts

export type GenerationStatus = "running" | "success" | "failed";

export type DocumentGenerationStatus = {
  documentId: string;
  commodity: string;
  newsStatus: GenerationStatus;
  imagesStatus: GenerationStatus;
  vectorsStatus: GenerationStatus;
  updatedAt: Date;
};

export type PredictionReadinessItem = {
  documentId: string;
  status: "success" | "running" | "failed";
  newsStatus: GenerationStatus;
  imagesStatus: GenerationStatus;
  vectorsStatus: GenerationStatus;
};

export type PredictionReadinessResult = {
  commodity: string;
  totalDocuments: number;
  readyDocuments: PredictionReadinessItem[];
  runningDocuments: PredictionReadinessItem[];
  failedDocuments: PredictionReadinessItem[];
  canRunForecast: boolean;
  message: string | null;
};