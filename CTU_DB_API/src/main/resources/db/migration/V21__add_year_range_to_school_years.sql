-- Add year_range column to school_years
ALTER TABLE school_years
ADD COLUMN year_range VARCHAR(9);

-- Update existing rows with concatenated year range from start_date and end_date
UPDATE school_years
SET year_range = CONCAT(EXTRACT(YEAR FROM start_date)::text, '-', EXTRACT(YEAR FROM end_date)::text);

-- Optionally, you can set this column to NOT NULL if desired after update
ALTER TABLE school_years
ALTER COLUMN year_range SET NOT NULL;
