import { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
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
import { ErrorState, LoadingState } from '../../components/ui/ScreenState';

import {
  addLeadActivity,
  getConnection,
  getLeadActivities,
  updateConnection,
  getPriorityLabel,
  getSourceLabel,
} from '../../services/connectionService';

import { getCurrentSession } from '../../services/authService';

import { getLeadStages } from '../../services/leadStageService';

import {
  completeFollowupTask,
  createFollowupTask,
  deleteFollowupTask,
  getConnectionFollowups,
  reopenFollowupTask,
} from '../../services/followupTaskService';

export default function LeadDetailScreen({ navigation, route }) {
  const connectionId = route.params?.connectionId;

  const [user, setUser] = useState(null);

  const [lead, setLead] = useState(null);

  const [stages, setStages] = useState([]);

  const [activities, setActivities] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [notes, setNotes] = useState('');

  const [taskTitle, setTaskTitle] = useState('Follow up');

  const [taskDate, setTaskDate] = useState('');
  const [taskPriority, setTaskPriority] = useState('normal');

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [dealValue, setDealValue] = useState('');
  const [workingAction, setWorkingAction] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    if (!connectionId) {
      setLoading(false);
      return;
    }

    try {
      const session = await getCurrentSession();

      if (!session?.user) {
        return;
      }

      setUser(session.user);

      const [connection, stageData, activityData, taskData] = await Promise.all([
        getConnection(session.user.id, connectionId),

        getLeadStages(session.user.id),

        getLeadActivities(session.user.id, connectionId),

        getConnectionFollowups(session.user.id, connectionId),
      ]);

      setLead(connection);

      setStages(stageData);

      setActivities(activityData);

      setTasks(taskData);

      setNotes(connection.notes || '');
      setDealValue(connection.estimated_value == null ? '' : String(connection.estimated_value));
    } catch {
      setLoadError('We could not load this lead. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visibleStages = useMemo(() => {
    const active = stages.filter((stage) => stage.is_active);

    const current = stages.find((stage) => stage.stage_key === lead?.stage);

    if (current && !active.some((stage) => stage.id === current.id)) {
      return [current, ...active];
    }

    return active;
  }, [stages, lead?.stage]);

  async function changeStage(stage) {
    if (saving || lead.stage === stage.stage_key) return;
    setSaving(true);
    try {
      const updated = await updateConnection(user.id, connectionId, {
        stage: stage.stage_key,
      });

      setLead(updated);

      const activityType = stage.is_won
        ? 'deal_won'
        : stage.is_lost
          ? 'deal_lost'
          : 'stage_changed';
      const activityTitle = stage.is_won
        ? `Marked Won — ${stage.label}`
        : stage.is_lost
          ? `Marked Lost — ${stage.label}`
          : `Stage changed to ${stage.label}`;
      await addLeadActivity(user.id, connectionId, activityType, activityTitle);

      await load();
    } catch (error) {
      Alert.alert('Stage update failed', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    if (!notes.trim()) {
      Alert.alert('Note required', 'Enter a note before saving.');
      return;
    }
    setSaving(true);

    try {
      await updateConnection(user.id, connectionId, {
        notes: notes.trim(),
      });

      await addLeadActivity(user.id, connectionId, 'note_added', 'Note added', notes.trim());

      Alert.alert('Saved', 'Lead notes updated.');

      await load();
    } catch (error) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateOpportunity(values, activityTitle) {
    if (saving) return;
    setSaving(true);
    try {
      const updated = await updateConnection(user.id, connectionId, values);
      setLead(updated);
      await addLeadActivity(user.id, connectionId, 'lead_updated', activityTitle);
      Alert.alert('Saved', 'Lead opportunity details updated.');
      await load();
    } catch (error) {
      Alert.alert('Update failed', error.message);
    } finally {
      setSaving(false);
    }
  }

  function saveDealValue() {
    const value = dealValue.trim() ? Number(dealValue.replace(/,/g, '')) : null;
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      Alert.alert('Invalid value', 'Enter a valid non-negative estimated deal value.');
      return;
    }
    updateOpportunity({ estimated_value: value }, 'Estimated deal value updated');
  }

  async function addFollowup() {
    if (!taskTitle.trim()) {
      Alert.alert('Required', 'Enter a follow-up title.');

      return;
    }

    if (!taskDate.trim()) {
      Alert.alert('Required', 'Enter the date as YYYY-MM-DD.');

      return;
    }

    const date = new Date(`${taskDate.trim()}T09:00:00`);

    if (Number.isNaN(date.getTime())) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD format.');

      return;
    }

    setSaving(true);

    try {
      await createFollowupTask(user.id, connectionId, {
        title: taskTitle.trim(),

        due_at: date.toISOString(),

        priority: taskPriority,
      });

      await updateConnection(user.id, connectionId, {
        next_follow_up_at: date.toISOString(),

        stage: lead.stage === 'new' ? 'follow_up' : lead.stage,
      });

      await addLeadActivity(
        user.id,
        connectionId,
        'followup_created',
        'Follow-up scheduled',
        `${taskTitle.trim()} - ${taskDate}`
      );

      setTaskTitle('Follow up');

      setTaskDate('');
      setTaskPriority('normal');

      await load();
    } catch (error) {
      Alert.alert('Unable to schedule follow-up', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task) {
    try {
      if (task.status === 'completed') {
        await reopenFollowupTask(user.id, task.id);
      } else {
        await completeFollowupTask(user.id, task.id);

        await addLeadActivity(
          user.id,
          connectionId,
          'followup_completed',
          `Completed: ${task.title}`
        );
      }

      await load();
    } catch (error) {
      Alert.alert('Unable to update follow-up', error.message);
    }
  }

  function removeTask(task) {
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
            await deleteFollowupTask(user.id, task.id);

            await load();
          } catch (error) {
            Alert.alert('Unable to delete follow-up', error.message);
          }
        },
      },
    ]);
  }

  function cleanPhone(value) {
    return String(value || '').replace(/[^\d+]/g, '');
  }

  async function openContactAction(key, url, title) {
    if (workingAction) return;
    setWorkingAction(key);
    try {
      await Linking.openURL(url);
      await updateConnection(user.id, connectionId, {
        last_contacted_at: new Date().toISOString(),
      });
      await addLeadActivity(user.id, connectionId, 'contact_attempt', title);
      await load();
    } catch {
      Alert.alert('Unable to open', 'This contact action is unavailable on this device.');
    } finally {
      setWorkingAction('');
    }
  }

  function whatsapp() {
    if (!lead?.phone) return;
    const number = cleanPhone(lead.phone).replace('+', '');
    openContactAction('whatsapp', `https://wa.me/${number}`, 'WhatsApp opened');
  }

  function call() {
    if (!lead?.phone) return;
    openContactAction('call', `tel:${cleanPhone(lead.phone)}`, 'Phone call opened');
  }

  function email() {
    if (!lead?.email) return;
    openContactAction('email', `mailto:${encodeURIComponent(lead.email)}`, 'Email composer opened');
  }

  if (loading) return <LoadingState message="Loading lead details…" />;
  if (loadError)
    return (
      <ErrorState
        title="Lead unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={load}
        fullScreen
      />
    );

  if (!connectionId || !lead) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lead Detail</Text>
          <View style={{ width: 25 }} />
        </View>
        <View style={styles.loading}>
          <Ionicons name="alert-circle-outline" size={42} color="#98A2B3" />
          <Text style={{ color: '#667085', marginTop: 10 }}>Lead unavailable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Lead Details</Text>

        <View style={{ width: 25 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{lead.name?.charAt(0)?.toUpperCase() || 'L'}</Text>
          </View>

          <Text style={styles.name}>{lead.name}</Text>

          <Text style={styles.company}>{lead.company || 'No company'}</Text>

          {lead.phone ? (
            <View style={styles.contactRow}>
              <TouchableOpacity style={styles.contactButton} onPress={whatsapp}>
                <Ionicons name="logo-whatsapp" size={20} color="#06162D" />

                <Text style={styles.contactText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactButton} onPress={call}>
                <Ionicons name="call-outline" size={20} color="#06162D" />

                <Text style={styles.contactText}>Call</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {lead.email ? (
            <TouchableOpacity style={styles.contactButton} onPress={email}>
              <Ionicons name="mail-outline" size={20} color="#06162D" />
              <Text style={styles.contactText}>Email</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>LEAD STAGE</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {visibleStages.map((stage) => (
            <TouchableOpacity
              key={stage.id}
              onPress={() => changeStage(stage)}
              style={[styles.stageChip, lead.stage === stage.stage_key && styles.stageChipActive]}
            >
              <Text
                style={[
                  styles.stageChipText,

                  lead.stage === stage.stage_key && styles.stageChipTextActive,
                ]}
              >
                {stage.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>OPPORTUNITY</Text>
        <View style={styles.card}>
          <Info label="Priority" value={getPriorityLabel(lead.priority)} />
          <Info label="Lead Source" value={getSourceLabel(lead.source, lead.source_detail)} />
          <Info
            label="Created"
            value={lead.created_at ? new Date(lead.created_at).toLocaleString() : null}
          />
          <Text style={styles.label}>Estimated pipeline value</Text>
          <TextInput
            value={dealValue}
            onChangeText={setDealValue}
            keyboardType="decimal-pad"
            placeholder="Potential deal amount"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />
          <TouchableOpacity style={styles.saveButton} onPress={saveDealValue} disabled={saving}>
            <Text style={styles.saveText}>Save Estimated Value</Text>
          </TouchableOpacity>
          <Text style={styles.revenueHelp}>
            Estimated value is potential pipeline, not earned revenue. Revenue counts only after a
            Won stage.
          </Text>
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {[
              ['low', 'Low'],
              ['normal', 'Medium'],
              ['high', 'High'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.priorityChip,
                  (lead.priority || 'normal') === value && styles.priorityChipActive,
                ]}
                onPress={() =>
                  updateOpportunity({ priority: value }, `Priority changed to ${label}`)
                }
                disabled={saving}
              >
                <Text
                  style={[
                    styles.priorityText,
                    (lead.priority || 'normal') === value && styles.priorityTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>

        <View style={styles.card}>
          <Info label="Phone" value={lead.phone} />

          <Info label="Email" value={lead.email} />

          <Info label="Company" value={lead.company} />

          <Info label="Requirement" value={lead.requirement} />

          <Info label="Source" value={lead.source} />
        </View>

        <Text style={styles.sectionTitle}>SCHEDULE FOLLOW-UP</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Follow-up title</Text>

          <TextInput
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder="Call client"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />

          <Text style={styles.label}>Date</Text>

          <TextInput
            value={taskDate}
            onChangeText={setTaskDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />

          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {[
              ['low', 'Low'],
              ['normal', 'Medium'],
              ['high', 'High'],
            ].map(([value, label]) => (
              <TouchableOpacity
                key={value}
                style={[styles.priorityChip, taskPriority === value && styles.priorityChipActive]}
                onPress={() => setTaskPriority(value)}
              >
                <Text
                  style={[styles.priorityText, taskPriority === value && styles.priorityTextActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={addFollowup} disabled={saving}>
            <Ionicons name="calendar-outline" size={19} color="#FFFFFF" />

            <Text style={styles.saveText}>Schedule Follow-up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>FOLLOW-UP TASKS</Text>

        {tasks.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.noActivity}>No follow-up tasks yet.</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View key={task.id} style={styles.task}>
              <TouchableOpacity onPress={() => toggleTask(task)} style={styles.taskCheck}>
                <Ionicons
                  name={task.status === 'completed' ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={task.status === 'completed' ? '#16A34A' : '#06162D'}
                />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.taskTitle, task.status === 'completed' && styles.taskCompleted]}
                >
                  {task.title}
                </Text>

                {task.due_at ? (
                  <Text style={styles.taskDate}>{new Date(task.due_at).toLocaleDateString()}</Text>
                ) : null}
                <Text style={styles.taskDate}>Priority: {getPriorityLabel(task.priority)}</Text>
              </View>

              <TouchableOpacity onPress={() => removeTask(task)}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>NOTES</Text>

        <View style={styles.card}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add lead notes..."
            placeholderTextColor="#98A2B3"
            multiline
            style={[styles.input, styles.notes]}
          />

          <TouchableOpacity style={styles.saveButton} onPress={saveNotes} disabled={saving}>
            <Text style={styles.saveText}>Save Notes</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>ACTIVITY HISTORY</Text>

        {activities.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.noActivity}>No activity recorded yet.</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <View key={activity.id} style={styles.activity}>
              <View style={styles.activityDot} />

              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{activity.title || activity.activity_type}</Text>

                {activity.description ? (
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                ) : null}

                <Text style={styles.activityDate}>
                  {new Date(activity.created_at).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({ label, value }) {
  if (!value) return null;

  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>

      <Text style={styles.infoValue}>{value}</Text>
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

  profile: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#06162D',
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,

    borderColor: '#F6B91A',
  },

  initial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  name: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '900',
    color: '#06162D',
  },

  company: {
    color: '#667085',
    marginTop: 3,
  },

  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 18,
  },

  contactButton: {
    flexDirection: 'row',

    gap: 7,

    backgroundColor: '#FFF4D6',

    paddingHorizontal: 16,

    paddingVertical: 10,

    borderRadius: 12,

    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  contactText: {
    fontWeight: '700',
    color: '#06162D',
  },

  sectionTitle: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 9,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  info: {
    marginBottom: 13,
  },

  infoLabel: {
    color: '#98A2B3',
    fontSize: 10,
    fontWeight: '700',
  },

  infoValue: {
    color: '#06162D',
    fontSize: 14,
    marginTop: 3,
  },

  stageChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    marginRight: 8,
  },

  stageChipActive: {
    backgroundColor: '#06162D',

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  stageChipText: {
    color: '#667085',
    fontSize: 11,
    fontWeight: '700',
  },

  stageChipTextActive: {
    color: '#FFFFFF',
  },

  label: {
    color: '#344054',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E6EAF0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
    color: '#06162D',
  },

  notes: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  saveButton: {
    backgroundColor: '#06162D',
    borderRadius: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  task: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  taskCheck: {
    padding: 2,
  },

  taskTitle: {
    color: '#06162D',
    fontWeight: '800',
  },

  taskCompleted: {
    textDecorationLine: 'line-through',
    color: '#98A2B3',
  },

  taskDate: {
    color: '#667085',
    fontSize: 10,
    marginTop: 3,
  },

  noActivity: {
    color: '#667085',
    textAlign: 'center',
  },

  activity: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  activityDot: {
    width: 10,

    height: 10,

    borderRadius: 5,

    backgroundColor: '#F6B91A',

    marginTop: 5,
  },

  activityTitle: {
    color: '#06162D',
    fontWeight: '800',
  },

  activityDescription: {
    color: '#667085',
    fontSize: 11,
    marginTop: 3,
  },

  activityDate: {
    color: '#98A2B3',
    fontSize: 9,
    marginTop: 5,
  },
  revenueHelp: { color: '#667085', fontSize: 10, lineHeight: 15, marginTop: 9, marginBottom: 13 },
  priorityRow: { flexDirection: 'row', gap: 8 },
  priorityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    alignItems: 'center',
  },
  priorityChipActive: { backgroundColor: '#06162D', borderColor: '#F6B91A' },
  priorityText: { color: '#667085', fontSize: 11, fontWeight: '700' },
  priorityTextActive: { color: '#FFFFFF' },
});
