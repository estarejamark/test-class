-- Create notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notification_templates_type CHECK (type IN ('SMS', 'EMAIL'))
);

-- Create template_variables table for storing template variables as key-value pairs
CREATE TABLE IF NOT EXISTS template_variables (
    notification_template_id INTEGER NOT NULL REFERENCES notification_templates(id) ON DELETE CASCADE,
    variable_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (notification_template_id, variable_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_created_at ON notification_templates(created_at DESC);
