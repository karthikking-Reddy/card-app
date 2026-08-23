import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  getCurrentSession,
} from '../../services/authService';

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService';

export default function NotificationsScreen({
  navigation,
}) {
  const [user, setUser] =
    useState(null);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const load =
    useCallback(async () => {
      setLoading(true);

      try {
        const session =
          await getCurrentSession();

        if (!session?.user) {
          return;
        }

        setUser(session.user);

        const data =
          await getNotifications(
            session.user.id
          );

        setNotifications(data);
      } catch (error) {
        Alert.alert(
          'Unable to load notifications',
          error.message
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function openNotification(
    notification
  ) {
    try {
      if (!notification.is_read) {
        await markNotificationRead(
          notification.id
        );
      }

      if (
        notification.notification_type ===
          'new_lead' &&
        notification.reference_id
      ) {
        navigation.navigate(
          'LeadDetail',
          {
            connectionId:
              notification.reference_id,
          }
        );

        return;
      }

      await load();
    } catch (error) {
      Alert.alert(
        'Error',
        error.message
      );
    }
  }

  async function markAll() {
    try {
      await markAllNotificationsRead(
        user.id
      );

      await load();
    } catch (error) {
      Alert.alert(
        'Error',
        error.message
      );
    }
  }

  const unread =
    notifications.filter(
      (item) => !item.is_read
    ).length;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#111827"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#111827"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Notifications
        </Text>

        <TouchableOpacity
          onPress={markAll}
          disabled={unread === 0}
        >
          <Text style={styles.markAll}>
            Read All
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Text style={styles.summary}>
          {unread} unread notification
          {unread === 1 ? '' : 's'}
        </Text>

        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="notifications-outline"
              size={45}
              color="#9CA3AF"
            />

            <Text
              style={styles.emptyTitle}
            >
              No notifications yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              New leads and important card activity will appear here.
            </Text>
          </View>
        ) : (
          notifications.map(
            (notification) => (
              <TouchableOpacity
                key={
                  notification.id
                }
                onPress={() =>
                  openNotification(
                    notification
                  )
                }
                style={[
                  styles.notification,
                  !notification.is_read &&
                    styles.unread,
                ]}
              >
                <View
                  style={
                    styles.notificationIcon
                  }
                >
                  <Ionicons
                    name={
                      notification.notification_type ===
                      'new_lead'
                        ? 'person-add-outline'
                        : 'notifications-outline'
                    }
                    size={21}
                    color="#111827"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={
                      styles.notificationTitle
                    }
                  >
                    {notification.title}
                  </Text>

                  <Text
                    style={
                      styles.notificationMessage
                    }
                  >
                    {notification.message ||
                      ''}
                  </Text>

                  <Text
                    style={
                      styles.notificationDate
                    }
                  >
                    {new Date(
                      notification.created_at
                    ).toLocaleString()}
                  </Text>
                </View>

                {!notification.is_read ? (
                  <View
                    style={
                      styles.unreadDot
                    }
                  />
                ) : null}
              </TouchableOpacity>
            )
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  loading: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  header: {
    height: 60,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  markAll: {
    color: '#B7791F',
    fontSize: 11,
    fontWeight: '800',
  },

  container: {
    padding: 16,
    paddingBottom: 70,
  },

  summary: {
    color: '#6B7280',
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
  },

  unread: {
    borderColor: '#D4A94E',
  },

  notificationIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationTitle: {
    color: '#111827',
    fontWeight: '800',
  },

  notificationMessage: {
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  notificationDate: {
    color: '#9CA3AF',
    fontSize: 9,
    marginTop: 6,
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#B7791F',
    marginTop: 5,
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
  },

  emptyTitle: {
    marginTop: 11,
    color: '#111827',
    fontWeight: '800',
  },

  emptyText: {
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
  },
});
