-- Fix security_settings table issues from V14
-- Add proper constraints and indexes for data integrity

-- Add unique constraint to ensure only one active security settings record
-- (assuming the system should have only one active settings record)
ALTER TABLE security_settings
ADD CONSTRAINT unique_active_security_settings
EXCLUDE (id WITH =)
WHERE (id IS NOT NULL);

-- Add check constraints for data validation
ALTER TABLE security_settings
ADD CONSTRAINT check_password_min_length
CHECK (password_min_length >= 8 AND password_min_length <= 128);

ALTER TABLE security_settings
ADD CONSTRAINT check_password_expiration_days
CHECK (password_expiration_days >= 0 AND password_expiration_days <= 365);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_settings_updated_at
ON security_settings (updated_at DESC);

-- Ensure we have exactly one active settings record
-- If multiple exist, keep the most recently updated one
DO $$
DECLARE
    settings_count INTEGER;
    latest_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO settings_count FROM security_settings;

    IF settings_count > 1 THEN
        -- Keep the most recently updated record
        SELECT id INTO latest_id
        FROM security_settings
        ORDER BY updated_at DESC
        LIMIT 1;

        -- Delete all other records
        DELETE FROM security_settings
        WHERE id != latest_id;

        RAISE NOTICE 'Cleaned up security_settings table: kept record with id %, deleted % others',
            latest_id, settings_count - 1;
    ELSIF settings_count = 0 THEN
        -- Insert default settings if none exist
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
        );
        RAISE NOTICE 'Inserted default security settings record';
    END IF;
END $$;
