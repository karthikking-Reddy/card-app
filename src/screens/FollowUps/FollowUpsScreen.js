import { useCallback, useRef, useState } from 'react';

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
import { getPriorityLabel } from '../../services/connectionService';

import {
  completeFollowupTask,
  deleteFollowupTask,
  getFollowupSummary,
  getFollowupTasksPage,
  reopenFollowupTask,
} from '../../services/followupTaskService';

export default function FollowUpsScreen({ navigation }) {
  const requestIdRef = useRef(0);
  const [userId, setUserId] = useState(null);
  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('today');
  const [loadError, setLoadError] = useState('');
  const [workingId, setWorkingId] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [summary, setSummary] = useState({ pending: 0, overdue: 0, total: 0 });

  const load = useCallback(
    async (nextPage = 0) => {
      const requestId = ++requestIdRef.current;
      setLoadError('');
      nextPage > 0 ? setLoadingMore(true) : setLoading(true);

      try {
        const session = await getCurrentSession();

        if (!session?.user) {
          return;
        }
        setUserId(session.user.id);

        const [result, totals] = await Promise.all([
          getFollowupTasksPage({
            userId: session.user.id,
            page: nextPage,
            status: filter === 'completed' ? 'completed' : 'pending',
            view: filter === 'completed' ? 'all' : filter,
          }),
          getFollowupSummary(session.user.id),
        ]);
        if (requestId !== requestIdRef.current) return;
        setTasks((current) =>
          nextPage === 0
            ? result.data
            : [...new Map([...current, ...result.data].map((item) => [item.id, item])).values()]
        );
        setPage(nextPage);
        setHasMore(result.hasMore);
        setSummary(totals);
      } catch {
        setLoadError('We could not load follow-ups. Check your connection and try again.');
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = tasks;

  async function toggle(task) {
    if (!userId || workingId) return;
    setWorkingId(task.id);
    try {
      if (task.status === 'completed') {
        await reopenFollowupTask(userId, task.id);
      } else {
        await completeFollowupTask(userId, task.id);
      }

      await load();
    } catch (error) {
      Alert.alert('Unable to update task', error.message);
    } finally {
      setWorkingId(null);
    }
  }

  function remove(task) {
    Alert.alert('Delete Follow-up', `Delete "${task.title}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',

        onPress: async () => {
          try {
            await deleteFollowupTask(userId, task.id);

            await load();
          } catch (error) {
            Alert.alert('Unable to delete follow-up', error.message);
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingState message="Loading follow-ups…" />;
  if (loadError && !tasks.length)
    return (
      <ErrorState
        title="Follow-ups unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={() => load()}
        fullScreen
      />
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Follow-ups</Text>

        <View style={{ width: 25 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.summaryRow}>
          <Summary value={summary.dueToday || 0} label="Due Today" />
          <Summary value={summary.upcoming || 0} label="Upcoming" />
          <Summary value={summary.overdue} label="Overdue" />
          <Summary value={summary.completed || 0} label="Completed" />
        </View>

        <View style={styles.filters}>
          {[
            ['today', 'Due Today'],
            ['upcoming', 'Upcoming'],
            ['overdue', 'Overdue'],
            ['completed', 'Completed'],
          ].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filter, filter === key && styles.filterActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>FOLLOW-UP TASKS</Text>

        {filtered.length === 0 ? (
          <EmptyState
            title="No follow-ups here"
            message="Schedule a follow-up from a lead detail screen."
            actionLabel="Open Leads"
            onAction={() => navigation.navigate('MainTabs', { screen: 'Connections' })}
          />
        ) : (
          filtered.map((task) => {
            const lead = task.connections;

            const isOverdue =
              task.status === 'pending' && task.due_at && new Date(task.due_at) < new Date();

            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.task, isOverdue && styles.overdueTask]}
                onPress={() => {
                  if (task.connection_id) {
                    navigation.navigate('LeadDetail', {
                      connectionId: task.connection_id,
                    });
                  }
                }}
              >
                <TouchableOpacity onPress={() => toggle(task)} disabled={workingId === task.id}>
                  {workingId === task.id ? (
                    <ActivityIndicator size="small" color="#06162D" />
                  ) : (
                    <Ionicons
                      name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={25}
                      color={task.status === 'completed' ? '#16A34A' : '#06162D'}
                    />
                  )}
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskTitle, task.status === 'completed' && styles.completed]}>
                    {task.title}
                  </Text>

                  <Text style={styles.leadName}>
                    {lead?.name || 'Lead'}
                    {lead?.company ? ` • ${lead.company}` : ''}
                  </Text>

                  {task.due_at ? (
                    <Text style={[styles.date, isOverdue && styles.overdueDate]}>
                      {isOverdue ? 'OVERDUE • ' : ''}

                      {new Date(task.due_at).toLocaleString()}
                    </Text>
                  ) : null}
                  <Text style={styles.date}>Priority: {getPriorityLabel(task.priority)}</Text>
                </View>

                <TouchableOpacity onPress={() => remove(task)}>
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
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
    flexWrap: 'wrap',
    gap: 9,
  },

  summary: {
    width: '48%',
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
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },

  filter: {
    width: '48%',
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
    textDecorationLine: 'line-through',
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
  loadMore: { minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  loadMoreText: { color: '#06162D', fontSize: 11, fontWeight: '900' },
});
