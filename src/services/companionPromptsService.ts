import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CompanionPrompt {
  id: string;
  type: 'morning' | 'afternoon' | 'evening' | 'task_reminder' | 'encouragement' | 'check_in' | 'celebration';
  message: string;
  followUp?: string;
  action?: 'add_task' | 'view_tasks' | 'journal' | 'wellness' | 'none';
}

// Prompt templates by time of day and context
const PROMPTS: Record<string, CompanionPrompt[]> = {
  morning: [
    {
      id: 'morning_1',
      type: 'morning',
      message: "Good morning! ☀️ What's the most important thing you want to accomplish today?",
      followUp: "I'll help you stay focused on it!",
      action: 'add_task',
    },
    {
      id: 'morning_2',
      type: 'morning',
      message: "Rise and shine! 🌅 Is there anything that might get in the way of your goals today?",
      followUp: "Let's plan around it together.",
      action: 'none',
    },
    {
      id: 'morning_3',
      type: 'morning',
      message: "Hey there! Ready to make today amazing? What are you looking forward to?",
      action: 'none',
    },
    {
      id: 'morning_4',
      type: 'morning',
      message: "Good morning! 🌸 How did you sleep? Let's set you up for a great day.",
      action: 'view_tasks',
    },
  ],
  afternoon: [
    {
      id: 'afternoon_1',
      type: 'afternoon',
      message: "How's your day going so far? Need help prioritizing anything?",
      action: 'view_tasks',
    },
    {
      id: 'afternoon_2',
      type: 'afternoon',
      message: "Afternoon check-in! 🌤️ Have you taken a break today?",
      followUp: "Remember, rest helps you be more productive!",
      action: 'wellness',
    },
    {
      id: 'afternoon_3',
      type: 'afternoon',
      message: "Hey! Just checking in. Is there anything I can help you with?",
      action: 'none',
    },
  ],
  evening: [
    {
      id: 'evening_1',
      type: 'evening',
      message: "Evening! 🌙 What was the best part of your day?",
      followUp: "I'd love to hear about it.",
      action: 'journal',
    },
    {
      id: 'evening_2',
      type: 'evening',
      message: "Winding down? Let's review what you accomplished today! 🎉",
      action: 'view_tasks',
    },
    {
      id: 'evening_3',
      type: 'evening',
      message: "Time to relax! Would you like to do a quick breathing exercise?",
      action: 'wellness',
    },
  ],
  task_reminder: [
    {
      id: 'task_1',
      type: 'task_reminder',
      message: "Hey! You have some tasks due today. Want to take a look?",
      action: 'view_tasks',
    },
    {
      id: 'task_2',
      type: 'task_reminder',
      message: "Friendly reminder: You've got things on your list! Let's tackle them together. 💪",
      action: 'view_tasks',
    },
  ],
  encouragement: [
    {
      id: 'encourage_1',
      type: 'encouragement',
      message: "You're doing great! Every small step counts. 🌟",
      action: 'none',
    },
    {
      id: 'encourage_2',
      type: 'encouragement',
      message: "I believe in you! You've got this. 💪",
      action: 'none',
    },
    {
      id: 'encourage_3',
      type: 'encouragement',
      message: "Remember: Progress, not perfection! You're amazing. ✨",
      action: 'none',
    },
  ],
  check_in: [
    {
      id: 'checkin_1',
      type: 'check_in',
      message: "Hey! I noticed you haven't checked in today. How are you feeling?",
      action: 'journal',
    },
    {
      id: 'checkin_2',
      type: 'check_in',
      message: "Just wanted to say hi! 👋 Is there anything on your mind?",
      action: 'none',
    },
  ],
  celebration: [
    {
      id: 'celebrate_1',
      type: 'celebration',
      message: "Woohoo! You completed all your tasks today! 🎉",
      followUp: "I'm so proud of you!",
      action: 'none',
    },
    {
      id: 'celebrate_2',
      type: 'celebration',
      message: "Amazing! You're on a streak! Keep up the great work! 🔥",
      action: 'none',
    },
  ],
  incomplete_tasks: [
    {
      id: 'incomplete_1',
      type: 'task_reminder',
      message: "I noticed some tasks from yesterday didn't get done. That's okay! Want to reschedule them?",
      action: 'view_tasks',
    },
    {
      id: 'incomplete_2',
      type: 'task_reminder',
      message: "Hey! You have some tasks that rolled over. Should we look at them together?",
      action: 'view_tasks',
    },
  ],
};

const STORAGE_KEY = '@companion_prompts';

interface PromptHistory {
  lastPromptId: string;
  lastPromptTime: string;
  promptsShownToday: string[];
  lastMorningPrompt?: string;
  lastEveningPrompt?: string;
}

class CompanionPromptsService {
  private history: PromptHistory | null = null;

  // Load prompt history
  async loadHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
        
        // Reset daily prompts if it's a new day
        const lastDate = new Date(this.history!.lastPromptTime).toDateString();
        const today = new Date().toDateString();
        if (lastDate !== today) {
          this.history!.promptsShownToday = [];
        }
      } else {
        this.history = {
          lastPromptId: '',
          lastPromptTime: new Date().toISOString(),
          promptsShownToday: [],
        };
      }
    } catch (error) {
      console.error('Failed to load prompt history:', error);
      this.history = {
        lastPromptId: '',
        lastPromptTime: new Date().toISOString(),
        promptsShownToday: [],
      };
    }
  }

  // Save prompt history
  private async saveHistory(): Promise<void> {
    if (!this.history) return;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save prompt history:', error);
    }
  }

  // Get time of day
  private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    return 'evening';
  }

  // Check if enough time has passed since last prompt
  private canShowPrompt(minMinutes: number = 60): boolean {
    if (!this.history) return true;
    
    const lastTime = new Date(this.history.lastPromptTime).getTime();
    const now = Date.now();
    const diffMinutes = (now - lastTime) / (1000 * 60);
    
    return diffMinutes >= minMinutes;
  }

  // Get a contextual prompt
  async getPrompt(context?: {
    hasTasksDueToday?: boolean;
    hasIncompleteTasks?: boolean;
    completedAllTasks?: boolean;
    isOnStreak?: boolean;
    lastJournalDate?: Date;
  }): Promise<CompanionPrompt | null> {
    await this.loadHistory();

    // Don't show prompts too frequently
    if (!this.canShowPrompt(60)) {
      return null;
    }

    let promptCategory: string;

    // Determine best prompt category based on context
    if (context?.completedAllTasks) {
      promptCategory = 'celebration';
    } else if (context?.hasIncompleteTasks) {
      promptCategory = 'incomplete_tasks';
    } else if (context?.hasTasksDueToday) {
      promptCategory = 'task_reminder';
    } else {
      promptCategory = this.getTimeOfDay();
    }

    // Get prompts for this category
    const categoryPrompts = PROMPTS[promptCategory] || PROMPTS[this.getTimeOfDay()];
    
    // Filter out recently shown prompts
    const availablePrompts = categoryPrompts.filter(
      p => !this.history?.promptsShownToday.includes(p.id)
    );

    // If all prompts shown, reset and use any
    const promptPool = availablePrompts.length > 0 ? availablePrompts : categoryPrompts;
    
    // Pick random prompt
    const prompt = promptPool[Math.floor(Math.random() * promptPool.length)];

    // Record this prompt
    if (this.history) {
      this.history.lastPromptId = prompt.id;
      this.history.lastPromptTime = new Date().toISOString();
      this.history.promptsShownToday.push(prompt.id);
      await this.saveHistory();
    }

    return prompt;
  }

  // Get a specific type of prompt
  async getPromptByType(type: CompanionPrompt['type']): Promise<CompanionPrompt | null> {
    await this.loadHistory();

    const typePrompts = Object.values(PROMPTS)
      .flat()
      .filter(p => p.type === type);

    if (typePrompts.length === 0) return null;

    const availablePrompts = typePrompts.filter(
      p => !this.history?.promptsShownToday.includes(p.id)
    );

    const promptPool = availablePrompts.length > 0 ? availablePrompts : typePrompts;
    const prompt = promptPool[Math.floor(Math.random() * promptPool.length)];

    if (this.history) {
      this.history.lastPromptId = prompt.id;
      this.history.lastPromptTime = new Date().toISOString();
      this.history.promptsShownToday.push(prompt.id);
      await this.saveHistory();
    }

    return prompt;
  }

  // Mark prompt as dismissed (user saw it)
  async dismissPrompt(promptId: string): Promise<void> {
    await this.loadHistory();
    if (this.history && !this.history.promptsShownToday.includes(promptId)) {
      this.history.promptsShownToday.push(promptId);
      await this.saveHistory();
    }
  }

  // Reset daily prompts (for testing)
  async resetDaily(): Promise<void> {
    await this.loadHistory();
    if (this.history) {
      this.history.promptsShownToday = [];
      await this.saveHistory();
    }
  }
}

export const companionPromptsService = new CompanionPromptsService();
export default companionPromptsService;
