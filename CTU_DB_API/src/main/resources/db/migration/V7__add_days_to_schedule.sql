-- Add days column to schedule table
ALTER TABLE schedule ADD COLUMN days VARCHAR(255) NOT NULL DEFAULT '';
