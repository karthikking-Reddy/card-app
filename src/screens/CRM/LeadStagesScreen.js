import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
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
  getCurrentSession,
} from '../../services/authService';

import {
  createLeadStage,
  deleteLeadStage,
  getLeadStages,
  reorderLeadStages,
  updateLeadStage,
} from '../../services/leadStageService';

export default function LeadStagesScreen({
  navigation,
}) {
  const [user, setUser] =
    useState(null);

  const [stages, setStages] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [label, setLabel] =
    useState('');

  const [isWon, setIsWon] =
    useState(false);

  const [isLost, setIsLost] =
    useState(false);

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

        const data =
          await getLeadStages(
            session.user.id
          );

        setStages(data);
      } catch (error) {
        Alert.alert(
          'Unable to load stages',
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

  async function addStage() {
    if (!label.trim()) {
      Alert.alert(
        'Required',
        'Enter a stage name.'
      );

      return;
    }

    if (isWon && isLost) {
      Alert.alert(
        'Invalid stage',
        'A stage cannot be both Won and Lost.'
      );

      return;
    }

    setSaving(true);

    try {
      await createLeadStage(
        user.id,
        {
          label,
          is_won: isWon,
          is_lost: isLost,
        }
      );

      setLabel('');
      setIsWon(false);
      setIsLost(false);
      setModalVisible(false);

      await load();
    } catch (error) {
      Alert.alert(
        'Unable to create stage',
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStage(
    stage,
    value
  ) {
    try {
      await updateLeadStage(
        stage.id,
        {
          is_active: value,
        }
      );

      setStages((previous) =>
        previous.map((item) =>
          item.id === stage.id
            ? {
                ...item,
                is_active: value,
              }
            : item
        )
      );
    } catch (error) {
      Alert.alert(
        'Unable to update stage',
        error.message
      );
    }
  }

  async function moveStage(
    index,
    direction
  ) {
    const newIndex =
      index + direction;

    if (
      newIndex < 0 ||
      newIndex >= stages.length
    ) {
      return;
    }

    const updated = [...stages];

    const [moved] =
      updated.splice(index, 1);

    updated.splice(
      newIndex,
      0,
      moved
    );

    setStages(updated);

    try {
      const saved =
        await reorderLeadStages(
          updated
        );

      setStages(saved);
    } catch (error) {
      Alert.alert(
        'Unable to reorder stages',
        error.message
      );

      await load();
    }
  }

  function confirmDelete(stage) {
    Alert.alert(
      'Delete Stage',
      `Delete "${stage.label}"?`,
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
              await deleteLeadStage(
                stage.id,
                stage.stage_key
              );

              await load();
            } catch (error) {
              Alert.alert(
                'Cannot delete stage',
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
          CRM Stages
        </Text>

        <TouchableOpacity
          onPress={() =>
            setModalVisible(true)
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={27}
            color="#111827"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Text style={styles.help}>
          Customize your lead pipeline.
          These stages will be used by
          Connections and follow-up workflows.
        </Text>

        {stages.map(
          (stage, index) => (
            <View
              key={stage.id}
              style={styles.stage}
            >
              <View
                style={styles.order}
              >
                <TouchableOpacity
                  disabled={
                    index === 0
                  }
                  onPress={() =>
                    moveStage(
                      index,
                      -1
                    )
                  }
                >
                  <Ionicons
                    name="chevron-up"
                    size={20}
                    color={
                      index === 0
                        ? '#D1D5DB'
                        : '#111827'
                    }
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={
                    index ===
                    stages.length - 1
                  }
                  onPress={() =>
                    moveStage(
                      index,
                      1
                    )
                  }
                >
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={
                      index ===
                      stages.length - 1
                        ? '#D1D5DB'
                        : '#111827'
                    }
                  />
                </TouchableOpacity>
              </View>

              <View
                style={styles.stageInfo}
              >
                <Text
                  style={styles.stageLabel}
                >
                  {stage.label}
                </Text>

                <View
                  style={styles.badges}
                >
                  {stage.is_won ? (
                    <Badge text="WON" />
                  ) : null}

                  {stage.is_lost ? (
                    <Badge text="LOST" />
                  ) : null}

                  <Text
                    style={styles.key}
                  >
                    {stage.stage_key}
                  </Text>
                </View>
              </View>

              <Switch
                value={
                  stage.is_active
                }
                onValueChange={(
                  value
                ) =>
                  toggleStage(
                    stage,
                    value
                  )
                }
              />

              <TouchableOpacity
                onPress={() =>
                  confirmDelete(
                    stage
                  )
                }
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color="#DC2626"
                />
              </TouchableOpacity>
            </View>
          )
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            setModalVisible(true)
          }
        >
          <Ionicons
            name="add"
            size={21}
            color="#FFFFFF"
          />

          <Text
            style={styles.addText}
          >
            Add Custom Stage
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View
              style={
                styles.modalHeader
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Add CRM Stage
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#111827"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Example: Meeting Scheduled"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Option
              title="Won Stage"
              description="Leads in this stage count as conversions."
              value={isWon}
              onValueChange={(
                value
              ) => {
                setIsWon(value);

                if (value) {
                  setIsLost(false);
                }
              }}
            />

            <Option
              title="Lost Stage"
              description="Leads in this stage count as lost opportunities."
              value={isLost}
              onValueChange={(
                value
              ) => {
                setIsLost(value);

                if (value) {
                  setIsWon(false);
                }
              }}
            />

            <TouchableOpacity
              style={
                styles.saveButton
              }
              onPress={addStage}
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
                  Create Stage
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Badge({ text }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {text}
      </Text>
    </View>
  );
}

function Option({
  title,
  description,
  value,
  onValueChange,
}) {
  return (
    <View style={styles.option}>
      <View style={{ flex: 1 }}>
        <Text
          style={styles.optionTitle}
        >
          {title}
        </Text>

        <Text
          style={
            styles.optionDescription
          }
        >
          {description}
        </Text>
      </View>

      <Switch
        value={value}
        onValueChange={
          onValueChange
        }
      />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
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

  help: {
    color: '#6B7280',
    lineHeight: 19,
    marginBottom: 15,
  },

  stage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  order: {
    gap: 2,
  },

  stageInfo: {
    flex: 1,
  },

  stageLabel: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 13,
  },

  badges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginTop: 5,
  },

  badge: {
    backgroundColor: '#FFF7E6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  badgeText: {
    color: '#B7791F',
    fontSize: 8,
    fontWeight: '900',
  },

  key: {
    color: '#9CA3AF',
    fontSize: 8,
  },

  addButton: {
    backgroundColor: '#111827',
    borderRadius: 15,
    paddingVertical: 14,
    marginTop: 12,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  overlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 35,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
  },

  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    padding: 13,
    color: '#111827',
    marginBottom: 14,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  optionTitle: {
    color: '#111827',
    fontWeight: '800',
  },

  optionDescription: {
    color: '#6B7280',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  saveButton: {
    marginTop: 18,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
