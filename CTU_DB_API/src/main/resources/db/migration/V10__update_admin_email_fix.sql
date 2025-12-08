-- V10__update_admin_email_fix.sql
UPDATE users
SET email = 'admin@admin.com'
WHERE email = 'admin@example.com';
