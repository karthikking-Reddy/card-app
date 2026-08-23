import {
  useCallback,
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
  CONNECTION_STAGES,
  getConnection,
  getLeadActivities,
  STAGE_LABELS,
  updateConnection,
} from '../../services/connectionService';

export default function LeadDetailScreen({
  navigation,
  route,
}) {
  const { connectionId } =
    route.params;

  const [lead, setLead] =
    useState(null);

  const [activities, setActivities] =
    useState([]);

  const [notes, setNotes] =
    useState('');

  const [followUp, setFollowUp] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const load =
    useCallback(async () => {
      setLoading(true);

      try {
        const [
          connection,
          activityData,
        ] = await Promise.all([
          getConnection(
            connectionId
          ),
          getLeadActivities(
            connectionId
          ),
        ]);

        setLead(connection);
        setActivities(activityData);
        setNotes(
          connection.notes || ''
        );

        if (
          connection.next_follow_up_at
        ) {
          setFollowUp(
            connection.next_follow_up_at
              .slice(0, 10)
          );
        } else {
          setFollowUp('');
        }
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

  async function changeStage(stage) {
    try {
      const updated =
        await updateConnection(
          connectionId,
          { stage }
        );

      setLead(updated);

      await addLeadActivity(
        connectionId,
        'stage_changed',
        `Stage changed to ${
          STAGE_LABELS[stage]
        }`
      );

      const activityData =
        await getLeadActivities(
          connectionId
        );

      setActivities(
        activityData
      );
    } catch (error) {
      Alert.alert(
        'Update failed',
        error.message
      );
    }
  }

  async function saveDetails() {
    setSaving(true);

    try {
      let followUpValue = null;

      if (followUp.trim()) {
        const date =
          new Date(
            `${followUp.trim()}T09:00:00`
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
          setSaving(false);
          return;
        }

        followUpValue =
          date.toISOString();
      }

      const updated =
        await updateConnection(
          connectionId,
          {
            notes: notes.trim(),
            next_follow_up_at:
              followUpValue,
          }
        );

      setLead(updated);

      await addLeadActivity(
        connectionId,
        'lead_updated',
        'Lead details updated',
        followUpValue
          ? `Follow-up set for ${followUp}`
          : 'Notes updated'
      );

      Alert.alert(
        'Saved',
        'Lead details updated.'
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
      cleanPhone(lead.phone)
        .replace('+', '');

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

        <Text
          style={styles.headerTitle}
        >
          Lead Details
        </Text>

        <View style={{ width: 25 }} />
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
              style={styles.contactRow}
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
          LEAD STAGE
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
        >
          {CONNECTION_STAGES.map(
            (stage) => (
              <TouchableOpacity
                key={stage}
                onPress={() =>
                  changeStage(stage)
                }
                style={[
                  styles.stageChip,
                  lead.stage ===
                    stage &&
                    styles.stageChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.stageChipText,
                    lead.stage ===
                      stage &&
                      styles.stageChipTextActive,
                  ]}
                >
                  {STAGE_LABELS[
                    stage
                  ]}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        <Text
          style={styles.sectionTitle}
        >
          FOLLOW-UP & NOTES
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            Next Follow-up
          </Text>

          <TextInput
            value={followUp}
            onChangeText={setFollowUp}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />

          <Text style={styles.label}>
            Notes
          </Text>

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this lead..."
            placeholderTextColor="#9CA3AF"
            multiline
            style={[
              styles.input,
              styles.notes,
            ]}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveDetails}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.saveText
                }
              >
                Save Changes
              </Text>
            )}
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
              style={styles.noActivity}
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

                <View style={{ flex: 1 }}>
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

function Info({ label, value }) {
  if (!value) return null;

  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
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
    alignItems: 'center',
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
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
