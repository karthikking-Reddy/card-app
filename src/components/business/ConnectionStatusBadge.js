import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, typography } from '../../theme';

export const CONNECTION_STATES = {
  connected: { label: 'Connected', color: colors.success, background: colors.successSoft },
  setup_required: { label: 'Setup required', color: colors.goldDark, background: colors.goldSoft },
  action_required: {
    label: 'Action required',
    color: colors.danger,
    background: colors.dangerSoft,
  },
  temporarily_unavailable: {
    label: 'Temporarily unavailable',
    color: colors.danger,
    background: colors.dangerSoft,
  },
  not_connected: {
    label: 'Not connected',
    color: colors.textSecondary,
    background: colors.surfaceSoft,
  },
  coming_later: {
    label: 'Coming later',
    color: colors.textSecondary,
    background: colors.surfaceSoft,
  },
};

export function normalizeConnectionState(value, { verified = false } = {}) {
  const status = String(value || '').toLowerCase();
  if (status === 'connected' && verified) return 'connected';
  if (['error', 'expired', 'disconnected_error', 'action_required'].includes(status)) {
    return 'action_required';
  }
  if (['unavailable', 'temporarily_unavailable'].includes(status)) {
    return 'temporarily_unavailable';
  }
  if (['pending', 'setup_required', 'initialized'].includes(status)) return 'setup_required';
  return 'not_connected';
}

export default function ConnectionStatusBadge({ status = 'not_connected' }) {
  const config = CONNECTION_STATES[status] || CONNECTION_STATES.not_connected;
  return (
    <View style={[styles.badge, { backgroundColor: config.background }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.round,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { ...typography.caption, fontWeight: '800' },
});
