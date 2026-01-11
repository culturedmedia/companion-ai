import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'task_reminder' | 'morning_checkin' | 'streak_reminder' | 'achievement' | 'companion_message';
  taskId?: string;
  achievementId?: string;
  message?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  // Request permissions and get push token
  async initialize(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with your Expo project ID
    });
    
    this.expoPushToken = tokenData.data;

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B6B',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('companion', {
        name: 'Companion Messages',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return this.expoPushToken;
  }

  // Save push token to database
  async savePushToken(userId: string): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      await supabase
        .from('profiles')
        .update({ push_token: this.expoPushToken })
        .eq('id', userId);
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  // Schedule a local notification
  async scheduleNotification(
    title: string,
    body: string,
    data: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger,
    });

    return id;
  }

  // Schedule task reminder
  async scheduleTaskReminder(
    taskId: string,
    taskTitle: string,
    dueDate: Date,
    reminderMinutesBefore: number = 30
  ): Promise<string | null> {
    const reminderTime = new Date(dueDate.getTime() - reminderMinutesBefore * 60 * 1000);
    
    if (reminderTime <= new Date()) {
      return null; // Don't schedule if reminder time has passed
    }

    return this.scheduleNotification(
      '⏰ Task Reminder',
      `"${taskTitle}" is due in ${reminderMinutesBefore} minutes`,
      { type: 'task_reminder', taskId },
      { date: reminderTime }
    );
  }

  // Schedule morning check-in
  async scheduleMorningCheckIn(hour: number = 8, minute: number = 0): Promise<string> {
    // Cancel existing morning check-in
    await this.cancelNotificationsByType('morning_checkin');

    const greetings = [
      "Good morning! 🌅 Ready to tackle today?",
      "Rise and shine! ☀️ What's on your agenda?",
      "Morning! 🌻 Let's make today count!",
      "Hey there! 🌞 Your companion is ready to help!",
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    return this.scheduleNotification(
      '🦊 Good Morning!',
      randomGreeting,
      { type: 'morning_checkin' },
      {
        hour,
        minute,
        repeats: true,
      }
    );
  }

  // Schedule streak reminder (evening)
  async scheduleStreakReminder(hour: number = 20, minute: number = 0): Promise<string> {
    await this.cancelNotificationsByType('streak_reminder');

    return this.scheduleNotification(
      '🔥 Don\'t Break Your Streak!',
      'Complete a task before midnight to keep your streak going!',
      { type: 'streak_reminder' },
      {
        hour,
        minute,
        repeats: true,
      }
    );
  }

  // Send achievement notification
  async sendAchievementNotification(
    achievementName: string,
    achievementId: string
  ): Promise<string> {
    return this.scheduleNotification(
      '🏆 Achievement Unlocked!',
      `You earned "${achievementName}"! Tap to see your rewards.`,
      { type: 'achievement', achievementId },
      null // Immediate notification
    );
  }

  // Send companion message
  async sendCompanionMessage(message: string): Promise<string> {
    return this.scheduleNotification(
      '🦊 Your Companion Says...',
      message,
      { type: 'companion_message', message },
      null
    );
  }

  // Cancel a specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  // Cancel all notifications of a specific type
  async cancelNotificationsByType(type: NotificationData['type']): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduled) {
      if ((notification.content.data as NotificationData)?.type === type) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // Add notification response listener
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Add notification received listener
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
