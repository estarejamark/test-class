-- Add is_adviser column to profiles table with default value false
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_adviser BOOLEAN NOT NULL DEFAULT false;
