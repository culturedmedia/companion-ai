import { supabase } from '../lib/supabase';

export interface Friend {
  id: string;
  friendId: string;
  displayName: string;
  companionName?: string;
  companionType?: string;
  companionLevel?: number;
  streak?: number;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

export interface Vibe {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromCompanionName?: string;
  fromCompanionType?: string;
  message: string;
  emoji: string;
  createdAt: Date;
  read: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  companionName?: string;
  companionType?: string;
  score: number;
  streak?: number;
}

// Vibe templates
const VIBE_TEMPLATES = [
  { emoji: '💪', message: "You've got this!" },
  { emoji: '⭐', message: "You're doing amazing!" },
  { emoji: '🌟', message: "Keep shining!" },
  { emoji: '🔥', message: "You're on fire!" },
  { emoji: '💝', message: "Sending love your way!" },
  { emoji: '🎉', message: "Celebrate every win!" },
  { emoji: '🌈', message: "Brighter days ahead!" },
  { emoji: '☀️', message: "You brighten my day!" },
  { emoji: '🦋', message: "Keep growing!" },
  { emoji: '🌸', message: "You're blooming!" },
];

class SocialService {
  // Search for users by email or display name
  async searchUsers(query: string, currentUserId: string): Promise<Array<{
    id: string;
    displayName: string;
    companionName?: string;
    companionType?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          companions (
            name,
            animal_type
          )
        `)
        .neq('id', currentUserId)
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      return (data || []).map(user => ({
        id: user.id,
        displayName: user.display_name || 'Anonymous',
        companionName: user.companions?.[0]?.name,
        companionType: user.companions?.[0]?.animal_type,
      }));
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  // Send friend request
  async sendFriendRequest(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if already friends or request pending
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          return { success: false, error: 'Already friends' };
        }
        if (existing.status === 'pending') {
          return { success: false, error: 'Request already pending' };
        }
      }

      const { error } = await supabase.from('friendships').insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending',
      });

      if (error) throw error;

      // Send notification to friend
      await this.sendNotification(friendId, 'friend_request', userId);

      return { success: true };
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return { success: false, error: 'Failed to send request' };
    }
  }

  // Accept friend request
  async acceptFriendRequest(friendshipId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  }

  // Decline friend request
  async declineFriendRequest(friendshipId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      return false;
    }
  }

  // Remove friend
  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      return false;
    }
  }

  // Get friends list
  async getFriends(userId: string): Promise<Friend[]> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at,
          friend:profiles!friendships_friend_id_fkey (
            id,
            display_name,
            companions (
              name,
              animal_type,
              level
            ),
            streaks (
              current_streak
            )
          ),
          user:profiles!friendships_user_id_fkey (
            id,
            display_name,
            companions (
              name,
              animal_type,
              level
            ),
            streaks (
              current_streak
            )
          )
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;

      return (data || []).map(friendship => {
        const isSender = friendship.user_id === userId;
        const friendProfile = isSender ? friendship.friend : friendship.user;
        
        return {
          id: friendship.id,
          friendId: friendProfile?.id || '',
          displayName: friendProfile?.display_name || 'Anonymous',
          companionName: friendProfile?.companions?.[0]?.name,
          companionType: friendProfile?.companions?.[0]?.animal_type,
          companionLevel: friendProfile?.companions?.[0]?.level,
          streak: friendProfile?.streaks?.[0]?.current_streak,
          status: friendship.status,
          createdAt: new Date(friendship.created_at),
        };
      });
    } catch (error) {
      console.error('Failed to get friends:', error);
      return [];
    }
  }

  // Get pending friend requests
  async getPendingRequests(userId: string): Promise<Friend[]> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          user_id,
          created_at,
          sender:profiles!friendships_user_id_fkey (
            id,
            display_name,
            companions (
              name,
              animal_type,
              level
            )
          )
        `)
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      return (data || []).map(request => ({
        id: request.id,
        friendId: request.sender?.id || '',
        displayName: request.sender?.display_name || 'Anonymous',
        companionName: request.sender?.companions?.[0]?.name,
        companionType: request.sender?.companions?.[0]?.animal_type,
        companionLevel: request.sender?.companions?.[0]?.level,
        status: 'pending' as const,
        createdAt: new Date(request.created_at),
      }));
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      return [];
    }
  }

  // Send a vibe (encouragement)
  async sendVibe(
    fromUserId: string,
    toUserId: string,
    vibeIndex?: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get sender info
      const { data: sender } = await supabase
        .from('profiles')
        .select(`
          display_name,
          companions (name, animal_type)
        `)
        .eq('id', fromUserId)
        .single();

      const vibe = vibeIndex !== undefined 
        ? VIBE_TEMPLATES[vibeIndex] 
        : VIBE_TEMPLATES[Math.floor(Math.random() * VIBE_TEMPLATES.length)];

      const { error } = await supabase.from('vibes').insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        from_user_name: sender?.display_name || 'A friend',
        from_companion_name: sender?.companions?.[0]?.name,
        from_companion_type: sender?.companions?.[0]?.animal_type,
        message: vibe.message,
        emoji: vibe.emoji,
      });

      if (error) throw error;

      // Send push notification
      await this.sendNotification(toUserId, 'vibe', fromUserId, vibe.message);

      return { success: true };
    } catch (error) {
      console.error('Failed to send vibe:', error);
      return { success: false, error: 'Failed to send vibe' };
    }
  }

  // Get received vibes
  async getVibes(userId: string, unreadOnly: boolean = false): Promise<Vibe[]> {
    try {
      let query = supabase
        .from('vibes')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(vibe => ({
        id: vibe.id,
        fromUserId: vibe.from_user_id,
        fromUserName: vibe.from_user_name,
        fromCompanionName: vibe.from_companion_name,
        fromCompanionType: vibe.from_companion_type,
        message: vibe.message,
        emoji: vibe.emoji,
        createdAt: new Date(vibe.created_at),
        read: vibe.read,
      }));
    } catch (error) {
      console.error('Failed to get vibes:', error);
      return [];
    }
  }

  // Mark vibes as read
  async markVibesAsRead(vibeIds: string[]): Promise<void> {
    try {
      await supabase
        .from('vibes')
        .update({ read: true })
        .in('id', vibeIds);
    } catch (error) {
      console.error('Failed to mark vibes as read:', error);
    }
  }

  // Get leaderboard
  async getLeaderboard(
    type: 'weekly' | 'monthly' | 'allTime' = 'weekly',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    try {
      let startDate: Date | null = null;
      
      if (type === 'weekly') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (type === 'monthly') {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // Get task completion counts
      let query = supabase
        .from('tasks')
        .select(`
          user_id,
          profiles!inner (
            display_name,
            companions (
              name,
              animal_type
            ),
            streaks (
              current_streak
            )
          )
        `)
        .eq('status', 'completed');

      if (startDate) {
        query = query.gte('completed_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate scores
      const scoreMap = new Map<string, {
        userId: string;
        displayName: string;
        companionName?: string;
        companionType?: string;
        streak?: number;
        score: number;
      }>();

      for (const task of data || []) {
        const existing = scoreMap.get(task.user_id);
        if (existing) {
          existing.score++;
        } else {
          scoreMap.set(task.user_id, {
            userId: task.user_id,
            displayName: task.profiles?.display_name || 'Anonymous',
            companionName: task.profiles?.companions?.[0]?.name,
            companionType: task.profiles?.companions?.[0]?.animal_type,
            streak: task.profiles?.streaks?.[0]?.current_streak,
            score: 1,
          });
        }
      }

      // Sort and rank
      const sorted = Array.from(scoreMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return sorted.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  // Get user's rank
  async getUserRank(userId: string, type: 'weekly' | 'monthly' | 'allTime' = 'weekly'): Promise<number | null> {
    const leaderboard = await this.getLeaderboard(type, 1000);
    const entry = leaderboard.find(e => e.userId === userId);
    return entry?.rank || null;
  }

  // Send notification helper
  private async sendNotification(
    userId: string,
    type: 'friend_request' | 'vibe' | 'friend_accepted',
    fromUserId: string,
    message?: string
  ): Promise<void> {
    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type,
        from_user_id: fromUserId,
        message,
        read: false,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Get vibe templates
  getVibeTemplates(): typeof VIBE_TEMPLATES {
    return VIBE_TEMPLATES;
  }
}

export const socialService = new SocialService();
export default socialService;
