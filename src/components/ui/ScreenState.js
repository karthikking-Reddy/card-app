import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from './AppButton';
import { colors, radius, spacing, typography } from '../../theme';

const STATE_CONFIG = {
  empty: { icon: 'file-tray-outline', tone: colors.textSecondary },
  offline: { icon: 'cloud-offline-outline', tone: colors.warning },
  success: { icon: 'checkmark-circle-outline', tone: colors.success },
  error: { icon: 'alert-circle-outline', tone: colors.danger },
};

export default function ScreenState({
  variant = 'empty',
  title,
  message,
  actionLabel,
  onAction,
  fullScreen = false,
  accessibilityLabel,
}) {
  const config = STATE_CONFIG[variant] || STATE_CONFIG.empty;

  return (
    <View
      style={[styles.container, fullScreen && styles.fullScreen]}
      accessibilityRole={variant === 'error' ? 'alert' : 'summary'}
      accessibilityLabel={accessibilityLabel || [title, message].filter(Boolean).join('. ')}
    >
      <View style={[styles.icon, { backgroundColor: `${config.tone}14` }]}>
        <Ionicons name={config.icon} size={30} color={config.tone} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton
          title={actionLabel}
          onPress={onAction}
          size="small"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

export function LoadingState({ message = 'Loading…', fullScreen = true }) {
  return (
    <View
      style={[styles.container, fullScreen && styles.fullScreen]}
      accessibilityRole="progressbar"
    >
      <ActivityIndicator size="large" color={colors.goldDark} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function EmptyState(props) {
  return <ScreenState variant="empty" {...props} />;
}

export function OfflineState(props) {
  return <ScreenState variant="offline" title="You're offline" {...props} />;
}

export function SuccessState(props) {
  return <ScreenState variant="success" {...props} />;
}

export function ErrorState(props) {
  return <ScreenState variant="error" title="Something went wrong" {...props} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[24],
  },
  fullScreen: {
    flex: 1,
    minHeight: 260,
    backgroundColor: colors.background,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[14],
  },
  title: { ...typography.h3, textAlign: 'center' },
  message: {
    ...typography.small,
    maxWidth: 300,
    marginTop: spacing[6],
    textAlign: 'center',
  },
  loadingText: { ...typography.bodyMedium, color: colors.textSecondary, marginTop: spacing[14] },
  action: { marginTop: spacing[18], minWidth: 132 },
});
