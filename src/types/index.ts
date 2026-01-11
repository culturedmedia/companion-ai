// Animal types available for companions
export type AnimalType = 
  | 'fox' 
  | 'owl' 
  | 'cat' 
  | 'bunny' 
  | 'dragon' 
  | 'axolotl' 
  | 'red_panda' 
  | 'penguin';

export type Personality = 
  | 'clever'      // Fox
  | 'wise'        // Owl
  | 'independent' // Cat
  | 'gentle'      // Bunny
  | 'powerful'    // Dragon
  | 'chill'       // Axolotl
  | 'playful'     // Red Panda
  | 'loyal';      // Penguin

export interface AnimalOption {
  type: AnimalType;
  emoji: string;
  name: string;
  personality: Personality;
  description: string;
  color: string;
}

export const ANIMAL_OPTIONS: AnimalOption[] = [
  { type: 'fox', emoji: '🦊', name: 'Fox', personality: 'clever', description: 'Clever & Resourceful', color: '#FF6B35' },
  { type: 'owl', emoji: '🦉', name: 'Owl', personality: 'wise', description: 'Wise & Observant', color: '#8B5A2B' },
  { type: 'cat', emoji: '🐱', name: 'Cat', personality: 'independent', description: 'Independent & Cozy', color: '#FFB347' },
  { type: 'bunny', emoji: '🐰', name: 'Bunny', personality: 'gentle', description: 'Gentle & Encouraging', color: '#FFB6C1' },
  { type: 'dragon', emoji: '🐉', name: 'Dragon', personality: 'powerful', description: 'Powerful & Protective', color: '#7B68EE' },
  { type: 'axolotl', emoji: '🦎', name: 'Axolotl', personality: 'chill', description: 'Chill & Adaptable', color: '#FF69B4' },
  { type: 'red_panda', emoji: '🐼', name: 'Red Panda', personality: 'playful', description: 'Playful & Curious', color: '#CD5C5C' },
  { type: 'penguin', emoji: '🐧', name: 'Penguin', personality: 'loyal', description: 'Loyal & Determined', color: '#4169E1' },
];

// Companion interface
export interface Companion {
  id: string;
  user_id: string;
  name: string;
  animal_type: AnimalType;
  personality: Personality;
  color: string;
  energy: number;      // 0-100
  level: number;       // 1+
  xp: number;          // Experience points
  created_at: string;
}

// Task categories
export type TaskCategory = 
  | 'work' 
  | 'personal' 
  | 'health' 
  | 'finance' 
  | 'errands' 
  | 'social';

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'completed' | 'cancelled';
export type RecurrencePattern = 'daily' | 'weekly' | 'weekdays' | 'monthly' | null;

export interface TaskCategoryInfo {
  id: TaskCategory;
  name: string;
  emoji: string;
  color: string;
  keywords: string[];
}

export const TASK_CATEGORIES: TaskCategoryInfo[] = [
  { 
    id: 'work', 
    name: 'Work', 
    emoji: '💼', 
    color: '#6366f1',
    keywords: ['meeting', 'report', 'email', 'deadline', 'project', 'client', 'presentation', 'call with', 'standup']
  },
  { 
    id: 'personal', 
    name: 'Personal', 
    emoji: '🏠', 
    color: '#8b5cf6',
    keywords: ['call mom', 'call dad', 'grocery', 'laundry', 'clean', 'cook', 'home', 'family']
  },
  { 
    id: 'health', 
    name: 'Health', 
    emoji: '🏥', 
    color: '#10b981',
    keywords: ['doctor', 'dentist', 'gym', 'medication', 'appointment', 'workout', 'exercise', 'run', 'walk']
  },
  { 
    id: 'finance', 
    name: 'Finance', 
    emoji: '💰', 
    color: '#f59e0b',
    keywords: ['pay', 'bill', 'bank', 'budget', 'invoice', 'tax', 'rent', 'mortgage']
  },
  { 
    id: 'errands', 
    name: 'Errands', 
    emoji: '🛒', 
    color: '#ec4899',
    keywords: ['pick up', 'drop off', 'return', 'buy', 'store', 'shop', 'get', 'mail']
  },
  { 
    id: 'social', 
    name: 'Social', 
    emoji: '👥', 
    color: '#06b6d4',
    keywords: ['dinner with', 'birthday', 'party', 'visit', 'hang out', 'meet', 'lunch with', 'coffee with']
  },
];

// Task interface
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string | null;      // YYYY-MM-DD
  due_time: string | null;      // HH:MM
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern;
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
  coins_reward: number;
  xp_reward: number;
}

// Wallet interface
export interface Wallet {
  user_id: string;
  coins: number;
  xp: number;
  updated_at: string;
}

// User profile
export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

// Voice intent types
export type VoiceIntent =
  | { type: 'CREATE_TASK'; title: string; dueDate?: string; dueTime?: string; priority?: TaskPriority; category?: TaskCategory }
  | { type: 'COMPLETE_TASK'; taskName: string }
  | { type: 'LIST_TASKS'; filter?: 'today' | 'week' | 'overdue' | 'all'; category?: TaskCategory }
  | { type: 'RESCHEDULE_TASK'; taskName: string; newDate: string }
  | { type: 'DELETE_TASK'; taskName: string }
  | { type: 'CREATE_EVENT'; title: string; date: string; time?: string }
  | { type: 'LIST_EVENTS'; date: 'today' | 'tomorrow' | 'week' | string }
  | { type: 'SET_REMINDER'; message: string; time: string; recurring?: RecurrencePattern }
  | { type: 'WEEKLY_REVIEW' }
  | { type: 'FOCUS_TODAY' }
  | { type: 'INCOMPLETE_TASKS' }
  | { type: 'TALK_TO_COMPANION'; message: string }
  | { type: 'CHECK_COMPANION' }
  | { type: 'NAVIGATE'; screen: string }
  | { type: 'HELP' }
  | { type: 'UNKNOWN'; raw: string };

// Companion messages
export interface CompanionMessage {
  id: string;
  type: 'greeting' | 'encouragement' | 'reminder' | 'celebration' | 'question' | 'response';
  text: string;
  timestamp: string;
}
