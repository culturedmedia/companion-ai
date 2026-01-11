import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme';
import { transcribeAudioMobile } from '../../services/whisperService';

interface VoiceButtonProps {
  onTranscript: (text: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  size?: number;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onTranscript,
  onListeningChange,
  size = 72,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recording = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  useEffect(() => {
    if (isListening) {
      // Pulse animation while listening
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Error checking audio permissions:', error);
    }
  };

  const startListening = async () => {
    if (!hasPermission || disabled) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recording.current = newRecording;
      setIsListening(true);
      onListeningChange?.(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopListening = async () => {
    if (!recording.current) return;

    try {
      setIsListening(false);
      onListeningChange?.(false);

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      if (uri) {
        // Transcribe using OpenAI Whisper
        setIsProcessing(true);
        const result = await transcribeAudioMobile(uri);
        setIsProcessing(false);
        
        if (result.error) {
          Alert.alert('Transcription Error', result.error);
        } else if (result.text) {
          onTranscript(result.text);
        } else {
          Alert.alert('No Speech Detected', 'Please try speaking again.');
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <View style={styles.container}>
      {/* Pulse ring */}
      {isListening && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 40,
              height: size + 40,
              borderRadius: (size + 40) / 2,
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.2],
                outputRange: [0.5, 0],
              }),
            },
          ]}
        />
      )}
      
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || !hasPermission || isProcessing}
        activeOpacity={0.8}
        style={[
          styles.buttonWrapper,
          { width: size, height: size },
        ]}
      >
        <LinearGradient
          colors={isListening 
            ? [colors.accent.error, '#ff6b6b'] 
            : isProcessing
              ? [colors.accent.warning, '#fbbf24']
              : disabled 
                ? ['#3f3f46', '#3f3f46']
                : colors.gradients.primary
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={styles.icon}>
            {isProcessing ? '⏳' : isListening ? '⏹' : '🎤'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Status text */}
      <Text style={styles.statusText}>
        {!hasPermission 
          ? 'Tap to enable mic'
          : isProcessing
            ? 'Processing...'
            : isListening 
              ? 'Listening...' 
              : 'Tap to speak'
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    fontSize: 28,
  },
  pulseRing: {
    position: 'absolute',
    backgroundColor: colors.accent.primary,
  },
  statusText: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: 12,
  },
});

export default VoiceButton;
