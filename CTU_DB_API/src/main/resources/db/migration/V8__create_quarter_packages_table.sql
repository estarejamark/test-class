-- Create quarter_packages table
CREATE TABLE IF NOT EXISTS quarter_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    quarter VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMPTZ,
    adviser_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ
);

-- Create index on section_id for better query performance
CREATE INDEX IF NOT EXISTS idx_quarter_packages_section_id ON quarter_packages(section_id);

-- Create index on adviser_id for better query performance
CREATE INDEX IF NOT EXISTS idx_quarter_packages_adviser_id ON quarter_packages(adviser_id);

-- Create index on quarter for filtering
CREATE INDEX IF NOT EXISTS idx_quarter_packages_quarter ON quarter_packages(quarter);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_quarter_packages_status ON quarter_packages(status);
