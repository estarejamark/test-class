-- Create security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
    id SERIAL PRIMARY KEY,
    password_min_length INTEGER NOT NULL DEFAULT 8,
    require_numbers BOOLEAN NOT NULL DEFAULT TRUE,
    require_special_chars BOOLEAN NOT NULL DEFAULT TRUE,
    password_expiration_days INTEGER NOT NULL DEFAULT 90,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_required_for_admins BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default security settings
INSERT INTO security_settings (
    password_min_length,
    require_numbers,
    require_special_chars,
    password_expiration_days,
    two_factor_enabled,
    two_factor_required_for_admins,
    updated_at
) VALUES (
    8, TRUE, TRUE, 90, FALSE, TRUE, CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;
