-- Create backup_points table
CREATE TABLE IF NOT EXISTS backup_points (
    id SERIAL PRIMARY KEY,
    date TIMESTAMP NOT NULL,
    size BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    file_path VARCHAR(500) NULL,
    restored_at TIMESTAMP NULL,
    CONSTRAINT chk_backup_points_size CHECK (size >= 0),
    CONSTRAINT chk_backup_points_status CHECK (status IN ('COMPLETED', 'IN_PROGRESS', 'FAILED', 'RESTORED'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_backup_points_status ON backup_points(status);
CREATE INDEX IF NOT EXISTS idx_backup_points_date ON backup_points(date DESC);
