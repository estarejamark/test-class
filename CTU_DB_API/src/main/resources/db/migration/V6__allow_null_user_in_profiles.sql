-- Allow user_id in profiles table to be null
ALTER TABLE profiles ALTER COLUMN user_id DROP NOT NULL;
