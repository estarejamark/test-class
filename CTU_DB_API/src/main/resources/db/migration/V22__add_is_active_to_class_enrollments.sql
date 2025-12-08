-- 1. Add is_active column if it doesn't exist
ALTER TABLE class_enrollments
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Set all NULL values to true
UPDATE class_enrollments
SET is_active = true
WHERE is_active IS NULL;

-- 3. Set NOT NULL constraint
-- This will fail if any NULLs exist, so we already handled NULLs above
ALTER TABLE class_enrollments
ALTER COLUMN is_active SET NOT NULL;
