import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Storage adapter - uses localStorage on web, AsyncStorage on native
const storageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return AsyncStorage.removeItem(key);
  },
};

// Supabase credentials - Set via environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
        };
        Update: {
          email?: string | null;
          display_name?: string | null;
          updated_at?: string;
        };
      };
      companions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          animal_type: string;
          personality: string;
          color: string;
          energy: number;
          level: number;
          xp: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          animal_type: string;
          personality?: string;
          color?: string;
        };
        Update: {
          name?: string;
          energy?: number;
          level?: number;
          xp?: number;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          priority: string;
          due_date: string | null;
          due_time: string | null;
          is_recurring: boolean;
          recurrence_pattern: string | null;
          status: string;
          completed_at: string | null;
          created_at: string;
          coins_reward: number;
          xp_reward: number;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          category?: string;
          priority?: string;
          due_date?: string | null;
          due_time?: string | null;
          is_recurring?: boolean;
          recurrence_pattern?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          category?: string;
          priority?: string;
          due_date?: string | null;
          due_time?: string | null;
          status?: string;
          completed_at?: string | null;
        };
      };
      wallets: {
        Row: {
          user_id: string;
          coins: number;
          xp: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          coins?: number;
          xp?: number;
        };
        Update: {
          coins?: number;
          xp?: number;
        };
      };
    };
  };
}
