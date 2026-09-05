import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import * as Haptics from 'expo-haptics';

import { colors, radius, shadows, typography } from '../../theme';

const variants = {
  primary: {
    background: colors.navy,

    text: colors.white,

    icon: colors.white,

    border: colors.navy,
  },

  gold: {
    background: colors.gold,

    text: colors.navy,

    icon: colors.navy,

    border: colors.gold,
  },

  secondary: {
    background: colors.surface,

    text: colors.text,

    icon: colors.text,

    border: colors.border,
  },

  outline: {
    background: 'transparent',

    text: colors.text,

    icon: colors.text,

    border: colors.borderStrong,
  },

  whatsapp: {
    background: colors.whatsapp,

    text: colors.white,

    icon: colors.white,

    border: colors.whatsapp,
  },

  meta: {
    background: colors.meta,

    text: colors.white,

    icon: colors.white,

    border: colors.meta,
  },

  danger: {
    background: colors.dangerSoft,

    text: colors.danger,

    icon: colors.danger,

    border: colors.dangerSoft,
  },

  ghost: {
    background: 'transparent',

    text: colors.textSecondary,

    icon: colors.textSecondary,

    border: 'transparent',
  },
};

export default function AppButton({
  title,
  onPress,

  variant = 'primary',

  icon,

  iconPosition = 'left',

  loading = false,

  disabled = false,

  fullWidth = true,

  size = 'medium',

  style,
}) {
  const palette = variants[variant] || variants.primary;

  async function handlePress() {
    if (disabled || loading) {
      return;
    }

    try {
      await Haptics.selectionAsync();
    } catch {
      // Haptics are optional.
    }

    onPress?.();
  }

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,

        styles[`size_${size}`],

        {
          backgroundColor: palette.background,

          borderColor: palette.border,

          opacity: disabled ? 0.45 : pressed ? 0.82 : 1,

          transform: [
            {
              scale: pressed ? 0.985 : 1,
            },
          ],
        },

        fullWidth && styles.fullWidth,

        variant === 'primary' && shadows.soft,

        variant === 'meta' && shadows.soft,

        variant === 'whatsapp' && shadows.soft,

        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={size === 'small' ? 17 : 20} color={palette.icon} />
          ) : null}

          <Text
            style={[
              typography.button,

              {
                color: palette.text,
              },
            ]}
          >
            {title}
          </Text>

          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={size === 'small' ? 17 : 20} color={palette.icon} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,

    borderRadius: radius.md,

    alignItems: 'center',

    justifyContent: 'center',
  },

  fullWidth: {
    width: '100%',
  },

  size_small: {
    minHeight: 40,
    paddingHorizontal: 14,
  },

  size_medium: {
    minHeight: 50,
    paddingHorizontal: 18,
  },

  size_large: {
    minHeight: 56,
    paddingHorizontal: 22,
    borderRadius: radius.lg,
  },

  content: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 8,
  },
});
