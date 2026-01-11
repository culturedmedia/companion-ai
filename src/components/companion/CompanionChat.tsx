import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { useCompanionStore } from '../../stores/companionStore';
import { ANIMAL_OPTIONS } from '../../types';

interface Message {
  id: string;
  text: string;
  isCompanion: boolean;
  timestamp: Date;
}

interface CompanionChatProps {
  messages: Message[];
  isTyping?: boolean;
}

export const CompanionChat: React.FC<CompanionChatProps> = ({
  messages,
  isTyping = false,
}) => {
  const { companion } = useCompanionStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const typingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      typingAnim.setValue(0);
    }
  }, [isTyping]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const animal = companion 
    ? ANIMAL_OPTIONS.find(a => a.type === companion.animal_type)
    : null;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isCompanion ? styles.companionBubble : styles.userBubble,
            ]}
          >
            {message.isCompanion && animal && (
              <Text style={styles.companionEmoji}>{animal.emoji}</Text>
            )}
            <View style={[
              styles.bubbleContent,
              message.isCompanion ? styles.companionContent : styles.userContent,
            ]}>
              <Text style={[
                styles.messageText,
                !message.isCompanion && styles.userText,
              ]}>
                {message.text}
              </Text>
            </View>
          </View>
        ))}
        
        {isTyping && (
          <View style={[styles.messageBubble, styles.companionBubble]}>
            {animal && <Text style={styles.companionEmoji}>{animal.emoji}</Text>}
            <View style={[styles.bubbleContent, styles.companionContent]}>
              <View style={styles.typingIndicator}>
                <Animated.View
                  style={[
                    styles.typingDot,
                    { opacity: typingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    })},
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    { opacity: typingAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.3, 1, 0.3],
                    })},
                  ]}
                />
                <Animated.View
                  style={[
                    styles.typingDot,
                    { opacity: typingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.3],
                    })},
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  companionBubble: {
    justifyContent: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  companionEmoji: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  bubbleContent: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  companionContent: {
    backgroundColor: colors.background.elevated,
    borderBottomLeftRadius: borderRadius.sm,
  },
  userContent: {
    backgroundColor: colors.accent.primary,
    borderBottomRightRadius: borderRadius.sm,
    marginLeft: 'auto',
  },
  messageText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  userText: {
    color: colors.text.primary,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.text.secondary,
    marginHorizontal: 2,
  },
});

export default CompanionChat;
