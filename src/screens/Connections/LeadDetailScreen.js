import {
  useCallback,
  useMemo,
  useState,
} from 'react';

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

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  addLeadActivity,
  getConnection,
  getLeadActivities,
  updateConnection,
} from '../../services/connectionService';

import {
  getCurrentSession,
} from '../../services/authService';

import {
  getLeadStages,
} from '../../services/leadStageService';

import {
  completeFollowupTask,
  createFollowupTask,
  deleteFollowupTask,
  getConnectionFollowups,
  reopenFollowupTask,
} from '../../services/followupTaskService';

export default function LeadDetailScreen({
  navigation,
  route,
}) {
  const { connectionId } =
    route.params;

  const [user, setUser] =
    useState(null);

  const [lead, setLead] =
    useState(null);

  const [stages, setStages] =
    useState([]);

  const [activities, setActivities] =
    useState([]);

  const [tasks, setTasks] =
    useState([]);

  const [notes, setNotes] =
    useState('');

  const [taskTitle, setTaskTitle] =
    useState('Follow up');

  const [taskDate, setTaskDate] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

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

        const [
          connection,
          stageData,
          activityData,
          taskData,
        ] = await Promise.all([
          getConnection(
            connectionId
          ),

          getLeadStages(
            session.user.id
          ),

          getLeadActivities(
            connectionId
          ),

          getConnectionFollowups(
            session.user.id,
            connectionId
          ),
        ]);

        setLead(connection);

        setStages(stageData);

        setActivities(
          activityData
        );

        setTasks(taskData);

        setNotes(
          connection.notes || ''
        );
      } catch (error) {
        Alert.alert(
          'Unable to load lead',
          error.message
        );
      } finally {
        setLoading(false);
      }
    }, [connectionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visibleStages =
    useMemo(() => {
      const active =
        stages.filter(
          (stage) =>
            stage.is_active
        );

      const current =
        stages.find(
          (stage) =>
            stage.stage_key ===
            lead?.stage
        );

      if (
        current &&
        !active.some(
          (stage) =>
            stage.id ===
            current.id
        )
      ) {
        return [
          current,
          ...active,
        ];
      }

      return active;
    }, [
      stages,
      lead?.stage,
    ]);

  async function changeStage(
    stage
  ) {
    try {
      const updated =
        await updateConnection(
          connectionId,
          {
            stage:
              stage.stage_key,

            last_contacted_at:
              new Date()
                .toISOString(),
          }
        );

      setLead(updated);

      await addLeadActivity(
        connectionId,
        'stage_changed',
        `Stage changed to ${stage.label}`
      );

      await load();
    } catch (error) {
      Alert.alert(
        'Stage update failed',
        error.message
      );
    }
  }

  async function saveNotes() {
    setSaving(true);

    try {
      await updateConnection(
        connectionId,
        {
          notes:
            notes.trim(),
        }
      );

      await addLeadActivity(
        connectionId,
        'note_updated',
        'Lead notes updated'
      );

      Alert.alert(
        'Saved',
        'Lead notes updated.'
      );

      await load();
    } catch (error) {
      Alert.alert(
        'Save failed',
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function addFollowup() {
    if (!taskTitle.trim()) {
      Alert.alert(
        'Required',
        'Enter a follow-up title.'
      );

      return;
    }

    if (!taskDate.trim()) {
      Alert.alert(
        'Required',
        'Enter the date as YYYY-MM-DD.'
      );

      return;
    }

    const date =
      new Date(
        `${taskDate.trim()}T09:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      Alert.alert(
        'Invalid date',
        'Use YYYY-MM-DD format.'
      );

      return;
    }

    setSaving(true);

    try {
      await createFollowupTask(
        user.id,
        connectionId,
        {
          title:
            taskTitle.trim(),

          due_at:
            date.toISOString(),

          priority: 'normal',
        }
      );

      await updateConnection(
        connectionId,
        {
          next_follow_up_at:
            date.toISOString(),

          stage:
            lead.stage ===
              'new'
              ? 'follow_up'
              : lead.stage,
        }
      );

      await addLeadActivity(
        connectionId,
        'followup_created',
        'Follow-up scheduled',
        `${taskTitle.trim()} - ${taskDate}`
      );

      setTaskTitle(
        'Follow up'
      );

      setTaskDate('');

      await load();
    } catch (error) {
      Alert.alert(
        'Unable to schedule follow-up',
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(
    task
  ) {
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

        await addLeadActivity(
          connectionId,
          'followup_completed',
          `Completed: ${task.title}`
        );
      }

      await load();
    } catch (error) {
      Alert.alert(
        'Unable to update follow-up',
        error.message
      );
    }
  }

  function removeTask(task) {
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

  function cleanPhone(value) {
    return String(value || '')
      .replace(/[^\d+]/g, '');
  }

  function call() {
    if (!lead?.phone) return;

    Linking.openURL(
      `tel:${cleanPhone(
        lead.phone
      )}`
    );
  }

  function whatsapp() {
    if (!lead?.phone) return;

    const number =
      cleanPhone(
        lead.phone
      ).replace('+', '');

    Linking.openURL(
      `https://wa.me/${number}`
    );
  }

  if (loading || !lead) {
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
            color="#111827"
          />
        </TouchableOpacity>

        <Text
          style={styles.headerTitle}
        >
          Lead Details
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
        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text
              style={styles.initial}
            >
              {lead.name
                ?.charAt(0)
                ?.toUpperCase() ||
                'L'}
            </Text>
          </View>

          <Text style={styles.name}>
            {lead.name}
          </Text>

          <Text
            style={styles.company}
          >
            {lead.company ||
              'No company'}
          </Text>

          {lead.phone ? (
            <View
              style={
                styles.contactRow
              }
            >
              <TouchableOpacity
                style={
                  styles.contactButton
                }
                onPress={whatsapp}
              >
                <Ionicons
                  name="logo-whatsapp"
                  size={20}
                  color="#111827"
                />

                <Text
                  style={
                    styles.contactText
                  }
                >
                  WhatsApp
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.contactButton
                }
                onPress={call}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#111827"
                />

                <Text
                  style={
                    styles.contactText
                  }
                >
                  Call
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Text
          style={styles.sectionTitle}
        >
          LEAD STAGE
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
        >
          {visibleStages.map(
            (stage) => (
              <TouchableOpacity
                key={stage.id}
                onPress={() =>
                  changeStage(
                    stage
                  )
                }
                style={[
                  styles.stageChip,

                  lead.stage ===
                    stage.stage_key &&
                    styles.stageChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.stageChipText,

                    lead.stage ===
                      stage.stage_key &&
                      styles.stageChipTextActive,
                  ]}
                >
                  {stage.label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <Text
          style={styles.sectionTitle}
        >
          CONTACT INFORMATION
        </Text>

        <View style={styles.card}>
          <Info
            label="Phone"
            value={lead.phone}
          />

          <Info
            label="Email"
            value={lead.email}
          />

          <Info
            label="Company"
            value={lead.company}
          />

          <Info
            label="Requirement"
            value={
              lead.requirement
            }
          />

          <Info
            label="Source"
            value={lead.source}
          />
        </View>

        <Text
          style={styles.sectionTitle}
        >
          SCHEDULE FOLLOW-UP
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Follow-up title
          </Text>

          <TextInput
            value={taskTitle}
            onChangeText={
              setTaskTitle
            }
            placeholder="Call client"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          <Text style={styles.label}>
            Date
          </Text>

          <TextInput
            value={taskDate}
            onChangeText={
              setTaskDate
            }
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          <TouchableOpacity
            style={
              styles.saveButton
            }
            onPress={addFollowup}
            disabled={saving}
          >
            <Ionicons
              name="calendar-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text
              style={styles.saveText}
            >
              Schedule Follow-up
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={styles.sectionTitle}
        >
          FOLLOW-UP TASKS
        </Text>

        {tasks.length === 0 ? (
          <View style={styles.card}>
            <Text
              style={
                styles.noActivity
              }
            >
              No follow-up tasks yet.
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View
              key={task.id}
              style={styles.task}
            >
              <TouchableOpacity
                onPress={() =>
                  toggleTask(task)
                }
                style={
                  styles.taskCheck
                }
              >
                <Ionicons
                  name={
                    task.status ===
                    'completed'
                      ? 'checkmark-circle'
                      : 'ellipse-outline'
                  }
                  size={24}
                  color={
                    task.status ===
                    'completed'
                      ? '#16A34A'
                      : '#111827'
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
                      styles.taskCompleted,
                  ]}
                >
                  {task.title}
                </Text>

                {task.due_at ? (
                  <Text
                    style={
                      styles.taskDate
                    }
                  >
                    {new Date(
                      task.due_at
                    ).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={() =>
                  removeTask(task)
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#DC2626"
                />
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text
          style={styles.sectionTitle}
        >
          NOTES
        </Text>

        <View style={styles.card}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add lead notes..."
            placeholderTextColor="#9CA3AF"
            multiline
            style={[
              styles.input,
              styles.notes,
            ]}
          />

          <TouchableOpacity
            style={
              styles.saveButton
            }
            onPress={saveNotes}
            disabled={saving}
          >
            <Text
              style={styles.saveText}
            >
              Save Notes
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={styles.sectionTitle}
        >
          ACTIVITY HISTORY
        </Text>

        {activities.length === 0 ? (
          <View style={styles.card}>
            <Text
              style={
                styles.noActivity
              }
            >
              No activity recorded yet.
            </Text>
          </View>
        ) : (
          activities.map(
            (activity) => (
              <View
                key={activity.id}
                style={
                  styles.activity
                }
              >
                <View
                  style={
                    styles.activityDot
                  }
                />

                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={
                      styles.activityTitle
                    }
                  >
                    {activity.title ||
                      activity.activity_type}
                  </Text>

                  {activity.description ? (
                    <Text
                      style={
                        styles.activityDescription
                      }
                    >
                      {
                        activity.description
                      }
                    </Text>
                  ) : null}

                  <Text
                    style={
                      styles.activityDate
                    }
                  >
                    {new Date(
                      activity.created_at
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>
            )
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({
  label,
  value,
}) {
  if (!value) return null;

  return (
    <View style={styles.info}>
      <Text
        style={styles.infoLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.infoValue}
      >
        {value}
      </Text>
    </View>
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
    justifyContent:
      'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
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
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#111827',
  },

  company: {
    color: '#6B7280',
    marginTop: 3,
  },

  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  contactButton: {
    flexDirection: 'row',
    gap: 7,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  contactText: {
    fontWeight: '700',
    color: '#111827',
  },

  sectionTitle: {
    color: '#6B7280',
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
  },

  info: {
    marginBottom: 13,
  },

  infoLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
  },

  infoValue: {
    color: '#111827',
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
    backgroundColor: '#111827',
  },

  stageChipText: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
  },

  stageChipTextActive: {
    color: '#FFFFFF',
  },

  label: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
    color: '#111827',
  },

  notes: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
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
  },

  taskCheck: {
    padding: 2,
  },

  taskTitle: {
    color: '#111827',
    fontWeight: '800',
  },

  taskCompleted: {
    textDecorationLine:
      'line-through',
    color: '#9CA3AF',
  },

  taskDate: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 3,
  },

  noActivity: {
    color: '#6B7280',
    textAlign: 'center',
  },

  activity: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },

  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#111827',
    marginTop: 5,
  },

  activityTitle: {
    color: '#111827',
    fontWeight: '800',
  },

  activityDescription: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 3,
  },

  activityDate: {
    color: '#9CA3AF',
    fontSize: 9,
    marginTop: 5,
  },
});
