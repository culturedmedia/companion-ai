import { VoiceIntent, TaskCategory, TaskPriority, TASK_CATEGORIES } from '../types';

// Date parsing utilities
const parseRelativeDate = (text: string): string | null => {
  const today = new Date();
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('today')) {
    return today.toISOString().split('T')[0];
  }
  
  if (lowerText.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  if (lowerText.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }
  
  // Day of week parsing
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lowerText.includes(days[i])) {
      const targetDay = i;
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + daysUntil);
      return targetDate.toISOString().split('T')[0];
    }
  }
  
  // Specific date patterns (e.g., "January 15", "Jan 15", "1/15")
  const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
  const monthAbbrevs = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                        'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  for (let i = 0; i < monthNames.length; i++) {
    const monthPattern = new RegExp(`(${monthNames[i]}|${monthAbbrevs[i]})\\s*(\\d{1,2})`, 'i');
    const match = lowerText.match(monthPattern);
    if (match) {
      const day = parseInt(match[2]);
      const year = today.getFullYear();
      const date = new Date(year, i, day);
      if (date < today) {
        date.setFullYear(year + 1);
      }
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
};

// Time parsing
const parseTime = (text: string): string | null => {
  const lowerText = text.toLowerCase();
  
  // Pattern: "at 3pm", "at 3:30pm", "at 15:00"
  const timePattern = /at\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const match = lowerText.match(timePattern);
  
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const period = match[3]?.toLowerCase();
    
    if (period === 'pm' && hours < 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  // Common time phrases
  if (lowerText.includes('morning')) return '09:00';
  if (lowerText.includes('noon') || lowerText.includes('lunch')) return '12:00';
  if (lowerText.includes('afternoon')) return '14:00';
  if (lowerText.includes('evening')) return '18:00';
  if (lowerText.includes('night')) return '21:00';
  
  return null;
};

// Priority detection
const detectPriority = (text: string): TaskPriority | undefined => {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('urgent') || 
      lowerText.includes('important') || 
      lowerText.includes('asap') ||
      lowerText.includes('high priority')) {
    return 'high';
  }
  
  if (lowerText.includes('low priority') || 
      lowerText.includes('whenever') ||
      lowerText.includes('no rush')) {
    return 'low';
  }
  
  return undefined;
};

// Category detection
const detectCategory = (text: string): TaskCategory | undefined => {
  const lowerText = text.toLowerCase();
  
  for (const category of TASK_CATEGORIES) {
    for (const keyword of category.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category.id;
      }
    }
  }
  
  return undefined;
};

// Extract task title from command
const extractTaskTitle = (text: string, patterns: RegExp[]): string => {
  let title = text;
  
  // Remove command prefixes
  for (const pattern of patterns) {
    title = title.replace(pattern, '').trim();
  }
  
  // Remove date/time phrases
  title = title
    .replace(/\b(today|tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\bat\s*\d{1,2}(:\d{2})?\s*(am|pm)?\b/gi, '')
    .replace(/\b(morning|noon|afternoon|evening|night)\b/gi, '')
    .replace(/\b(urgent|important|asap|high priority|low priority|no rush)\b/gi, '')
    .replace(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s*\d{1,2}\b/gi, '')
    .replace(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{1,2}\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return title;
};

// Main intent parser
export const parseVoiceIntent = (transcript: string): VoiceIntent => {
  const text = transcript.toLowerCase().trim();
  
  // CREATE TASK patterns
  const createTaskPatterns = [
    /^(add|create|new|make)\s+(a\s+)?(task|todo|to-do|reminder)\s*(to|for|:)?\s*/i,
    /^(i need to|i have to|i should|i must|remind me to|don't let me forget to)\s*/i,
    /^(put|add)\s+.+\s+(on|to)\s+(my\s+)?(list|tasks|todos)/i,
  ];
  
  for (const pattern of createTaskPatterns) {
    if (pattern.test(text)) {
      const title = extractTaskTitle(transcript, createTaskPatterns);
      return {
        type: 'CREATE_TASK',
        title: title || transcript,
        dueDate: parseRelativeDate(text) || undefined,
        dueTime: parseTime(text) || undefined,
        priority: detectPriority(text),
        category: detectCategory(text),
      };
    }
  }
  
  // COMPLETE TASK patterns
  const completePatterns = [
    /^(complete|finish|done|mark|check off)\s+(the\s+)?(task\s+)?/i,
    /^i\s+(finished|completed|did|done)\s+(the\s+)?/i,
  ];
  
  for (const pattern of completePatterns) {
    if (pattern.test(text)) {
      const taskName = text.replace(pattern, '').trim();
      return {
        type: 'COMPLETE_TASK',
        taskName,
      };
    }
  }
  
  // LIST TASKS patterns
  if (/^(what|show|list|tell me|what's|whats)\s+(are\s+)?(my\s+)?(tasks?|todos?|to-dos?)/i.test(text) ||
      /^(what do i|what should i|what am i)\s+(need to|have to|supposed to)\s+(do|finish)/i.test(text)) {
    
    let filter: 'today' | 'week' | 'overdue' | 'all' | undefined;
    
    if (text.includes('today') || text.includes('this morning') || text.includes('tonight')) {
      filter = 'today';
    } else if (text.includes('this week') || text.includes('week')) {
      filter = 'week';
    } else if (text.includes('overdue') || text.includes('missed') || text.includes('late')) {
      filter = 'overdue';
    }
    
    return {
      type: 'LIST_TASKS',
      filter,
      category: detectCategory(text),
    };
  }
  
  // INCOMPLETE TASKS / WEEKLY REVIEW
  if (/^(what|show|tell me)\s+.*(didn't|did not|haven't|have not)\s+(finish|complete|do|get done)/i.test(text) ||
      /^(what|which)\s+(tasks?|things?)\s+.*(incomplete|unfinished|pending|left)/i.test(text)) {
    return { type: 'INCOMPLETE_TASKS' };
  }
  
  if (/^(weekly|week)\s+(review|summary|recap)/i.test(text) ||
      /^(how did|how was)\s+(my|the)\s+week/i.test(text)) {
    return { type: 'WEEKLY_REVIEW' };
  }
  
  // FOCUS TODAY
  if (/^(what|is there)\s+(should i|do i need to)\s+(focus on|prioritize)/i.test(text) ||
      /^(what's|what is)\s+(most\s+)?(important|urgent)/i.test(text) ||
      /^(help me|let's)\s+(focus|prioritize)/i.test(text)) {
    return { type: 'FOCUS_TODAY' };
  }
  
  // RESCHEDULE TASK
  const reschedulePattern = /^(reschedule|move|postpone|push)\s+(the\s+)?(task\s+)?(.+?)\s+(to|until|for)\s+(.+)/i;
  const rescheduleMatch = text.match(reschedulePattern);
  if (rescheduleMatch) {
    return {
      type: 'RESCHEDULE_TASK',
      taskName: rescheduleMatch[4].trim(),
      newDate: parseRelativeDate(rescheduleMatch[6]) || rescheduleMatch[6],
    };
  }
  
  // DELETE TASK
  const deletePatterns = [
    /^(delete|remove|cancel)\s+(the\s+)?(task\s+)?/i,
  ];
  
  for (const pattern of deletePatterns) {
    if (pattern.test(text)) {
      const taskName = text.replace(pattern, '').trim();
      return {
        type: 'DELETE_TASK',
        taskName,
      };
    }
  }
  
  // CHECK COMPANION
  if (/^(how|how's|hows)\s+(is\s+)?(my\s+)?(companion|pet|buddy|friend)/i.test(text) ||
      /^(check on|see)\s+(my\s+)?(companion|pet|buddy)/i.test(text)) {
    return { type: 'CHECK_COMPANION' };
  }
  
  // TALK TO COMPANION (catch-all for conversational)
  if (/^(hey|hi|hello|talk to|chat with)/i.test(text)) {
    return {
      type: 'TALK_TO_COMPANION',
      message: transcript,
    };
  }
  
  // NAVIGATION
  const navPatterns: { pattern: RegExp; screen: string }[] = [
    { pattern: /^(go to|open|show)\s+(the\s+)?(home|main)/i, screen: 'home' },
    { pattern: /^(go to|open|show)\s+(the\s+)?(tasks?|todos?)/i, screen: 'tasks' },
    { pattern: /^(go to|open|show)\s+(the\s+)?calendar/i, screen: 'calendar' },
    { pattern: /^(go to|open|show)\s+(the\s+)?settings/i, screen: 'settings' },
    { pattern: /^(go to|open|show)\s+(the\s+)?shop/i, screen: 'shop' },
  ];
  
  for (const { pattern, screen } of navPatterns) {
    if (pattern.test(text)) {
      return { type: 'NAVIGATE', screen };
    }
  }
  
  // HELP
  if (/^(help|what can you do|commands|how do i)/i.test(text)) {
    return { type: 'HELP' };
  }
  
  // If it looks like a task (contains action verbs), treat as CREATE_TASK
  const actionVerbs = ['call', 'email', 'send', 'buy', 'get', 'pick up', 'drop off', 
                       'finish', 'complete', 'schedule', 'book', 'make', 'write',
                       'clean', 'organize', 'prepare', 'review', 'submit', 'pay'];
  
  for (const verb of actionVerbs) {
    if (text.startsWith(verb) || text.includes(` ${verb} `)) {
      return {
        type: 'CREATE_TASK',
        title: transcript,
        dueDate: parseRelativeDate(text) || undefined,
        dueTime: parseTime(text) || undefined,
        priority: detectPriority(text),
        category: detectCategory(text),
      };
    }
  }
  
  // Unknown intent
  return {
    type: 'UNKNOWN',
    raw: transcript,
  };
};

// Generate companion response based on intent
export const generateCompanionResponse = (
  intent: VoiceIntent,
  companionName: string,
  personality: string
): string => {
  const personalityResponses: Record<string, Record<string, string[]>> = {
    clever: {
      CREATE_TASK: [
        "Got it! I've added that to your list. Smart move getting it written down.",
        "Task captured! I'll make sure you don't forget.",
        "Added! You're being very organized today.",
      ],
      COMPLETE_TASK: [
        "Excellent work! Another one down.",
        "Task complete! You're on a roll.",
        "Done and dusted! What's next?",
      ],
      HELP: [
        "I can help you manage tasks, check your schedule, and keep you on track. Just tell me what you need!",
      ],
    },
    gentle: {
      CREATE_TASK: [
        "I've added that for you! You're doing great! 💕",
        "Task saved! I believe in you!",
        "Got it! One step at a time, you've got this!",
      ],
      COMPLETE_TASK: [
        "Yay! I'm so proud of you! 🌟",
        "Amazing job! You're wonderful!",
        "You did it! That makes me so happy!",
      ],
      HELP: [
        "I'm here to help you with anything! Tasks, reminders, or just a friendly chat. What would you like to do?",
      ],
    },
    // Add more personalities as needed
  };
  
  const responses = personalityResponses[personality] || personalityResponses.gentle;
  const intentResponses = responses[intent.type] || responses.HELP;
  
  return intentResponses[Math.floor(Math.random() * intentResponses.length)];
};

export default {
  parseVoiceIntent,
  generateCompanionResponse,
};
