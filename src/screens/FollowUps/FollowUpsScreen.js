import {
  useCallback,
  useMemo,
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
  completeFollowupTask,
  deleteFollowupTask,
  getFollowupTasks,
  reopenFollowupTask,
} from '../../services/followupTaskService';

export default function FollowUpsScreen({
  navigation,
}) {
  const [tasks, setTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState('pending');

  const load =
    useCallback(async () => {
      setLoading(true);

      try {
        const session =
          await getCurrentSession();

        if (!session?.user) {
          return;
        }

        const data =
          await getFollowupTasks(
            session.user.id
          );

        setTasks(data);
      } catch (error) {
        Alert.alert(
          'Unable to load follow-ups',
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

  const filtered =
    useMemo(() => {
      if (filter === 'all') {
        return tasks;
      }

      return tasks.filter(
        (task) =>
          task.status ===
          filter
      );
    }, [tasks, filter]);

  const pending =
    tasks.filter(
      (task) =>
        task.status ===
        'pending'
    ).length;

  const overdue =
    tasks.filter(
      (task) =>
        task.status ===
          'pending' &&
        task.due_at &&
        new Date(
          task.due_at
        ) < new Date()
    ).length;

  async function toggle(task) {
    try {
      if (
        task.status ===
        'completed'
      ) {
        await reopenFollowupTask(
          task.id
        );
      } else {
        await completeFollowupTask(
          task.id
        );
      }

      await load();
    } catch (error) {
      Alert.alert(
        'Unable to update task',
        error.message
      );
    }
  }

  function remove(task) {
    Alert.alert(
      'Delete Follow-up',
      `Delete "${task.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress: async () => {
            try {
              await deleteFollowupTask(
                task.id
              );

              await load();
            } catch (error) {
              Alert.alert(
                'Unable to delete follow-up',
                error.message
              );
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#06162D"
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
        >
          Follow-ups
        </Text>

        <View
          style={{ width: 25 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <View
          style={styles.summaryRow}
        >
          <Summary
            value={pending}
            label="Pending"
          />

          <Summary
            value={overdue}
            label="Overdue"
          />

          <Summary
            value={tasks.length}
            label="Total"
          />
        </View>

        <View style={styles.filters}>
          {[
            ['pending', 'Pending'],
            ['completed', 'Completed'],
            ['all', 'All'],
          ].map(
            ([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.filter,

                  filter === key &&
                    styles.filterActive,
                ]}
                onPress={() =>
                  setFilter(key)
                }
              >
                <Text
                  style={[
                    styles.filterText,

                    filter === key &&
                      styles.filterTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Text
          style={styles.sectionTitle}
        >
          FOLLOW-UP TASKS
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="calendar-outline"
              size={44}
              color="#98A2B3"
            />

            <Text
              style={styles.emptyTitle}
            >
              No follow-ups here
            </Text>
          </View>
        ) : (
          filtered.map((task) => {
            const lead =
              task.connections;

            const isOverdue =
              task.status ===
                'pending' &&
              task.due_at &&
              new Date(
                task.due_at
              ) < new Date();

            return (
              <TouchableOpacity
                key={task.id}
                style={[
                  styles.task,

                  isOverdue &&
                    styles.overdueTask,
                ]}
                onPress={() => {
                  if (
                    task.connection_id
                  ) {
                    navigation.navigate(
                      'LeadDetail',
                      {
                        connectionId:
                          task.connection_id,
                      }
                    );
                  }
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    toggle(task)
                  }
                >
                  <Ionicons
                    name={
                      task.status ===
                      'completed'
                        ? 'checkmark-circle'
                        : 'ellipse-outline'
                    }
                    size={25}
                    color={
                      task.status ===
                      'completed'
                        ? '#16A34A'
                        : '#06162D'
                    }
                  />
                </TouchableOpacity>

                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={[
                      styles.taskTitle,

                      task.status ===
                        'completed' &&
                        styles.completed,
                    ]}
                  >
                    {task.title}
                  </Text>

                  <Text
                    style={
                      styles.leadName
                    }
                  >
                    {lead?.name ||
                      'Lead'}
                    {lead?.company
                      ? ` • ${lead.company}`
                      : ''}
                  </Text>

                  {task.due_at ? (
                    <Text
                      style={[
                        styles.date,

                        isOverdue &&
                          styles.overdueDate,
                      ]}
                    >
                      {isOverdue
                        ? 'OVERDUE • '
                        : ''}

                      {new Date(
                        task.due_at
                      ).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  onPress={() =>
                    remove(task)
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color="#DC2626"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Summary({
  value,
  label,
}) {
  return (
    <View style={styles.summary}>
      <Text
        style={styles.summaryValue}
      >
        {value}
      </Text>

      <Text
        style={styles.summaryLabel}
      >
        {label}
      </Text>
    </View>
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

  container: {
    padding: 16,
    paddingBottom: 70,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 9,
  },

  summary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,


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
    fontSize: 10,
    marginTop: 3,
  },

  filters: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },

  filter: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',


    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
},

  filterActive: {
    backgroundColor: '#06162D',


    borderWidth: 1,

    borderColor: '#F6B91A',
},

  filterText: {
    color: '#667085',
    fontWeight: '700',
    fontSize: 11,
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  sectionTitle: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 10,
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
    marginTop: 10,
    color: '#667085',
    fontWeight: '700',
  },

  task: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
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

  overdueTask: {
    borderColor: '#FCA5A5',


    backgroundColor: '#FFF9F9',
},

  taskTitle: {
    color: '#06162D',
    fontWeight: '800',
  },

  completed: {
    color: '#98A2B3',
    textDecorationLine:
      'line-through',
  },

  leadName: {
    color: '#667085',
    fontSize: 10,
    marginTop: 3,
  },

  date: {
    color: '#98A2B3',
    fontSize: 9,
    marginTop: 4,
  },

  overdueDate: {
    color: '#DC2626',
    fontWeight: '800',
  },
});
