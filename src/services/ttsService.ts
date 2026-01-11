import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

export interface TTSOptions {
  language?: string;
  pitch?: number;
  rate?: number;
  voice?: string;
}

export interface Voice {
  identifier: string;
  name: string;
  quality: string;
  language: string;
}

class TTSService {
  private isInitialized = false;
  private availableVoices: Voice[] = [];
  private defaultOptions: TTSOptions = {
    language: 'en-US',
    pitch: 1.0,
    rate: Platform.OS === 'ios' ? 0.5 : 0.9, // iOS speaks faster
  };

  // Initialize and load available voices
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const voices = await Speech.getAvailableVoicesAsync();
      this.availableVoices = voices.map(v => ({
        identifier: v.identifier,
        name: v.name,
        quality: v.quality,
        language: v.language,
      }));
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize TTS:', error);
    }
  }

  // Get available voices
  getVoices(): Voice[] {
    return this.availableVoices;
  }

  // Get voices for a specific language
  getVoicesForLanguage(language: string): Voice[] {
    return this.availableVoices.filter(v => 
      v.language.toLowerCase().startsWith(language.toLowerCase())
    );
  }

  // Find a good quality voice for the language
  getBestVoice(language: string = 'en'): Voice | undefined {
    const voices = this.getVoicesForLanguage(language);
    
    // Prefer enhanced/premium voices
    const enhanced = voices.find(v => 
      v.quality === 'Enhanced' || 
      v.name.includes('Premium') ||
      v.name.includes('Neural')
    );
    if (enhanced) return enhanced;

    // Fall back to any voice
    return voices[0];
  }

  // Speak text
  async speak(text: string, options?: TTSOptions): Promise<void> {
    await this.initialize();

    const mergedOptions = { ...this.defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      Speech.speak(text, {
        language: mergedOptions.language,
        pitch: mergedOptions.pitch,
        rate: mergedOptions.rate,
        voice: mergedOptions.voice,
        onDone: () => resolve(),
        onError: (error) => reject(error),
        onStopped: () => resolve(),
      });
    });
  }

  // Speak with companion personality
  async speakAsCompanion(
    text: string, 
    personality: 'gentle' | 'clever' | 'playful' | 'wise' = 'gentle'
  ): Promise<void> {
    let options: TTSOptions = { ...this.defaultOptions };

    // Adjust voice characteristics based on personality
    switch (personality) {
      case 'gentle':
        options.pitch = 1.1;
        options.rate = Platform.OS === 'ios' ? 0.45 : 0.85;
        break;
      case 'clever':
        options.pitch = 1.0;
        options.rate = Platform.OS === 'ios' ? 0.52 : 0.95;
        break;
      case 'playful':
        options.pitch = 1.2;
        options.rate = Platform.OS === 'ios' ? 0.55 : 1.0;
        break;
      case 'wise':
        options.pitch = 0.9;
        options.rate = Platform.OS === 'ios' ? 0.42 : 0.8;
        break;
    }

    // Try to find a good voice
    const bestVoice = this.getBestVoice('en');
    if (bestVoice) {
      options.voice = bestVoice.identifier;
    }

    return this.speak(text, options);
  }

  // Stop speaking
  stop(): void {
    Speech.stop();
  }

  // Check if currently speaking
  async isSpeaking(): Promise<boolean> {
    return Speech.isSpeakingAsync();
  }

  // Pause speaking (iOS only)
  pause(): void {
    if (Platform.OS === 'ios') {
      Speech.pause();
    }
  }

  // Resume speaking (iOS only)
  resume(): void {
    if (Platform.OS === 'ios') {
      Speech.resume();
    }
  }

  // Set default options
  setDefaultOptions(options: Partial<TTSOptions>): void {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }

  // Get default options
  getDefaultOptions(): TTSOptions {
    return { ...this.defaultOptions };
  }
}

export const ttsService = new TTSService();
export default ttsService;
