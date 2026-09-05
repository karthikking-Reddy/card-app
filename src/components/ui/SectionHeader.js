import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors, typography } from '../../theme';

export default function SectionHeader({ eyebrow, title, actionLabel, onActionPress }) {
  return (
    <View style={styles.container}>
      <View
        style={{
          flex: 1,
        }}
      >
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}

        <Text style={typography.h3}>{title}</Text>
      </View>

      {actionLabel ? (
        <TouchableOpacity style={styles.action} onPress={onActionPress}>
          <Text style={styles.actionText}>{actionLabel}</Text>

          <Ionicons name="chevron-forward" size={15} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',

    alignItems: 'flex-end',

    marginTop: 24,

    marginBottom: 10,
  },

  eyebrow: {
    ...typography.label,

    color: colors.goldDark,

    marginBottom: 3,
  },

  action: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 3,

    paddingVertical: 5,
  },

  actionText: {
    ...typography.small,

    fontWeight: '700',
  },
});
