-- Enhance school year constraints and indexes for better data integrity
-- V18__enhance_school_year_constraints.sql

-- Add unique constraint to ensure only one active school year at a time
-- First, handle any existing multiple active years by deactivating all but the most recent
UPDATE school_years
SET is_active = false
WHERE is_active = true
  AND id NOT IN (
    SELECT id FROM school_years
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  );

-- Now add the unique constraint
ALTER TABLE school_years
ADD CONSTRAINT unique_active_school_year
EXCLUDE (is_active WITH =)
WHERE (is_active = true);

-- Add check constraint to prevent overlapping school years
-- This ensures no two school years have overlapping date ranges
-- Note: Exclusion constraints with range operators may not be supported in all PostgreSQL versions
-- Alternative: Use a trigger or application-level validation
-- For now, we'll rely on application-level validation in the service layer

-- Add partial index for faster active school year queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_years_active_unique
ON school_years(is_active)
WHERE is_active = true;

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_school_years_date_range
ON school_years(start_date, end_date)
WHERE is_archived = false;

-- Add index for school year quarters foreign key
CREATE INDEX IF NOT EXISTS idx_school_year_quarters_school_year_id_status
ON school_year_quarters(school_year_id, status);

-- Note: Check constraints with subqueries are not supported in PostgreSQL
-- Date validation will be handled at the application layer in the service

-- Add index for active quarter queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_year_quarters_active_unique
ON school_year_quarters(status)
WHERE status = 'ACTIVE';
