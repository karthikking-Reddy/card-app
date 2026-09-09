import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../../../lib/supabase';
import { ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { getAccountSummary, getCurrentProfile, isAdminUser } from '../../services/profileService';
import { colors, fontFamilies, radius, shadows, spacing, typography } from '../../theme';

const ROLE_LABELS = { super_admin: 'Super Admin', admin: 'Admin', user: 'User' };

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [summary, setSummary] = useState({ cards: 0, leads: 0 });

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setLoadError('');
    try {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();
      if (error || !authUser) throw new Error('Session unavailable');
      const [accountProfile, accountSummary] = await Promise.all([
        getCurrentProfile(),
        getAccountSummary(authUser.id),
      ]);
      setUser(authUser);
      setProfile(accountProfile);
      setSummary(accountSummary);
    } catch {
      setLoadError('We could not load your account profile. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openRoot(name, params) {
    const parent = navigation.getParent?.();
    parent ? parent.navigate(name, params) : navigation.navigate(name, params);
  }

  function openModule(module) {
    openRoot('ProfileModule', { module });
  }

  function confirmSignOut() {
    if (signingOut) return;
    Alert.alert('Sign Out', 'Sign out of YNS Card on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
          } catch {
            Alert.alert('Unable to sign out', 'Please check your connection and try again.');
            setSigningOut(false);
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingState message="Loading your account…" />;
  if (loadError && !profile)
    return (
      <ErrorState
        title="Profile unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={() => load()}
        fullScreen
      />
    );

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email || 'YNS User';
  const providers = new Set(
    [
      user?.app_metadata?.provider,
      ...(user?.app_metadata?.providers || []),
      ...(user?.identities || []).map((identity) => identity.provider),
    ].filter(Boolean)
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.navyDeep, colors.navy, '#0B2A50']}
        style={styles.headerBackground}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.gold}
            />
          }
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Profile</Text>
              <Text style={styles.subtitle}>Account and workspace control centre</Text>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => openRoot('Notifications')}
              accessibilityLabel="Open notifications"
            >
              <Ionicons name="notifications-outline" size={23} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.overview}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.initial}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>
                {profile?.email || user?.email || 'Email unavailable'}
              </Text>
              <View style={styles.badges}>
                <Badge label={ROLE_LABELS[profile?.role] || 'User'} tone="gold" />
                <Badge
                  label={user?.email_confirmed_at ? 'Email verified' : 'Email not verified'}
                  tone={user?.email_confirmed_at ? 'success' : 'neutral'}
                />
                {providers.has('google') ? <Badge label="Google connected" tone="success" /> : null}
              </View>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Summary icon="card-outline" value={summary.cards} label="Digital cards" />
            <Summary icon="people-outline" value={summary.leads} label="Leads" />
          </View>

          <View style={styles.body}>
            <MenuGroup title="ACCOUNT">
              <Menu
                icon="person-outline"
                title="Personal Information"
                subtitle="Account name and verified identity details"
                onPress={() => openModule('personal')}
              />
              <Menu
                icon="shield-checkmark-outline"
                title="Login & Security"
                subtitle="Password, providers, MFA and sessions"
                onPress={() => openModule('security')}
              />
              <Menu
                icon="language-outline"
                title="Language & Region"
                subtitle="Preference persistence setup required"
                onPress={() => openModule('preferences')}
              />
              <Menu
                icon="notifications-outline"
                title="Notifications"
                subtitle="In-app activity and delivery availability"
                onPress={() => openRoot('Notifications')}
              />
              <Menu
                icon="link-outline"
                title="Connected Accounts"
                subtitle="Google identity and provider connection status"
                onPress={() => openModule('security')}
              />
            </MenuGroup>

            <MenuGroup title="WORKSPACE">
              <Menu
                icon="card-outline"
                title="Digital Cards"
                subtitle={`${summary.cards} card${summary.cards === 1 ? '' : 's'} — manage in My Cards`}
                onPress={() => openRoot('MyCards')}
              />
              <Menu
                icon="people-circle-outline"
                title="Team & Roles"
                subtitle="Current platform hierarchy and future workspace model"
                onPress={() => openModule('team')}
              />
              <Menu
                icon="color-palette-outline"
                title="Brand Settings"
                subtitle="Manage branding per digital card"
                onPress={() => openRoot('MyCards')}
              />
              <Menu
                icon="git-branch-outline"
                title="CRM Stages"
                subtitle="Manage the lead pipeline"
                onPress={() => openRoot('LeadStages')}
              />
            </MenuGroup>

            <MenuGroup title="PLAN & USAGE">
              <Menu
                icon="diamond-outline"
                title="Plans"
                subtitle="Free, Pro and Business product information"
                onPress={() => openModule('plans')}
              />
              <Menu
                icon="analytics-outline"
                title="Usage"
                subtitle={`${summary.cards} cards • ${summary.leads} leads • no invented limits`}
                onPress={() => openModule('plans')}
              />
            </MenuGroup>

            <MenuGroup title="PRIVACY & SUPPORT">
              <Menu
                icon="lock-closed-outline"
                title="Privacy & Data"
                subtitle="Exports, analytics controls and retention"
                onPress={() => openModule('privacy')}
              />
              <Menu
                icon="help-circle-outline"
                title="Help & Support"
                subtitle="Getting started, guides and support status"
                onPress={() => openModule('support')}
              />
              <Menu
                icon="document-text-outline"
                title="Legal"
                subtitle="Privacy, terms, consent and licences"
                onPress={() => openModule('legal')}
              />
              <Menu
                icon="information-circle-outline"
                title="App Information"
                subtitle="Version and company information"
                onPress={() => openModule('app_info')}
              />
              <Menu
                icon="trash-outline"
                title="Delete Account"
                subtitle="Secure deletion backend required"
                danger
                onPress={() => openModule('delete_account')}
              />
            </MenuGroup>

            {isAdminUser(profile) ? (
              <MenuGroup title="ADMINISTRATION">
                {profile.role === 'super_admin' ? (
                  <>
                    <Menu
                      icon="grid-outline"
                      title="Super Admin Dashboard"
                      subtitle="Global management summary"
                      onPress={() => openRoot('SuperAdminDashboard')}
                    />
                    <Menu
                      icon="shield-outline"
                      title="Admin Management"
                      subtitle="Administrators, assignments and roles"
                      onPress={() => openRoot('AdminManagement')}
                    />
                  </>
                ) : null}
                <Menu
                  icon="people-outline"
                  title={profile.role === 'super_admin' ? 'User Management' : 'Assigned Users'}
                  subtitle="Secure RPC-scoped account management"
                  onPress={() => openRoot('UserManagement')}
                />
                <Menu
                  icon="checkmark-done-outline"
                  title="Card Approvals"
                  subtitle="Review pending cards within authorized scope"
                  onPress={() => openRoot('AdminApprovals')}
                />
              </MenuGroup>
            ) : null}

            <TouchableOpacity style={styles.signOut} onPress={confirmSignOut} disabled={signingOut}>
              <Ionicons name="log-out-outline" size={22} color={colors.danger} />
              <View style={{ flex: 1 }}>
                <Text style={styles.signOutTitle}>{signingOut ? 'Signing Out…' : 'Sign Out'}</Text>
                <Text style={styles.menuSubtitle}>Sign out on this device</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function Badge({ label, tone }) {
  const config =
    tone === 'success'
      ? [colors.successSoft, colors.success]
      : tone === 'gold'
        ? [colors.goldSoft, colors.goldDark]
        : [colors.surfaceSoft, colors.textSecondary];
  return (
    <View style={[styles.badge, { backgroundColor: config[0] }]}>
      <Text style={[styles.badgeText, { color: config[1] }]}>{label}</Text>
    </View>
  );
}

function Summary({ icon, value, label }) {
  return (
    <View style={styles.summary}>
      <Ionicons name={icon} size={22} color={colors.goldDark} />
      <Text style={styles.summaryValue}>{Number(value || 0).toLocaleString()}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function MenuGroup({ title, children }) {
  return (
    <>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </>
  );
}

function Menu({ icon, title, subtitle, onPress, danger = false }) {
  return (
    <TouchableOpacity style={styles.menu} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon} size={21} color={danger ? colors.danger : colors.goldDark} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuTitle, danger && { color: colors.danger }]}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  headerBackground: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  scroll: { paddingBottom: 105 },
  header: {
    paddingHorizontal: spacing[20],
    paddingTop: spacing[18],
    paddingBottom: spacing[18],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: colors.white, fontFamily: fontFamilies.medium, fontSize: 28, fontWeight: '800' },
  subtitle: { ...typography.small, color: '#D5DDE8', marginTop: 3 },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overview: {
    marginHorizontal: spacing[18],
    padding: spacing[18],
    borderRadius: radius.xl,
    backgroundColor: 'rgba(3,19,38,.92)',
    borderWidth: 1,
    borderColor: colors.goldDark,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[14],
  },
  avatar: { width: 72, height: 72, borderRadius: 24, borderWidth: 2, borderColor: colors.gold },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: colors.navy, fontSize: 28, fontWeight: '900' },
  name: { ...typography.h3, color: colors.white },
  email: { ...typography.small, color: '#D5DDE8', marginTop: 3 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing[10] },
  badge: { borderRadius: radius.round, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { ...typography.caption, fontWeight: '800' },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[10],
    marginHorizontal: spacing[18],
    marginTop: spacing[12],
  },
  summary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing[16],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  summaryValue: { ...typography.h2, marginTop: spacing[8] },
  summaryLabel: { ...typography.caption, marginTop: 2 },
  body: { paddingHorizontal: spacing[18], paddingTop: spacing[8] },
  groupTitle: { ...typography.label, marginTop: spacing[20], marginBottom: spacing[8] },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[14],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  menu: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerIcon: { backgroundColor: colors.dangerSoft },
  menuTitle: { ...typography.bodyMedium },
  menuSubtitle: { ...typography.caption, marginTop: 2 },
  signOut: {
    minHeight: 66,
    marginTop: spacing[22],
    paddingHorizontal: spacing[16],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  signOutTitle: { ...typography.bodyMedium, color: colors.danger },
});
