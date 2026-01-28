-- F1 Family Betting App - Supabase Database Schema

-- Users table (family members)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  emoji VARCHAR(10) DEFAULT '👤',
  is_host BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  race_id VARCHAR(50) NOT NULL, -- Format: "2024_1" (year_round)
  race_year INTEGER NOT NULL,
  race_round INTEGER NOT NULL,

  -- Podium predictions
  p1 VARCHAR(50), -- Driver ID
  p2 VARCHAR(50),
  p3 VARCHAR(50),

  -- Top 10 prediction (ordered array of driver IDs)
  top_10 VARCHAR(50)[] DEFAULT '{}',

  -- Other predictions
  fastest_lap VARCHAR(50),
  pole_position VARCHAR(50),
  dnf_drivers VARCHAR(50)[] DEFAULT '{}', -- Up to 5 drivers
  safety_car BOOLEAN,
  red_flag BOOLEAN,
  driver_of_the_day VARCHAR(50),
  winning_margin_bracket VARCHAR(20), -- '0-5s', '5-10s', '10-20s', '20-30s', '30s+'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Each user can only have one prediction per race
  UNIQUE(user_id, race_id)
);

-- Race results table
CREATE TABLE IF NOT EXISTS race_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  race_id VARCHAR(50) UNIQUE NOT NULL,
  race_year INTEGER NOT NULL,
  race_round INTEGER NOT NULL,
  race_name VARCHAR(100),

  -- Podium results
  p1 VARCHAR(50),
  p2 VARCHAR(50),
  p3 VARCHAR(50),

  -- Top 10 (ordered array)
  top_10 VARCHAR(50)[] DEFAULT '{}',

  -- Other results
  fastest_lap VARCHAR(50),
  pole_position VARCHAR(50),
  dnf_drivers VARCHAR(50)[] DEFAULT '{}',
  safety_car BOOLEAN,
  red_flag BOOLEAN,
  driver_of_the_day VARCHAR(50),
  winning_margin DECIMAL(10, 3), -- In seconds

  -- Raw data from API
  raw_results JSONB,
  scraping_status JSONB DEFAULT '{}',

  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  race_id VARCHAR(50) NOT NULL,
  race_year INTEGER NOT NULL,
  race_round INTEGER NOT NULL,

  -- Detailed breakdown
  points_breakdown JSONB DEFAULT '{}',
  total_points INTEGER DEFAULT 0,

  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Each prediction should only have one score
  UNIQUE(prediction_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_predictions_race ON predictions(race_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_race ON scores(race_id);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_year ON scores(race_year);

-- Enable Row Level Security (optional, for future auth)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policies for public access (adjust for your auth needs)
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert to users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Allow public insert to predictions" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to predictions" ON predictions FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to race_results" ON race_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert to race_results" ON race_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to race_results" ON race_results FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert to scores" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to scores" ON scores FOR UPDATE USING (true);
