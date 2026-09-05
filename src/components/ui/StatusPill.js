import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../../theme';

const palettes = {
  success: {
    background: colors.successSoft,

    foreground: colors.success,
  },

  warning: {
    background: colors.warningSoft,

    foreground: colors.warning,
  },

  danger: {
    background: colors.dangerSoft,

    foreground: colors.danger,
  },

  info: {
    background: colors.infoSoft,

    foreground: colors.info,
  },

  neutral: {
    background: colors.surfaceSoft,

    foreground: colors.textSecondary,
  },
};

export default function StatusPill({
  label,

  tone = 'neutral',

  dot = true,
}) {
  const palette = palettes[tone] || palettes.neutral;

  return (
    <View
      style={[
        styles.container,

        {
          backgroundColor: palette.background,
        },
      ]}
    >
      {dot ? (
        <View
          style={[
            styles.dot,

            {
              backgroundColor: palette.foreground,
            },
          ]}
        />
      ) : null}

      <Text
        style={[
          styles.text,

          {
            color: palette.foreground,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    paddingHorizontal: 9,

    paddingVertical: 5,

    borderRadius: radius.round,
  },

  dot: {
    width: 6,
    height: 6,

    borderRadius: 3,
  },

  text: {
    fontSize: 9,

    fontWeight: '800',
  },
});
