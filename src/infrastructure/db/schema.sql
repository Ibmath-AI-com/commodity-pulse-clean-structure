-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

------------------------------------------------
-- DOCUMENTS
------------------------------------------------

CREATE TABLE IF NOT EXISTS documents (
    document_id TEXT PRIMARY KEY,
    commodity TEXT NOT NULL,
    source TEXT NOT NULL,
    filename TEXT NOT NULL,
    source_key TEXT NOT NULL,
    published_at DATE,
    ingested_at TIMESTAMP DEFAULT NOW(),
    file_hash TEXT,
    processing_status TEXT DEFAULT 'processed'
);

------------------------------------------------
-- MARKET EVENTS
------------------------------------------------

CREATE TABLE IF NOT EXISTS market_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT REFERENCES documents(document_id),
    commodity TEXT NOT NULL,
    event_type TEXT NOT NULL,
    impact_direction TEXT,
    importance_score NUMERIC,
    headline TEXT,
    evidence_summary TEXT,
    regions JSONB,
    numbers JSONB,
    event_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    raw_event JSONB
);

------------------------------------------------
-- COMMODITY PRICES
------------------------------------------------

CREATE TABLE IF NOT EXISTS commodity_prices (
    price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commodity TEXT NOT NULL,
    market TEXT,
    region TEXT,
    price NUMERIC,
    price_low NUMERIC,
    price_high NUMERIC,
    currency TEXT,
    unit TEXT,
    price_date DATE NOT NULL,
    source TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

------------------------------------------------
-- INDEXES
------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_events_commodity_date
ON market_events(commodity, event_date);

CREATE INDEX IF NOT EXISTS idx_prices_commodity_date
ON commodity_prices(commodity, price_date);