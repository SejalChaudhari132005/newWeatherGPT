-- =========================================================
-- WeatherGPT Production & Development Database Schema
-- Profiles, Conversations & Messages with Row Level Security (RLS)
-- Paste this script into your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/dmghlienivomivugouaa/sql
-- =========================================================

-- 1. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'citizen',
  preferred_language TEXT DEFAULT 'en',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  district TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  formatted_address TEXT,
  location_source TEXT DEFAULT 'gps',
  location_updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migration support for existing database instances:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- 2. Create Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  role TEXT NOT NULL DEFAULT 'citizen',
  location_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- 3. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Profiles RLS Policies
DROP POLICY IF EXISTS "Enable read for profiles" ON public.profiles;
CREATE POLICY "Enable read for profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for profiles" ON public.profiles;
CREATE POLICY "Enable insert for profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for profiles" ON public.profiles;
CREATE POLICY "Enable update for profiles" ON public.profiles FOR UPDATE USING (true);

-- 6. Conversations RLS Policies
DROP POLICY IF EXISTS "Enable all operations for conversation owners" ON public.conversations;
CREATE POLICY "Enable all operations for conversation owners"
  ON public.conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Messages RLS Policies
DROP POLICY IF EXISTS "Enable all operations for messages" ON public.messages;
CREATE POLICY "Enable all operations for messages"
  ON public.messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Enable Indexes for Fast Query Performance
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);
CREATE INDEX IF NOT EXISTS conversations_user_idx ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_updated_idx ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conv_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_idx ON public.messages(created_at ASC);

-- =========================================================
-- 9. STEP 9: Weather Alerts & Early Warning Table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  fingerprint TEXT NOT NULL,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT NOT NULL,
  district TEXT,
  state TEXT,
  source TEXT NOT NULL,
  source_url TEXT,
  confidence NUMERIC,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  recommended_action TEXT,
  what_to_avoid TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for alerts
CREATE INDEX IF NOT EXISTS weather_alerts_active_idx ON public.weather_alerts(is_active);
CREATE INDEX IF NOT EXISTS weather_alerts_user_idx ON public.weather_alerts(user_id);
CREATE INDEX IF NOT EXISTS weather_alerts_fingerprint_idx ON public.weather_alerts(fingerprint);
CREATE INDEX IF NOT EXISTS weather_alerts_coords_idx ON public.weather_alerts(latitude, longitude);
CREATE INDEX IF NOT EXISTS weather_alerts_valid_until_idx ON public.weather_alerts(valid_until DESC);

-- Enable RLS for weather_alerts
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for weather_alerts" ON public.weather_alerts;
CREATE POLICY "Enable read for weather_alerts" ON public.weather_alerts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for weather_alerts" ON public.weather_alerts;
CREATE POLICY "Enable insert for weather_alerts" ON public.weather_alerts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update for weather_alerts" ON public.weather_alerts;
CREATE POLICY "Enable update for weather_alerts" ON public.weather_alerts FOR UPDATE USING (true);

-- =========================================================
-- 10. STEP 9: User Alert Preferences Table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.user_alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  severe_weather BOOLEAN DEFAULT TRUE,
  heavy_rain BOOLEAN DEFAULT TRUE,
  heatwave BOOLEAN DEFAULT TRUE,
  cyclone BOOLEAN DEFAULT TRUE,
  flood BOOLEAN DEFAULT TRUE,
  strong_wind BOOLEAN DEFAULT TRUE,
  thunderstorm BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================================
-- 11. STEP 10: Travel Plans & Route Weather Intelligence Table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lon DOUBLE PRECISION NOT NULL,
  origin_name TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lon DOUBLE PRECISION NOT NULL,
  destination_name TEXT NOT NULL,
  travel_date DATE NOT NULL DEFAULT CURRENT_DATE,
  departure_time TEXT NOT NULL DEFAULT '08:00',
  distance_km NUMERIC,
  duration_minutes INTEGER,
  overall_risk TEXT DEFAULT 'low',
  route_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS travel_plans_user_idx ON public.travel_plans(user_id);
CREATE INDEX IF NOT EXISTS travel_plans_date_idx ON public.travel_plans(travel_date);

ALTER TABLE public.travel_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for travel_plans" ON public.travel_plans;
CREATE POLICY "Enable all operations for travel_plans" ON public.travel_plans FOR ALL USING (true) WITH CHECK (true);

-- =========================================================
-- 12. STEP 10: Route Alert Preferences Table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.route_alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  plan_id UUID REFERENCES public.travel_plans(id) ON DELETE CASCADE,
  origin_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  alert_on_rain BOOLEAN DEFAULT TRUE,
  alert_on_thunderstorm BOOLEAN DEFAULT TRUE,
  alert_on_fog BOOLEAN DEFAULT TRUE,
  alert_on_severe BOOLEAN DEFAULT TRUE,
  notify_window_hours INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS route_alert_prefs_user_idx ON public.route_alert_preferences(user_id);
CREATE INDEX IF NOT EXISTS route_alert_prefs_plan_idx ON public.route_alert_preferences(plan_id);

ALTER TABLE public.route_alert_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all operations for route_alert_preferences" ON public.route_alert_preferences;
CREATE POLICY "Enable all operations for route_alert_preferences" ON public.route_alert_preferences FOR ALL USING (true) WITH CHECK (true);

