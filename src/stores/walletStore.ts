import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Wallet } from '../types';

interface WalletState {
  wallet: Wallet | null;
  isLoading: boolean;
  
  // Actions
  fetchWallet: (userId: string) => Promise<void>;
  addCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<{ success: boolean; error?: Error }>;
  addXP: (amount: number) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  isLoading: false,

  fetchWallet: async (userId) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      set({ 
        wallet: data as Wallet | null, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      set({ isLoading: false });
    }
  },

  addCoins: async (amount) => {
    const { wallet } = get();
    if (!wallet) return;
    
    const newCoins = wallet.coins + amount;
    
    try {
      await supabase
        .from('wallets')
        .update({ 
          coins: newCoins,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', wallet.user_id);
      
      set({ 
        wallet: { ...wallet, coins: newCoins } 
      });
    } catch (error) {
      console.error('Error adding coins:', error);
    }
  },

  spendCoins: async (amount) => {
    const { wallet } = get();
    if (!wallet) return { success: false, error: new Error('No wallet') };
    
    if (wallet.coins < amount) {
      return { success: false, error: new Error('Insufficient coins') };
    }
    
    const newCoins = wallet.coins - amount;
    
    try {
      await supabase
        .from('wallets')
        .update({ 
          coins: newCoins,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', wallet.user_id);
      
      set({ 
        wallet: { ...wallet, coins: newCoins } 
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error spending coins:', error);
      return { success: false, error: error as Error };
    }
  },

  addXP: async (amount) => {
    const { wallet } = get();
    if (!wallet) return;
    
    const newXP = wallet.xp + amount;
    
    try {
      await supabase
        .from('wallets')
        .update({ 
          xp: newXP,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', wallet.user_id);
      
      set({ 
        wallet: { ...wallet, xp: newXP } 
      });
    } catch (error) {
      console.error('Error adding XP:', error);
    }
  },
}));
