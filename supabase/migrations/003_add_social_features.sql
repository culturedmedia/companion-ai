-- Migration: Add Social Features (Friends, Vibes, Leaderboards, Family)
-- Run after 002_add_journal_and_wellness.sql

-- Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" ON public.friendships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own friendships" ON public.friendships
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships" ON public.friendships
  FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE INDEX idx_friendships_user ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend ON public.friendships(friend_id);

-- Vibes (encouragement messages)
CREATE TABLE IF NOT EXISTS public.vibes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_user_name TEXT,
  from_companion_name TEXT,
  from_companion_type TEXT,
  message TEXT NOT NULL,
  emoji TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view received vibes" ON public.vibes
  FOR SELECT USING (auth.uid() = to_user_id);

CREATE POLICY "Users can send vibes" ON public.vibes
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update own received vibes" ON public.vibes
  FOR UPDATE USING (auth.uid() = to_user_id);

CREATE INDEX idx_vibes_to_user ON public.vibes(to_user_id);
CREATE INDEX idx_vibes_created ON public.vibes(created_at DESC);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = FALSE;

-- Families
CREATE TABLE IF NOT EXISTS public.families (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Family members
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Family policies
CREATE POLICY "Members can view own families" ON public.families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = families.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create families" ON public.families
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update families" ON public.families
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = families.id AND user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Members can view family members" ON public.family_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = family_members.family_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join families" ON public.family_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave families" ON public.family_members
  FOR DELETE USING (auth.uid() = user_id);

-- Family tasks
CREATE TABLE IF NOT EXISTS public.family_tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_by_name TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_by_name TEXT,
  completed_at TIMESTAMPTZ,
  points INTEGER DEFAULT 10,
  recurring TEXT CHECK (recurring IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.family_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view tasks" ON public.family_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = family_tasks.family_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can create tasks" ON public.family_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = family_tasks.family_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Family members can update tasks" ON public.family_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.family_members 
      WHERE family_id = family_tasks.family_id AND user_id = auth.uid()
    )
  );

CREATE INDEX idx_family_tasks_family ON public.family_tasks(family_id);
CREATE INDEX idx_family_tasks_assigned ON public.family_tasks(assigned_to);

-- Challenge completions
CREATE TABLE IF NOT EXISTS public.challenge_completions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  coins_earned INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge completions" ON public.challenge_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge completions" ON public.challenge_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_challenge_completions_user ON public.challenge_completions(user_id);

-- Evolution history
CREATE TABLE IF NOT EXISTS public.evolution_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE NOT NULL,
  stage INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.evolution_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evolution history" ON public.evolution_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evolution history" ON public.evolution_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_evolution_history_companion ON public.evolution_history(companion_id);

-- Add calendar_event_id to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS calendar_event_id TEXT;

-- Grant permissions
GRANT ALL ON public.friendships TO authenticated;
GRANT ALL ON public.vibes TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.families TO authenticated;
GRANT ALL ON public.family_members TO authenticated;
GRANT ALL ON public.family_tasks TO authenticated;
GRANT ALL ON public.challenge_completions TO authenticated;
GRANT ALL ON public.evolution_history TO authenticated;
