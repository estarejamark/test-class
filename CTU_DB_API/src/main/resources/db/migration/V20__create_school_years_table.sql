-- Create school_years table
CREATE TABLE IF NOT EXISTS school_years (
    id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    term_type VARCHAR(50) NOT NULL DEFAULT 'QUARTER',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    CONSTRAINT chk_school_years_dates CHECK (end_date > start_date),
    CONSTRAINT chk_school_years_year_span CHECK (EXTRACT(YEAR FROM end_date) = EXTRACT(YEAR FROM start_date) + 1)
);

-- Create index on is_active for faster queries
CREATE INDEX IF NOT EXISTS idx_school_years_is_active ON school_years(is_active);

-- Create index on is_archived for faster queries
CREATE INDEX IF NOT EXISTS idx_school_years_is_archived ON school_years(is_archived);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_school_years_created_at ON school_years(created_at DESC);
