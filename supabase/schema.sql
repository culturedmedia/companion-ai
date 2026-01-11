-- CompanionAI Database Schema v2.0
-- Run this in your Supabase SQL Editor
-- Last updated: January 2026

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  push_token TEXT,
  is_onboarded BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"taskReminders": true, "morningCheckIn": true, "streakReminder": true, "achievements": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- COMPANIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.companions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  animal_type TEXT NOT NULL CHECK (animal_type IN ('fox', 'owl', 'cat', 'bunny', 'dragon', 'axolotl', 'red_panda', 'penguin')),
  personality TEXT NOT NULL CHECK (personality IN ('clever', 'wise', 'independent', 'gentle', 'powerful', 'chill', 'playful', 'loyal')),
  color TEXT DEFAULT '#6366f1',
  energy INTEGER DEFAULT 50 CHECK (energy >= 0 AND energy <= 100),
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  mood TEXT DEFAULT 'happy' CHECK (mood IN ('happy', 'excited', 'tired', 'sad', 'neutral')),
  accessories JSONB DEFAULT '[]'::jsonb,
  background TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companion" ON public.companions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own companion" ON public.companions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own companion" ON public.companions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'personal' CHECK (category IN ('work', 'personal', 'health', 'finance', 'errands', 'social')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE,
  due_time TIME,
  reminder_time TIMESTAMPTZ,
  reminder_notification_id TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence JSONB, -- {frequency: 'daily'|'weekly'|'monthly'|'yearly', interval: 1, daysOfWeek: [0-6], endDate: '2026-12-31'}
  parent_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  coins_reward INTEGER DEFAULT 10 CHECK (coins_reward >= 0),
  xp_reward INTEGER DEFAULT 10 CHECK (xp_reward >= 0),
  notes TEXT,
  tags TEXT[]
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category);

-- ============================================
-- SUBTASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage subtasks" ON public.subtasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = subtasks.task_id AND tasks.user_id = auth.uid())
  );

-- ============================================
-- WALLETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.wallets (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  coins INTEGER DEFAULT 100 CHECK (coins >= 0),
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  lifetime_coins INTEGER DEFAULT 100 CHECK (lifetime_coins >= 0),
  lifetime_xp INTEGER DEFAULT 0 CHECK (lifetime_xp >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- COIN TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'spent', 'purchased', 'bonus')),
  description TEXT,
  reference_type TEXT, -- 'task', 'achievement', 'purchase', 'streak'
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.coin_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.coin_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('tasks', 'streaks', 'companion', 'social', 'special')),
  requirement INTEGER NOT NULL,
  reward_coins INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  notified BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own achievements" ON public.user_achievements
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- STREAKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.streaks (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  streak_protected BOOLEAN DEFAULT FALSE,
  protection_used_date DATE,
  freeze_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks" ON public.streaks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.streaks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON public.streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INVENTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('accessory', 'background', 'boost', 'cosmetic')),
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  is_equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" ON public.inventory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory" ON public.inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory" ON public.inventory
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SHOP ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('accessory', 'background', 'boost', 'cosmetic')),
  price_coins INTEGER DEFAULT 0,
  price_premium BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- ============================================
-- PURCHASES TABLE (IAP)
-- ============================================
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  receipt_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  expiration_date TIMESTAMPTZ,
  will_renew BOOLEAN DEFAULT TRUE,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own subscription" ON public.subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- UNLOCKED FEATURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.unlocked_features (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_id)
);

ALTER TABLE public.unlocked_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own features" ON public.unlocked_features
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own features" ON public.unlocked_features
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general', 'praise')),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'closed')),
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can view own feedback" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Create wallet with starting coins
  INSERT INTO public.wallets (user_id, coins, xp, lifetime_coins, lifetime_xp)
  VALUES (NEW.id, 100, 0, 100, 0);
  
  -- Create streak record
  INSERT INTO public.streaks (user_id, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SEED DATA
-- ============================================

-- Insert achievements
INSERT INTO public.achievements (name, description, icon, category, requirement, reward_coins, reward_xp, sort_order)
VALUES
  -- Task achievements
  ('First Steps', 'Complete your first task', '🎯', 'tasks', 1, 10, 10, 1),
  ('Getting Started', 'Complete 10 tasks', '🌟', 'tasks', 10, 50, 50, 2),
  ('Task Master', 'Complete 50 tasks', '🏆', 'tasks', 50, 200, 200, 3),
  ('Productivity Pro', 'Complete 100 tasks', '👑', 'tasks', 100, 500, 500, 4),
  ('Task Legend', 'Complete 500 tasks', '💎', 'tasks', 500, 2000, 2000, 5),
  
  -- Streak achievements
  ('Streak Starter', 'Maintain a 3-day streak', '🔥', 'streaks', 3, 30, 30, 10),
  ('Week Warrior', 'Maintain a 7-day streak', '💪', 'streaks', 7, 100, 100, 11),
  ('Two Week Champion', 'Maintain a 14-day streak', '⚡', 'streaks', 14, 200, 200, 12),
  ('Month Master', 'Maintain a 30-day streak', '🌙', 'streaks', 30, 500, 500, 13),
  ('Streak Legend', 'Maintain a 100-day streak', '🌈', 'streaks', 100, 2000, 2000, 14),
  
  -- Companion achievements
  ('Best Friends', 'Reach companion level 5', '🦊', 'companion', 5, 100, 0, 20),
  ('Soul Mates', 'Reach companion level 10', '❤️', 'companion', 10, 250, 0, 21),
  ('Legendary Bond', 'Reach companion level 25', '✨', 'companion', 25, 1000, 0, 22),
  
  -- Special achievements
  ('Early Bird', 'Complete a task before 8 AM', '🌅', 'special', 1, 50, 50, 30),
  ('Night Owl', 'Complete a task after 10 PM', '🦉', 'special', 1, 50, 50, 31),
  ('Voice Master', 'Create 10 tasks using voice', '🎤', 'special', 10, 100, 100, 32)
ON CONFLICT DO NOTHING;

-- Insert shop items
INSERT INTO public.shop_items (id, name, description, type, price_coins, rarity, sort_order)
VALUES
  -- Accessories
  ('acc_hat_party', 'Party Hat', 'A festive party hat for celebrations', 'accessory', 100, 'common', 1),
  ('acc_glasses_cool', 'Cool Shades', 'Stylish sunglasses', 'accessory', 150, 'common', 2),
  ('acc_bow_red', 'Red Bow', 'A cute red bow tie', 'accessory', 100, 'common', 3),
  ('acc_crown_gold', 'Golden Crown', 'A majestic golden crown', 'accessory', 500, 'rare', 4),
  ('acc_wings_angel', 'Angel Wings', 'Beautiful angel wings', 'accessory', 1000, 'epic', 5),
  ('acc_halo', 'Halo', 'A glowing halo', 'accessory', 750, 'rare', 6),
  
  -- Backgrounds
  ('bg_forest', 'Enchanted Forest', 'A magical forest setting', 'background', 200, 'common', 10),
  ('bg_beach', 'Sunny Beach', 'A relaxing beach scene', 'background', 200, 'common', 11),
  ('bg_space', 'Outer Space', 'Among the stars', 'background', 500, 'rare', 12),
  ('bg_castle', 'Royal Castle', 'A grand castle backdrop', 'background', 750, 'epic', 13),
  ('bg_rainbow', 'Rainbow Valley', 'A colorful rainbow paradise', 'background', 1000, 'legendary', 14)
ON CONFLICT DO NOTHING;

-- ============================================
-- PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
