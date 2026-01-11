import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Companion, AnimalType, Personality, ANIMAL_OPTIONS } from '../types';

interface CompanionState {
  companion: Companion | null;
  isLoading: boolean;
  
  // Actions
  setCompanion: (companion: Companion | null) => void;
  createCompanion: (name: string, animalType: AnimalType) => Promise<{ error: Error | null; companion?: Companion }>;
  fetchCompanion: (userId: string) => Promise<void>;
  updateEnergy: (amount: number) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  getCompanionGreeting: () => string;
  getCompanionEncouragement: () => string;
}

// Personality-based messages
const GREETINGS: Record<Personality, string[]> = {
  clever: [
    "Good morning! I've been thinking about your schedule...",
    "Hey there! Ready to outsmart today's challenges?",
    "I noticed some patterns in your tasks. Let's be strategic!",
  ],
  wise: [
    "Good morning. Take a moment to breathe before we begin.",
    "Another day, another opportunity for growth.",
    "Remember: progress, not perfection.",
  ],
  independent: [
    "Oh, you're up. I suppose we should look at your tasks.",
    "Morning. I've been napping, but I'm ready when you are.",
    "*stretches* Alright, let's see what needs doing.",
  ],
  gentle: [
    "Good morning, friend! I hope you slept well! 💕",
    "Hi! I'm so happy to see you! Ready for a great day?",
    "You're doing amazing just by showing up today!",
  ],
  powerful: [
    "Rise and conquer! Today's challenges don't stand a chance.",
    "I've got your back. Let's crush this day!",
    "Together, we're unstoppable. What's first?",
  ],
  chill: [
    "Hey... no rush, but whenever you're ready...",
    "Morning vibes~ Let's take it one thing at a time.",
    "Today's gonna be good. I can feel it.",
  ],
  playful: [
    "Yay, you're here! Let's make today fun! 🎉",
    "Ooh ooh! What adventures await us today?",
    "I've been waiting! Let's play... I mean, work!",
  ],
  loyal: [
    "Good morning! I'm right here with you, as always.",
    "Ready to tackle today together? I won't leave your side.",
    "Whatever comes, we'll face it as a team.",
  ],
};

const ENCOURAGEMENTS: Record<Personality, string[]> = {
  clever: [
    "Smart move! That's exactly what I would have done.",
    "See? I knew you had it figured out.",
    "Efficiency at its finest!",
  ],
  wise: [
    "Well done. Each small step matters.",
    "You're building something meaningful here.",
    "Patience and persistence. You have both.",
  ],
  independent: [
    "Not bad. I'm... impressed. Don't let it go to your head.",
    "*purrs* Fine, that was pretty good.",
    "You handled that. As expected.",
  ],
  gentle: [
    "I'm so proud of you! You're doing great! 🌟",
    "Every little bit counts, and you're amazing!",
    "You make my heart so happy when you take care of things!",
  ],
  powerful: [
    "THAT'S what I'm talking about! Unstoppable!",
    "Another victory! Keep that momentum going!",
    "You're a force of nature!",
  ],
  chill: [
    "Nice~ See? Not so bad when you just flow with it.",
    "Smooth. Very smooth.",
    "That's the vibe. Keep it easy.",
  ],
  playful: [
    "Woohoo! You did it! *happy dance*",
    "That was awesome! Do another one! Do another one!",
    "You're on fire! 🔥 (in a good way!)",
  ],
  loyal: [
    "I knew you could do it. I never doubted you.",
    "That's my human! Always coming through.",
    "We make a great team, don't we?",
  ],
};

export const useCompanionStore = create<CompanionState>((set, get) => ({
  companion: null,
  isLoading: false,

  setCompanion: (companion) => {
    set({ companion });
  },

  createCompanion: async (name, animalType) => {
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const animalOption = ANIMAL_OPTIONS.find(a => a.type === animalType);
      if (!animalOption) throw new Error('Invalid animal type');
      
      const newCompanion = {
        user_id: user.id,
        name,
        animal_type: animalType,
        personality: animalOption.personality,
        color: animalOption.color,
        energy: 50,
        level: 1,
        xp: 0,
      };
      
      const { data, error } = await supabase
        .from('companions')
        .insert(newCompanion)
        .select()
        .single();
      
      if (error) throw error;
      
      const companion = data as Companion;
      set({ companion, isLoading: false });
      
      // Also create wallet for user
      await supabase.from('wallets').insert({
        user_id: user.id,
        coins: 100, // Starting coins
        xp: 0,
      });
      
      return { error: null, companion };
    } catch (error) {
      set({ isLoading: false });
      return { error: error as Error };
    }
  },

  fetchCompanion: async (userId) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('companions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      set({ 
        companion: data as Companion | null, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching companion:', error);
      set({ isLoading: false });
    }
  },

  updateEnergy: async (amount) => {
    const { companion } = get();
    if (!companion) return;
    
    const newEnergy = Math.max(0, Math.min(100, companion.energy + amount));
    
    try {
      await supabase
        .from('companions')
        .update({ energy: newEnergy })
        .eq('id', companion.id);
      
      set({ 
        companion: { ...companion, energy: newEnergy } 
      });
    } catch (error) {
      console.error('Error updating energy:', error);
    }
  },

  addXP: async (amount) => {
    const { companion } = get();
    if (!companion) return;
    
    const newXP = companion.xp + amount;
    const xpPerLevel = 100; // XP needed per level
    const newLevel = Math.floor(newXP / xpPerLevel) + 1;
    
    try {
      await supabase
        .from('companions')
        .update({ xp: newXP, level: newLevel })
        .eq('id', companion.id);
      
      set({ 
        companion: { ...companion, xp: newXP, level: newLevel } 
      });
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  },

  getCompanionGreeting: () => {
    const { companion } = get();
    if (!companion) return "Hello!";
    
    const greetings = GREETINGS[companion.personality] || GREETINGS.gentle;
    return greetings[Math.floor(Math.random() * greetings.length)];
  },

  getCompanionEncouragement: () => {
    const { companion } = get();
    if (!companion) return "Great job!";
    
    const encouragements = ENCOURAGEMENTS[companion.personality] || ENCOURAGEMENTS.gentle;
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  },
}));
