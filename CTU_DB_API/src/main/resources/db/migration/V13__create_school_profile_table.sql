-- Create school_profile table
CREATE TABLE IF NOT EXISTS school_profile (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(500) NULL,
    contact_info VARCHAR(100) NULL,
    email VARCHAR(100) NULL,
    office_hours VARCHAR(100) NULL,
    logo_url VARCHAR(500) NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure updated_at has default value for existing tables
ALTER TABLE school_profile ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Update any existing rows with null updated_at
UPDATE school_profile SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- Create theme_colors table for storing theme colors as key-value pairs
CREATE TABLE IF NOT EXISTS theme_colors (
    school_profile_id INTEGER NOT NULL REFERENCES school_profile(id) ON DELETE CASCADE,
    color_key VARCHAR(50) NOT NULL,
    color_value VARCHAR(20) NOT NULL,
    PRIMARY KEY (school_profile_id, color_key)
);

-- Insert default school profile
INSERT INTO school_profile (name, address, contact_info, email, office_hours, logo_url)
VALUES (
    'Academia de San Martin',
    'Daanbantayan, Cebu',
    'info@adsm.com',
    NULL,
    NULL,
    NULL
);
