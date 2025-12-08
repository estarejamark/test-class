-- Add school_year_quarter_id column to schedule table
ALTER TABLE schedule ADD COLUMN school_year_quarter_id BIGINT NOT NULL;

-- Add foreign key constraint
ALTER TABLE schedule ADD CONSTRAINT fk_schedule_school_year_quarter
FOREIGN KEY (school_year_quarter_id) REFERENCES school_year_quarters(id);
