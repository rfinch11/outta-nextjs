# Supabase Migrations

This directory contains SQL migration files for the Outta database.

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended for now)

1. Go to https://supabase.com/dashboard
2. Select your project: `kkauoixgtaujnjruynov`
3. Navigate to **SQL Editor**
4. Open each migration file and copy/paste the SQL
5. Click **Run** to execute

### Option 2: Supabase CLI (Future)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref kkauoixgtaujnjruynov

# Run migrations
supabase db push
```

## Migrations

### 001_performance_indexes.sql
**Purpose:** Add database indexes for query performance
**Adds:**
- Index on `type` column (for filtering Events/Activities/Camps)
- Index on `recommended` column (for prioritizing recommended listings)
- Index on `start_date` column (for sorting events)
- Index on `city` column (for location filtering)
- Full-text search column `fts` (tsvector)
- GIN index on `fts` for fast text search

**Impact:** ~10x faster queries on filtered results

### 002_postgis_location.sql
**Purpose:** Enable PostGIS for distance calculations
**Adds:**
- PostGIS extension
- `location` geography column (POINT type)
- GIST index on `location` for spatial queries
- Populates `location` from existing `latitude`/`longitude`

**Impact:** Enables fast "within X miles" queries

## Testing Migrations

After running migrations, test with these queries:

### Test Full-Text Search
```sql
SELECT title, city FROM listings
WHERE fts @@ to_tsquery('english', 'playground')
LIMIT 10;
```

### Test Distance Query
```sql
-- From Mountain View, CA
SELECT
  title,
  city,
  ST_Distance(location, ST_MakePoint(-122.1430, 37.4419)::geography) / 1609.34 AS distance_miles
FROM listings
WHERE location IS NOT NULL
  AND ST_DWithin(location, ST_MakePoint(-122.1430, 37.4419)::geography, 64000)
ORDER BY distance_miles
LIMIT 10;
```

## Rollback (if needed)

To rollback migrations, run:

```sql
-- Rollback 002_postgis_location.sql
DROP INDEX IF EXISTS idx_listings_location;
ALTER TABLE listings DROP COLUMN IF EXISTS location;
DROP EXTENSION IF EXISTS postgis;

-- Rollback 001_performance_indexes.sql
DROP INDEX IF EXISTS idx_listings_fts;
ALTER TABLE listings DROP COLUMN IF EXISTS fts;
DROP INDEX IF EXISTS idx_listings_city;
DROP INDEX IF EXISTS idx_listings_start_date;
DROP INDEX IF EXISTS idx_listings_recommended;
DROP INDEX IF EXISTS idx_listings_type;
```

## Notes

- These migrations are **idempotent** (safe to run multiple times)
- All use `IF NOT EXISTS` / `IF EXISTS` to prevent errors
- No data is deleted, only indexes and columns are added
- The `location` column population only updates rows where `location IS NULL`
