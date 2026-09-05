import { StyleSheet, View } from 'react-native';

import { colors, radius, shadows } from '../../theme';

export default function AppCard({
  children,

  padded = true,

  elevated = false,

  style,
}) {
  return (
    <View style={[styles.card, padded && styles.padded, elevated && shadows.soft, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.xl,
  },

  padded: {
    padding: 16,
  },
});
