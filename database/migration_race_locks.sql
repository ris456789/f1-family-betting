-- Adds admin-editable prediction lock overrides per race, so the
-- qualifying lock/unlock time can be changed from the Admin UI without
-- a code deploy. Run this once in the Supabase SQL editor for existing
-- projects (already included in schema.sql for fresh installs).

CREATE TABLE IF NOT EXISTS race_locks (
  race_id VARCHAR(50) PRIMARY KEY, -- Format: "2026_12" (year_round)
  qualifying_date DATE NOT NULL,
  qualifying_time VARCHAR(20) NOT NULL, -- e.g. "16:15:00Z"
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE race_locks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to race_locks" ON race_locks FOR SELECT USING (true);
CREATE POLICY "Allow public insert to race_locks" ON race_locks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to race_locks" ON race_locks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to race_locks" ON race_locks FOR DELETE USING (true);
