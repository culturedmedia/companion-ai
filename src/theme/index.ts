export const colors = {
  // Primary palette - Deep space theme
  background: {
    primary: '#0a0a0f',
    secondary: '#12121a',
    tertiary: '#1a1a24',
    card: '#1e1e2a',
    elevated: '#252532',
  },
  
  // Accent colors
  accent: {
    primary: '#6366f1',    // Indigo
    secondary: '#8b5cf6',  // Purple
    tertiary: '#a855f7',   // Violet
    success: '#10b981',    // Emerald
    warning: '#f59e0b',    // Amber
    error: '#ef4444',      // Red
    info: '#06b6d4',       // Cyan
  },
  
  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    tertiary: '#71717a',
    muted: '#52525b',
    inverse: '#0a0a0f',
  },
  
  // Category colors
  categories: {
    work: '#6366f1',
    personal: '#8b5cf6',
    health: '#10b981',
    finance: '#f59e0b',
    errands: '#ec4899',
    social: '#06b6d4',
  },
  
  // Priority colors
  priority: {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#10b981',
  },
  
  // Gradient presets
  gradients: {
    primary: ['#6366f1', '#8b5cf6'],
    success: ['#10b981', '#34d399'],
    sunset: ['#f59e0b', '#ef4444'],
    ocean: ['#06b6d4', '#3b82f6'],
    aurora: ['#8b5cf6', '#ec4899'],
  },
  
  // Border colors
  border: {
    default: '#27272a',
    light: '#3f3f46',
    focus: '#6366f1',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  }),
};

export const animations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    default: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animations,
};
