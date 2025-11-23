-- Phase 4: Performance Optimization - Database Indexes
-- This migration adds indexes to improve query performance

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(type);
CREATE INDEX IF NOT EXISTS idx_listings_recommended ON listings(recommended);
CREATE INDEX IF NOT EXISTS idx_listings_start_date ON listings(start_date);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);

-- Full-text search column
-- This creates a generated column that concatenates all searchable fields
ALTER TABLE listings ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(city, '') || ' ' ||
      coalesce(state, '') || ' ' ||
      coalesce(street, '') || ' ' ||
      coalesce(place_type, '') || ' ' ||
      coalesce(organizer, '') || ' ' ||
      coalesce(tags, '')
    )
  ) STORED;

-- Full-text search index (GIN)
-- GIN (Generalized Inverted Index) is optimal for full-text search
CREATE INDEX IF NOT EXISTS idx_listings_fts ON listings USING GIN(fts);

-- Test full-text search
-- Uncomment to test:
-- SELECT title, city FROM listings
-- WHERE fts @@ to_tsquery('english', 'playground')
-- LIMIT 10;
