import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../../../lib/supabase';
import { ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { getCurrentProfile, updateCurrentProfileName } from '../../services/profileService';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const INFO_MODULES = {
  preferences: {
    title: 'Application Preferences',
    status: 'Setup required',
    intro:
      'Account preferences are not persisted yet, so this screen does not show switches that would only change local UI.',
    rows: [
      ['Language', 'English, Telugu and Hindi require localization infrastructure'],
      ['Region', 'Time zone, date format and currency require persisted preferences'],
      ['Accessibility', 'Reduce motion and larger text require app-wide enforcement'],
      ['Sharing', 'Default card and sharing channel require persisted account settings'],
    ],
  },
  privacy: {
    title: 'Privacy & Data',
    status: 'Backend required',
    intro: 'CRM CSV export is available from Leads, but it is not a complete account-data export.',
    rows: [
      ['Download my data', 'A secure, complete account-export job is required'],
      ['Analytics preferences', 'Opt-out and retention must be enforced by the web and backend'],
      ['Public visibility', 'Manage each card from Card Settings'],
      ['Delete analytics', 'Requires an owner-authorized backend operation'],
    ],
  },
  delete_account: {
    title: 'Delete Account',
    status: 'Secure backend required',
    intro:
      'Deleting an account is different from deleting a digital card. It can remove profile, cards, leads, activity and related account data.',
    rows: [
      ['1. Export', 'Offer a complete account export before deletion'],
      ['2. Reauthenticate', 'Require a recent password or approved identity check'],
      ['3. Confirm', 'Collect an optional reason and strong confirmation'],
      ['4. Process', 'A secure server-side deletion request must perform the operation'],
    ],
    warning:
      'Account deletion is not submitted from this build. No auth.admin capability or service-role credential is present in the mobile app.',
  },
  plans: {
    title: 'Plans & Usage',
    status: 'Information only',
    intro:
      'There is no deployed entitlement or billing system. These plans do not lock or unlock current functionality.',
    rows: [
      ['Free', 'Digital card, standard theme, QR, basic insights and leads'],
      ['Pro', 'Product direction: multiple cards, premium themes, advanced insights and reports'],
      ['Business', 'Product direction: teams, Meta, Cloud API, automations and webhooks'],
      ['Upgrade', 'Coming later — no payment or checkout is implemented'],
    ],
  },
  team: {
    title: 'Team & Workspace',
    status: 'Future architecture',
    intro:
      'Current YNS platform roles remain super_admin, admin and user, with admin_id assignment. They are not commercial workspace roles.',
    rows: [
      ['Current hierarchy', 'Managed only through authorized administration RPCs'],
      [
        'Business workspace roles',
        'Owner, Manager, Salesperson, Designer and Viewer are not implemented',
      ],
      ['Employee cards', 'Requires a dedicated workspace, membership and permission model'],
    ],
  },
  support: {
    title: 'Help & Support',
    status: 'Information available',
    intro:
      'Use the existing card, Leads, Insights and Business screens for feature-specific setup. A support-ticket backend is not deployed.',
    rows: [
      ['Getting Started', 'Create a card, request approval, then share its QR or public link'],
      [
        'Setup Guides',
        'Google and administration setup notes are available in the project documentation',
      ],
      ['Report a Problem', 'Ticket submission requires a secure support backend'],
      ['Feature Request', 'Coming later with support history and attachments'],
    ],
  },
  legal: {
    title: 'Legal & Consent',
    status: 'Phase G completion required',
    intro:
      'The required legal entry points are present. Final reviewed policy content and hosted URLs belong to Play Store readiness.',
    rows: [
      ['Privacy Policy', 'Final policy URL and content pending legal/product review'],
      ['Terms & Conditions', 'Final terms pending legal/product review'],
      ['Data & Consent', 'Consent, retention and analytics controls require backend enforcement'],
      ['Open Source Licences', 'Production licence inventory is deferred to Phase G'],
    ],
  },
  app_info: {
    title: 'App Information',
    status: 'Current build',
    intro: 'Real application metadata from the installed Expo configuration.',
    rows: [
      ['App', Constants.expoConfig?.name || 'YNS Card'],
      ['Version', Constants.expoConfig?.version || 'Unavailable'],
      ['Company', 'YUVARAJ NETWORKS & SOLUTIONS'],
      ['Android package', Constants.expoConfig?.android?.package || 'Unavailable'],
    ],
  },
};

export default function ProfileModuleScreen({ navigation, route }) {
  const moduleKey = route.params?.module || 'security';
  if (moduleKey === 'personal') return <PersonalInformation navigation={navigation} />;
  if (moduleKey === 'security') return <SecurityCentre navigation={navigation} />;
  if (moduleKey === 'delete_account') return <AccountDeletionFoundation navigation={navigation} />;
  const module = INFO_MODULES[moduleKey] || INFO_MODULES.support;
  return <InformationModule navigation={navigation} module={module} />;
}

function AccountDeletionFoundation({ navigation }) {
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  function reviewRequest() {
    if (confirmation.trim().toUpperCase() !== 'DELETE') {
      Alert.alert(
        'Confirmation required',
        'Type DELETE to confirm that you understand this action.'
      );
      return;
    }
    Alert.alert(
      'Deletion is not submitted',
      'This build does not have the secure server-side deletion operation or recent-authentication check required to submit the request.'
    );
  }
  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader
        navigation={navigation}
        title="Delete Account"
        subtitle="Secure backend required"
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={22} color={colors.danger} />
          <Text style={styles.warningText}>
            Account deletion is different from deleting a card. It may remove your profile, cards,
            leads, activity and related account data.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>SAFE DELETION FLOW</Text>
          <Text style={styles.rowValue}>1. Export complete account data when available.</Text>
          <Text style={styles.rowValue}>
            2. Reauthenticate using an approved recent-login flow.
          </Text>
          <Text style={styles.rowValue}>3. Confirm the request and any grace period.</Text>
          <Text style={styles.rowValue}>4. Let the secure server process Auth and owned data.</Text>
          <Text style={styles.fieldLabel}>OPTIONAL REASON</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            maxLength={1000}
            multiline
            style={[styles.input, styles.reasonInput]}
            placeholder="Why are you considering deletion?"
          />
          <Text style={styles.fieldLabel}>TYPE DELETE TO ACKNOWLEDGE</Text>
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            style={styles.input}
            placeholder="DELETE"
          />
          <TouchableOpacity style={styles.dangerButton} onPress={reviewRequest}>
            <Text style={styles.dangerButtonText}>Check Deletion Readiness</Text>
          </TouchableOpacity>
          <Text style={styles.help}>
            This does not submit or perform deletion. No auth.admin API or service-role credential
            is used by the mobile app.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PageHeader({ navigation, title, subtitle }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={24} color={colors.white} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function InformationModule({ navigation, module }) {
  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader navigation={navigation} title={module.title} subtitle={module.status} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.intro}>{module.intro}</Text>
        </View>
        <View style={styles.card}>
          {module.rows.map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          ))}
        </View>
        {module.warning ? (
          <View style={styles.warning}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.danger} />
            <Text style={styles.warningText}>{module.warning}</Text>
          </View>
        ) : null}
        {module === INFO_MODULES.privacy ? (
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() => navigation.replace('ProfileModule', { module: 'delete_account' })}
            accessibilityRole="button"
            accessibilityLabel="Open account deletion information"
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PersonalInformation({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const value = await getCurrentProfile();
      setProfile(value);
      setName(value.full_name || '');
    } catch {
      setError('We could not load your personal information.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const value = await updateCurrentProfileName(name);
      setProfile(value);
      Alert.alert(
        'Profile updated',
        'Your account name was updated. Digital card names were not changed.'
      );
    } catch (reason) {
      Alert.alert('Unable to update profile', reason.message);
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <LoadingState message="Loading personal information…" />;
  if (error)
    return (
      <ErrorState
        title="Personal information unavailable"
        message={error}
        actionLabel="Try Again"
        onAction={load}
        fullScreen
      />
    );
  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader
        navigation={navigation}
        title="Personal Information"
        subtitle="Account profile, not card content"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>FULL NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            maxLength={120}
            style={styles.input}
            placeholder="Your full name"
          />
          <Text style={styles.help}>
            Changing this does not change names on your digital cards.
          </Text>
          <Text style={styles.fieldLabel}>ACCOUNT EMAIL</Text>
          <View style={styles.readOnly}>
            <Text style={styles.readOnlyText}>{profile?.email || 'Unavailable'}</Text>
          </View>
          <Text style={styles.help}>
            Email changes require a verified Supabase Auth flow and are not available here.
          </Text>
          <TouchableOpacity style={styles.primary} onPress={save} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryText}>Save Account Name</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SecurityCentre({ navigation }) {
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      supabase.auth.getUser().then(({ data }) => {
        if (active) {
          setUser(data?.user || null);
          setLoading(false);
        }
      });
      return () => {
        active = false;
      };
    }, [])
  );
  async function changePassword() {
    if (saving) return;
    if (password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
    if (password !== confirmPassword)
      return Alert.alert('Passwords do not match', 'Enter the same password twice.');
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmPassword('');
      Alert.alert('Password updated', 'Your account password has been updated.');
    } catch {
      Alert.alert(
        'Unable to change password',
        'Your session may require recent authentication. Sign in again and retry.'
      );
    } finally {
      setSaving(false);
    }
  }
  if (loading) return <LoadingState message="Loading security settings…" />;
  const providers = new Set(
    [
      user?.app_metadata?.provider,
      ...(user?.app_metadata?.providers || []),
      ...(user?.identities || []).map((identity) => identity.provider),
    ].filter(Boolean)
  );
  return (
    <SafeAreaView style={styles.safe}>
      <PageHeader
        navigation={navigation}
        title="Login & Security"
        subtitle="Protect your YNS account"
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.section}>ACCOUNT SECURITY</Text>
          <SecurityRow
            label="Email verification"
            value={user?.email_confirmed_at ? 'Email verified' : 'Email not verified'}
            operational
          />
          <SecurityRow
            label="Google account"
            value={providers.has('google') ? 'Connected' : 'Not connected'}
            operational={providers.has('google')}
          />
          <SecurityRow label="Authenticator MFA" value="Setup required" />
          <SecurityRow label="Active sessions & devices" value="Backend required" />
          <SecurityRow label="Trusted devices / login history" value="Coming later" />
          <SecurityRow label="Sign out from all devices" value="Coming later" />
        </View>
        <View style={styles.card}>
          <Text style={styles.section}>CHANGE PASSWORD</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            placeholder="New password"
          />
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            placeholder="Confirm new password"
          />
          <Text style={styles.help}>
            Passwords are sent only to Supabase Auth and are never stored or logged by the app.
          </Text>
          <TouchableOpacity style={styles.primary} onPress={changePassword} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SecurityRow({ label, value, operational = false }) {
  return (
    <View style={styles.securityRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.securityValue, operational && styles.operational]}>{value}</Text>
    </View>
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
  intro: { ...typography.body, color: colors.textSecondary },
  row: { paddingVertical: spacing[12], borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { ...typography.bodyMedium },
  rowValue: { ...typography.small, marginTop: spacing[4] },
  warning: {
    flexDirection: 'row',
    gap: spacing[10],
    padding: spacing[16],
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  warningText: { ...typography.small, flex: 1, color: colors.danger },
  section: { ...typography.label, marginBottom: spacing[12] },
  fieldLabel: { ...typography.label, marginTop: spacing[12], marginBottom: spacing[6] },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing[14],
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing[10],
  },
  reasonInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing[12] },
  readOnly: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing[14],
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  readOnlyText: { ...typography.body, color: colors.textSecondary },
  help: { ...typography.caption, marginBottom: spacing[12] },
  primary: {
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[10],
  },
  primaryText: { ...typography.button, color: colors.white },
  dangerButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[16],
  },
  dangerButtonText: { ...typography.button, color: colors.danger },
  securityRow: {
    paddingVertical: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  securityValue: { ...typography.small, color: colors.goldDark, marginTop: 3 },
  operational: { color: colors.success },
});
