-- Phase 4: Performance Optimization - PostGIS for Distance Calculations
-- This migration enables PostGIS and adds spatial indexing for distance queries

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column for spatial queries
-- POINT type with SRID 4326 (WGS 84 coordinate system)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location geography(POINT, 4326);

-- Populate location column from existing lat/lng
-- This converts latitude/longitude to PostGIS geography type
UPDATE listings
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE longitude IS NOT NULL AND latitude IS NOT NULL AND location IS NULL;

-- Index for spatial queries (GIST index)
-- GIST (Generalized Search Tree) is optimal for spatial data
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings USING GIST(location);

-- Test distance query (from Mountain View, CA: -122.1430, 37.4419)
-- Uncomment to test:
-- SELECT
--   title,
--   city,
--   ST_Distance(location, ST_MakePoint(-122.1430, 37.4419)::geography) / 1609.34 AS distance_miles
-- FROM listings
-- WHERE location IS NOT NULL
--   AND ST_DWithin(location, ST_MakePoint(-122.1430, 37.4419)::geography, 64000) -- 40 miles in meters
-- ORDER BY distance_miles
-- LIMIT 10;
