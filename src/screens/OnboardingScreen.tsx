import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../stores/authStore';
import { useCompanionStore } from '../stores/companionStore';
import { CompanionAvatar } from '../components/companion/CompanionAvatar';
import { Button, Input } from '../components/ui';
import { AnimalType, ANIMAL_OPTIONS } from '../types';
import { colors, spacing, borderRadius, typography } from '../theme';

type OnboardingStep = 'welcome' | 'name' | 'animal' | 'companion-name' | 'complete';

export const OnboardingScreen: React.FC = () => {
  const { updateProfile, setOnboarded } = useAuthStore();
  const { createCompanion } = useCompanionStore();
  
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [userName, setUserName] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalType | null>(null);
  const [companionName, setCompanionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    switch (step) {
      case 'welcome':
        setStep('name');
        break;
      case 'name':
        if (userName.trim()) {
          await updateProfile({ display_name: userName.trim() });
          setStep('animal');
        }
        break;
      case 'animal':
        if (selectedAnimal) {
          setStep('companion-name');
        }
        break;
      case 'companion-name':
        if (companionName.trim() && selectedAnimal) {
          setIsLoading(true);
          const { error } = await createCompanion(companionName.trim(), selectedAnimal);
          setIsLoading(false);
          if (!error) {
            setStep('complete');
          }
        }
        break;
      case 'complete':
        setOnboarded(true);
        break;
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeEmoji}>
        <Text style={styles.bigEmoji}>✨</Text>
      </View>
      <Text style={styles.welcomeTitle}>Welcome to CompanionAI</Text>
      <Text style={styles.welcomeSubtitle}>
        Your voice-first personal assistant with a whimsical companion to help you stay organized and motivated.
      </Text>
      
      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🎤</Text>
          <Text style={styles.featureText}>Talk to add tasks & manage your day</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🦊</Text>
          <Text style={styles.featureText}>Choose a companion to guide you</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureEmoji}>🎮</Text>
          <Text style={styles.featureText}>Earn rewards for completing tasks</Text>
        </View>
      </View>
    </View>
  );

  const renderNameStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>What should I call you?</Text>
      <Text style={styles.stepSubtitle}>
        Your companion will use this name to greet you
      </Text>
      
      <Input
        placeholder="Enter your name"
        value={userName}
        onChangeText={setUserName}
        autoFocus
        style={styles.nameInput}
      />
    </View>
  );

  const renderAnimalStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose your companion</Text>
      <Text style={styles.stepSubtitle}>
        Each companion has a unique personality
      </Text>
      
      <ScrollView 
        style={styles.animalGrid}
        contentContainerStyle={styles.animalGridContent}
        showsVerticalScrollIndicator={false}
      >
        {ANIMAL_OPTIONS.map((animal) => (
          <TouchableOpacity
            key={animal.type}
            onPress={() => setSelectedAnimal(animal.type)}
            style={[
              styles.animalCard,
              selectedAnimal === animal.type && {
                borderColor: animal.color,
                backgroundColor: animal.color + '20',
              },
            ]}
          >
            <CompanionAvatar
              animalType={animal.type}
              size={80}
              mood="happy"
            />
            <Text style={styles.animalName}>{animal.name}</Text>
            <Text style={[styles.animalPersonality, { color: animal.color }]}>
              {animal.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCompanionNameStep = () => {
    const animal = ANIMAL_OPTIONS.find(a => a.type === selectedAnimal);
    
    return (
      <View style={styles.stepContainer}>
        <CompanionAvatar
          animalType={selectedAnimal || 'fox'}
          size={120}
          mood="happy"
        />
        
        <Text style={styles.stepTitle}>Name your {animal?.name}</Text>
        <Text style={styles.stepSubtitle}>
          Give your companion a special name
        </Text>
        
        <Input
          placeholder={`e.g., ${animal?.name === 'Fox' ? 'Rusty' : animal?.name === 'Owl' ? 'Wisdom' : 'Buddy'}`}
          value={companionName}
          onChangeText={setCompanionName}
          autoFocus
          style={styles.nameInput}
        />
        
        <View style={styles.suggestionRow}>
          {['Luna', 'Mochi', 'Pip', 'Nova'].map(name => (
            <TouchableOpacity
              key={name}
              onPress={() => setCompanionName(name)}
              style={styles.suggestionChip}
            >
              <Text style={styles.suggestionText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderComplete = () => {
    const animal = ANIMAL_OPTIONS.find(a => a.type === selectedAnimal);
    
    return (
      <View style={styles.stepContainer}>
        <View style={styles.completeAnimation}>
          <CompanionAvatar
            animalType={selectedAnimal || 'fox'}
            size={150}
            mood="excited"
          />
        </View>
        
        <Text style={styles.completeTitle}>
          {companionName} is ready! 🎉
        </Text>
        <Text style={styles.completeSubtitle}>
          Your {animal?.personality} {animal?.name?.toLowerCase()} companion is excited to help you stay organized and motivated.
        </Text>
        
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Quick Tip</Text>
          <Text style={styles.tipText}>
            Tap the microphone and say "Add task to call mom tomorrow" to create your first task!
          </Text>
        </View>
      </View>
    );
  };

  const canProceed = () => {
    switch (step) {
      case 'welcome':
        return true;
      case 'name':
        return userName.trim().length > 0;
      case 'animal':
        return selectedAnimal !== null;
      case 'companion-name':
        return companionName.trim().length > 0;
      case 'complete':
        return true;
      default:
        return false;
    }
  };

  const getButtonText = () => {
    switch (step) {
      case 'welcome':
        return "Let's Go!";
      case 'complete':
        return "Start Using CompanionAI";
      default:
        return "Continue";
    }
  };

  const getProgress = () => {
    const steps: OnboardingStep[] = ['welcome', 'name', 'animal', 'companion-name', 'complete'];
    return ((steps.indexOf(step) + 1) / steps.length) * 100;
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, colors.background.secondary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 'welcome' && renderWelcome()}
            {step === 'name' && renderNameStep()}
            {step === 'animal' && renderAnimalStep()}
            {step === 'companion-name' && renderCompanionNameStep()}
            {step === 'complete' && renderComplete()}
          </ScrollView>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <Button
              title={getButtonText()}
              onPress={handleNext}
              disabled={!canProceed()}
              loading={isLoading}
              fullWidth
              size="lg"
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  stepContainer: {
    alignItems: 'center',
  },
  welcomeEmoji: {
    marginBottom: spacing.lg,
  },
  bigEmoji: {
    fontSize: 80,
  },
  welcomeTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  welcomeSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  featureList: {
    width: '100%',
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    flex: 1,
  },
  stepTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  nameInput: {
    width: '100%',
    fontSize: typography.sizes.lg,
    textAlign: 'center',
  },
  animalGrid: {
    width: '100%',
    maxHeight: 400,
  },
  animalGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  animalCard: {
    width: '47%',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  animalName: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.sm,
  },
  animalPersonality: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  suggestionChip: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  suggestionText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  completeAnimation: {
    marginBottom: spacing.lg,
  },
  completeTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  completeSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.xl,
  },
  tipCard: {
    backgroundColor: colors.accent.primary + '20',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: colors.accent.primary,
  },
  tipTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  tipText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
});

export default OnboardingScreen;
