import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  
  // Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setOnboarded: (value: boolean) => void;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      profile: null,
      isLoading: true,
      isOnboarded: false,

      setSession: (session) => {
        set({ 
          session, 
          user: session?.user ?? null,
          isLoading: false 
        });
      },

      setProfile: (profile) => {
        set({ profile });
      },

      setOnboarded: (value) => {
        set({ isOnboarded: value });
      },

      signUp: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (error) throw error;
          
          if (data.session) {
            set({ 
              session: data.session, 
              user: data.user,
              isLoading: false 
            });
            
            // Create profile
            if (data.user) {
              await supabase.from('profiles').insert({
                id: data.user.id,
                email: data.user.email,
              });
            }
          }
          
          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },

      signIn: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          set({ 
            session: data.session, 
            user: data.user,
            isLoading: false 
          });
          
          // Fetch profile
          if (data.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            if (profile) {
              set({ profile: profile as UserProfile });
            }
          }
          
          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ 
          session: null, 
          user: null, 
          profile: null,
          isOnboarded: false,
          isLoading: false 
        });
      },

      initialize: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            // Check if user has a companion (means they completed onboarding)
            const { data: companion } = await supabase
              .from('companions')
              .select('id')
              .eq('user_id', session.user.id)
              .single();
            
            set({ 
              session, 
              user: session.user,
              profile: profile as UserProfile | null,
              isOnboarded: !!companion,
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
          
          // Listen for auth changes
          supabase.auth.onAuthStateChange((_event, session) => {
            set({ 
              session, 
              user: session?.user ?? null 
            });
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isLoading: false });
        }
      },

      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return { error: new Error('Not authenticated') };
        
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', user.id);
          
          if (error) throw error;
          
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null
          }));
          
          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ 
        isOnboarded: state.isOnboarded 
      }),
    }
  )
);
