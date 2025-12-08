-- Add custom months support to school year quarters
-- V19__add_custom_months_to_school_year_quarters.sql

-- Create table for custom months (many-to-many relationship)
CREATE TABLE school_year_quarter_custom_months (
    quarter_id BIGINT NOT NULL,
    month INTEGER NOT NULL,
    PRIMARY KEY (quarter_id, month),
    FOREIGN KEY (quarter_id) REFERENCES school_year_quarters(id) ON DELETE CASCADE,
    CONSTRAINT check_month_range CHECK (month >= 1 AND month <= 12)
);

-- Add index for better query performance
CREATE INDEX idx_school_year_quarter_custom_months_quarter_id
ON school_year_quarter_custom_months(quarter_id);

-- Add comment for documentation
COMMENT ON TABLE school_year_quarter_custom_months IS 'Stores custom month assignments for school year quarters';
COMMENT ON COLUMN school_year_quarter_custom_months.quarter_id IS 'Reference to school_year_quarters.id';
COMMENT ON COLUMN school_year_quarter_custom_months.month IS 'Month number (1-12) assigned to this quarter';
