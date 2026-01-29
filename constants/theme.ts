// constants/theme.ts
import { useColorScheme } from 'react-native';

const PALETTE = {
  primary: '#38bdf8', // Sky Blue
  secondary: '#f97316', // Orange
  darkBg: '#0f172a',
  darkCard: '#1e293b',
  lightBg: '#f1f5f9',
  lightCard: '#ffffff',
  textLight: '#ffffff',
  textDark: '#0f172a',
  subText: '#94a3b8'
};

export const useTheme = () => {
  const scheme = useColorScheme(); // System theme detect karega
  const isDark = scheme === 'dark';

  return {
    isDark,
    colors: {
      background: isDark ? PALETTE.darkBg : PALETTE.lightBg,
      card: isDark ? PALETTE.darkCard : PALETTE.lightCard,
      text: isDark ? PALETTE.textLight : PALETTE.textDark,
      subText: PALETTE.subText,
      primary: PALETTE.primary,
      secondary: PALETTE.secondary,
      iconBg: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.1)',
      border: isDark ? '#334155' : '#e2e8f0',
      statusBar: isDark ? 'light-content' : 'dark-content',
    }
  };
};

