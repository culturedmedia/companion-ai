// Core services
export { analyticsService } from './analyticsService';
export { hapticService } from './hapticService';
export { notificationService } from './notificationService';
export { sessionService } from './sessionService';
export { ttsService } from './ttsService';

// Auth services
export { oauthService } from './oauthService';

// Voice services
export { parseVoiceIntent, generateCompanionResponse } from './voiceService';
export { transcribeAudioMobile } from './whisperService';
export { voiceShortcutsService } from './voiceShortcutsService';

// AI services
export { aiChatService } from './aiChatService';
export { companionPromptsService } from './companionPromptsService';

// Companion services
export { evolutionService } from './evolutionService';

// Task & Calendar services
export { calendarService } from './calendarService';
export { challengeService } from './challengeService';

// Social services
export { socialService } from './socialService';
export { familyService } from './familyService';
export { shareService } from './shareService';

// Monetization services
export { purchaseService, PRODUCT_IDS } from './purchaseService';
export { streakService } from './streakService';

// Platform services
export { widgetService } from './widgetService';

// Types
export type { Session } from './sessionService';
export type { TTSOptions, Voice } from './ttsService';
export type { CompanionPrompt } from './companionPromptsService';
export type { Product, Purchase, Subscription } from './purchaseService';
export type { ChatMessage, CompanionContext } from './aiChatService';
export type { CalendarEvent, SyncedCalendar } from './calendarService';
export type { DailyChallenge } from './challengeService';
export type { Friend, Vibe, LeaderboardEntry } from './socialService';
export type { Family, FamilyMember, FamilyTask, FamilyStats } from './familyService';
export type { EvolutionStage, CompanionEvolution } from './evolutionService';
export type { WidgetData, WidgetSize, WidgetType } from './widgetService';
export type { VoiceShortcut } from './voiceShortcutsService';
export type { ShareContent, AchievementShare, StatsShare } from './shareService';
