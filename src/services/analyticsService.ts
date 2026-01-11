import { Platform } from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

// Event types for tracking
export type AnalyticsEvent = 
  | 'app_open'
  | 'sign_up'
  | 'sign_in'
  | 'sign_out'
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'companion_selected'
  | 'task_created'
  | 'task_completed'
  | 'task_deleted'
  | 'voice_command_used'
  | 'voice_command_success'
  | 'voice_command_failed'
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'shop_viewed'
  | 'item_purchased'
  | 'subscription_started'
  | 'subscription_cancelled'
  | 'settings_changed'
  | 'error_occurred'
  | 'screen_view';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  companionType?: string;
  subscriptionStatus?: string;
  streakDays?: number;
  totalTasksCompleted?: number;
  accountCreatedAt?: string;
}

class AnalyticsService {
  private isEnabled = true;
  private userId: string | null = null;
  private sessionId: string;
  private sessionStartTime: Date;
  private eventQueue: Array<{ event: AnalyticsEvent; properties: AnalyticsProperties; timestamp: Date }> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize analytics
  async initialize(): Promise<void> {
    // In production, initialize your analytics SDK here
    // e.g., Mixpanel, Amplitude, Firebase Analytics
    
    this.trackEvent('app_open', {
      platform: Platform.OS,
      version: Application.nativeApplicationVersion || 'unknown',
      buildNumber: Application.nativeBuildVersion || 'unknown',
    });
  }

  // Set user ID for tracking
  setUserId(userId: string): void {
    this.userId = userId;
  }

  // Clear user ID on logout
  clearUserId(): void {
    this.userId = null;
  }

  // Set user properties
  setUserProperties(properties: UserProperties): void {
    // In production, send to analytics service
    console.log('[Analytics] User properties:', properties);
  }

  // Track an event
  trackEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}): void {
    if (!this.isEnabled) return;

    const enrichedProperties = {
      ...properties,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };

    // In production, send to analytics service
    console.log(`[Analytics] Event: ${event}`, enrichedProperties);

    // Queue event for batch sending
    this.eventQueue.push({
      event,
      properties: enrichedProperties,
      timestamp: new Date(),
    });

    // Flush queue if it gets too large
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  // Track screen view
  trackScreenView(screenName: string, properties: AnalyticsProperties = {}): void {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  // Track error
  trackError(error: Error, context: string, properties: AnalyticsProperties = {}): void {
    this.trackEvent('error_occurred', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack?.substring(0, 500),
      context,
      ...properties,
    });
  }

  // Track task events
  trackTaskCreated(taskId: string, category: string, priority: string, hasVoice: boolean): void {
    this.trackEvent('task_created', {
      task_id: taskId,
      category,
      priority,
      created_via_voice: hasVoice,
    });
  }

  trackTaskCompleted(taskId: string, category: string, priority: string, daysOverdue: number): void {
    this.trackEvent('task_completed', {
      task_id: taskId,
      category,
      priority,
      days_overdue: daysOverdue,
      completed_on_time: daysOverdue <= 0,
    });
  }

  // Track voice command events
  trackVoiceCommand(command: string, success: boolean, intent?: string): void {
    this.trackEvent(success ? 'voice_command_success' : 'voice_command_failed', {
      command_length: command.length,
      detected_intent: intent,
    });
  }

  // Track purchase events
  trackPurchase(productId: string, price: number, currency: string): void {
    this.trackEvent('item_purchased', {
      product_id: productId,
      price,
      currency,
    });
  }

  // Track subscription events
  trackSubscription(action: 'started' | 'cancelled' | 'renewed', productId: string): void {
    this.trackEvent(action === 'started' ? 'subscription_started' : 'subscription_cancelled', {
      product_id: productId,
      action,
    });
  }

  // Flush queued events
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // In production, batch send to analytics service
    console.log(`[Analytics] Flushing ${events.length} events`);
  }

  // Get session duration
  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime.getTime();
  }

  // Enable/disable analytics
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Check if analytics is enabled
  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  // End session
  endSession(): void {
    this.trackEvent('app_open', {
      session_duration_ms: this.getSessionDuration(),
      events_in_session: this.eventQueue.length,
    });
    this.flushEvents();
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
