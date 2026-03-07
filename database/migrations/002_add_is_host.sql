-- Migration: Add is_host column to users table
-- Run this in the Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT FALSE;

-- Add UPDATE policy if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Allow public update to users'
  ) THEN
    CREATE POLICY "Allow public update to users" ON users FOR UPDATE USING (true);
  END IF;
END
$$;
