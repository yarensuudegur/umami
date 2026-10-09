/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B1F1D',
    background: '#F6F5F1',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7E6E0',
    textSecondary: '#6B716D',
    border: '#E4E3DC',
    accent: '#2E7D5B',
    accentSoft: '#DDEEE5',
    onAccent: '#FFFFFF',
    danger: '#C7372F',
    dangerSoft: '#FBE4E2',
    warning: '#C2570C',
    warningSoft: '#FDEBD9',
    caution: '#8A6A00',
    cautionSoft: '#FAF0C8',
  },
  dark: {
    text: '#F2F3F1',
    background: '#111413',
    backgroundElement: '#1B1F1D',
    backgroundSelected: '#2A2F2C',
    textSecondary: '#A3AAA5',
    border: '#2A2F2C',
    accent: '#4FB88A',
    accentSoft: '#1E3A2E',
    onAccent: '#0B1A12',
    danger: '#FF8A80',
    dangerSoft: '#3E1F1D',
    warning: '#FFA45E',
    warningSoft: '#3C2A19',
    caution: '#F2D55C',
    cautionSoft: '#3A3317',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
