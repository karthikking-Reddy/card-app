import { useCallback, useState } from 'react';

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

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ScreenState';

import { getCurrentSession } from '../../services/authService';

import {
  createLeadStage,
  deleteLeadStage,
  getLeadStages,
  reorderLeadStages,
  updateLeadStage,
} from '../../services/leadStageService';

export default function LeadStagesScreen({ navigation }) {
  const [user, setUser] = useState(null);

  const [stages, setStages] = useState([]);

  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);

  const [label, setLabel] = useState('');

  const [isWon, setIsWon] = useState(false);

  const [isLost, setIsLost] = useState(false);

  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const session = await getCurrentSession();

      if (!session?.user) {
        return;
      }

      setUser(session.user);

      const data = await getLeadStages(session.user.id);

      setStages(data);
    } catch {
      setLoadError('We could not load your pipeline stages.');
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
      Alert.alert('Required', 'Enter a stage name.');

      return;
    }

    if (isWon && isLost) {
      Alert.alert('Invalid stage', 'A stage cannot be both Won and Lost.');

      return;
    }

    setSaving(true);

    try {
      await createLeadStage(user.id, {
        label,
        is_won: isWon,
        is_lost: isLost,
      });

      setLabel('');
      setIsWon(false);
      setIsLost(false);
      setModalVisible(false);

      await load();
    } catch (error) {
      Alert.alert('Unable to create stage', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStage(stage, value) {
    try {
      await updateLeadStage(user.id, stage.id, {
        is_active: value,
      });

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
      Alert.alert('Unable to update stage', error.message);
    }
  }

  async function moveStage(index, direction) {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= stages.length) {
      return;
    }

    const updated = [...stages];

    const [moved] = updated.splice(index, 1);

    updated.splice(newIndex, 0, moved);

    setStages(updated);

    try {
      const saved = await reorderLeadStages(user.id, updated);

      setStages(saved);
    } catch (error) {
      Alert.alert('Unable to reorder stages', error.message);

      await load();
    }
  }

  function confirmDelete(stage) {
    Alert.alert('Delete Stage', `Delete "${stage.label}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',

        onPress: async () => {
          try {
            await deleteLeadStage(user.id, stage.id, stage.stage_key);

            await load();
          } catch (error) {
            Alert.alert('Cannot delete stage', error.message);
          }
        },
      },
    ]);
  }

  if (loading) return <LoadingState message="Loading CRM pipeline…" />;
  if (loadError)
    return (
      <ErrorState
        title="Pipeline unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={load}
        fullScreen
      />
    );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>CRM Stages</Text>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={27} color="#F6B91A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.help}>
          Customize your lead pipeline. These stages will be used by Leads and follow-up workflows.
        </Text>

        {!stages.length ? (
          <EmptyState
            title="No pipeline stages"
            message="Add your first CRM stage to organize leads."
            actionLabel="Add Stage"
            onAction={() => setModalVisible(true)}
          />
        ) : null}
        {stages.map((stage, index) => (
          <View key={stage.id} style={styles.stage}>
            <View style={styles.order}>
              <TouchableOpacity disabled={index === 0} onPress={() => moveStage(index, -1)}>
                <Ionicons name="chevron-up" size={20} color={index === 0 ? '#D0D5DD' : '#06162D'} />
              </TouchableOpacity>

              <TouchableOpacity
                disabled={index === stages.length - 1}
                onPress={() => moveStage(index, 1)}
              >
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={index === stages.length - 1 ? '#D0D5DD' : '#06162D'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.stageInfo}>
              <Text style={styles.stageLabel}>{stage.label}</Text>

              <View style={styles.badges}>
                {stage.is_won ? <Badge text="WON" /> : null}

                {stage.is_lost ? <Badge text="LOST" /> : null}

                <Text style={styles.key}>{stage.stage_key}</Text>
              </View>
            </View>

            <Switch value={stage.is_active} onValueChange={(value) => toggleStage(stage, value)} />

            <TouchableOpacity onPress={() => confirmDelete(stage)}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={21} color="#FFFFFF" />

          <Text style={styles.addText}>Add Custom Stage</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add CRM Stage</Text>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color="#06162D" />
              </TouchableOpacity>
            </View>

            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Example: Meeting Scheduled"
              placeholderTextColor="#98A2B3"
              style={styles.input}
            />

            <Option
              title="Won Stage"
              description="Leads in this stage count as conversions."
              value={isWon}
              onValueChange={(value) => {
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
              onValueChange={(value) => {
                setIsLost(value);

                if (value) {
                  setIsWon(false);
                }
              }}
            />

            <TouchableOpacity style={styles.saveButton} onPress={addStage} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Create Stage</Text>
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
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

function Option({ title, description, value, onValueChange }) {
  return (
    <View style={styles.option}>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>

        <Text style={styles.optionDescription}>{description}</Text>
      </View>

      <Switch value={value} onValueChange={onValueChange} />
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

  help: {
    color: '#667085',
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

  order: {
    gap: 2,
  },

  stageInfo: {
    flex: 1,
  },

  stageLabel: {
    color: '#06162D',
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
    backgroundColor: '#FFF4D6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },

  badgeText: {
    color: '#C98B16',
    fontSize: 8,
    fontWeight: '900',
  },

  key: {
    color: '#98A2B3',
    fontSize: 8,
  },

  addButton: {
    backgroundColor: '#06162D',
    borderRadius: 15,
    paddingVertical: 14,
    marginTop: 12,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  addText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 35,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#06162D',
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6EAF0',
    borderRadius: 13,
    padding: 13,
    color: '#06162D',
    marginBottom: 14,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FB',
  },

  optionTitle: {
    color: '#06162D',
    fontWeight: '800',
  },

  optionDescription: {
    color: '#667085',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  saveButton: {
    marginTop: 18,
    backgroundColor: '#06162D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
