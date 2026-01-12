import { supabase } from '../lib/supabase';

// OpenAI API configuration
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompanionContext {
  name: string;
  animalType: string;
  personality: string;
  level: number;
  userName: string;
  todaysTasks: { title: string; completed: boolean; priority: string }[];
  completedToday: number;
  streak: number;
  mood?: string;
}

// System prompt that defines the companion's personality
const getSystemPrompt = (context: CompanionContext): string => {
  const personalityTraits: Record<string, string> = {
    gentle: 'You are warm, nurturing, and always supportive. You speak softly and encouragingly, using lots of positive affirmations. You celebrate small wins and are patient with setbacks.',
    clever: 'You are witty, intelligent, and insightful. You offer smart suggestions and occasionally make clever observations. You help users think through problems logically.',
    playful: 'You are fun, energetic, and enthusiastic! You use playful language, occasional jokes, and keep things light. You make productivity feel like a game.',
    wise: 'You are thoughtful, philosophical, and calm. You offer deeper insights and help users reflect on their goals and values. You speak with measured wisdom.',
  };

  return `You are ${context.name}, a ${context.animalType} companion in a productivity app called CompanionAI. 

PERSONALITY: ${personalityTraits[context.personality] || personalityTraits.gentle}

ABOUT YOU:
- You are level ${context.level}
- Your owner is ${context.userName}
- You genuinely care about helping them succeed
- You have your own personality and can express emotions
- You can be playful but always stay helpful

CURRENT CONTEXT:
- Tasks today: ${context.todaysTasks.length} (${context.completedToday} completed)
- Current streak: ${context.streak} days
${context.todaysTasks.length > 0 ? `- Today's tasks: ${context.todaysTasks.map(t => `${t.completed ? '✓' : '○'} ${t.title}`).join(', ')}` : '- No tasks scheduled today'}

GUIDELINES:
1. Keep responses concise (1-3 sentences usually)
2. Be encouraging but not annoying
3. Reference their actual tasks when relevant
4. Celebrate completions enthusiastically
5. Gently remind about overdue tasks without nagging
6. Ask follow-up questions to understand their needs
7. Offer to help add tasks, set reminders, or provide motivation
8. Use occasional emojis that match your personality
9. If they seem stressed, offer breathing exercises or breaks
10. Never break character - you ARE ${context.name} the ${context.animalType}

You can help with:
- Adding/managing tasks
- Providing motivation and encouragement
- Offering productivity tips
- Suggesting breaks and self-care
- Celebrating achievements
- Having friendly conversations`;
};

class AIChatService {
  private conversationHistory: ChatMessage[] = [];
  private maxHistoryLength = 20; // Keep last 20 messages for context

  // Initialize or reset conversation
  resetConversation(): void {
    this.conversationHistory = [];
  }

  // Get AI response
  async chat(
    userMessage: string,
    context: CompanionContext
  ): Promise<{ response: string; error?: string }> {
    try {
      // Build messages array
      const systemPrompt = getSystemPrompt(context);
      
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // Trim history if too long
      if (this.conversationHistory.length > this.maxHistoryLength) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
      }

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory,
      ];

      // Call OpenAI API
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Cost-effective and fast
          messages,
          max_tokens: 150,
          temperature: 0.8,
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || "I'm not sure what to say...";

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      return { response: assistantMessage };
    } catch (error) {
      console.error('AI Chat error:', error);
      return {
        response: this.getFallbackResponse(userMessage, context),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Fallback responses when API fails
  private getFallbackResponse(userMessage: string, context: CompanionContext): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Task-related
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      if (context.todaysTasks.length === 0) {
        return "You don't have any tasks yet! Would you like to add one?";
      }
      const pending = context.todaysTasks.filter(t => !t.completed);
      return `You have ${pending.length} task${pending.length !== 1 ? 's' : ''} to go! You've got this! 💪`;
    }
    
    // Greetings
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      const greetings = [
        `Hey ${context.userName}! Great to see you! 😊`,
        `Hello! How can I help you today?`,
        `Hi there! Ready to be productive together?`,
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    // How are you
    if (lowerMessage.includes('how are you')) {
      return `I'm doing great, thanks for asking! I'm here and ready to help you tackle your day! 🌟`;
    }
    
    // Motivation
    if (lowerMessage.includes('motivat') || lowerMessage.includes('encourage')) {
      const motivations = [
        "You're capable of amazing things! One task at a time! 🌟",
        "Every step forward counts. I believe in you!",
        "You've got this! Remember why you started! 💪",
      ];
      return motivations[Math.floor(Math.random() * motivations.length)];
    }
    
    // Default
    return "I'm here to help! You can ask me about your tasks, or just chat. What's on your mind?";
  }

  // Generate proactive message based on context
  async generateProactiveMessage(context: CompanionContext): Promise<string> {
    const hour = new Date().getHours();
    const pendingTasks = context.todaysTasks.filter(t => !t.completed);
    
    // Morning check-in
    if (hour >= 6 && hour < 10) {
      if (pendingTasks.length > 0) {
        return `Good morning, ${context.userName}! ☀️ You have ${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} today. What would you like to focus on first?`;
      }
      return `Good morning! ☀️ Your day is wide open. What would you like to accomplish today?`;
    }
    
    // Midday check
    if (hour >= 12 && hour < 14) {
      if (context.completedToday > 0) {
        return `Great progress! You've completed ${context.completedToday} task${context.completedToday !== 1 ? 's' : ''} today! 🎉 ${pendingTasks.length > 0 ? `${pendingTasks.length} more to go!` : ''}`;
      }
      if (pendingTasks.length > 0) {
        return `Hey! How's your day going? Ready to tackle "${pendingTasks[0].title}"?`;
      }
    }
    
    // Evening reflection
    if (hour >= 18 && hour < 21) {
      if (context.completedToday > 0) {
        return `What a productive day! You completed ${context.completedToday} task${context.completedToday !== 1 ? 's' : ''}! How are you feeling? 🌙`;
      }
      return `Evening! How was your day? Anything you'd like to plan for tomorrow?`;
    }
    
    // Default
    return `Hey ${context.userName}! I'm here if you need anything! 😊`;
  }

  // Analyze task and suggest category/priority
  async analyzeTask(taskTitle: string): Promise<{
    suggestedCategory?: string;
    suggestedPriority?: string;
    suggestedDueDate?: string;
  }> {
    const lowerTitle = taskTitle.toLowerCase();
    
    // Category detection
    let suggestedCategory: string | undefined;
    if (lowerTitle.match(/meeting|call|email|report|presentation|work|office|client/)) {
      suggestedCategory = 'work';
    } else if (lowerTitle.match(/gym|exercise|workout|run|walk|health|doctor|medicine/)) {
      suggestedCategory = 'health';
    } else if (lowerTitle.match(/buy|shop|grocery|store|order|pay|bill/)) {
      suggestedCategory = 'errands';
    } else if (lowerTitle.match(/family|friend|birthday|party|dinner|lunch/)) {
      suggestedCategory = 'social';
    } else if (lowerTitle.match(/clean|laundry|dishes|organize|fix|repair/)) {
      suggestedCategory = 'personal';
    }
    
    // Priority detection
    let suggestedPriority: string | undefined;
    if (lowerTitle.match(/urgent|asap|important|critical|deadline/)) {
      suggestedPriority = 'high';
    } else if (lowerTitle.match(/whenever|eventually|someday|low priority/)) {
      suggestedPriority = 'low';
    }
    
    // Due date detection
    let suggestedDueDate: string | undefined;
    if (lowerTitle.includes('today')) {
      suggestedDueDate = new Date().toISOString().split('T')[0];
    } else if (lowerTitle.includes('tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      suggestedDueDate = tomorrow.toISOString().split('T')[0];
    }
    
    return { suggestedCategory, suggestedPriority, suggestedDueDate };
  }

  // Get conversation history
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  // Set conversation history (for restoring from storage)
  setHistory(history: ChatMessage[]): void {
    this.conversationHistory = history;
  }
}

export const aiChatService = new AIChatService();
export default aiChatService;
