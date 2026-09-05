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

import { getCurrentSession } from '../../services/authService';

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';

export default function NotificationsScreen({ navigation }) {
  const [user, setUser] = useState(null);

  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const session = await getCurrentSession();

      if (!session?.user) {
        return;
      }

      setUser(session.user);

      const data = await getNotifications(session.user.id);

      setNotifications(data);
    } catch (error) {
      Alert.alert('Unable to load notifications', error.message);
    } finally {
      setLoading(false);
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
        await markNotificationRead(notification.id);
      }

      if (notification.notification_type === 'new_lead' && notification.reference_id) {
        navigation.navigate('LeadDetail', {
          connectionId: notification.reference_id,
        });

        return;
      }

      await load();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  async function markAll() {
    try {
      await markAllNotificationsRead(user.id);

      await load();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  const unread = notifications.filter((item) => !item.is_read).length;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#06162D" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <TouchableOpacity onPress={markAll} disabled={unread === 0}>
          <Text style={styles.markAll}>Read All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.summary}>
          {unread} unread notification
          {unread === 1 ? '' : 's'}
        </Text>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={45} color="#98A2B3" />

            <Text style={styles.emptyTitle}>No notifications yet</Text>

            <Text style={styles.emptyText}>
              New leads and important card activity will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => openNotification(notification)}
              style={[styles.notification, !notification.is_read && styles.unread]}
            >
              <View style={styles.notificationIcon}>
                <Ionicons
                  name={
                    notification.notification_type === 'new_lead'
                      ? 'person-add-outline'
                      : 'notifications-outline'
                  }
                  size={21}
                  color="#06162D"
                />
              </View>

              <View style={{ flex: 1 }}>
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
      </ScrollView>
    </SafeAreaView>
  );
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
});
