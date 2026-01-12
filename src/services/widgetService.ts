import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// Widget data structure
export interface WidgetData {
  // Companion info
  companionName: string;
  companionType: string;
  companionLevel: number;
  companionEnergy: number;
  companionMood: string;
  
  // Task info
  todayTasksCount: number;
  todayTasksCompleted: number;
  nextTask?: {
    title: string;
    dueTime?: string;
    priority: string;
  };
  
  // Stats
  streak: number;
  coins: number;
  
  // Timestamp
  lastUpdated: string;
}

// Widget types
export type WidgetSize = 'small' | 'medium' | 'large';
export type WidgetType = 'companion' | 'tasks' | 'stats' | 'combined';

const WIDGET_DATA_KEY = '@widget_data';

class WidgetService {
  private widgetModule: any = null;

  constructor() {
    // Try to get native widget module
    if (Platform.OS === 'ios') {
      this.widgetModule = NativeModules.WidgetModule;
    } else if (Platform.OS === 'android') {
      this.widgetModule = NativeModules.WidgetModule;
    }
  }

  // Update widget data
  async updateWidgetData(data: Partial<WidgetData>): Promise<void> {
    try {
      // Get existing data
      const existing = await this.getWidgetData();
      
      // Merge with new data
      const updated: WidgetData = {
        ...existing,
        ...data,
        lastUpdated: new Date().toISOString(),
      };

      // Save to AsyncStorage (for app access)
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(updated));

      // Update native widget if available
      if (this.widgetModule?.updateWidget) {
        await this.widgetModule.updateWidget(updated);
      }

      // For iOS, update shared UserDefaults for widget extension
      if (Platform.OS === 'ios' && this.widgetModule?.updateSharedData) {
        await this.widgetModule.updateSharedData('group.com.companionai.widget', updated);
      }

      // For Android, update SharedPreferences for widget
      if (Platform.OS === 'android' && this.widgetModule?.updateSharedPreferences) {
        await this.widgetModule.updateSharedPreferences(updated);
      }
    } catch (error) {
      console.error('Failed to update widget data:', error);
    }
  }

  // Get current widget data
  async getWidgetData(): Promise<WidgetData> {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get widget data:', error);
    }

    // Return default data
    return {
      companionName: 'Companion',
      companionType: 'fox',
      companionLevel: 1,
      companionEnergy: 100,
      companionMood: 'happy',
      todayTasksCount: 0,
      todayTasksCompleted: 0,
      streak: 0,
      coins: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Update companion data for widget
  async updateCompanionData(companion: {
    name: string;
    animal_type: string;
    level: number;
    energy: number;
    mood?: string;
  }): Promise<void> {
    await this.updateWidgetData({
      companionName: companion.name,
      companionType: companion.animal_type,
      companionLevel: companion.level,
      companionEnergy: companion.energy,
      companionMood: companion.mood || 'happy',
    });
  }

  // Update task data for widget
  async updateTaskData(tasks: Array<{
    title: string;
    status: string;
    due_date?: string;
    due_time?: string;
    priority: string;
  }>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.due_date === today);
    const completedTasks = todayTasks.filter(t => t.status === 'completed');
    const pendingTasks = todayTasks.filter(t => t.status === 'pending');
    
    // Get next task (first pending task)
    const nextTask = pendingTasks[0];

    await this.updateWidgetData({
      todayTasksCount: todayTasks.length,
      todayTasksCompleted: completedTasks.length,
      nextTask: nextTask ? {
        title: nextTask.title,
        dueTime: nextTask.due_time,
        priority: nextTask.priority,
      } : undefined,
    });
  }

  // Update stats for widget
  async updateStatsData(stats: {
    streak: number;
    coins: number;
  }): Promise<void> {
    await this.updateWidgetData({
      streak: stats.streak,
      coins: stats.coins,
    });
  }

  // Request widget reload (iOS)
  async reloadWidgets(): Promise<void> {
    if (Platform.OS === 'ios' && this.widgetModule?.reloadAllTimelines) {
      await this.widgetModule.reloadAllTimelines();
    }
  }

  // Check if widgets are supported
  isSupported(): boolean {
    return this.widgetModule !== null;
  }

  // Get widget configuration for different sizes
  getWidgetConfig(size: WidgetSize, type: WidgetType): {
    showCompanion: boolean;
    showTasks: boolean;
    showStats: boolean;
    maxTasks: number;
  } {
    switch (size) {
      case 'small':
        return {
          showCompanion: type === 'companion' || type === 'combined',
          showTasks: type === 'tasks',
          showStats: type === 'stats',
          maxTasks: 1,
        };
      case 'medium':
        return {
          showCompanion: type === 'companion' || type === 'combined',
          showTasks: type === 'tasks' || type === 'combined',
          showStats: type === 'stats' || type === 'combined',
          maxTasks: 3,
        };
      case 'large':
        return {
          showCompanion: true,
          showTasks: true,
          showStats: true,
          maxTasks: 5,
        };
    }
  }
}

export const widgetService = new WidgetService();
export default widgetService;

/*
 * NATIVE MODULE SETUP REQUIRED:
 * 
 * For iOS:
 * 1. Create a Widget Extension target in Xcode
 * 2. Set up App Groups for data sharing
 * 3. Create WidgetModule.swift to bridge with React Native
 * 
 * For Android:
 * 1. Create AppWidgetProvider in android/app/src/main/java
 * 2. Create widget layout XML files
 * 3. Create WidgetModule.java to bridge with React Native
 * 
 * See companion-ai/native/README.md for detailed setup instructions
 */
