import React from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';
import { AnimalType, ANIMAL_OPTIONS } from '../../types';
import { colors, spacing } from '../../theme';

interface CompanionAvatarProps {
  animalType: AnimalType;
  size?: number;
  mood?: 'happy' | 'neutral' | 'sleepy' | 'excited';
  showName?: boolean;
  name?: string;
  energy?: number;
}

export const CompanionAvatar: React.FC<CompanionAvatarProps> = ({
  animalType,
  size = 120,
  mood = 'happy',
  showName = false,
  name,
  energy = 100,
}) => {
  const animal = ANIMAL_OPTIONS.find(a => a.type === animalType);
  const color = animal?.color || '#6366f1';

  const renderAnimal = () => {
    switch (animalType) {
      case 'fox':
        return <FoxSvg size={size} color={color} mood={mood} />;
      case 'owl':
        return <OwlSvg size={size} color={color} mood={mood} />;
      case 'cat':
        return <CatSvg size={size} color={color} mood={mood} />;
      case 'bunny':
        return <BunnySvg size={size} color={color} mood={mood} />;
      case 'dragon':
        return <DragonSvg size={size} color={color} mood={mood} />;
      case 'axolotl':
        return <AxolotlSvg size={size} color={color} mood={mood} />;
      case 'red_panda':
        return <RedPandaSvg size={size} color={color} mood={mood} />;
      case 'penguin':
        return <PenguinSvg size={size} color={color} mood={mood} />;
      default:
        return <FoxSvg size={size} color={color} mood={mood} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        {/* Glow effect */}
        <View style={[styles.glow, { 
          backgroundColor: color,
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          opacity: 0.2 + (energy / 500),
        }]} />
        {renderAnimal()}
      </View>
      {showName && name && (
        <Text style={styles.name}>{name}</Text>
      )}
    </View>
  );
};

// Fox SVG Component
const FoxSvg: React.FC<{ size: number; color: string; mood: string }> = ({ size, color, mood }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Ears */}
    <Path d="M20 35 L30 10 L40 35 Z" fill={color} />
    <Path d="M60 35 L70 10 L80 35 Z" fill={color} />
    <Path d="M25 30 L30 15 L35 30 Z" fill="#FFE4C4" />
    <Path d="M65 30 L70 15 L75 30 Z" fill="#FFE4C4" />
    
    {/* Face */}
    <Circle cx="50" cy="55" r="30" fill={color} />
    
    {/* White face patch */}
    <Ellipse cx="50" cy="65" rx="20" ry="18" fill="#FFF8F0" />
    
    {/* Eyes */}
    <Ellipse cx="40" cy="50" rx="5" ry={mood === 'happy' ? 3 : 5} fill="#2D2D2D" />
    <Ellipse cx="60" cy="50" rx="5" ry={mood === 'happy' ? 3 : 5} fill="#2D2D2D" />
    {mood === 'happy' && (
      <>
        <Circle cx="38" cy="49" r="1.5" fill="white" />
        <Circle cx="58" cy="49" r="1.5" fill="white" />
      </>
    )}
    
    {/* Nose */}
    <Circle cx="50" cy="62" r="4" fill="#2D2D2D" />
    
    {/* Mouth */}
    {mood === 'happy' ? (
      <Path d="M45 68 Q50 73 55 68" stroke="#2D2D2D" strokeWidth="2" fill="none" />
    ) : (
      <Path d="M45 70 L55 70" stroke="#2D2D2D" strokeWidth="2" fill="none" />
    )}
    
    {/* Cheeks */}
    <Circle cx="32" cy="58" r="5" fill="#FFB6C1" opacity="0.5" />
    <Circle cx="68" cy="58" r="5" fill="#FFB6C1" opacity="0.5" />
  </Svg>
);

// Owl SVG Component
const OwlSvg: React.FC<{ size: number; color: string; mood: string }> = ({ size, color, mood }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Body */}
    <Ellipse cx="50" cy="60" rx="30" ry="32" fill={color} />
    
    {/* Ear tufts */}
    <Path d="M25 30 L30 15 L38 28 Z" fill={color} />
    <Path d="M62 28 L70 15 L75 30 Z" fill={color} />
    
    {/* Face disc */}
    <Circle cx="50" cy="50" r="25" fill="#DEB887" />
    
    {/* Eye circles */}
    <Circle cx="40" cy="48" r="12" fill="#FFF8DC" />
    <Circle cx="60" cy="48" r="12" fill="#FFF8DC" />
    
    {/* Eyes */}
    <Circle cx="40" cy="48" r={mood === 'sleepy' ? 2 : 6} fill="#2D2D2D" />
    <Circle cx="60" cy="48" r={mood === 'sleepy' ? 2 : 6} fill="#2D2D2D" />
    {mood !== 'sleepy' && (
      <>
        <Circle cx="38" cy="46" r="2" fill="white" />
        <Circle cx="58" cy="46" r="2" fill="white" />
      </>
    )}
    
    {/* Beak */}
    <Path d="M50 55 L45 65 L50 62 L55 65 Z" fill="#F4A460" />
    
    {/* Belly pattern */}
    <Ellipse cx="50" cy="75" rx="15" ry="12" fill="#DEB887" />
    <Path d="M42 70 L42 82" stroke={color} strokeWidth="2" />
    <Path d="M50 68 L50 84" stroke={color} strokeWidth="2" />
    <Path d="M58 70 L58 82" stroke={color} strokeWidth="2" />
  </Svg>
);

// Cat SVG Component
const CatSvg: React.FC<{ size: number; color: string; mood: string }> = ({ size, color, mood }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Ears */}
    <Path d="M22 40 L28 12 L42 35 Z" fill={color} />
    <Path d="M58 35 L72 12 L78 40 Z" fill={color} />
    <Path d="M27 35 L30 20 L38 32 Z" fill="#FFB6C1" />
    <Path d="M62 32 L70 20 L73 35 Z" fill="#FFB6C1" />
    
    {/* Face */}
    <Circle cx="50" cy="55" r="30" fill={color} />
    
    {/* Eyes */}
    <Ellipse cx="38" cy="50" rx="6" ry={mood === 'sleepy' ? 1 : 8} fill="#90EE90" />
    <Ellipse cx="62" cy="50" rx="6" ry={mood === 'sleepy' ? 1 : 8} fill="#90EE90" />
    {mood !== 'sleepy' && (
      <>
        <Ellipse cx="38" cy="50" rx="2" ry="6" fill="#2D2D2D" />
        <Ellipse cx="62" cy="50" rx="2" ry="6" fill="#2D2D2D" />
      </>
    )}
    
    {/* Nose */}
    <Path d="M50 58 L47 63 L53 63 Z" fill="#FFB6C1" />
    
    {/* Mouth */}
    <Path d="M50 63 L50 68" stroke="#2D2D2D" strokeWidth="2" />
    <Path d="M50 68 Q45 72 40 68" stroke="#2D2D2D" strokeWidth="2" fill="none" />
    <Path d="M50 68 Q55 72 60 68" stroke="#2D2D2D" strokeWidth="2" fill="none" />
    
    {/* Whiskers */}
    <Path d="M25 55 L38 58" stroke="#2D2D2D" strokeWidth="1" />
    <Path d="M25 60 L38 60" stroke="#2D2D2D" strokeWidth="1" />
    <Path d="M25 65 L38 62" stroke="#2D2D2D" strokeWidth="1" />
    <Path d="M75 55 L62 58" stroke="#2D2D2D" strokeWidth="1" />
    <Path d="M75 60 L62 60" stroke="#2D2D2D" strokeWidth="1" />
    <Path d="M75 65 L62 62" stroke="#2D2D2D" strokeWidth="1" />
  </Svg>
);

// Bunny SVG Component
const BunnySvg: React.FC<{ size: number; color: string; mood: string }> = ({ size, color, mood }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Ears */}
    <Ellipse cx="35" cy="25" rx="8" ry="22" fill={color} />
    <Ellipse cx="65" cy="25" rx="8" ry="22" fill={color} />
    <Ellipse cx="35" cy="25" rx="4" ry="16" fill="#FFB6C1" />
    <Ellipse cx="65" cy="25" rx="4" ry="16" fill="#FFB6C1" />
    
    {/* Face */}
    <Circle cx="50" cy="60" r="28" fill={color} />
    
    {/* Eyes */}
    <Circle cx="40" cy="55" r="5" fill="#2D2D2D" />
    <Circle cx="60" cy="55" r="5" fill="#2D2D2D" />
    <Circle cx="38" cy="53" r="2" fill="white" />
    <Circle cx="58" cy="53" r="2" fill="white" />
    
    {/* Nose */}
    <Ellipse cx="50" cy="65" rx="4" ry="3" fill="#FFB6C1" />
    
    {/* Mouth */}
    <Path d="M50 68 L50 72" stroke="#2D2D2D" strokeWidth="2" />
    {mood === 'happy' ? (
      <>
        <Path d="M50 72 Q45 76 42 72" stroke="#2D2D2D" strokeWidth="2" fill="none" />
        <Path d="M50 72 Q55 76 58 72" stroke="#2D2D2D" strokeWidth="2" fill="none" />
      </>
    ) : (
      <Path d="M45 74 L55 74" stroke="#2D2D2D" strokeWidth="2" />
    )}
    
    {/* Cheeks */}
    <Circle cx="32" cy="62" r="6" fill="#FFB6C1" opacity="0.5" />
    <Circle cx="68" cy="62" r="6" fill="#FFB6C1" opacity="0.5" />
  </Svg>
);

// Dragon SVG Component
const DragonSvg: React.FC<{ size: number; color: string; mood: string }> = ({ size, color, mood }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Horns */}
    <Path d="M25 35 L20 10 L35 30 Z" fill="#4B0082" />
    <Path d="M65 30 L80 10 L75 35 Z" fill="#4B0082" />
    
    {/* Head */}
    <Ellipse cx="50" cy="55" rx="28" ry="25" fill={color} />
    
    {/* Snout */}
    <Ellipse cx="50" cy="70" rx="15" ry="12" fill={color} />
    
    {/* Scales on forehead */}
    <Circle cx="50" cy="38" r="4" fill="#4B0082" />
    <Circle cx="42" cy="42" r="3" fill="#4B0082" />
    <Circle cx="58" cy="42" r="3" fill="#4B0082" />
    
    {/* Eyes */}
    <Ellipse cx="38" cy="52" rx="6" ry="7" fill="#FFD700" />
    <Ellipse cx="62" cy="52" rx="6" ry="7" fill="#FFD700" />
    <Ellipse cx="38" cy="52" rx="2" ry="5" fill="#2D2D2D" />
    <Ellipse cx="62" cy="52" rx="2" ry="5" fill="#2D2D2D" />
    
    {/* Nostrils */}
    <Circle cx="45" cy="68" r="2" fill="#4B0082" />
    <Circle cx="55" cy="68" r="2" fill="#4B0082" />
    
    {/* Mouth */}
    {mood === 'happy' ? (
      <Path d="M40 78 Q50 85 60 78" stroke="#4B0082" strokeWidth="2" fill="none" />
    ) : (
      <Path d="M42 80 L58 80" stroke="#4B0082" strokeWidth="2" />
    )}
    
    {/* Small flame */}
    {mood === 'excited' && (
      <Path d="M50 85 Q48 92 50 95 Q52 92 50 85" fill="#FF4500" />
    )}
  </Svg>
);

// Axolotl SVG Component
const AxolotlSvg: React.FC<{ size: number; color: string; mood: string }> = ({ size, color, mood }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Gills */}
    <G>
      <Path d="M15 40 Q10 35 8 25 Q12 30 18 35" fill={color} />
      <Path d="M18 45 Q10 42 5 35 Q12 38 20 42" fill={color} />
      <Path d="M20 50 Q12 50 8 45 Q15 48 22 50" fill={color} />
    </G>
    <G>
      <Path d="M85 40 Q90 35 92 25 Q88 30 82 35" fill={color} />
      <Path d="M82 45 Q90 42 95 35 Q88 38 80 42" fill={color} />
      <Path d="M80 50 Q88 50 92 45 Q85 48 78 50" fill={color} />
    </G>
    
    {/* Head */}
    <Ellipse cx="50" cy="55" rx="30" ry="25" fill={color} />
    
    {/* Eyes */}
    <Circle cx="38" cy="50" r="8" fill="#2D2D2D" />
    <Circle cx="62" cy="50" r="8" fill="#2D2D2D" />
    <Circle cx="36" cy="48" r="3" fill="white" />
    <Circle cx="60" cy="48" r="3" fill="white" />
    
    {/* Smile */}
    {mood === 'happy' ? (
      <Path d="M35 68 Q50 78 65 68" stroke="#2D2D2D" strokeWidth="2" fill="none" />
    ) : (
      <Path d="M40 70 Q50 72 60 70" stroke="#2D2D2D" strokeWidth="2" fill="none" />
    )}
    
    {/* Cheek dots */}
    <Circle cx="30" cy="60" r="4" fill="#FF69B4" opacity="0.6" />
    <Circle cx="70" cy="60" r="4" fill="#FF69B4" opacity="0.6" />
  </Svg>
);

// Red Panda SVG Component
const RedPandaSvg: React.FC<{ size: number; color: string; mood: string }> = ({ size, color, mood }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Ears */}
    <Circle cx="25" cy="28" r="12" fill={color} />
    <Circle cx="75" cy="28" r="12" fill={color} />
    <Circle cx="25" cy="28" r="6" fill="#2D2D2D" />
    <Circle cx="75" cy="28" r="6" fill="#2D2D2D" />
    
    {/* Face */}
    <Circle cx="50" cy="55" r="30" fill={color} />
    
    {/* White face markings */}
    <Ellipse cx="35" cy="52" rx="10" ry="12" fill="#FFF8F0" />
    <Ellipse cx="65" cy="52" rx="10" ry="12" fill="#FFF8F0" />
    <Ellipse cx="50" cy="68" rx="12" ry="10" fill="#FFF8F0" />
    
    {/* Eyes */}
    <Circle cx="38" cy="50" r="5" fill="#2D2D2D" />
    <Circle cx="62" cy="50" r="5" fill="#2D2D2D" />
    <Circle cx="36" cy="48" r="2" fill="white" />
    <Circle cx="60" cy="48" r="2" fill="white" />
    
    {/* Nose */}
    <Circle cx="50" cy="62" r="4" fill="#2D2D2D" />
    
    {/* Mouth */}
    {mood === 'happy' ? (
      <Path d="M45 70 Q50 75 55 70" stroke="#2D2D2D" strokeWidth="2" fill="none" />
    ) : (
      <Path d="M45 72 L55 72" stroke="#2D2D2D" strokeWidth="2" />
    )}
    
    {/* Tear marks */}
    <Path d="M30 55 Q28 62 32 68" stroke={color} strokeWidth="3" fill="none" />
    <Path d="M70 55 Q72 62 68 68" stroke={color} strokeWidth="3" fill="none" />
  </Svg>
);

// Penguin SVG Component
const PenguinSvg: React.FC<{ size: number; color: string; mood: string }> = ({ size, color, mood }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Body */}
    <Ellipse cx="50" cy="58" rx="28" ry="32" fill="#2D2D2D" />
    
    {/* White belly */}
    <Ellipse cx="50" cy="62" rx="18" ry="24" fill="#FFF8F0" />
    
    {/* Head */}
    <Circle cx="50" cy="35" r="22" fill="#2D2D2D" />
    
    {/* White face */}
    <Ellipse cx="50" cy="38" rx="15" ry="12" fill="#FFF8F0" />
    
    {/* Eyes */}
    <Circle cx="42" cy="35" r="5" fill="#2D2D2D" />
    <Circle cx="58" cy="35" r="5" fill="#2D2D2D" />
    <Circle cx="41" cy="34" r="2" fill="white" />
    <Circle cx="57" cy="34" r="2" fill="white" />
    
    {/* Beak */}
    <Path d="M50 42 L45 50 L50 48 L55 50 Z" fill="#FF8C00" />
    
    {/* Cheeks */}
    <Circle cx="35" cy="40" r="5" fill="#FFB6C1" opacity="0.5" />
    <Circle cx="65" cy="40" r="5" fill="#FFB6C1" opacity="0.5" />
    
    {/* Flippers */}
    <Ellipse cx="22" cy="60" rx="6" ry="15" fill="#2D2D2D" transform="rotate(-15 22 60)" />
    <Ellipse cx="78" cy="60" rx="6" ry="15" fill="#2D2D2D" transform="rotate(15 78 60)" />
    
    {/* Feet */}
    <Ellipse cx="40" cy="88" rx="8" ry="4" fill="#FF8C00" />
    <Ellipse cx="60" cy="88" rx="8" ry="4" fill="#FF8C00" />
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  name: {
    marginTop: spacing.sm,
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CompanionAvatar;
