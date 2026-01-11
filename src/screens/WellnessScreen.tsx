import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { Card, Button } from '../components/ui';
import { colors, spacing, borderRadius, typography } from '../theme';

// Breathing patterns
const BREATHING_PATTERNS = {
  relaxing: { name: '4-7-8 Relaxing', inhale: 4, hold: 7, exhale: 8 },
  box: { name: 'Box Breathing', inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
  energizing: { name: 'Energizing', inhale: 6, hold: 0, exhale: 2 },
  calming: { name: 'Calming', inhale: 4, hold: 4, exhale: 6 },
};

// Mood options
const MOODS = [
  { emoji: '😊', label: 'Great', value: 5 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Low', value: 2 },
  { emoji: '😢', label: 'Struggling', value: 1 },
];

// Quick meditations
const MEDITATIONS = [
  { id: 'focus', name: 'Focus', duration: 5, emoji: '🎯', description: 'Clear your mind and focus' },
  { id: 'calm', name: 'Calm', duration: 3, emoji: '🌊', description: 'Quick calming exercise' },
  { id: 'gratitude', name: 'Gratitude', duration: 5, emoji: '🙏', description: 'Reflect on what you\'re thankful for' },
  { id: 'body_scan', name: 'Body Scan', duration: 10, emoji: '🧘', description: 'Full body relaxation' },
];

export const WellnessScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingPattern, setBreathingPattern] = useState<keyof typeof BREATHING_PATTERNS>('relaxing');
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdAfter'>('inhale');
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathCount, setBreathCount] = useState(0);
  const [showMeditation, setShowMeditation] = useState(false);
  const [selectedMeditation, setSelectedMeditation] = useState<typeof MEDITATIONS[0] | null>(null);
  const [meditationTime, setMeditationTime] = useState(0);

  const breathAnimation = useRef(new Animated.Value(1)).current;
  const breathingInterval = useRef<NodeJS.Timeout | null>(null);
  const meditationInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (breathingInterval.current) clearInterval(breathingInterval.current);
      if (meditationInterval.current) clearInterval(meditationInterval.current);
    };
  }, []);

  const startBreathing = () => {
    setIsBreathing(true);
    setBreathCount(0);
    runBreathingCycle();
  };

  const stopBreathing = () => {
    setIsBreathing(false);
    if (breathingInterval.current) clearInterval(breathingInterval.current);
    breathAnimation.setValue(1);
  };

  const runBreathingCycle = () => {
    const pattern = BREATHING_PATTERNS[breathingPattern];
    let phase: 'inhale' | 'hold' | 'exhale' | 'holdAfter' = 'inhale';
    
    const runPhase = () => {
      setBreathingPhase(phase);
      
      let duration = 0;
      let toValue = 1;
      
      switch (phase) {
        case 'inhale':
          duration = pattern.inhale * 1000;
          toValue = 1.5;
          Vibration.vibrate(50);
          break;
        case 'hold':
          duration = pattern.hold * 1000;
          toValue = 1.5;
          break;
        case 'exhale':
          duration = pattern.exhale * 1000;
          toValue = 1;
          break;
        case 'holdAfter':
          duration = (pattern as any).holdAfter * 1000 || 0;
          toValue = 1;
          break;
      }

      Animated.timing(breathAnimation, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();

      breathingInterval.current = setTimeout(() => {
        // Move to next phase
        if (phase === 'inhale') {
          phase = pattern.hold > 0 ? 'hold' : 'exhale';
        } else if (phase === 'hold') {
          phase = 'exhale';
        } else if (phase === 'exhale') {
          if ((pattern as any).holdAfter) {
            phase = 'holdAfter';
          } else {
            phase = 'inhale';
            setBreathCount(c => c + 1);
          }
        } else {
          phase = 'inhale';
          setBreathCount(c => c + 1);
        }
        runPhase();
      }, duration);
    };

    runPhase();
  };

  const startMeditation = (meditation: typeof MEDITATIONS[0]) => {
    setSelectedMeditation(meditation);
    setMeditationTime(meditation.duration * 60);
    setShowMeditation(true);

    meditationInterval.current = setInterval(() => {
      setMeditationTime(t => {
        if (t <= 1) {
          if (meditationInterval.current) clearInterval(meditationInterval.current);
          Vibration.vibrate([0, 200, 100, 200]);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const stopMeditation = () => {
    if (meditationInterval.current) clearInterval(meditationInterval.current);
    setShowMeditation(false);
    setSelectedMeditation(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInstruction = () => {
    switch (breathingPhase) {
      case 'inhale': return 'Breathe In';
      case 'hold': return 'Hold';
      case 'exhale': return 'Breathe Out';
      case 'holdAfter': return 'Hold';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wellness</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Mood Check-in */}
        <Card style={styles.moodCard}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <View style={styles.moodGrid}>
            {MOODS.map(mood => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodOption,
                  selectedMood === mood.value && styles.moodOptionSelected,
                ]}
                onPress={() => setSelectedMood(mood.value)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedMood && (
            <Text style={styles.moodResponse}>
              {selectedMood >= 4 
                ? "That's wonderful! Keep up the positive energy! 🌟"
                : selectedMood === 3
                ? "It's okay to have neutral days. Take a moment for yourself."
                : "I'm here for you. Would you like to try a breathing exercise? 💙"}
            </Text>
          )}
        </Card>

        {/* Breathing Exercises */}
        <Card style={styles.breathingCard}>
          <Text style={styles.sectionTitle}>🌬️ Breathing Exercises</Text>
          <Text style={styles.sectionSubtitle}>
            Take a moment to center yourself
          </Text>

          <View style={styles.patternGrid}>
            {Object.entries(BREATHING_PATTERNS).map(([key, pattern]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.patternOption,
                  breathingPattern === key && styles.patternOptionSelected,
                ]}
                onPress={() => setBreathingPattern(key as keyof typeof BREATHING_PATTERNS)}
              >
                <Text style={styles.patternName}>{pattern.name}</Text>
                <Text style={styles.patternTiming}>
                  {pattern.inhale}-{pattern.hold}-{pattern.exhale}
                  {(pattern as any).holdAfter ? `-${(pattern as any).holdAfter}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            title={showBreathing ? 'Close' : 'Start Breathing Exercise'}
            onPress={() => {
              if (showBreathing) {
                stopBreathing();
                setShowBreathing(false);
              } else {
                setShowBreathing(true);
              }
            }}
            fullWidth
          />
        </Card>

        {/* Breathing Modal */}
        {showBreathing && (
          <Card style={styles.breathingModal}>
            <Animated.View
              style={[
                styles.breathCircle,
                { transform: [{ scale: breathAnimation }] },
              ]}
            >
              <Text style={styles.breathInstruction}>
                {isBreathing ? getPhaseInstruction() : 'Ready'}
              </Text>
            </Animated.View>

            <Text style={styles.breathCount}>
              Breaths: {breathCount}
            </Text>

            <Button
              title={isBreathing ? 'Stop' : 'Begin'}
              onPress={isBreathing ? stopBreathing : startBreathing}
              variant={isBreathing ? 'outline' : 'primary'}
              fullWidth
            />
          </Card>
        )}

        {/* Quick Meditations */}
        <Card style={styles.meditationCard}>
          <Text style={styles.sectionTitle}>🧘 Quick Meditations</Text>
          <View style={styles.meditationGrid}>
            {MEDITATIONS.map(meditation => (
              <TouchableOpacity
                key={meditation.id}
                style={styles.meditationOption}
                onPress={() => startMeditation(meditation)}
              >
                <Text style={styles.meditationEmoji}>{meditation.emoji}</Text>
                <Text style={styles.meditationName}>{meditation.name}</Text>
                <Text style={styles.meditationDuration}>{meditation.duration} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Daily Affirmation */}
        <Card style={styles.affirmationCard}>
          <Text style={styles.affirmationLabel}>✨ Today's Affirmation</Text>
          <Text style={styles.affirmationText}>
            "I am capable of achieving my goals, one step at a time."
          </Text>
        </Card>
      </ScrollView>

      {/* Meditation Modal */}
      <Modal
        visible={showMeditation}
        animationType="fade"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.meditationModalContent}>
            <Text style={styles.meditationModalEmoji}>
              {selectedMeditation?.emoji}
            </Text>
            <Text style={styles.meditationModalTitle}>
              {selectedMeditation?.name}
            </Text>
            <Text style={styles.meditationModalDesc}>
              {selectedMeditation?.description}
            </Text>
            <Text style={styles.meditationTimer}>
              {formatTime(meditationTime)}
            </Text>
            {meditationTime === 0 ? (
              <>
                <Text style={styles.meditationComplete}>
                  🎉 Well done!
                </Text>
                <Button
                  title="Close"
                  onPress={stopMeditation}
                  fullWidth
                />
              </>
            ) : (
              <Button
                title="End Early"
                variant="outline"
                onPress={stopMeditation}
                fullWidth
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  backButton: {
    color: colors.accent.primary,
    fontSize: typography.sizes.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  moodCard: {
    marginBottom: spacing.lg,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  moodOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodOptionSelected: {
    borderColor: colors.accent.primary,
    backgroundColor: colors.accent.primary + '20',
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  moodLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  moodResponse: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  breathingCard: {
    marginBottom: spacing.lg,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  patternOption: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  patternOptionSelected: {
    backgroundColor: colors.accent.primary + '30',
    borderWidth: 1,
    borderColor: colors.accent.primary,
  },
  patternName: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  patternTiming: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  breathingModal: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  breathCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent.primary + '30',
    borderWidth: 3,
    borderColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  breathInstruction: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
  },
  breathCount: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    marginBottom: spacing.lg,
  },
  meditationCard: {
    marginBottom: spacing.lg,
  },
  meditationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  meditationOption: {
    width: '47%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
  },
  meditationEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  meditationName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  meditationDuration: {
    color: colors.text.tertiary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  affirmationCard: {
    backgroundColor: colors.accent.primary + '15',
    borderColor: colors.accent.primary + '30',
  },
  affirmationLabel: {
    color: colors.accent.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  affirmationText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontStyle: 'italic',
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  meditationModalContent: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
  },
  meditationModalEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  meditationModalTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  meditationModalDesc: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  meditationTimer: {
    color: colors.text.primary,
    fontSize: 64,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
    marginBottom: spacing.xl,
  },
  meditationComplete: {
    color: colors.accent.success,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.lg,
  },
});

export default WellnessScreen;
