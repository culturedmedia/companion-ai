import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

export interface Session {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'ios' | 'android' | 'web' | 'unknown';
  ip_address?: string;
  location?: string;
  user_agent?: string;
  last_active_at: string;
  created_at: string;
  is_current: boolean;
}

class SessionService {
  private currentSessionId: string | null = null;

  // Get device info
  private getDeviceInfo(): { name: string; type: 'ios' | 'android' | 'web' | 'unknown' } {
    if (Platform.OS === 'web') {
      return {
        name: 'Web Browser',
        type: 'web',
      };
    }

    const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
    const appName = Application.applicationName || 'CompanionAI';
    
    return {
      name: `${deviceName} - ${appName}`,
      type: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'unknown',
    };
  }

  // Create a new session on login
  async createSession(userId: string): Promise<Session | null> {
    try {
      const deviceInfo = this.getDeviceInfo();

      // First, mark all other sessions as not current
      await supabase
        .from('sessions')
        .update({ is_current: false })
        .eq('user_id', userId);

      // Create new session
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          device_name: deviceInfo.name,
          device_type: deviceInfo.type,
          is_current: true,
          last_active_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      this.currentSessionId = data.id;
      return data as Session;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  }

  // Update session activity
  async updateActivity(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await supabase
        .from('sessions')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', this.currentSessionId);
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  // Get all sessions for user
  async getSessions(userId: string): Promise<Session[]> {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_active_at', { ascending: false });

      if (error) throw error;

      // Mark current session
      return (data || []).map(session => ({
        ...session,
        is_current: session.id === this.currentSessionId,
      })) as Session[];
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  // Revoke a specific session
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to revoke session:', error);
      return false;
    }
  }

  // Revoke all sessions except current
  async revokeAllOtherSessions(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('user_id', userId)
        .neq('id', this.currentSessionId || '');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to revoke all sessions:', error);
      return false;
    }
  }

  // End current session (on logout)
  async endCurrentSession(): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await supabase
        .from('sessions')
        .delete()
        .eq('id', this.currentSessionId);

      this.currentSessionId = null;
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  // Get current session ID
  getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  // Set current session ID (for restoring from storage)
  setCurrentSessionId(sessionId: string): void {
    this.currentSessionId = sessionId;
  }
}

export const sessionService = new SessionService();
export default sessionService;
