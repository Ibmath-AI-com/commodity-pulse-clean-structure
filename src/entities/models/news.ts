// FILE: src/entities/models/news.ts

export type NewsImpactDirection = "bullish" | "bearish" | "mixed" | "unclear" | string;
export type NewsRetentionType = "short_term" | "medium_term" | "long_term" | string;

export type NewsNumber = {
  value: string;
  unit?: string;
  context?: string;
};

export type NewsEvent = {
  documentId: string;
  commodity?: string;
  importanceScore?: number;
  eventType?: string;
  headline: string;
  impactDirection?: NewsImpactDirection;
  regions?: string[];
  eventDate?: string;
  numbers?: NewsNumber[];
  evidenceSummary?: string;
  retentionType?: NewsRetentionType;
  active?: boolean;
  expiryDate?: string;
  archive?: boolean;
};

export type DocumentNewsSummary = {
  documentId: string;
  active: number;
  inactive: number;
  total: number;
};

export type DocumentNewsDetails = {
  documentId: string;
  active: number;
  inactive: number;
  total: number;
  activeEvents: NewsEvent[];
  inactiveEvents: NewsEvent[];
};