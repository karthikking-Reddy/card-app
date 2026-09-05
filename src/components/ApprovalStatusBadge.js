import { StyleSheet, Text, View } from 'react-native';

const CONFIG = {
  draft: { label: 'Draft', color: '#667085', background: '#F2F4F7' },
  pending: { label: 'Pending Approval', color: '#B7791F', background: '#FFF4D6' },
  approved: { label: 'Approved', color: '#15803D', background: '#ECFDF3' },
  rejected: { label: 'Rejected', color: '#DC2626', background: '#FEF2F2' },
};

export default function ApprovalStatusBadge({ status, compact = false }) {
  const config = CONFIG[status] || CONFIG.draft;

  return (
    <View style={[styles.badge, { backgroundColor: config.background }, compact && styles.compact]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export function getApprovalStatusCopy(status) {
  if (status === 'approved') return { label: 'APPROVED', message: 'Ready to share' };
  if (status === 'pending') return { label: 'PENDING', message: 'Waiting for admin approval' };
  if (status === 'rejected') return { label: 'REJECTED', message: 'Changes required' };
  return { label: 'DRAFT', message: 'Submit your card for approval' };
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compact: { paddingHorizontal: 8, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 },
});
