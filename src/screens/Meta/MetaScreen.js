import { useCallback, useState } from 'react';
import {
  Alert,
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
import { findIntegration, getIntegrationStatus } from '../../services/integrationService';
import ConnectionStatusBadge, {
  normalizeConnectionState,
} from '../../components/business/ConnectionStatusBadge';
import { ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { colors, fontFamilies } from '../../theme';

const C = {
  navy: colors.navy,
  gold: colors.gold,
  text2: '#AEB8C7',
  border: 'rgba(255,255,255,.18)',
  green: colors.success,
  greenSoft: 'rgba(22,163,74,.14)',
  meta: colors.meta,
  whatsapp: colors.whatsapp,
  purple: '#7C3AED',
  orange: '#EA7B00',
};
export default function MetaScreen({ navigation }) {
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [refreshing, setRefreshing] = useState(false),
    [connections, setConnections] = useState([]);
  const load = useCallback(async (refresh = false) => {
    setLoadError('');
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      setConnections(await getIntegrationStatus());
    } catch {
      setLoadError('We could not load your business tools. Check your connection and try again.');
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
  const meta = findIntegration(connections, 'meta'),
    wa = findIntegration(connections, 'whatsapp');
  function openRoot(name) {
    const p = navigation.getParent?.();
    p ? p.navigate(name) : navigation.navigate(name);
  }
  function openModule(module) {
    const p = navigation.getParent?.();
    p
      ? p.navigate('BusinessModule', { module })
      : navigation.navigate('BusinessModule', { module });
  }
  if (loading) return <LoadingState message="Loading business tools…" />;
  if (loadError && connections.length === 0)
    return (
      <ErrorState
        title="Business tools unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={() => load()}
        fullScreen
      />
    );
  return (
    <LinearGradient colors={['#06162D', '#071B35', '#0B2447']} style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 18, paddingBottom: 110 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={C.gold}
            />
          }
        >
          <View style={s.header}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <Ionicons name="infinite" size={31} color={C.meta} />
                <Text style={s.title}>Business Tools</Text>
              </View>
              <Text style={s.subtitle}>Connect, communicate and automate</Text>
            </View>
            <TouchableOpacity
              style={s.help}
              onPress={() =>
                Alert.alert(
                  'Integration Guide',
                  'Meta verification can be completed later. WhatsApp and Meta credentials stay server-side.'
                )
              }
            >
              <Ionicons name="help-circle-outline" size={20} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>Help & Guide</Text>
            </TouchableOpacity>
          </View>
          <Integration
            icon="infinite"
            color={C.meta}
            title="Meta Business Account"
            integration={meta}
            action={meta?.status === 'connected' ? 'Manage Meta Business' : 'Connect Meta Business'}
            onPress={() => openModule('meta_leads')}
          />
          <Integration
            icon="logo-whatsapp"
            color={C.whatsapp}
            title="WhatsApp Business"
            integration={wa}
            action={wa?.status === 'connected' ? 'Open WhatsApp Inbox' : 'Review setup'}
            onPress={() =>
              wa?.status === 'connected' ? openRoot('WhatsAppInbox') : openModule('whatsapp_setup')
            }
          />
          <View style={s.overview}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Integration Overview</Text>
              <Text style={s.period}>This Month</Text>
            </View>
            <View style={s.metricGrid}>
              <Metric
                icon="megaphone-outline"
                label="Lead Ads"
                value={meta?.status === 'connected' ? 'Connected' : 'Setup required'}
                color={C.meta}
              />
              <Metric
                icon="chatbubbles-outline"
                label="WhatsApp"
                value={wa?.status === 'connected' ? 'Connected' : 'Setup required'}
                color={C.whatsapp}
              />
              <Metric
                icon="people-outline"
                label="CRM Sync"
                value="Setup required"
                color={C.purple}
              />
              <Metric
                icon="analytics-outline"
                label="Analytics"
                value="Setup required"
                color={C.orange}
              />
            </View>
          </View>
          <View style={s.activity}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Business Tools</Text>
              <Text style={s.period}>YNS</Text>
            </View>
            <Tool
              icon="logo-whatsapp"
              color={C.whatsapp}
              title="WhatsApp Inbox"
              sub={
                wa?.status === 'connected'
                  ? 'Stored customer conversations'
                  : 'Cloud API setup required'
              }
              onPress={() => openRoot('WhatsAppInbox')}
            />
            <Tool
              icon="document-text-outline"
              color={C.gold}
              title="Quick Messages"
              sub="Personal reusable messages"
              onPress={() => openRoot('WhatsAppTemplates')}
            />
            <Tool
              icon="people-outline"
              color={C.meta}
              title="Meta Lead Ads"
              sub={meta?.status === 'connected' ? 'Connected' : 'Waiting for Meta verification'}
              onPress={() => openModule('meta_leads')}
            />
            <Tool
              icon="pulse-outline"
              color={C.green}
              title="Webhooks"
              sub="Secure dispatcher setup required"
              onPress={() => openModule('webhooks')}
            />
            <Tool
              icon="git-branch-outline"
              color={C.gold}
              title="Automations"
              sub="Execution backend not configured"
              onPress={() => openModule('automations')}
            />
            <Tool
              icon="notifications-outline"
              color={C.orange}
              title="Notifications"
              sub="In-app activity and preferences"
              onPress={() => openRoot('Notifications')}
            />
            <Tool
              icon="calendar-outline"
              color={C.purple}
              title="Appointments"
              sub="Booking setup foundation"
              onPress={() => openModule('appointments')}
            />
          </View>
          <View style={s.premium}>
            <View style={s.premiumIcon}>
              <Ionicons name="diamond-outline" size={25} color={C.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.premiumTitle}>Integration Health</Text>
              <Text style={s.premiumSub}>
                Green appears only when the server verifies an active provider connection.
              </Text>
            </View>
            <ConnectionStatusBadge
              status={
                meta?.status === 'connected' || wa?.status === 'connected'
                  ? 'connected'
                  : 'not_connected'
              }
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
function Integration({ icon, color, title, integration, action, onPress }) {
  const state = normalizeConnectionState(integration?.status, {
    verified: integration?.status === 'connected',
  });
  return (
    <View style={s.integration}>
      <View style={s.integrationTop}>
        <View style={[s.brandIcon, { backgroundColor: color + '22' }]}>
          <Ionicons name={icon} size={32} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={s.integrationTitle}>{title}</Text>
            <ConnectionStatusBadge status={state} />
          </View>
          <Text style={s.integrationSub}>
            {integration?.display_name || 'Provider account not connected'}
          </Text>
        </View>
      </View>
      <TouchableOpacity style={s.manage} onPress={onPress}>
        <Ionicons
          name={icon === 'logo-whatsapp' ? 'chatbubble-ellipses-outline' : 'briefcase-outline'}
          size={20}
          color="#FFF"
        />
        <Text style={s.manageText}>{action}</Text>
        <Ionicons name="chevron-forward" size={19} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}
function Metric({ icon, label, value, color }) {
  return (
    <View style={s.metric}>
      <View style={[s.metricIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
    </View>
  );
}
function Tool({ icon, color, title, sub, onPress }) {
  return (
    <TouchableOpacity style={s.tool} onPress={onPress}>
      <View style={[s.toolIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.toolTitle}>{title}</Text>
        <Text style={s.toolSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#AEB8C7" />
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: { color: '#FFF', fontFamily: fontFamilies.medium, fontSize: 26, fontWeight: '800' },
  subtitle: { color: C.text2, fontSize: 11, marginTop: 4 },
  help: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.gold,
    paddingHorizontal: 14,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  integration: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 11,
    backgroundColor: 'rgba(10,31,58,.72)',
  },
  integrationTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandIcon: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationTitle: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  integrationSub: { color: C.text2, fontSize: 9, marginTop: 5 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 13,
  },
  manage: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.12)',
    backgroundColor: 'rgba(255,255,255,.04)',
    paddingHorizontal: 13,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  manageText: { flex: 1, color: '#FFF', fontSize: 11, fontWeight: '800' },
  init: {
    minHeight: 48,
    backgroundColor: C.gold,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 12,
  },
  initText: { color: C.navy, fontSize: 11, fontWeight: '900' },
  overview: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
    backgroundColor: 'rgba(10,31,58,.62)',
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  period: { color: C.gold, fontSize: 9, fontWeight: '800' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 13 },
  metric: {
    width: '48.5%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.08)',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,.025)',
  },
  metricIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: { color: C.text2, fontSize: 9, marginTop: 8 },
  metricValue: { color: '#FFF', fontSize: 15, fontWeight: '900', marginTop: 2 },
  activity: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    backgroundColor: 'rgba(10,31,58,.62)',
  },
  tool: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,.08)',
  },
  toolIcon: {
    width: 41,
    height: 41,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTitle: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  toolSub: { color: C.text2, fontSize: 8, marginTop: 2 },
  premium: {
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  premiumIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: { color: C.gold, fontSize: 12, fontWeight: '900' },
  premiumSub: { color: C.text2, fontSize: 8, lineHeight: 12, marginTop: 3 },
  premiumBtn: {
    backgroundColor: C.gold,
    borderRadius: 11,
    paddingHorizontal: 12,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBtnText: { color: C.navy, fontSize: 9, fontWeight: '900' },
});
