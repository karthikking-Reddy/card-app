import { Platform } from 'react-native';

export const colors = {
  /*
   * BRAND
   */
  navy: '#061B36',
  navySoft: '#123457',
  navyDeep: '#031326',

  gold: '#F4B91F',
  goldDark: '#D99A12',
  goldSoft: '#FFF6DD',

  blue: '#2563EB',
  blueSoft: '#EFF6FF',

  /*
   * APP
   */
  background: '#FAF8F2',
  surface: '#FFFFFF',
  surfaceSoft: '#F8FAFC',

  text: '#111827',
  textSecondary: '#667085',
  textMuted: '#98A2B3',

  border: '#E7EAF0',
  borderStrong: '#D0D5DD',

  /*
   * STATES
   */
  success: '#16A36A',
  successSoft: '#ECFDF3',

  warning: '#D97706',
  warningSoft: '#FFF7ED',

  danger: '#D92D3A',
  dangerSoft: '#FEF2F2',

  info: '#2563EB',
  infoSoft: '#EFF6FF',

  /*
   * INTEGRATIONS
   */
  whatsapp: '#16A34A',
  whatsappSoft: '#ECFDF3',

  meta: '#0866FF',
  metaSoft: '#EEF4FF',

  /*
   * GENERIC
   */
  black: '#000000',
  white: '#FFFFFF',

  overlay: 'rgba(3,19,38,0.56)',
};

export const fontFamilies = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'sans-serif' }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
};

export const spacing = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  14: 14,
  16: 16,
  18: 18,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
  40: 40,
  48: 48,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  round: 999,
};

export const typography = {
  display: {
    fontFamily: fontFamilies.medium,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '800',
    color: colors.text,
  },

  h1: {
    fontFamily: fontFamilies.medium,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '800',
    color: colors.text,
  },

  h2: {
    fontFamily: fontFamilies.medium,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '800',
    color: colors.text,
  },

  h3: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.text,
  },

  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
    color: colors.text,
  },

  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: colors.text,
  },

  small: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
    color: colors.textSecondary,
  },

  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 0.7,
    color: colors.textSecondary,
  },

  button: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },

  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '500',
    color: colors.textMuted,
  },
};

export const shadows = {
  soft: {
    shadowColor: '#101828',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.06,
    shadowRadius: 12,

    elevation: 2,
  },

  medium: {
    shadowColor: '#101828',

    shadowOffset: {
      width: 0,
      height: 7,
    },

    shadowOpacity: 0.1,
    shadowRadius: 18,

    elevation: 4,
  },
};

export const theme = {
  colors,
  fontFamilies,
  spacing,
  radius,
  typography,
  shadows,
};

export default theme;
