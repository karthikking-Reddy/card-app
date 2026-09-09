import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
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
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import ApprovalRequiredModal from '../../components/ApprovalRequiredModal';
import ApprovalStatusBadge from '../../components/ApprovalStatusBadge';
import { getCurrentProfile, isAdminUser } from '../../services/profileService';
import { ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { colors, fontFamilies } from '../../theme';
import { getCardPublicAvailability, getPublicCardUrl } from '../../utils/cardPublicAccess';

const C = {
  navy: colors.navy,
  gold: colors.gold,
  bg: colors.background,
  text: colors.text,
  text2: colors.textSecondary,
  muted: colors.textMuted,
  border: colors.border,
  blue: colors.blue,
  green: colors.success,
  purple: '#7C3AED',
  orange: '#EA7B00',
  red: colors.danger,
  redSoft: colors.dangerSoft,
};
export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [refreshing, setRefreshing] = useState(false),
    [user, setUser] = useState(null),
    [profile, setProfile] = useState(null),
    [card, setCard] = useState(null),
    [cards, setCards] = useState([]),
    [stats, setStats] = useState({ views: 0, clicks: 0, wa: 0, leads: 0 }),
    [unread, setUnread] = useState(0),
    [approvalVisible, setApprovalVisible] = useState(false);
  const load = useCallback(async (refresh = false) => {
    setLoadError('');
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = session?.user;
      if (!u) return;
      setUser(u);
      try {
        setProfile(await getCurrentProfile());
      } catch {
        setProfile(null);
      }
      const cr = await supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', u.id)
        .order('is_primary', { ascending: false });
      if (cr.error) throw cr.error;
      const cs = cr.data || [];
      setCards(cs);
      setCard(cs.find((x) => x.is_primary) || cs[0] || null);
      const ids = cs.map((x) => x.id);
      const countEvents = (configure) => {
        if (!ids.length) return Promise.resolve({ count: 0 });
        return configure(
          supabase
            .from('card_events')
            .select('id', { count: 'exact', head: true })
            .in('card_id', ids)
        );
      };
      const [leads, views, clicks, whatsapp] = await Promise.all([
        supabase
          .from('connections')
          .select('id', { count: 'exact', head: true })
          .eq('owner_user_id', u.id),
        countEvents((query) => query.eq('event_type', 'card_view')),
        countEvents((query) => query.like('event_type', '%_click')),
        countEvents((query) => query.ilike('event_type', '%whatsapp%')),
      ]);
      const statsError = leads.error || views.error || clicks.error || whatsapp.error;
      if (statsError) throw statsError;
      setStats({
        views: views.count || 0,
        clicks: clicks.count || 0,
        wa: whatsapp.count || 0,
        leads: leads.count || 0,
      });
      try {
        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', u.id)
          .eq('is_read', false);
        setUnread(count || 0);
      } catch {
        setUnread(0);
      }
    } catch {
      setLoadError('We could not load your profile. Check your connection and try again.');
      Alert.alert('Unable to load profile', 'Please try again.');
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
  const publicAvailability = getCardPublicAvailability(card);
  const approvedUrl = publicAvailability.available ? getPublicCardUrl(card) : null;
  function openRoot(name, params) {
    const p = navigation.getParent?.();
    p ? p.navigate(name, params) : navigation.navigate(name, params);
  }
  function openPublicCard() {
    if (approvedUrl) {
      Linking.openURL(approvedUrl);
      return;
    }
    if (publicAvailability.code === 'approval') {
      setApprovalVisible(true);
      return;
    }
    Alert.alert('Public card unavailable', publicAvailability.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Card Settings', onPress: () => openRoot('CardSettings', { cardId: card?.id }) },
    ]);
  }
  function logout() {
    Alert.alert('Sign Out', 'Sign out from YNS Card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  }
  if (loading) return <LoadingState message="Loading your profile…" />;
  if (loadError && !profile && !card)
    return (
      <ErrorState
        title="Profile unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={() => load()}
        fullScreen
      />
    );
  return (
    <View style={s.root}>
      <LinearGradient colors={['#06162D', '#081D39', '#0B2447']} style={s.headerBg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 105 }}
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
              <Text style={s.title}>Profile</Text>
              <Text style={s.subtitle}>Manage your account & settings</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={s.topIcon} onPress={() => openRoot('Notifications')}>
                <Ionicons name="notifications-outline" size={22} color="#FFF" />
                {unread > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={s.topIcon} onPress={() => openRoot('CardSettings')}>
                <Ionicons name="settings-outline" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.profileCard}>
            <View style={s.profileTop}>
              <View style={s.avatarWrap}>
                {card?.profile_image_url ? (
                  <Image source={{ uri: card.profile_image_url }} style={s.avatar} />
                ) : (
                  <View style={s.avatarFallback}>
                    <Text style={s.initial}>
                      {String(card?.name || user?.email || '?')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
                <TouchableOpacity style={s.camera} onPress={() => openRoot('Card')}>
                  <Ionicons name="camera" size={17} color={C.navy} />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}
                >
                  <Text style={s.name}>{card?.name || user?.email || 'YNS User'}</Text>
                  <Ionicons name="checkmark-circle" size={18} color={C.gold} />
                </View>
                <Text style={s.role}>{card?.designation || 'Digital Business Professional'}</Text>
                <Text style={s.company}>{card?.company || 'YUVARAJ NETWORKS & SOLUTIONS'}</Text>
                {card?.phone && <Info icon="call" text={card.phone} />}
                <Info icon="mail" text={card?.email || user?.email} />
                {card?.location && <Info icon="location" text={card.location} />}
              </View>
            </View>
            <View style={s.qrArea}>
              <ApprovalStatusBadge status={card?.approval_status} compact />
              {approvedUrl && (
                <View style={s.qrBox}>
                  <QRCode value={approvedUrl} size={96} backgroundColor="#FFF" color={C.text} />
                </View>
              )}
              <TouchableOpacity style={s.viewBtn} onPress={openPublicCard}>
                <Ionicons name="eye-outline" size={17} color="#FFF" />
                <Text style={s.viewText}>View My Card</Text>
              </TouchableOpacity>
            </View>
            <View style={s.stats}>
              <PStat icon="eye-outline" label="Profile Views" value={stats.views} color={C.blue} />
              <PStat
                icon="navigate-outline"
                label="Card Clicks"
                value={stats.clicks}
                color={C.purple}
              />
              <PStat
                icon="logo-whatsapp"
                label="WhatsApp Clicks"
                value={stats.wa}
                color={C.green}
              />
              <PStat
                icon="person-add-outline"
                label="New Leads"
                value={stats.leads}
                color={C.orange}
              />
            </View>
          </View>
          <View style={s.body}>
            <MenuGroup title="CARD MANAGEMENT">
              <Menu
                icon="card-outline"
                color={C.blue}
                title="My Digital Cards"
                sub={`${cards.length} card${cards.length === 1 ? '' : 's'} • manage and customize`}
                onPress={() => openRoot('MyCards')}
              />
              <Menu
                icon="create-outline"
                color={C.purple}
                title="Edit Primary Card"
                sub="Profile, company, contact details and photo"
                onPress={() => openRoot('Card')}
              />
              <Menu
                icon="color-palette-outline"
                color={C.purple}
                title="Themes & Appearance"
                sub="Themes, public/private and active status"
                onPress={() => openRoot('CardSettings')}
              />
              <Menu
                icon="link-outline"
                color={C.blue}
                title="Links & Social Media"
                sub="WhatsApp, Instagram, YouTube and more"
                onPress={() => openRoot('SocialLinks')}
              />
              <Menu
                icon="grid-outline"
                color={C.orange}
                title="Card Block Builder"
                sub="Custom links, media, documents and actions"
                onPress={() => openRoot('BlockBuilder')}
              />
              <Menu
                icon="briefcase-outline"
                color={C.green}
                title="Services"
                sub="Manage services shown on your card"
                onPress={() => openRoot('Services')}
              />
              <Menu
                icon="people-outline"
                color={C.blue}
                title="Portfolio"
                sub="Students and employees portfolio"
                onPress={() => openRoot('Portfolio')}
              />
            </MenuGroup>
            <MenuGroup title="CRM & BUSINESS TOOLS">
              <Menu
                icon="git-branch-outline"
                color={C.purple}
                title="CRM Stages"
                sub="Customize your lead pipeline stages"
                onPress={() => openRoot('LeadStages')}
              />
              <Menu
                icon="download-outline"
                color={C.blue}
                title="Export CRM"
                sub="Export all leads to CSV"
                onPress={() => openRoot('CRMExport')}
              />
              <Menu
                icon="logo-whatsapp"
                color={C.green}
                title="WhatsApp Inbox"
                sub="Customer WhatsApp conversations"
                onPress={() => openRoot('WhatsAppInbox')}
              />
              <Menu
                icon="document-text-outline"
                color={C.orange}
                title="WhatsApp Templates"
                sub="Reusable WhatsApp business messages"
                onPress={() => openRoot('WhatsAppTemplates')}
              />
              <Menu
                icon="notifications-outline"
                color={C.orange}
                title="Notifications"
                sub="New leads and card activity"
                onPress={() => openRoot('Notifications')}
              />
            </MenuGroup>
            {isAdminUser(profile) ? (
              <MenuGroup title="ADMINISTRATION">
                {profile?.role === 'super_admin' && (
                  <Menu
                    icon="grid-outline"
                    color={C.gold}
                    title="Super Admin Dashboard"
                    sub="Manage administrators and user assignments"
                    onPress={() => openRoot('SuperAdminDashboard')}
                  />
                )}
                <Menu
                  icon="people-outline"
                  color={C.gold}
                  title={profile?.role === 'super_admin' ? 'User Management' : 'Assigned Users'}
                  sub="View accounts and card approval information"
                  onPress={() => openRoot('UserManagement')}
                />
                <Menu
                  icon="shield-checkmark-outline"
                  color={C.gold}
                  title="Card Approvals"
                  sub="Review cards waiting for approval"
                  onPress={() => openRoot('AdminApprovals')}
                />
              </MenuGroup>
            ) : null}
            <TouchableOpacity style={s.logout} onPress={logout}>
              <View style={[s.menuIcon, { backgroundColor: C.redSoft }]}>
                <Ionicons name="log-out-outline" size={22} color={C.red} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.red, fontSize: 12, fontWeight: '900' }}>Sign Out</Text>
                <Text style={s.menuSub}>Sign out from your account</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.text2} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        <ApprovalRequiredModal
          visible={approvalVisible}
          card={card}
          onClose={() => setApprovalVisible(false)}
          onUpdated={() => load(true)}
          onEdit={() => {
            setApprovalVisible(false);
            openRoot('Card');
          }}
        />
      </SafeAreaView>
    </View>
  );
}
function Info({ icon, text }) {
  if (!text) return null;
  return (
    <View style={s.info}>
      <Ionicons name={icon} size={15} color={C.gold} />
      <Text numberOfLines={1} style={s.infoText}>
        {text}
      </Text>
    </View>
  );
}
function PStat({ icon, label, value, color }) {
  return (
    <View style={s.pstat}>
      <View style={[s.pstatIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={s.pstatValue}>{Number(value || 0).toLocaleString()}</Text>
      <Text style={s.pstatLabel}>{label}</Text>
    </View>
  );
}
function MenuGroup({ title, children }) {
  return (
    <>
      <Text style={s.groupTitle}>{title}</Text>
      <View style={s.group}>{children}</View>
    </>
  );
}
function Menu({ icon, color, title, sub, onPress }) {
  return (
    <TouchableOpacity style={s.menu} onPress={onPress}>
      <View style={[s.menuIcon, { backgroundColor: color + '16' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.menuTitle}>{title}</Text>
        <Text style={s.menuSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.text2} />
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 560 },
  loading: { flex: 1, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#FFF', fontFamily: fontFamilies.medium, fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#D5DDE8', fontSize: 11, marginTop: 4 },
  topIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.18)',
    backgroundColor: 'rgba(255,255,255,.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: C.navy, fontSize: 8, fontWeight: '900' },
  profileCard: {
    marginHorizontal: 18,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(246,185,26,.7)',
    backgroundColor: 'rgba(6,22,45,.88)',
    overflow: 'hidden',
  },
  profileTop: { padding: 18, paddingRight: 155, flexDirection: 'row', gap: 13 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 92, height: 92, borderRadius: 31, borderWidth: 2, borderColor: '#FFF' },
  avatarFallback: {
    width: 92,
    height: 92,
    borderRadius: 31,
    backgroundColor: '#FFE7BD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: C.navy, fontSize: 32, fontWeight: '900' },
  camera: {
    position: 'absolute',
    right: -7,
    bottom: -5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  role: { color: '#D3DCE8', fontSize: 11, marginTop: 4 },
  company: { color: '#AEB8C7', fontSize: 9, marginTop: 3, marginBottom: 7 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  infoText: { color: '#D9E0EA', fontSize: 9, flex: 1 },
  qrArea: { position: 'absolute', right: 15, top: 18, alignItems: 'center' },
  active: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    backgroundColor: 'rgba(22,163,74,.12)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,.3)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 15,
  },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#20D982' },
  activeText: { color: '#20D982', fontSize: 8, fontWeight: '800' },
  qrBox: {
    marginTop: 10,
    padding: 7,
    backgroundColor: '#FFF',
    borderRadius: 13,
    borderWidth: 2,
    borderColor: C.gold,
  },
  viewBtn: {
    marginTop: 8,
    minHeight: 34,
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: 10,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewText: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  stats: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,.14)',
    marginTop: 8,
    flexDirection: 'row',
    paddingVertical: 15,
  },
  pstat: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,.12)',
  },
  pstatIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pstatValue: { color: '#FFF', fontSize: 16, fontWeight: '900', marginTop: 5 },
  pstatLabel: { color: '#AEB8C7', fontSize: 7, marginTop: 2 },
  body: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 18,
    padding: 18,
  },
  groupTitle: {
    color: C.text,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 7,
  },
  group: {
    backgroundColor: '#FFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
  },
  menu: {
    minHeight: 69,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F6',
  },
  menuIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: { color: C.text, fontSize: 11, fontWeight: '900' },
  menuSub: { color: C.text2, fontSize: 8, marginTop: 3 },
  logout: {
    minHeight: 69,
    marginTop: 14,
    backgroundColor: '#FFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
  },
});
