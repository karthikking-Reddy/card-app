import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ScreenState';

import { getCurrentSession } from '../../services/authService';

import {
  getNotificationsPage,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';

export default function NotificationsScreen({ navigation }) {
  const [user, setUser] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [unread, setUnread] = useState(0);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async (nextPage = 0) => {
    nextPage > 0 ? setLoadingMore(true) : setLoading(true);
    setLoadError('');

    try {
      const session = await getCurrentSession();

      if (!session?.user) {
        return;
      }

      setUser(session.user);

      const [result, unreadCount] = await Promise.all([
        getNotificationsPage({ userId: session.user.id, page: nextPage }),
        getUnreadNotificationCount(session.user.id),
      ]);
      setNotifications((current) =>
        nextPage === 0
          ? result.data
          : [...new Map([...current, ...result.data].map((item) => [item.id, item])).values()]
      );
      setPage(nextPage);
      setHasMore(result.hasMore);
      setUnread(unreadCount);
    } catch {
      setLoadError('We could not load notifications. Check your connection and try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function openNotification(notification) {
    try {
      if (!notification.is_read) {
        await markNotificationRead(user.id, notification.id);
        setUnread((value) => Math.max(0, value - 1));
        setNotifications((items) =>
          items.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
        );
      }

      if (notification.notification_type === 'new_lead' && notification.reference_id) {
        navigation.navigate('LeadDetail', {
          connectionId: notification.reference_id,
        });

        return;
      }
    } catch {
      Alert.alert('Unable to update notification', 'Please try again.');
    }
  }

  async function markAll() {
    try {
      await markAllNotificationsRead(user.id);
      setUnread(0);
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch {
      Alert.alert('Unable to update notifications', 'Please try again.');
    }
  }

  if (loading) {
    return <LoadingState message="Loading notifications…" />;
  }

  if (loadError && notifications.length === 0) {
    return (
      <ErrorState
        title="Notifications unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={() => load()}
        fullScreen
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('BusinessModule', { module: 'notification_preferences' })
          }
        >
          <Ionicons name="options-outline" size={23} color="#F6B91A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.summary}>
          {unread} unread notification
          {unread === 1 ? '' : 's'}
        </Text>

        {notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            message="Real lead, follow-up, card, integration and security activity will appear here."
          />
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => openNotification(notification)}
              style={[styles.notification, !notification.is_read && styles.unread]}
            >
              <View style={styles.notificationIcon}>
                <Ionicons
                  name={getNotificationPresentation(notification.notification_type).icon}
                  size={21}
                  color={getNotificationPresentation(notification.notification_type).color}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.category}>
                  {getNotificationPresentation(notification.notification_type).label}
                </Text>
                <Text style={styles.notificationTitle}>{notification.title}</Text>

                <Text style={styles.notificationMessage}>{notification.message || ''}</Text>

                <Text style={styles.notificationDate}>
                  {new Date(notification.created_at).toLocaleString()}
                </Text>
              </View>

              {!notification.is_read ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>
          ))
        )}
        {hasMore ? (
          <TouchableOpacity
            style={styles.loadMore}
            disabled={loadingMore}
            onPress={() => load(page + 1)}
          >
            {loadingMore ? (
              <ActivityIndicator color="#06162D" />
            ) : (
              <Text style={styles.loadMoreText}>Load More</Text>
            )}
          </TouchableOpacity>
        ) : null}
        {unread > 0 ? (
          <TouchableOpacity style={styles.readAllButton} onPress={markAll}>
            <Text style={styles.readAllText}>Mark all as read</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function getNotificationPresentation(type) {
  const key = String(type || '').toLowerCase();
  if (key.includes('lead'))
    return { label: 'New leads', icon: 'person-add-outline', color: '#2563EB' };
  if (key.includes('follow'))
    return { label: 'Follow-ups', icon: 'time-outline', color: '#D99A12' };
  if (key.includes('meeting') || key.includes('appointment'))
    return { label: 'Meetings', icon: 'calendar-outline', color: '#7C3AED' };
  if (key.includes('card') || key.includes('approval'))
    return { label: 'Card activity', icon: 'card-outline', color: '#061B36' };
  if (key.includes('integration') || key.includes('meta') || key.includes('whatsapp'))
    return { label: 'Integration status', icon: 'pulse-outline', color: '#D99A12' };
  if (key.includes('security') || key.includes('login') || key.includes('password'))
    return { label: 'Security', icon: 'shield-checkmark-outline', color: '#D92D3A' };
  return { label: 'Product updates', icon: 'notifications-outline', color: '#061B36' };
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },

  loading: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    alignItems: 'center',
    justifyContent: 'center',

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

  headerTitle: {
    fontSize: 18,

    fontWeight: '900',

    color: '#FFFFFF',

    letterSpacing: 0.1,
  },

  markAll: {
    color: '#F6B91A',

    fontSize: 11,

    fontWeight: '900',
  },

  container: {
    padding: 16,
    paddingBottom: 70,
  },

  summary: {
    color: '#667085',
    marginBottom: 13,
  },

  notification: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  unread: {
    borderColor: '#F6B91A',

    backgroundColor: '#FFFCF3',

    borderWidth: 1.5,
  },

  notificationIcon: {
    width: 43,

    height: 43,

    borderRadius: 13,

    backgroundColor: '#FFF4D6',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  notificationTitle: {
    color: '#06162D',
    fontWeight: '800',
  },
  category: {
    color: '#D99A12',
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  readAllButton: {
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#D99A12',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  readAllText: { color: '#061B36', fontSize: 11, fontWeight: '900' },

  notificationMessage: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  notificationDate: {
    color: '#98A2B3',
    fontSize: 9,
    marginTop: 6,
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#C98B16',
    marginTop: 5,
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  emptyTitle: {
    marginTop: 11,
    color: '#06162D',
    fontWeight: '800',
  },

  emptyText: {
    color: '#667085',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
  },
  loadMore: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  loadMoreText: { color: '#06162D', fontSize: 11, fontWeight: '900' },
});
