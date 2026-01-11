import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type HapticType = 
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection';

class HapticService {
  private isEnabled = true;

  // Enable/disable haptics
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  // Check if haptics are enabled
  isHapticsEnabled(): boolean {
    return this.isEnabled;
  }

  // Trigger haptic feedback
  async trigger(type: HapticType = 'light'): Promise<void> {
    if (!this.isEnabled || Platform.OS === 'web') return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'selection':
          await Haptics.selectionAsync();
          break;
      }
    } catch (error) {
      // Silently fail if haptics aren't available
      console.log('Haptics not available:', error);
    }
  }

  // Convenience methods
  async light(): Promise<void> {
    return this.trigger('light');
  }

  async medium(): Promise<void> {
    return this.trigger('medium');
  }

  async heavy(): Promise<void> {
    return this.trigger('heavy');
  }

  async success(): Promise<void> {
    return this.trigger('success');
  }

  async warning(): Promise<void> {
    return this.trigger('warning');
  }

  async error(): Promise<void> {
    return this.trigger('error');
  }

  async selection(): Promise<void> {
    return this.trigger('selection');
  }

  // Task completion celebration
  async taskComplete(): Promise<void> {
    await this.success();
  }

  // Button press
  async buttonPress(): Promise<void> {
    await this.light();
  }

  // Tab switch
  async tabSwitch(): Promise<void> {
    await this.selection();
  }

  // Achievement unlocked
  async achievementUnlocked(): Promise<void> {
    await this.success();
    // Double tap for extra celebration
    setTimeout(() => this.medium(), 200);
  }

  // Error occurred
  async errorOccurred(): Promise<void> {
    await this.error();
  }

  // Pull to refresh
  async pullToRefresh(): Promise<void> {
    await this.medium();
  }

  // Swipe action
  async swipeAction(): Promise<void> {
    await this.light();
  }

  // Long press
  async longPress(): Promise<void> {
    await this.heavy();
  }
}

export const hapticService = new HapticService();
export default hapticService;
