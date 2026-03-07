-- Migration: Allow upsert (update) on notification_log
-- Needed so duplicate notification checks work correctly via ON CONFLICT
-- Run this in Supabase SQL Editor

CREATE POLICY "Allow public update to notification_log"
  ON notification_log FOR UPDATE USING (true);
