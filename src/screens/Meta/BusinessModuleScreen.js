import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import ConnectionStatusBadge from '../../components/business/ConnectionStatusBadge';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const MODULES = {
  whatsapp_setup: {
    title: 'WhatsApp Business API',
    subtitle: 'Guided connection setup',
    status: 'setup_required',
    intro:
      'Cloud messaging is separate from Basic WhatsApp. It requires Meta Business setup, a WhatsApp Business Account, a registered phone number, permissions and a verified webhook.',
    steps: [
      'Review requirements',
      'Connect Meta',
      'Select Business Portfolio',
      'Select WhatsApp Business Account',
      'Select registered phone',
      'Grant required permissions',
      'Verify webhook',
      'Send a test message',
      'Confirm connection',
    ],
    note: 'Provider authorization is not configured in this mobile app. Setup stops here safely.',
  },
  meta_leads: {
    title: 'Meta Lead Ads',
    subtitle: 'Lead synchronisation foundation',
    status: 'not_connected',
    intro:
      'Connect Meta, select a Page and lead form, map fields, choose a CRM stage and owner, test, then activate sync.',
    steps: [
      'Connect Meta',
      'Select Page and form',
      'Map contact and custom fields',
      'Test lead',
      'Activate sync',
    ],
    note: 'No Pages, forms, campaigns, costs or sync activity are shown until returned by a verified backend.',
  },
  automations: {
    title: 'Automations',
    subtitle: 'Trigger → Conditions → Action',
    status: 'coming_later',
    intro:
      'Plan workflows for enquiries, leads, stage changes, overdue follow-ups, won deals and appointment requests.',
    steps: [
      'Choose a supported trigger',
      'Add owner-scoped conditions',
      'Choose a server-supported action',
      'Test safely',
      'Review run history',
    ],
    note: 'There is no automation worker today, so no workflow can be activated or represented as running.',
  },
  webhooks: {
    title: 'Webhooks',
    subtitle: 'Secure server-to-server events',
    status: 'setup_required',
    intro:
      'Future endpoints can receive lead, enquiry, card, QR, appointment and deal events through a server-side dispatcher.',
    steps: [
      'HTTPS endpoint',
      'Server-held signing secret',
      'Timestamp validation',
      'Bounded retries',
      'Delivery logs and rate limits',
    ],
    note: 'Webhook secrets must never be entered into or stored by the mobile app.',
  },
  notification_preferences: {
    title: 'Notification Preferences',
    subtitle: 'Delivery-channel availability',
    status: 'setup_required',
    intro:
      'In-app notifications are available from stored account events. Other delivery channels need verified backend configuration.',
    channels: [
      ['In-app', 'Connected'],
      ['Push', 'Setup required'],
      ['Email', 'Setup required'],
      ['WhatsApp', 'Setup required'],
    ],
    note: 'No switches are shown until preferences can be persisted and enforced securely.',
  },
  appointments: {
    title: 'Appointments',
    subtitle: 'Booking foundation',
    status: 'setup_required',
    intro:
      'A generic card link can open a real external booking URL today. Dedicated availability, duration, limits, consent and appointment records require backend support.',
    steps: [
      'Add a real booking link to the card',
      'Publish an approved, active card',
      'Verify the destination before sharing',
    ],
    note: 'No scheduling engine or available time slots are simulated.',
  },
};

export default function BusinessModuleScreen({ navigation, route }) {
  const module = MODULES[route.params?.module] || MODULES.automations;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{module.title}</Text>
          <Text style={styles.headerSubtitle}>{module.subtitle}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <ConnectionStatusBadge status={module.status} />
          <Text style={styles.intro}>{module.intro}</Text>
        </View>
        {module.steps ? (
          <View style={styles.card}>
            <Text style={styles.section}>SETUP PATH</Text>
            {module.steps.map((step, index) => (
              <View key={step} style={styles.step}>
                <View style={styles.number}>
                  <Text style={styles.numberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {module.channels ? (
          <View style={styles.card}>
            <Text style={styles.section}>CHANNELS</Text>
            {module.channels.map(([name, state]) => (
              <View key={name} style={styles.channel}>
                <Text style={styles.stepText}>{name}</Text>
                <Text style={state === 'Connected' ? styles.available : styles.unavailable}>
                  {state}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={21} color={colors.goldDark} />
          <Text style={styles.noticeText}>{module.note}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 76,
    paddingHorizontal: spacing[18],
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[14],
  },
  headerCopy: { flex: 1 },
  headerTitle: { ...typography.h2, color: colors.white },
  headerSubtitle: { ...typography.caption, color: '#D0D5DD', marginTop: 2 },
  content: { padding: spacing[18], paddingBottom: 60, gap: spacing[12] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[18],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  intro: { ...typography.body, color: colors.textSecondary, marginTop: spacing[14] },
  section: { ...typography.label, marginBottom: spacing[12] },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing[10], minHeight: 42 },
  number: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { ...typography.caption, color: colors.goldDark, fontWeight: '900' },
  stepText: { ...typography.bodyMedium, flex: 1 },
  channel: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  available: { ...typography.small, color: colors.success, fontWeight: '800' },
  unavailable: { ...typography.small, color: colors.goldDark, fontWeight: '800' },
  notice: {
    flexDirection: 'row',
    gap: spacing[10],
    padding: spacing[16],
    borderRadius: radius.md,
    backgroundColor: colors.goldSoft,
  },
  noticeText: { ...typography.small, flex: 1, color: colors.text },
});
