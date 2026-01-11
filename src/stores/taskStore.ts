import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Task, TaskCategory, TaskPriority, TaskStatus, RecurrencePattern, TASK_CATEGORIES } from '../types';
import { useCompanionStore } from './companionStore';
import { useWalletStore } from './walletStore';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  
  // Actions
  fetchTasks: (userId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'completed_at' | 'status' | 'coins_reward' | 'xp_reward'>) => Promise<{ error: Error | null; task?: Task }>;
  createRecurringTask: (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'completed_at' | 'status' | 'coins_reward' | 'xp_reward'>, recurrence: RecurrencePattern) => Promise<{ error: Error | null; task?: Task }>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<{ error: Error | null }>;
  completeTask: (taskId: string) => Promise<{ error: Error | null; coinsEarned?: number; xpEarned?: number }>;
  deleteTask: (taskId: string) => Promise<{ error: Error | null }>;
  skipRecurringTask: (taskId: string) => Promise<{ error: Error | null }>;
  
  // Queries
  getTodaysTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getTasksByCategory: (category: TaskCategory) => Task[];
  getIncompleteTasks: () => Task[];
  getWeekTasks: () => Task[];
  getLastWeekIncomplete: () => Task[];
  searchTasks: (query: string) => Task[];
  
  // Auto-categorization
  detectCategory: (title: string) => TaskCategory;
  calculateRewards: (priority: TaskPriority) => { coins: number; xp: number };
  
  // Recurring task helpers
  generateNextOccurrence: (task: Task) => Date | null;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async (userId) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ tasks: (data as Task[]) || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ isLoading: false });
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // Auto-detect category if not provided
      const category = taskData.category || get().detectCategory(taskData.title);
      const priority = taskData.priority || 'medium';
      const rewards = get().calculateRewards(priority);
      
      const newTask = {
        ...taskData,
        user_id: user.id,
        category,
        priority,
        status: 'pending' as TaskStatus,
        coins_reward: rewards.coins,
        xp_reward: rewards.xp,
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();
      
      if (error) throw error;
      
      const task = data as Task;
      set((state) => ({ 
        tasks: [task, ...state.tasks],
        isLoading: false 
      }));
      
      return { error: null, task };
    } catch (error) {
      set({ isLoading: false });
      return { error: error as Error };
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);
      
      if (error) throw error;
      
      set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === taskId ? { ...t, ...updates } : t
        )
      }));
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  completeTask: async (taskId) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Task not found');
      
      const completedAt = new Date().toISOString();
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed', 
          completed_at: completedAt 
        })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        tasks: state.tasks.map(t => 
          t.id === taskId 
            ? { ...t, status: 'completed' as TaskStatus, completed_at: completedAt } 
            : t
        )
      }));
      
      // Add rewards
      const coinsEarned = task.coins_reward;
      const xpEarned = task.xp_reward;
      
      // Update wallet
      await useWalletStore.getState().addCoins(coinsEarned);
      await useWalletStore.getState().addXP(xpEarned);
      
      // Update companion energy
      const energyGain = task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5;
      await useCompanionStore.getState().updateEnergy(energyGain);
      await useCompanionStore.getState().addXP(xpEarned);
      
      return { error: null, coinsEarned, xpEarned };
    } catch (error) {
      return { error: error as Error };
    }
  },

  deleteTask: async (taskId) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      }));
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  getTodaysTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(t => 
      t.status === 'pending' && 
      (t.due_date === today || !t.due_date)
    );
  },

  getOverdueTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(t => 
      t.status === 'pending' && 
      t.due_date && 
      t.due_date < today
    );
  },

  getTasksByCategory: (category) => {
    return get().tasks.filter(t => t.category === category && t.status === 'pending');
  },

  getIncompleteTasks: () => {
    return get().tasks.filter(t => t.status === 'pending');
  },

  getWeekTasks: () => {
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekStr = weekFromNow.toISOString().split('T')[0];
    
    return get().tasks.filter(t => 
      t.status === 'pending' && 
      (!t.due_date || (t.due_date >= todayStr && t.due_date <= weekStr))
    );
  },

  getLastWeekIncomplete: () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const todayStr = today.toISOString().split('T')[0];
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    return get().tasks.filter(t => 
      t.status === 'pending' && 
      t.due_date && 
      t.due_date >= weekAgoStr && 
      t.due_date < todayStr
    );
  },

  searchTasks: (query: string) => {
    const lowerQuery = query.toLowerCase();
    return get().tasks.filter(t => 
      t.title.toLowerCase().includes(lowerQuery) ||
      (t.description && t.description.toLowerCase().includes(lowerQuery))
    );
  },

  detectCategory: (title: string): TaskCategory => {
    const lowerTitle = title.toLowerCase();
    
    for (const category of TASK_CATEGORIES) {
      for (const keyword of category.keywords) {
        if (lowerTitle.includes(keyword.toLowerCase())) {
          return category.id;
        }
      }
    }
    
    return 'personal'; // Default category
  },

  calculateRewards: (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return { coins: 15, xp: 20 };
      case 'medium':
        return { coins: 10, xp: 10 };
      case 'low':
        return { coins: 5, xp: 5 };
      default:
        return { coins: 10, xp: 10 };
    }
  },

  createRecurringTask: async (taskData, recurrence) => {
    set({ isLoading: true });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const category = taskData.category || get().detectCategory(taskData.title);
      const priority = taskData.priority || 'medium';
      const rewards = get().calculateRewards(priority);
      
      const newTask = {
        ...taskData,
        user_id: user.id,
        category,
        priority,
        status: 'pending' as TaskStatus,
        coins_reward: rewards.coins,
        xp_reward: rewards.xp,
        recurrence,
        is_recurring: true,
      };
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(newTask)
        .select()
        .single();
      
      if (error) throw error;
      
      const task = data as Task;
      set((state) => ({ 
        tasks: [task, ...state.tasks],
        isLoading: false 
      }));
      
      return { error: null, task };
    } catch (error) {
      set({ isLoading: false });
      return { error: error as Error };
    }
  },

  skipRecurringTask: async (taskId) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task || !task.is_recurring) {
        throw new Error('Task not found or not recurring');
      }
      
      // Generate next occurrence
      const nextDate = get().generateNextOccurrence(task);
      
      if (nextDate) {
        // Update to next occurrence
        const { error } = await supabase
          .from('tasks')
          .update({ 
            due_date: nextDate.toISOString().split('T')[0],
            status: 'pending'
          })
          .eq('id', taskId);
        
        if (error) throw error;
        
        set((state) => ({
          tasks: state.tasks.map(t => 
            t.id === taskId 
              ? { ...t, due_date: nextDate.toISOString().split('T')[0], status: 'pending' as TaskStatus } 
              : t
          )
        }));
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  generateNextOccurrence: (task: Task): Date | null => {
    if (!task.recurrence || !task.due_date) return null;
    
    const currentDate = new Date(task.due_date);
    const { frequency, interval = 1, endDate, daysOfWeek } = task.recurrence;
    
    // Check if we've passed the end date
    if (endDate && new Date(endDate) < currentDate) {
      return null;
    }
    
    let nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          // Find next day of week
          const currentDay = nextDate.getDay();
          const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
          const nextDay = sortedDays.find(d => d > currentDay) || sortedDays[0];
          
          if (nextDay <= currentDay) {
            nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextDay));
          } else {
            nextDate.setDate(nextDate.getDate() + (nextDay - currentDay));
          }
        } else {
          nextDate.setDate(nextDate.getDate() + (7 * interval));
        }
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }
    
    // Check if next date is past end date
    if (endDate && nextDate > new Date(endDate)) {
      return null;
    }
    
    return nextDate;
  },
}));
