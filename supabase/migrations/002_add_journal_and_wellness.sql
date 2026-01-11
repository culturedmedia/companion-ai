-- Migration: Add Journal and Wellness features
-- Run after 001_add_2fa_and_sessions.sql

-- Journal entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journal entries" ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_journal_user_id ON public.journal_entries(user_id);
CREATE INDEX idx_journal_created_at ON public.journal_entries(created_at DESC);

-- Mood tracking table (for quick mood check-ins separate from journal)
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mood entries" ON public.mood_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_mood_user_id ON public.mood_entries(user_id);
CREATE INDEX idx_mood_created_at ON public.mood_entries(created_at DESC);

-- Wellness activity log
CREATE TABLE IF NOT EXISTS public.wellness_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('breathing', 'meditation', 'exercise', 'sleep', 'hydration', 'other')),
  duration_seconds INTEGER,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wellness_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wellness activities" ON public.wellness_activities
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_wellness_user_id ON public.wellness_activities(user_id);
CREATE INDEX idx_wellness_created_at ON public.wellness_activities(created_at DESC);

-- Shop items catalog (for inventory system)
CREATE TABLE IF NOT EXISTS public.shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('energy', 'accessory', 'background', 'boost', 'cosmetic')),
  image_url TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  effect_type TEXT,
  effect_value INTEGER,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default shop items
INSERT INTO public.shop_items (id, name, description, price, category, rarity, effect_type, effect_value) VALUES
  ('snack_small', 'Small Snack', 'Restores 10 energy', 20, 'energy', 'common', 'energy', 10),
  ('snack_medium', 'Tasty Meal', 'Restores 25 energy', 45, 'energy', 'common', 'energy', 25),
  ('snack_large', 'Feast', 'Restores 50 energy', 80, 'energy', 'rare', 'energy', 50),
  ('energy_drink', 'Energy Potion', 'Full energy restore!', 150, 'energy', 'epic', 'energy', 100),
  ('acc_hat_party', 'Party Hat', 'A festive hat for your companion', 100, 'accessory', 'common', NULL, NULL),
  ('acc_glasses_cool', 'Cool Shades', 'Stylish sunglasses', 75, 'accessory', 'common', NULL, NULL),
  ('acc_bow_red', 'Cute Bow', 'An adorable bow accessory', 60, 'accessory', 'common', NULL, NULL),
  ('acc_crown_gold', 'Royal Crown', 'For the most accomplished companions', 500, 'accessory', 'legendary', NULL, NULL),
  ('acc_wings_angel', 'Angel Wings', 'Heavenly wings for your companion', 300, 'accessory', 'epic', NULL, NULL),
  ('acc_halo', 'Golden Halo', 'A glowing halo', 250, 'accessory', 'epic', NULL, NULL),
  ('bg_forest', 'Forest Background', 'A peaceful forest scene', 150, 'background', 'rare', NULL, NULL),
  ('bg_beach', 'Beach Background', 'Sunny beach vibes', 150, 'background', 'rare', NULL, NULL),
  ('bg_space', 'Space Background', 'Among the stars', 200, 'background', 'epic', NULL, NULL),
  ('bg_castle', 'Castle Background', 'Royal castle grounds', 200, 'background', 'epic', NULL, NULL),
  ('bg_rainbow', 'Rainbow Background', 'Colorful rainbow sky', 175, 'background', 'rare', NULL, NULL),
  ('boost_xp', 'XP Boost', '2x XP for your next 5 tasks', 100, 'boost', 'rare', 'xp_boost', 5),
  ('boost_coins', 'Coin Boost', '2x coins for your next 5 tasks', 100, 'boost', 'rare', 'coin_boost', 5)
ON CONFLICT (id) DO NOTHING;

-- Add boost tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_xp_boost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_coin_boost INTEGER DEFAULT 0;

-- Update inventory table to reference shop_items
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS item_type TEXT,
ADD COLUMN IF NOT EXISTS is_equipped BOOLEAN DEFAULT FALSE;

-- Feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'complaint', 'praise')),
  message TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.journal_entries TO authenticated;
GRANT ALL ON public.mood_entries TO authenticated;
GRANT ALL ON public.wellness_activities TO authenticated;
GRANT SELECT ON public.shop_items TO authenticated;
GRANT ALL ON public.feedback TO authenticated;
