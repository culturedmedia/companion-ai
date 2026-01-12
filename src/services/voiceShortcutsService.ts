import { Platform, NativeModules, Linking } from 'react-native';

// Shortcut types
export interface VoiceShortcut {
  id: string;
  title: string;
  phrase: string;
  action: string;
  parameters?: Record<string, any>;
}

// Predefined shortcuts
const SHORTCUTS: VoiceShortcut[] = [
  {
    id: 'add_task',
    title: 'Add Task',
    phrase: 'Add a task to CompanionAI',
    action: 'ADD_TASK',
  },
  {
    id: 'show_tasks',
    title: 'Show My Tasks',
    phrase: 'Show my tasks in CompanionAI',
    action: 'SHOW_TASKS',
  },
  {
    id: 'check_companion',
    title: 'Check on Companion',
    phrase: 'How is my companion doing',
    action: 'CHECK_COMPANION',
  },
  {
    id: 'complete_task',
    title: 'Complete a Task',
    phrase: 'Complete a task in CompanionAI',
    action: 'COMPLETE_TASK',
  },
  {
    id: 'daily_summary',
    title: 'Daily Summary',
    phrase: 'What do I need to do today',
    action: 'DAILY_SUMMARY',
  },
  {
    id: 'start_focus',
    title: 'Start Focus Session',
    phrase: 'Start a focus session',
    action: 'START_FOCUS',
  },
  {
    id: 'breathing_exercise',
    title: 'Breathing Exercise',
    phrase: 'Start a breathing exercise',
    action: 'BREATHING_EXERCISE',
  },
];

class VoiceShortcutsService {
  private siriModule: any = null;
  private googleAssistantModule: any = null;

  constructor() {
    if (Platform.OS === 'ios') {
      this.siriModule = NativeModules.SiriShortcuts;
    } else if (Platform.OS === 'android') {
      this.googleAssistantModule = NativeModules.GoogleAssistant;
    }
  }

  // Get available shortcuts
  getAvailableShortcuts(): VoiceShortcut[] {
    return SHORTCUTS;
  }

  // iOS: Donate shortcut to Siri
  async donateSiriShortcut(shortcut: VoiceShortcut): Promise<boolean> {
    if (Platform.OS !== 'ios' || !this.siriModule) {
      return false;
    }

    try {
      await this.siriModule.donateShortcut({
        activityType: `com.companionai.${shortcut.action}`,
        title: shortcut.title,
        suggestedInvocationPhrase: shortcut.phrase,
        userInfo: {
          action: shortcut.action,
          ...shortcut.parameters,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to donate Siri shortcut:', error);
      return false;
    }
  }

  // iOS: Present Siri shortcut setup
  async presentSiriShortcutSetup(shortcut: VoiceShortcut): Promise<boolean> {
    if (Platform.OS !== 'ios' || !this.siriModule) {
      return false;
    }

    try {
      await this.siriModule.presentShortcut({
        activityType: `com.companionai.${shortcut.action}`,
        title: shortcut.title,
        suggestedInvocationPhrase: shortcut.phrase,
        userInfo: {
          action: shortcut.action,
          ...shortcut.parameters,
        },
      });
      return true;
    } catch (error) {
      console.error('Failed to present Siri shortcut:', error);
      return false;
    }
  }

  // iOS: Get all donated shortcuts
  async getDonatedShortcuts(): Promise<VoiceShortcut[]> {
    if (Platform.OS !== 'ios' || !this.siriModule) {
      return [];
    }

    try {
      const donated = await this.siriModule.getShortcuts();
      return donated.map((s: any) => ({
        id: s.activityType.replace('com.companionai.', '').toLowerCase(),
        title: s.title,
        phrase: s.suggestedInvocationPhrase,
        action: s.userInfo?.action || '',
      }));
    } catch (error) {
      console.error('Failed to get donated shortcuts:', error);
      return [];
    }
  }

  // iOS: Delete a donated shortcut
  async deleteSiriShortcut(shortcutId: string): Promise<boolean> {
    if (Platform.OS !== 'ios' || !this.siriModule) {
      return false;
    }

    try {
      await this.siriModule.deleteShortcut(`com.companionai.${shortcutId.toUpperCase()}`);
      return true;
    } catch (error) {
      console.error('Failed to delete Siri shortcut:', error);
      return false;
    }
  }

  // Android: Register Google Assistant action
  async registerGoogleAssistantAction(shortcut: VoiceShortcut): Promise<boolean> {
    if (Platform.OS !== 'android' || !this.googleAssistantModule) {
      return false;
    }

    try {
      await this.googleAssistantModule.registerAction({
        intentName: shortcut.action,
        displayName: shortcut.title,
        triggerPhrase: shortcut.phrase,
      });
      return true;
    } catch (error) {
      console.error('Failed to register Google Assistant action:', error);
      return false;
    }
  }

  // Handle incoming shortcut action
  handleShortcutAction(action: string, parameters?: Record<string, any>): {
    screen?: string;
    params?: Record<string, any>;
    callback?: () => void;
  } {
    switch (action) {
      case 'ADD_TASK':
        return {
          screen: 'Home',
          callback: () => {
            // Trigger add task modal
          },
        };
      
      case 'SHOW_TASKS':
        return {
          screen: 'Tasks',
        };
      
      case 'CHECK_COMPANION':
        return {
          screen: 'Home',
        };
      
      case 'COMPLETE_TASK':
        return {
          screen: 'Tasks',
          params: { action: 'complete' },
        };
      
      case 'DAILY_SUMMARY':
        return {
          screen: 'Home',
          params: { showSummary: true },
        };
      
      case 'START_FOCUS':
        return {
          screen: 'Wellness',
          params: { startFocus: true },
        };
      
      case 'BREATHING_EXERCISE':
        return {
          screen: 'Wellness',
          params: { startBreathing: true },
        };
      
      default:
        return { screen: 'Home' };
    }
  }

  // Donate all shortcuts (call on app launch)
  async donateAllShortcuts(): Promise<void> {
    if (Platform.OS === 'ios') {
      for (const shortcut of SHORTCUTS) {
        await this.donateSiriShortcut(shortcut);
      }
    } else if (Platform.OS === 'android') {
      for (const shortcut of SHORTCUTS) {
        await this.registerGoogleAssistantAction(shortcut);
      }
    }
  }

  // Check if voice shortcuts are supported
  isSupported(): boolean {
    if (Platform.OS === 'ios') {
      return this.siriModule !== null;
    } else if (Platform.OS === 'android') {
      return this.googleAssistantModule !== null;
    }
    return false;
  }

  // Open system settings for voice assistant
  async openVoiceAssistantSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Linking.openURL('App-Prefs:SIRI');
    } else if (Platform.OS === 'android') {
      await Linking.openSettings();
    }
  }
}

export const voiceShortcutsService = new VoiceShortcutsService();
export default voiceShortcutsService;

/*
 * NATIVE MODULE SETUP REQUIRED:
 * 
 * For iOS (Siri Shortcuts):
 * 1. Add Siri capability in Xcode
 * 2. Create SiriShortcuts.swift native module
 * 3. Implement NSUserActivity donation
 * 4. Handle Siri intents in AppDelegate
 * 
 * For Android (Google Assistant):
 * 1. Add App Actions in actions.xml
 * 2. Create GoogleAssistant.java native module
 * 3. Configure shortcuts.xml
 * 4. Handle deep links from Assistant
 * 
 * See companion-ai/native/README.md for detailed setup instructions
 */
