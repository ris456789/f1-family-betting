-- Migration: Add email notifications support
-- Run this in Supabase SQL Editor if you have an existing database

-- Add email and notification preference columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_qualifying BOOLEAN DEFAULT TRUE;

-- Create notification log table
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  race_id VARCHAR(50) NOT NULL,
  notification_type VARCHAR(20) NOT NULL, -- 'qualifying', 'race', 'results'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed'
  error_message TEXT,

  -- Prevent duplicate notifications
  UNIQUE(user_id, race_id, notification_type)
);

-- Enable Row Level Security
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Policies for public access
CREATE POLICY "Allow public read access to notification_log" ON notification_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert to notification_log" ON notification_log FOR INSERT WITH CHECK (true);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_log_race ON notification_log(race_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
