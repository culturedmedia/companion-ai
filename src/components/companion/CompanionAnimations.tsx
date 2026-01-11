import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface AnimationProps {
  children: React.ReactNode;
  type: 'idle' | 'bounce' | 'celebrate' | 'sleep' | 'wave' | 'shake';
  duration?: number;
  loop?: boolean;
}

export const CompanionAnimation: React.FC<AnimationProps> = ({
  children,
  type,
  duration = 1000,
  loop = true,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    switch (type) {
      case 'idle':
        // Gentle floating animation
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: duration,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'bounce':
        // Bouncy animation
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleValue, {
              toValue: 1.1,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 0.95,
              duration: 100,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.delay(1000),
          ])
        );
        break;

      case 'celebrate':
        // Celebration animation (jump + rotate)
        animation = Animated.loop(
          Animated.parallel([
            Animated.sequence([
              Animated.timing(animatedValue, {
                toValue: 1,
                duration: 200,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: 200,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(rotateValue, {
                toValue: 1,
                duration: 400,
                easing: Easing.linear,
                useNativeDriver: true,
              }),
              Animated.timing(rotateValue, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ]),
          { iterations: loop ? -1 : 3 }
        );
        break;

      case 'sleep':
        // Slow breathing animation
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(scaleValue, {
              toValue: 1.05,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
              toValue: 0.98,
              duration: 2000,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'wave':
        // Waving animation
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(rotateValue, {
              toValue: 0.1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotateValue, {
              toValue: -0.1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotateValue, {
              toValue: 0.1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotateValue, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.delay(2000),
          ])
        );
        break;

      case 'shake':
        // Shake animation (for errors or attention)
        animation = Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: -1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]);
        break;

      default:
        return;
    }

    animation.start();

    return () => {
      animation.stop();
    };
  }, [type, duration, loop]);

  const getTransformStyle = () => {
    switch (type) {
      case 'idle':
        return {
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -10],
              }),
            },
          ],
        };

      case 'bounce':
        return {
          transform: [{ scale: scaleValue }],
        };

      case 'celebrate':
        return {
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -30],
              }),
            },
            {
              rotate: rotateValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        };

      case 'sleep':
        return {
          transform: [{ scale: scaleValue }],
        };

      case 'wave':
        return {
          transform: [
            {
              rotate: rotateValue.interpolate({
                inputRange: [-0.1, 0, 0.1],
                outputRange: ['-10deg', '0deg', '10deg'],
              }),
            },
          ],
        };

      case 'shake':
        return {
          transform: [
            {
              translateX: animatedValue.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-10, 0, 10],
              }),
            },
          ],
        };

      default:
        return {};
    }
  };

  return (
    <Animated.View style={[styles.container, getTransformStyle()]}>
      {children}
    </Animated.View>
  );
};

// Particle effect for celebrations
export const CelebrationParticles: React.FC<{ active: boolean }> = ({ active }) => {
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    const animations = particles.map((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      return Animated.parallel([
        Animated.timing(particle.x, {
          toValue: targetX,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(particle.y, {
          toValue: targetY,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      // Reset particles
      particles.forEach((particle) => {
        particle.x.setValue(0);
        particle.y.setValue(0);
        particle.opacity.setValue(0);
        particle.scale.setValue(0);
      });
    });
  }, [active]);

  if (!active) return null;

  const emojis = ['⭐', '✨', '🎉', '💫', '🌟', '💖'];

  return (
    <View style={styles.particleContainer}>
      {particles.map((particle, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        >
          {emojis[index % emojis.length]}
        </Animated.Text>
      ))}
    </View>
  );
};

// Mood indicator animation
export const MoodIndicator: React.FC<{ mood: string }> = ({ mood }) => {
  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, []);

  const getMoodEmoji = () => {
    switch (mood) {
      case 'happy':
        return '😊';
      case 'excited':
        return '🤩';
      case 'tired':
        return '😴';
      case 'sad':
        return '😢';
      default:
        return '😐';
    }
  };

  const getMoodColor = () => {
    switch (mood) {
      case 'happy':
        return '#4ade80';
      case 'excited':
        return '#fbbf24';
      case 'tired':
        return '#94a3b8';
      case 'sad':
        return '#60a5fa';
      default:
        return '#a78bfa';
    }
  };

  return (
    <Animated.View
      style={[
        styles.moodIndicator,
        {
          backgroundColor: getMoodColor() + '30',
          borderColor: getMoodColor(),
          transform: [{ scale: pulseValue }],
        },
      ]}
    >
      <Animated.Text style={styles.moodEmoji}>{getMoodEmoji()}</Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    fontSize: 20,
  },
  moodIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 16,
  },
});

export default CompanionAnimation;
