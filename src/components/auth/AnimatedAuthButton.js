import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, typography } from '../../theme';

export default function AnimatedAuthButton({
  title,
  loadingTitle,
  loading,
  disabled,
  icon = 'arrow-forward',
  onPress,
  scale,
  arrowTranslate,
}) {
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={disabled || loading}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
        style={[styles.button, (disabled || loading) && styles.disabled]}
      >
        <View style={styles.spacer} />
        <Text style={styles.text}>{loading ? loadingTitle : title}</Text>
        <Animated.View style={[styles.icon, { transform: [{ translateX: arrowTranslate }] }]}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.navy} />
          ) : (
            <Ionicons name={icon} size={21} color={colors.navy} />
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    marginTop: 18,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    shadowColor: colors.gold,
    ...shadows.medium,
  },
  disabled: { opacity: 0.72 },
  icon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { ...typography.button, color: colors.white, fontSize: 16 },
  spacer: { width: 39 },
});
