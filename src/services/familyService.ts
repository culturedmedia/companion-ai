import { supabase } from '../lib/supabase';

export interface Family {
  id: string;
  name: string;
  createdBy: string;
  inviteCode: string;
  createdAt: Date;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  displayName: string;
  role: 'admin' | 'member';
  companionName?: string;
  companionType?: string;
  joinedAt: Date;
}

export interface FamilyTask {
  id: string;
  familyId: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdBy: string;
  createdByName: string;
  dueDate?: string;
  status: 'pending' | 'completed';
  completedBy?: string;
  completedByName?: string;
  completedAt?: Date;
  points: number;
  recurring?: 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
}

export interface FamilyStats {
  totalTasks: number;
  completedTasks: number;
  memberStats: Array<{
    userId: string;
    displayName: string;
    tasksCompleted: number;
    points: number;
  }>;
}

class FamilyService {
  // Create a new family
  async createFamily(userId: string, familyName: string): Promise<{ family?: Family; error?: string }> {
    try {
      // Generate unique invite code
      const inviteCode = this.generateInviteCode();

      const { data, error } = await supabase
        .from('families')
        .insert({
          name: familyName,
          created_by: userId,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase.from('family_members').insert({
        family_id: data.id,
        user_id: userId,
        role: 'admin',
      });

      return {
        family: {
          id: data.id,
          name: data.name,
          createdBy: data.created_by,
          inviteCode: data.invite_code,
          createdAt: new Date(data.created_at),
        },
      };
    } catch (error) {
      console.error('Failed to create family:', error);
      return { error: 'Failed to create family' };
    }
  }

  // Join family with invite code
  async joinFamily(userId: string, inviteCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Find family by invite code
      const { data: family, error: findError } = await supabase
        .from('families')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (findError || !family) {
        return { success: false, error: 'Invalid invite code' };
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', family.id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return { success: false, error: 'Already a member of this family' };
      }

      // Add as member
      const { error: joinError } = await supabase.from('family_members').insert({
        family_id: family.id,
        user_id: userId,
        role: 'member',
      });

      if (joinError) throw joinError;

      return { success: true };
    } catch (error) {
      console.error('Failed to join family:', error);
      return { success: false, error: 'Failed to join family' };
    }
  }

  // Leave family
  async leaveFamily(userId: string, familyId: string): Promise<boolean> {
    try {
      // Check if user is the only admin
      const { data: admins } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_id', familyId)
        .eq('role', 'admin');

      const { data: userMember } = await supabase
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .single();

      if (userMember?.role === 'admin' && admins?.length === 1) {
        // Transfer admin to another member or delete family
        const { data: otherMembers } = await supabase
          .from('family_members')
          .select('id, user_id')
          .eq('family_id', familyId)
          .neq('user_id', userId)
          .limit(1);

        if (otherMembers && otherMembers.length > 0) {
          // Transfer admin
          await supabase
            .from('family_members')
            .update({ role: 'admin' })
            .eq('id', otherMembers[0].id);
        } else {
          // Delete family (no other members)
          await supabase.from('families').delete().eq('id', familyId);
          return true;
        }
      }

      // Remove member
      await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', userId);

      return true;
    } catch (error) {
      console.error('Failed to leave family:', error);
      return false;
    }
  }

  // Get user's families
  async getUserFamilies(userId: string): Promise<Family[]> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          families (
            id,
            name,
            created_by,
            invite_code,
            created_at
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return (data || [])
        .filter(d => d.families)
        .map(d => ({
          id: d.families.id,
          name: d.families.name,
          createdBy: d.families.created_by,
          inviteCode: d.families.invite_code,
          createdAt: new Date(d.families.created_at),
        }));
    } catch (error) {
      console.error('Failed to get families:', error);
      return [];
    }
  }

  // Get family members
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          id,
          family_id,
          user_id,
          role,
          created_at,
          profiles (
            display_name,
            companions (
              name,
              animal_type
            )
          )
        `)
        .eq('family_id', familyId);

      if (error) throw error;

      return (data || []).map(member => ({
        id: member.id,
        familyId: member.family_id,
        userId: member.user_id,
        displayName: member.profiles?.display_name || 'Anonymous',
        role: member.role,
        companionName: member.profiles?.companions?.[0]?.name,
        companionType: member.profiles?.companions?.[0]?.animal_type,
        joinedAt: new Date(member.created_at),
      }));
    } catch (error) {
      console.error('Failed to get family members:', error);
      return [];
    }
  }

  // Create family task
  async createFamilyTask(
    familyId: string,
    createdBy: string,
    task: {
      title: string;
      description?: string;
      assignedTo?: string;
      dueDate?: string;
      points?: number;
      recurring?: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<{ task?: FamilyTask; error?: string }> {
    try {
      // Get creator name
      const { data: creator } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', createdBy)
        .single();

      // Get assignee name if assigned
      let assignedToName: string | undefined;
      if (task.assignedTo) {
        const { data: assignee } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', task.assignedTo)
          .single();
        assignedToName = assignee?.display_name;
      }

      const { data, error } = await supabase
        .from('family_tasks')
        .insert({
          family_id: familyId,
          title: task.title,
          description: task.description,
          assigned_to: task.assignedTo,
          assigned_to_name: assignedToName,
          created_by: createdBy,
          created_by_name: creator?.display_name || 'Unknown',
          due_date: task.dueDate,
          points: task.points || 10,
          recurring: task.recurring,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        task: {
          id: data.id,
          familyId: data.family_id,
          title: data.title,
          description: data.description,
          assignedTo: data.assigned_to,
          assignedToName: data.assigned_to_name,
          createdBy: data.created_by,
          createdByName: data.created_by_name,
          dueDate: data.due_date,
          status: data.status,
          points: data.points,
          recurring: data.recurring,
          createdAt: new Date(data.created_at),
        },
      };
    } catch (error) {
      console.error('Failed to create family task:', error);
      return { error: 'Failed to create task' };
    }
  }

  // Get family tasks
  async getFamilyTasks(familyId: string, status?: 'pending' | 'completed'): Promise<FamilyTask[]> {
    try {
      let query = supabase
        .from('family_tasks')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(task => ({
        id: task.id,
        familyId: task.family_id,
        title: task.title,
        description: task.description,
        assignedTo: task.assigned_to,
        assignedToName: task.assigned_to_name,
        createdBy: task.created_by,
        createdByName: task.created_by_name,
        dueDate: task.due_date,
        status: task.status,
        completedBy: task.completed_by,
        completedByName: task.completed_by_name,
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        points: task.points,
        recurring: task.recurring,
        createdAt: new Date(task.created_at),
      }));
    } catch (error) {
      console.error('Failed to get family tasks:', error);
      return [];
    }
  }

  // Complete family task
  async completeFamilyTask(taskId: string, completedBy: string): Promise<boolean> {
    try {
      // Get completer name
      const { data: completer } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', completedBy)
        .single();

      const { data: task, error } = await supabase
        .from('family_tasks')
        .update({
          status: 'completed',
          completed_by: completedBy,
          completed_by_name: completer?.display_name || 'Unknown',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      // If recurring, create next instance
      if (task.recurring) {
        const nextDueDate = this.getNextRecurringDate(task.due_date, task.recurring);
        await supabase.from('family_tasks').insert({
          family_id: task.family_id,
          title: task.title,
          description: task.description,
          assigned_to: task.assigned_to,
          assigned_to_name: task.assigned_to_name,
          created_by: task.created_by,
          created_by_name: task.created_by_name,
          due_date: nextDueDate,
          points: task.points,
          recurring: task.recurring,
          status: 'pending',
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to complete family task:', error);
      return false;
    }
  }

  // Get family stats
  async getFamilyStats(familyId: string, period: 'week' | 'month' | 'all' = 'week'): Promise<FamilyStats> {
    try {
      let startDate: Date | null = null;
      
      if (period === 'week') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (period === 'month') {
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
      }

      let query = supabase
        .from('family_tasks')
        .select('*')
        .eq('family_id', familyId);

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      const completedTasks = (tasks || []).filter(t => t.status === 'completed');
      
      // Aggregate by member
      const memberMap = new Map<string, { displayName: string; tasksCompleted: number; points: number }>();
      
      for (const task of completedTasks) {
        if (task.completed_by) {
          const existing = memberMap.get(task.completed_by);
          if (existing) {
            existing.tasksCompleted++;
            existing.points += task.points || 0;
          } else {
            memberMap.set(task.completed_by, {
              displayName: task.completed_by_name || 'Unknown',
              tasksCompleted: 1,
              points: task.points || 0,
            });
          }
        }
      }

      return {
        totalTasks: tasks?.length || 0,
        completedTasks: completedTasks.length,
        memberStats: Array.from(memberMap.entries())
          .map(([userId, stats]) => ({ userId, ...stats }))
          .sort((a, b) => b.points - a.points),
      };
    } catch (error) {
      console.error('Failed to get family stats:', error);
      return { totalTasks: 0, completedTasks: 0, memberStats: [] };
    }
  }

  // Regenerate invite code
  async regenerateInviteCode(familyId: string, userId: string): Promise<string | null> {
    try {
      // Check if user is admin
      const { data: member } = await supabase
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .single();

      if (member?.role !== 'admin') {
        return null;
      }

      const newCode = this.generateInviteCode();

      await supabase
        .from('families')
        .update({ invite_code: newCode })
        .eq('id', familyId);

      return newCode;
    } catch (error) {
      console.error('Failed to regenerate invite code:', error);
      return null;
    }
  }

  // Helper: Generate invite code
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Helper: Get next recurring date
  private getNextRecurringDate(currentDate: string | null, recurring: string): string {
    const date = currentDate ? new Date(currentDate) : new Date();
    
    switch (recurring) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    
    return date.toISOString().split('T')[0];
  }
}

export const familyService = new FamilyService();
export default familyService;
