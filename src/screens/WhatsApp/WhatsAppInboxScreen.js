import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';

import { getCurrentSession } from '../../services/authService';
import {
  getWhatsAppConversationsPage,
  getWhatsAppInboxSummary,
} from '../../services/whatsappService';
import { findIntegration, getIntegrationStatus } from '../../services/integrationService';
import ConnectionStatusBadge from '../../components/business/ConnectionStatusBadge';
import { EmptyState, LoadingState } from '../../components/ui/ScreenState';
import { safeGoBack } from '../../utils/navigation';

export default function WhatsAppInboxScreen({ navigation }) {
  const requestIdRef = useRef(0);
  const [conversations, setConversations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');

  const [filter, setFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [summary, setSummary] = useState({ total: 0, open: 0, unread: 0 });
  const [cloudConnected, setCloudConnected] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (refresh = false, nextPage = 0) => {
      const requestId = ++requestIdRef.current;
      if (nextPage > 0) {
        setLoadingMore(true);
      } else if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const session = await getCurrentSession();
        if (!session?.user) return;
        const [result, totals, integrationResult] = await Promise.all([
          getWhatsAppConversationsPage({
            userId: session.user.id,
            page: nextPage,
            status: filter,
            search: debouncedSearch,
          }),
          getWhatsAppInboxSummary(session.user.id),
          getIntegrationStatus().catch(() => []),
        ]);
        if (requestId !== requestIdRef.current) return;
        setConversations((current) =>
          nextPage === 0
            ? result.data
            : [...new Map([...current, ...result.data].map((item) => [item.id, item])).values()]
        );
        setPage(nextPage);
        setHasMore(result.hasMore);
        setSummary(totals);
        setCloudConnected(findIntegration(integrationResult, 'whatsapp')?.status === 'connected');
      } catch (error) {
        Alert.alert('Unable to load WhatsApp inbox', 'Please check your connection and try again.');
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedSearch, filter]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = conversations;

  if (loading) {
    return <LoadingState message="Loading WhatsApp inbox…" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeGoBack(navigation, { fallbackTab: 'Meta' })}>
          <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>WhatsApp Inbox</Text>

          <Text style={styles.subtitle}>{summary.unread} unread messages</Text>
        </View>

        <View style={styles.whatsappIcon}>
          <Ionicons name="logo-whatsapp" size={25} color="#16A34A" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {!cloudConnected ? (
          <View style={styles.connectionBanner}>
            <View style={{ flex: 1 }}>
              <ConnectionStatusBadge status="setup_required" />
              <Text style={styles.connectionText}>
                WhatsApp Business API setup required for live business messaging. Existing stored
                conversations remain visible below.
              </Text>
            </View>
          </View>
        ) : null}
        <View style={styles.summaryRow}>
          <Summary value={summary.total} label="Chats" />

          <Summary value={summary.open} label="Open" />

          <Summary value={summary.unread} label="Unread" />
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color="#98A2B3" />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or phone"
            placeholderTextColor="#98A2B3"
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            marginTop: 12,
          }}
        >
          {[
            ['all', 'All'],
            ['unread', 'Unread'],
            ['open', 'Open'],
            ['closed', 'Closed'],
          ].map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[styles.filterChip, filter === value && styles.filterChipActive]}
              onPress={() => setFilter(value)}
            >
              <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>CONVERSATIONS</Text>

        {filtered.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            message="Live WhatsApp Business messages appear only after a verified Cloud API connection."
          />
        ) : (
          filtered.map((conversation) => (
            <TouchableOpacity
              key={conversation.id}
              style={styles.conversation}
              onPress={() =>
                navigation.navigate('WhatsAppChat', {
                  conversation,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(conversation.contact_name || conversation.phone)}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text numberOfLines={1} style={styles.contactName}>
                  {conversation.contact_name || conversation.phone}
                </Text>

                <Text numberOfLines={1} style={styles.phone}>
                  {conversation.phone}
                </Text>
              </View>

              <View style={styles.right}>
                <Text style={styles.time}>{formatTime(conversation.last_message_at)}</Text>

                {conversation.unread_count > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unread_count}</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        {hasMore ? (
          <TouchableOpacity
            style={styles.loadMore}
            disabled={loadingMore}
            onPress={() => load(false, page + 1)}
          >
            {loadingMore ? (
              <ActivityIndicator color="#06162D" />
            ) : (
              <Text style={styles.loadMoreText}>Load More</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({ value, label }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function getInitials(value) {
  return String(value || 'WA')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((item) => item.charAt(0))
    .join('')
    .toUpperCase();
}

function formatTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FB',

    backgroundColor: '#F5F7FB',
  },

  header: {
    minHeight: 68,

    paddingHorizontal: 18,

    backgroundColor: '#06162D',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 10,

    borderBottomWidth: 1,

    borderBottomColor: 'rgba(246,185,26,0.22)',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 5 },

    shadowOpacity: 0.12,

    shadowRadius: 12,

    elevation: 5,
  },

  title: {
    color: '#FFFFFF',

    fontWeight: '900',

    fontSize: 18,
  },

  subtitle: {
    color: '#D0D5DD',

    fontSize: 9,

    marginTop: 2,
  },

  whatsappIcon: {
    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor: 'rgba(22,163,74,0.13)',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#16A34A',
  },

  container: {
    padding: 18,
    paddingBottom: 100,
  },
  connectionBanner: {
    backgroundColor: '#FFF6DD',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D99A12',
    padding: 14,
    marginBottom: 14,
  },
  connectionText: { color: '#344054', fontSize: 10, lineHeight: 16, marginTop: 9 },

  summaryRow: {
    flexDirection: 'row',
    gap: 9,
  },

  summary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  summaryValue: {
    color: '#06162D',
    fontSize: 22,
    fontWeight: '900',
  },

  summaryLabel: {
    color: '#667085',
    fontSize: 9,
    marginTop: 3,
  },

  searchBox: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 14,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  searchInput: {
    flex: 1,
    color: '#06162D',
    fontSize: 12,
  },

  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 13,
    marginRight: 8,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  filterChipActive: {
    backgroundColor: '#06162D',

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  filterText: {
    color: '#667085',
    fontWeight: '800',
    fontSize: 10,
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  sectionLabel: {
    color: '#667085',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 9,
  },

  conversation: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 8,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,

    borderWidth: 1,

    borderColor: '#E6EAF0',
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#16A34A',
    fontWeight: '900',
    fontSize: 14,
  },

  contactName: {
    color: '#06162D',
    fontWeight: '900',
    fontSize: 13,
  },

  phone: {
    color: '#667085',
    fontSize: 9,
    marginTop: 4,
  },

  right: {
    alignItems: 'flex-end',
    gap: 7,
  },

  time: {
    color: '#98A2B3',
    fontSize: 8,
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  unreadText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 35,
    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: '#06162D',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 14,
  },

  emptyText: {
    color: '#667085',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 7,
    maxWidth: 270,
  },
  loadMore: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  loadMoreText: { color: '#06162D', fontSize: 11, fontWeight: '900' },
});
