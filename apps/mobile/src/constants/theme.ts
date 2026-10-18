import { configureFonts, MD3LightTheme } from 'react-native-paper';

export const appFontFamily = {
  bold: 'BeVietnamPro-Bold',
  regular: 'BeVietnamPro-Regular',
  semiBold: 'BeVietnamPro-SemiBold',
} as const;

const paperFontConfig = {
  bodyLarge: { fontFamily: appFontFamily.regular },
  bodyMedium: { fontFamily: appFontFamily.regular },
  bodySmall: { fontFamily: appFontFamily.regular },
  displayLarge: { fontFamily: appFontFamily.bold },
  displayMedium: { fontFamily: appFontFamily.bold },
  displaySmall: { fontFamily: appFontFamily.bold },
  headlineLarge: { fontFamily: appFontFamily.bold },
  headlineMedium: { fontFamily: appFontFamily.bold },
  headlineSmall: { fontFamily: appFontFamily.bold },
  labelLarge: { fontFamily: appFontFamily.semiBold },
  labelMedium: { fontFamily: appFontFamily.semiBold },
  labelSmall: { fontFamily: appFontFamily.semiBold },
  titleLarge: { fontFamily: appFontFamily.semiBold },
  titleMedium: { fontFamily: appFontFamily.semiBold },
  titleSmall: { fontFamily: appFontFamily.semiBold },
};

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
  fonts: configureFonts({ config: paperFontConfig }),
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
