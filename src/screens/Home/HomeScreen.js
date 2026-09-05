import { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
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
import ApprovalStatusBadge, { getApprovalStatusCopy } from '../../components/ApprovalStatusBadge';

const COLORS = {
  navy: '#06162D',
  navy2: '#0B2447',
  navy3: '#102D52',

  gold: '#F6B91A',
  gold2: '#F7C955',
  goldSoft: '#FFF4D6',

  white: '#FFFFFF',

  background: '#F5F7FB',

  text: '#071A33',
  text2: '#667085',
  muted: '#98A2B3',

  border: '#E6EAF0',

  green: '#16A34A',
  greenSoft: '#ECFDF3',

  blue: '#0866FF',
  blueSoft: '#EFF6FF',

  purple: '#7C3AED',
  purpleSoft: '#F5F3FF',

  orange: '#EA7B00',
  orangeSoft: '#FFF7ED',
};

const PUBLIC_CARD_BASE = 'https://card.ynscrm.online/card';

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState(null);

  const [card, setCard] = useState(null);

  const [cards, setCards] = useState([]);

  const [events, setEvents] = useState([]);

  const [connections, setConnections] = useState([]);

  const [totalLeads, setTotalLeads] = useState(0);

  const [notificationCount, setNotificationCount] = useState(0);

  const [qrVisible, setQrVisible] = useState(false);

  const [approvalVisible, setApprovalVisible] = useState(false);

  const loadDashboard = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const currentUser = sessionData?.session?.user;

      if (!currentUser) {
        return;
      }

      setUser(currentUser);

      const { data: cardData, error: cardsError } = await supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('is_primary', {
          ascending: false,
        })
        .order('created_at', {
          ascending: true,
        });

      if (cardsError) {
        throw cardsError;
      }

      const userCards = cardData || [];

      setCards(userCards);

      const primary = userCards.find((item) => item.is_primary) || userCards[0] || null;

      setCard(primary);

      const cardIds = userCards.map((item) => item.id);

      let eventData = [];
      let leadData = [];

      if (cardIds.length > 0) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const [eventsResult, leadsResult, leadCountResult] = await Promise.all([
          supabase
            .from('card_events')
            .select('id,event_type,created_at')
            .in('card_id', cardIds)
            .gte('created_at', monthStart.toISOString())
            .order('created_at', { ascending: false }),

          supabase
            .from('connections')
            .select('id,created_at')
            .eq('owner_user_id', currentUser.id)
            .gte('created_at', monthStart.toISOString())
            .order('created_at', {
              ascending: false,
            }),
          supabase
            .from('connections')
            .select('id', { count: 'exact', head: true })
            .eq('owner_user_id', currentUser.id),
        ]);

        if (eventsResult.error) {
          throw eventsResult.error;
        }

        if (leadsResult.error) {
          throw leadsResult.error;
        }
        if (leadCountResult.error) throw leadCountResult.error;

        eventData = eventsResult.data || [];

        leadData = leadsResult.data || [];
        setTotalLeads(leadCountResult.count || 0);
      }

      setEvents(eventData);

      setConnections(leadData);

      /*
       * Notification count.
       * If an older notifications
       * schema differs, dashboard
       * still works normally.
       */
      try {
        const { count, error: notificationError } = await supabase
          .from('notifications')
          .select('id', {
            count: 'exact',

            head: true,
          })
          .eq('user_id', currentUser.id)
          .eq('is_read', false);

        if (!notificationError) {
          setNotificationCount(count || 0);
        } else {
          setNotificationCount(0);
        }
      } catch {
        setNotificationCount(0);
      }
    } catch (error) {
      console.log('Home dashboard error:', error);

      Alert.alert('Unable to load dashboard', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const publicUrl = card?.card_slug ? `${PUBLIC_CARD_BASE}/${card.card_slug}` : null;

  const approvalCopy = getApprovalStatusCopy(card?.approval_status);

  const firstName = useMemo(() => {
    const source = card?.name || user?.email || 'there';

    return String(source).trim().split(/\s+/)[0];
  }, [card?.name, user?.email]);

  const stats = useMemo(() => {
    const start = new Date();

    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const monthlyEvents = events.filter((item) => new Date(item.created_at) >= start);

    const monthlyLeads = connections.filter((item) => new Date(item.created_at) >= start);

    const views = monthlyEvents.filter((item) => item.event_type === 'card_view').length;

    const clicks = monthlyEvents.filter(
      (item) =>
        String(item.event_type || '').endsWith('_click') || item.event_type === 'block_click'
    ).length;

    const whatsapp = monthlyEvents.filter((item) =>
      String(item.event_type || '').includes('whatsapp')
    ).length;

    return {
      views,
      clicks,
      whatsapp,
      leads: monthlyLeads.length,
    };
  }, [events, connections]);

  function openRoot(routeName, params) {
    const parent = navigation.getParent?.();

    if (parent) {
      parent.navigate(routeName, params);

      return;
    }

    navigation.navigate(routeName, params);
  }

  async function shareCard() {
    if (!publicUrl) {
      Alert.alert('Card unavailable', 'Create a digital card first.');

      return;
    }

    if (card?.approval_status !== 'approved') {
      setQrVisible(false);
      setApprovalVisible(true);
      return;
    }

    try {
      await Share.share({
        title: 'YNS Card',

        message: `View my digital business card: ${publicUrl}`,

        url: publicUrl,
      });
    } catch (error) {
      Alert.alert('Unable to share', error?.message || 'Please try again.');
    }
  }

  function showQr() {
    if (!publicUrl) {
      Alert.alert('Card unavailable', 'Create a digital card first.');

      return;
    }

    if (card?.approval_status !== 'approved') {
      setApprovalVisible(true);
      return;
    }

    setQrVisible(true);
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.gold} />

        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#06162D', '#081D39', '#0B2447']} style={styles.headerBackground} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadDashboard(true)}
              tintColor={COLORS.gold}
            />
          }
        >
          <View style={styles.hero}>
            <View style={styles.heroIdentity}>
              <View style={styles.avatarWrap}>
                {card?.profile_image_url ? (
                  <Image
                    source={{
                      uri: card.profile_image_url,
                    }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{firstName?.charAt(0)?.toUpperCase()}</Text>
                  </View>
                )}

                <View style={styles.onlineDot} />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <View style={styles.helloRow}>
                  <Text style={styles.helloWhite}>Hello,</Text>

                  <Text style={styles.helloGold}>{firstName}!</Text>

                  <Text style={styles.wave}>{'\uD83D\uDC4B'}</Text>
                </View>

                {card ? <ApprovalStatusBadge status={card.approval_status} compact /> : null}

                <Text style={styles.welcomeText}>Welcome back to your dashboard</Text>

                {card ? (
                  <Text
                    style={{ color: COLORS.gold, fontSize: 9, fontWeight: '900', marginTop: 8 }}
                  >
                    {approvalCopy.label} · {approvalCopy.message}
                  </Text>
                ) : null}
              </View>
            </View>

            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => openRoot('Notifications')}
            >
              <Ionicons name="notifications-outline" size={25} color={COLORS.white} />

              {notificationCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          {card ? (
            <LinearGradient
              colors={['#102D52', '#081D39', '#06162D']}
              start={{
                x: 0,
                y: 0,
              }}
              end={{
                x: 1,
                y: 1,
              }}
              style={styles.digitalCard}
            >
              <View style={styles.cardTop}>
                <View style={[styles.activeBadge, !card.is_active && styles.inactiveBadge]}>
                  <View
                    style={[
                      styles.activeDot,

                      !card.is_active && {
                        backgroundColor: COLORS.muted,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.activeText,

                      !card.is_active && {
                        color: COLORS.muted,
                      },
                    ]}
                  >
                    {card.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>

                <View style={styles.cardTopRight}>
                  <Text style={styles.cardLabel}>Your Digital Card</Text>

                  <TouchableOpacity onPress={() => openRoot('CardSettings')}>
                    <Ionicons name="ellipsis-vertical" size={22} color={COLORS.white} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.cardLogo}>
                  <Ionicons name="id-card-outline" size={30} color={COLORS.gold} />

                  <Text style={styles.cardLogoText}>YNS</Text>
                </View>

                <Text style={styles.cardName}>{card.name || 'Digital Card'}</Text>

                <Text style={styles.cardDesignation}>
                  {card.designation || card.company || 'Digital Business Professional'}
                </Text>

                <View style={styles.goldLine} />

                <View style={styles.cardBottom}>
                  <View style={styles.urlRow}>
                    <Ionicons name="globe-outline" size={20} color={COLORS.gold} />

                    <Text numberOfLines={1} style={styles.cardUrl}>
                      {card.approval_status === 'approved'
                        ? `card.ynscrm.online/card/${card.card_slug}`
                        : 'Public link available after approval'}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.shareCircle} onPress={shareCard}>
                    <Ionicons name="share-social-outline" size={22} color={COLORS.gold} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardGoldBottom} />
            </LinearGradient>
          ) : (
            <View style={styles.noCard}>
              <Ionicons name="card-outline" size={35} color={COLORS.gold} />

              <Text style={styles.noCardTitle}>Create your first digital card</Text>

              <TouchableOpacity style={styles.noCardButton} onPress={() => openRoot('MyCards')}>
                <Text style={styles.noCardButtonText}>Create Card</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.mainContent}>
            <View style={styles.sectionTop}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>

              <TouchableOpacity onPress={() => openRoot('CardEditor')} style={styles.editLink}>
                <Text style={styles.editLinkText}>Edit</Text>

                <Ionicons name="create-outline" size={18} color={COLORS.blue} />
              </TouchableOpacity>
            </View>

            <View style={styles.quickGrid}>
              <QuickAction
                icon="create-outline"
                label="Edit Card"
                tone="blue"
                onPress={() => openRoot('CardEditor')}
              />

              <QuickAction
                icon="share-social-outline"
                label="Share Card"
                tone="purple"
                onPress={shareCard}
              />

              <QuickAction icon="qr-code-outline" label="QR Code" tone="green" onPress={showQr} />

              <QuickAction
                icon="people-outline"
                label="My Leads"
                tone="orange"
                onPress={() => navigation.navigate('Connections')}
              />

              <QuickAction
                icon="logo-whatsapp"
                label="WhatsApp"
                tone="green"
                onPress={() => openRoot('WhatsAppInbox')}
              />

              <QuickAction
                icon="bar-chart-outline"
                label="Analytics"
                tone="blue"
                onPress={() => navigation.navigate('Insights')}
              />
            </View>

            <View style={styles.sectionTop}>
              <Text style={styles.sectionTitle}>Overview</Text>

              <View style={styles.periodLabel}>
                <Text style={styles.periodText}>This Month</Text>

                <Ionicons name="chevron-down" size={15} color={COLORS.blue} />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsRow}
            >
              <StatCard icon="eye-outline" label="Profile Views" value={stats.views} tone="blue" />

              <StatCard
                icon="navigate-outline"
                label="Card Clicks"
                value={stats.clicks}
                tone="purple"
              />

              <StatCard
                icon="logo-whatsapp"
                label="WhatsApp Clicks"
                value={stats.whatsapp}
                tone="green"
              />

              <StatCard
                icon="person-add-outline"
                label="New Leads"
                value={stats.leads}
                tone="orange"
              />
            </ScrollView>

            <LinearGradient colors={['#081D39', '#06162D']} style={styles.premiumBanner}>
              <View style={styles.premiumIcon}>
                <Ionicons name="diamond-outline" size={26} color={COLORS.gold} />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.premiumTitle}>YNS Premium</Text>

                <Text style={styles.premiumText}>
                  Premium themes, custom domains and advanced business tools.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() =>
                  Alert.alert(
                    'YNS Premium',
                    'Premium plans will be activated after the core production app is completed.'
                  )
                }
              >
                <Text style={styles.upgradeButtonText}>Upgrade</Text>

                <Ionicons name="chevron-forward" size={17} color={COLORS.navy} />
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.accountSummary}>
              <View>
                <Text style={styles.accountSummaryLabel}>DIGITAL CARDS</Text>

                <Text style={styles.accountSummaryValue}>{cards.length}</Text>
              </View>

              <View style={styles.summaryDivider} />

              <View>
                <Text style={styles.accountSummaryLabel}>TOTAL LEADS</Text>

                <Text style={styles.accountSummaryValue}>{totalLeads}</Text>
              </View>

              <TouchableOpacity
                style={styles.manageCardsButton}
                onPress={() => openRoot('MyCards')}
              >
                <Text style={styles.manageCardsText}>Manage</Text>

                <Ionicons name="arrow-forward" size={16} color={COLORS.blue} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <TouchableOpacity style={styles.qrClose} onPress={() => setQrVisible(false)}>
              <Ionicons name="close" size={23} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.qrLogo}>
              <Ionicons name="id-card-outline" size={25} color={COLORS.gold} />
            </View>

            <Text style={styles.qrTitle}>Scan My YNS Card</Text>

            <Text style={styles.qrSubtitle}>Scan to open the digital business card</Text>

            {publicUrl ? (
              <View style={styles.qrBox}>
                <QRCode value={publicUrl} size={205} backgroundColor="#FFFFFF" color="#071A33" />
              </View>
            ) : null}

            <Text numberOfLines={1} style={styles.qrUrl}>
              {publicUrl}
            </Text>

            <TouchableOpacity style={styles.qrShareButton} onPress={shareCard}>
              <Ionicons name="share-social-outline" size={19} color={COLORS.white} />

              <Text style={styles.qrShareText}>Share Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ApprovalRequiredModal
        visible={approvalVisible}
        card={card}
        onClose={() => setApprovalVisible(false)}
        onUpdated={() => loadDashboard(true)}
        onEdit={() => {
          setApprovalVisible(false);
          openRoot('CardEditor');
        }}
      />
    </View>
  );
}

function QuickAction({ icon, label, tone, onPress }) {
  const palette = getTone(tone);

  return (
    <TouchableOpacity activeOpacity={0.72} onPress={onPress} style={styles.quickAction}>
      <View
        style={[
          styles.quickIcon,

          {
            backgroundColor: palette.soft,
          },
        ]}
      >
        <Ionicons name={icon} size={25} color={palette.main} />
      </View>

      <Text style={styles.quickText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, tone }) {
  const palette = getTone(tone);

  return (
    <View
      style={[
        styles.statCard,

        {
          backgroundColor: palette.soft,
        },
      ]}
    >
      <Ionicons name={icon} size={27} color={palette.main} />

      <Text style={styles.statLabel}>{label}</Text>

      <Text style={styles.statValue}>{formatNumber(value)}</Text>

      <View style={styles.statTrend}>
        <Ionicons name="arrow-up" size={13} color={COLORS.green} />

        <Text style={styles.statTrendText}>This month</Text>
      </View>
    </View>
  );
}

function getTone(tone) {
  if (tone === 'green') {
    return {
      main: COLORS.green,

      soft: COLORS.greenSoft,
    };
  }

  if (tone === 'purple') {
    return {
      main: COLORS.purple,

      soft: COLORS.purpleSoft,
    };
  }

  if (tone === 'orange') {
    return {
      main: COLORS.orange,

      soft: COLORS.orangeSoft,
    };
  }

  return {
    main: COLORS.blue,

    soft: COLORS.blueSoft,
  };
}

function formatNumber(value) {
  const number = Number(value || 0);

  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }

  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }

  return String(number);
}

const styles = StyleSheet.create({
  root: {
    flex: 1,

    backgroundColor: COLORS.background,
  },

  safe: {
    flex: 1,
  },

  headerBackground: {
    position: 'absolute',

    left: 0,
    right: 0,
    top: 0,

    height: 430,
  },

  loading: {
    flex: 1,

    backgroundColor: COLORS.navy,

    justifyContent: 'center',

    alignItems: 'center',

    gap: 12,
  },

  loadingText: {
    color: '#D2DBE8',

    fontSize: 11,
  },

  scrollContent: {
    paddingBottom: 35,
  },

  /*
   * HEADER
   */

  hero: {
    paddingHorizontal: 18,

    paddingTop: 15,

    paddingBottom: 20,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  heroIdentity: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,
  },

  avatarWrap: {
    position: 'relative',
  },

  avatar: {
    width: 62,
    height: 62,

    borderRadius: 21,

    borderWidth: 2,

    borderColor: 'rgba(255,255,255,0.75)',
  },

  avatarFallback: {
    width: 62,
    height: 62,

    borderRadius: 21,

    backgroundColor: COLORS.goldSoft,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 2,

    borderColor: COLORS.gold,
  },

  avatarInitial: {
    color: COLORS.navy,

    fontSize: 24,

    fontWeight: '900',
  },

  onlineDot: {
    width: 15,
    height: 15,

    borderRadius: 8,

    backgroundColor: COLORS.green,

    borderWidth: 2,

    borderColor: COLORS.navy,

    position: 'absolute',

    bottom: 1,
    right: 0,
  },

  helloRow: {
    flexDirection: 'row',

    alignItems: 'center',

    flexWrap: 'wrap',

    gap: 4,
  },

  helloWhite: {
    color: COLORS.white,

    fontSize: 23,

    fontWeight: '800',
  },

  helloGold: {
    color: COLORS.gold,

    fontSize: 23,

    fontWeight: '900',
  },

  wave: {
    fontSize: 20,
  },

  welcomeText: {
    color: '#C8D1DF',

    fontSize: 10,

    marginTop: 4,
  },

  notificationButton: {
    width: 48,
    height: 48,

    borderRadius: 15,

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.18)',

    backgroundColor: 'rgba(255,255,255,0.08)',

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 10,
  },

  notificationBadge: {
    minWidth: 20,

    height: 20,

    paddingHorizontal: 4,

    borderRadius: 10,

    position: 'absolute',

    top: -4,
    right: -4,

    backgroundColor: COLORS.gold,

    alignItems: 'center',

    justifyContent: 'center',
  },

  notificationBadgeText: {
    color: COLORS.navy,

    fontSize: 8,

    fontWeight: '900',
  },

  /*
   * DIGITAL CARD
   */

  digitalCard: {
    marginHorizontal: 18,

    borderRadius: 24,

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.35)',

    overflow: 'hidden',

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 12,
    },

    shadowOpacity: 0.25,

    shadowRadius: 20,

    elevation: 10,
  },

  cardTop: {
    paddingHorizontal: 17,

    paddingTop: 17,

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  activeBadge: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

    paddingHorizontal: 10,

    paddingVertical: 7,

    borderRadius: 20,

    backgroundColor: 'rgba(22,163,74,0.12)',

    borderWidth: 1,

    borderColor: 'rgba(22,163,74,0.30)',
  },

  inactiveBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',

    borderColor: 'rgba(255,255,255,0.13)',
  },

  activeDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#18D67D',
  },

  activeText: {
    color: '#18D67D',

    fontSize: 10,

    fontWeight: '800',
  },

  cardTopRight: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,
  },

  cardLabel: {
    color: '#D8E0EB',

    fontSize: 10,
  },

  cardBody: {
    paddingHorizontal: 18,

    paddingTop: 22,

    paddingBottom: 17,
  },

  cardLogo: {
    width: 70,
    height: 70,

    borderRadius: 20,

    borderWidth: 2,

    borderColor: COLORS.gold,

    alignItems: 'center',

    justifyContent: 'center',
  },

  cardLogoText: {
    color: COLORS.gold,

    fontSize: 10,

    fontWeight: '900',

    marginTop: 1,
  },

  cardName: {
    color: COLORS.white,

    fontSize: 24,

    fontWeight: '900',

    marginTop: 18,
  },

  cardDesignation: {
    color: '#D2DAE5',

    fontSize: 12,

    marginTop: 4,
  },

  goldLine: {
    width: 55,

    height: 3,

    borderRadius: 3,

    backgroundColor: COLORS.gold,

    marginTop: 14,
  },

  cardBottom: {
    marginTop: 20,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  urlRow: {
    flex: 1,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    paddingRight: 10,
  },

  cardUrl: {
    flex: 1,

    color: COLORS.gold,

    fontSize: 10,
  },

  shareCircle: {
    width: 44,
    height: 44,

    borderRadius: 22,

    borderWidth: 1,

    borderColor: 'rgba(246,185,26,0.4)',

    backgroundColor: 'rgba(246,185,26,0.08)',

    alignItems: 'center',

    justifyContent: 'center',
  },

  cardGoldBottom: {
    height: 4,

    backgroundColor: COLORS.gold,
  },

  noCard: {
    marginHorizontal: 18,

    backgroundColor: COLORS.navy2,

    borderRadius: 22,

    padding: 28,

    alignItems: 'center',
  },

  noCardTitle: {
    color: COLORS.white,

    fontSize: 15,

    fontWeight: '800',

    marginTop: 10,
  },

  noCardButton: {
    backgroundColor: COLORS.gold,

    paddingHorizontal: 20,

    paddingVertical: 11,

    borderRadius: 12,

    marginTop: 15,
  },

  noCardButtonText: {
    color: COLORS.navy,

    fontWeight: '900',
  },

  /*
   * WHITE CONTENT
   */

  mainContent: {
    backgroundColor: COLORS.background,

    borderTopLeftRadius: 28,

    borderTopRightRadius: 28,

    marginTop: 18,

    paddingHorizontal: 18,

    paddingTop: 21,
  },

  sectionTop: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 12,

    marginTop: 4,
  },

  sectionTitle: {
    color: COLORS.text,

    fontSize: 17,

    fontWeight: '900',
  },

  editLink: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,
  },

  editLinkText: {
    color: COLORS.blue,

    fontSize: 11,

    fontWeight: '800',
  },

  /*
   * QUICK ACTIONS
   */

  quickGrid: {
    flexDirection: 'row',

    flexWrap: 'wrap',

    gap: 9,

    marginBottom: 22,
  },

  quickAction: {
    width: '31.5%',

    minHeight: 104,

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 18,

    alignItems: 'center',

    justifyContent: 'center',

    padding: 10,
  },

  quickIcon: {
    width: 45,
    height: 45,

    borderRadius: 15,

    alignItems: 'center',

    justifyContent: 'center',
  },

  quickText: {
    color: COLORS.text,

    fontSize: 10,

    fontWeight: '800',

    marginTop: 9,

    textAlign: 'center',
  },

  /*
   * STATS
   */

  periodLabel: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,
  },

  periodText: {
    color: COLORS.blue,

    fontSize: 10,

    fontWeight: '700',
  },

  statsRow: {
    gap: 10,

    paddingBottom: 4,
  },

  statCard: {
    width: 145,

    minHeight: 155,

    borderRadius: 19,

    padding: 15,

    borderWidth: 1,

    borderColor: 'rgba(0,0,0,0.025)',
  },

  statLabel: {
    color: COLORS.text,

    fontSize: 10,

    marginTop: 13,
  },

  statValue: {
    color: COLORS.text,

    fontSize: 27,

    fontWeight: '900',

    marginTop: 5,
  },

  statTrend: {
    flexDirection: 'row',

    alignItems: 'center',

    gap: 3,

    marginTop: 5,
  },

  statTrendText: {
    color: COLORS.green,

    fontSize: 8,

    fontWeight: '800',
  },

  /*
   * PREMIUM
   */

  premiumBanner: {
    minHeight: 95,

    borderRadius: 19,

    borderWidth: 1,

    borderColor: COLORS.gold,

    marginTop: 18,

    padding: 14,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,
  },

  premiumIcon: {
    width: 52,
    height: 52,

    borderRadius: 16,

    borderWidth: 1,

    borderColor: COLORS.gold,

    alignItems: 'center',

    justifyContent: 'center',
  },

  premiumTitle: {
    color: COLORS.gold,

    fontSize: 13,

    fontWeight: '900',
  },

  premiumText: {
    color: '#D1D9E5',

    fontSize: 8,

    lineHeight: 12,

    marginTop: 3,
  },

  upgradeButton: {
    minHeight: 39,

    backgroundColor: COLORS.gold,

    borderRadius: 11,

    paddingHorizontal: 11,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 3,
  },

  upgradeButtonText: {
    color: COLORS.navy,

    fontSize: 9,

    fontWeight: '900',
  },

  /*
   * ACCOUNT SUMMARY
   */

  accountSummary: {
    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 17,

    marginTop: 14,

    padding: 14,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 14,
  },

  accountSummaryLabel: {
    color: COLORS.muted,

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.7,
  },

  accountSummaryValue: {
    color: COLORS.text,

    fontSize: 20,

    fontWeight: '900',

    marginTop: 2,
  },

  summaryDivider: {
    width: 1,

    height: 35,

    backgroundColor: COLORS.border,
  },

  manageCardsButton: {
    marginLeft: 'auto',

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    padding: 8,
  },

  manageCardsText: {
    color: COLORS.blue,

    fontSize: 10,

    fontWeight: '800',
  },

  /*
   * QR
   */

  modalOverlay: {
    flex: 1,

    backgroundColor: 'rgba(3,13,28,0.72)',

    alignItems: 'center',

    justifyContent: 'center',

    padding: 24,
  },

  qrModal: {
    width: '100%',

    maxWidth: 380,

    backgroundColor: COLORS.white,

    borderRadius: 28,

    padding: 24,

    alignItems: 'center',
  },

  qrClose: {
    position: 'absolute',

    top: 15,
    right: 15,

    width: 39,
    height: 39,

    backgroundColor: COLORS.background,

    borderRadius: 13,

    alignItems: 'center',

    justifyContent: 'center',
  },

  qrLogo: {
    width: 55,
    height: 55,

    borderRadius: 17,

    backgroundColor: COLORS.navy,

    alignItems: 'center',

    justifyContent: 'center',
  },

  qrTitle: {
    color: COLORS.text,

    fontSize: 20,

    fontWeight: '900',

    marginTop: 13,
  },

  qrSubtitle: {
    color: COLORS.text2,

    fontSize: 10,

    marginTop: 4,
  },

  qrBox: {
    marginTop: 19,

    padding: 15,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 20,
  },

  qrUrl: {
    width: '90%',

    color: COLORS.text2,

    fontSize: 8,

    marginTop: 13,

    textAlign: 'center',
  },

  qrShareButton: {
    width: '100%',

    minHeight: 49,

    marginTop: 18,

    borderRadius: 14,

    backgroundColor: COLORS.navy,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 7,
  },

  qrShareText: {
    color: COLORS.white,

    fontSize: 12,

    fontWeight: '900',
  },
});
