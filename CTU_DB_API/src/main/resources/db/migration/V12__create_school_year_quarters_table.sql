-- Create school_year_quarters table
CREATE TABLE IF NOT EXISTS school_year_quarters (
    id SERIAL PRIMARY KEY,
    school_year_id INTEGER NOT NULL REFERENCES school_years(id) ON DELETE CASCADE,
    quarter VARCHAR(10) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    CONSTRAINT chk_school_year_quarters_dates CHECK (end_date > start_date),
    CONSTRAINT chk_school_year_quarters_quarter CHECK (quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
    CONSTRAINT chk_school_year_quarters_status CHECK (status IN ('UPCOMING', 'ACTIVE', 'CLOSED'))
);

-- Create index on school_year_id for faster queries
CREATE INDEX IF NOT EXISTS idx_school_year_quarters_school_year_id ON school_year_quarters(school_year_id);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_school_year_quarters_status ON school_year_quarters(status);

-- Create index on quarter for filtering
CREATE INDEX IF NOT EXISTS idx_school_year_quarters_quarter ON school_year_quarters(quarter);

-- Create unique constraint to prevent duplicate quarters for the same school year
CREATE UNIQUE INDEX IF NOT EXISTS idx_school_year_quarters_unique ON school_year_quarters(school_year_id, quarter);
