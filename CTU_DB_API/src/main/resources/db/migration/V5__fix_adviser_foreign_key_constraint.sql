-- Fix the adviser foreign key constraint to allow NULL values and remove uniqueness
-- This allows multiple sections to not have an adviser (NULL) and advisers to be removed

-- First, drop the existing foreign key constraint
ALTER TABLE sections DROP CONSTRAINT IF EXISTS sections_adviser_id_fkey;

-- Add the new foreign key constraint without NOT NULL and without unique constraint
ALTER TABLE sections ADD CONSTRAINT sections_adviser_id_fkey
    FOREIGN KEY (adviser_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Make sure adviser_id column allows NULL values
ALTER TABLE sections ALTER COLUMN adviser_id DROP NOT NULL;
