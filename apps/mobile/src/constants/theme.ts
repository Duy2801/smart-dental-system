import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  primary: '#0875D1',
  onPrimary: '#FFFFFF',
  secondary: '#0D9488',
  onSecondary: '#FFFFFF',
  background: '#F6F8FC',
  surface: '#FFFFFF',
  error: '#D92D20',
  outline: '#D9E1EC',
  text: '#101828',
  muted: '#667085',
};

export const paperLightTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    onPrimary: colors.onPrimary,
    secondary: colors.secondary,
    onSecondary: colors.onSecondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    outline: colors.outline,
  },
};
