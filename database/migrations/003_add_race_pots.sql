-- Migration: Add race pots (money tracking)
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS race_pots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id VARCHAR(50) UNIQUE NOT NULL,
  race_name VARCHAR(100),
  buy_in DECIMAL(10,2) DEFAULT 10.00,
  host_cut DECIMAL(10,2) DEFAULT 1.00,
  paid_user_ids UUID[] DEFAULT '{}',
  winner_user_ids UUID[] DEFAULT '{}',
  prize_per_winner DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE race_pots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to race_pots" ON race_pots FOR SELECT USING (true);
CREATE POLICY "Allow public insert to race_pots" ON race_pots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to race_pots" ON race_pots FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_race_pots_race ON race_pots(race_id);
