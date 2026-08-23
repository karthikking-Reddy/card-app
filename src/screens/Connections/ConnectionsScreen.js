import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
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
  getCurrentSession,
} from '../../services/authService';

import {
  getCard,
} from '../../services/cardService';

import {
  addLeadActivity,
  calculateConnectionStats,
  createConnection,
  getAllConnections,
  STAGE_LABELS,
} from '../../services/connectionService';

export default function ConnectionsScreen({
  navigation,
}) {
  const [card, setCard] = useState(null);
  const [connections, setConnections] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [selectedStage, setSelectedStage] =
    useState('all');

  const [modalVisible, setModalVisible] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    requirement: '',
  });

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const session =
        await getCurrentSession();

      if (!session?.user) return;

      const currentCard =
        await getCard(session.user.id);

      setCard(currentCard);

      const data =
        await getAllConnections();

      setConnections(data);
    } catch (error) {
      Alert.alert(
        'Unable to load connections',
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

  const stats =
    useMemo(
      () =>
        calculateConnectionStats(
          connections
        ),
      [connections]
    );

  const filtered =
    useMemo(() => {
      const term =
        search.trim().toLowerCase();

      return connections.filter(
        (item) => {
          const stageMatch =
            selectedStage === 'all' ||
            item.stage ===
              selectedStage;

          const searchMatch =
            !term ||
            item.name
              ?.toLowerCase()
              .includes(term) ||
            item.phone
              ?.toLowerCase()
              .includes(term) ||
            item.email
              ?.toLowerCase()
              .includes(term) ||
            item.company
              ?.toLowerCase()
              .includes(term);

          return (
            stageMatch &&
            searchMatch
          );
        }
      );
    }, [
      connections,
      search,
      selectedStage,
    ]);

  function change(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm({
      name: '',
      phone: '',
      email: '',
      company: '',
      requirement: '',
    });
  }

  async function addConnection() {
    if (!card) return;

    if (!form.name.trim()) {
      Alert.alert(
        'Required',
        'Please enter the lead name.'
      );
      return;
    }

    setSaving(true);

    try {
      const connection =
        await createConnection(
          card.id,
          {
            name:
              form.name.trim(),
            phone:
              form.phone.trim(),
            email:
              form.email.trim(),
            company:
              form.company.trim(),
            requirement:
              form.requirement.trim(),
            stage: 'new',
            source: 'mobile_app',
          }
        );

      await addLeadActivity(
        connection.id,
        'lead_created',
        'Lead created',
        'Lead was added from YNS Card mobile app.'
      );

      setModalVisible(false);
      resetForm();
      await load();
    } catch (error) {
      Alert.alert(
        'Unable to add lead',
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

  function call(phone) {
    if (!phone) return;

    Linking.openURL(
      `tel:${cleanPhone(phone)}`
    );
  }

  function whatsapp(phone) {
    if (!phone) return;

    const number =
      cleanPhone(phone)
        .replace('+', '');

    Linking.openURL(
      `https://wa.me/${number}`
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
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Connections
            </Text>

            <Text
              style={styles.subtitle}
            >
              Manage leads and follow-ups
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() =>
              setModalVisible(true)
            }
          >
            <Ionicons
              name="add"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <View
          style={styles.summaryRow}
        >
          <Summary
            number={stats.all}
            label="Total"
          />

          <Summary
            number={stats.follow_up}
            label="Follow Up"
          />

          <Summary
            number={stats.converted}
            label="Converted"
          />
        </View>

        <View
          style={styles.searchBox}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#6B7280"
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search connections"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={styles.filters}
        >
          {[
            'all',
            'new',
            'pending',
            'interested',
            'follow_up',
            'in_progress',
            'converted',
            'dead',
          ].map((stage) => (
            <TouchableOpacity
              key={stage}
              onPress={() =>
                setSelectedStage(stage)
              }
              style={[
                styles.filterChip,
                selectedStage ===
                  stage &&
                  styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedStage ===
                    stage &&
                    styles.filterTextActive,
                ]}
              >
                {stage === 'all'
                  ? 'All'
                  : STAGE_LABELS[
                      stage
                    ]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text
          style={styles.sectionTitle}
        >
          LEADS ({filtered.length})
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="people-outline"
              size={46}
              color="#9CA3AF"
            />

            <Text
              style={styles.emptyTitle}
            >
              No connections yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              Leads captured from your
              digital card will appear here.
            </Text>

            <TouchableOpacity
              style={
                styles.emptyButton
              }
              onPress={() =>
                setModalVisible(true)
              }
            >
              <Text
                style={
                  styles.emptyButtonText
                }
              >
                Add Test Lead
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.leadCard}
              onPress={() =>
                navigation.navigate(
                  'LeadDetail',
                  {
                    connectionId:
                      item.id,
                  }
                )
              }
            >
              <View
                style={styles.avatar}
              >
                <Text
                  style={
                    styles.avatarText
                  }
                >
                  {item.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    'L'}
                </Text>
              </View>

              <View
                style={
                  styles.leadContent
                }
              >
                <Text
                  style={
                    styles.leadName
                  }
                >
                  {item.name}
                </Text>

                <Text
                  style={
                    styles.leadCompany
                  }
                >
                  {item.company ||
                    item.phone ||
                    item.email ||
                    'No details'}
                </Text>

                <View
                  style={
                    styles.stageBadge
                  }
                >
                  <Text
                    style={
                      styles.stageText
                    }
                  >
                    {STAGE_LABELS[
                      item.stage
                    ] || item.stage}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.actions
                }
              >
                {item.phone ? (
                  <>
                    <TouchableOpacity
                      style={
                        styles.actionIcon
                      }
                      onPress={() =>
                        whatsapp(
                          item.phone
                        )
                      }
                    >
                      <Ionicons
                        name="logo-whatsapp"
                        size={19}
                        color="#111827"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.actionIcon
                      }
                      onPress={() =>
                        call(
                          item.phone
                        )
                      }
                    >
                      <Ionicons
                        name="call-outline"
                        size={19}
                        color="#111827"
                      />
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View
          style={styles.modalOverlay}
        >
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
                Add Connection
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

            <LeadInput
              placeholder="Name *"
              value={form.name}
              onChangeText={(value) =>
                change('name', value)
              }
            />

            <LeadInput
              placeholder="Phone"
              value={form.phone}
              onChangeText={(value) =>
                change('phone', value)
              }
              keyboardType="phone-pad"
            />

            <LeadInput
              placeholder="Email"
              value={form.email}
              onChangeText={(value) =>
                change('email', value)
              }
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <LeadInput
              placeholder="Company"
              value={form.company}
              onChangeText={(value) =>
                change(
                  'company',
                  value
                )
              }
            />

            <LeadInput
              placeholder="Requirement / enquiry"
              value={
                form.requirement
              }
              onChangeText={(value) =>
                change(
                  'requirement',
                  value
                )
              }
              multiline
            />

            <TouchableOpacity
              style={
                styles.modalSave
              }
              onPress={addConnection}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.modalSaveText
                  }
                >
                  Add Connection
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Summary({ number, label }) {
  return (
    <View style={styles.summary}>
      <Text style={styles.summaryNumber}>
        {number}
      </Text>
      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function LeadInput(props) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#9CA3AF"
      style={[
        styles.modalInput,
        props.multiline &&
          styles.modalMultiline,
      ]}
    />
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

  container: {
    padding: 18,
    paddingBottom: 110,
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },

  subtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 3,
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 22,
  },

  summary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
  },

  summaryNumber: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111827',
  },

  summaryLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 3,
  },

  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 9,
    color: '#111827',
  },

  filters: {
    marginTop: 14,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },

  filterChipActive: {
    backgroundColor: '#111827',
  },

  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#6B7280',
    fontWeight: '800',
    marginTop: 25,
    marginBottom: 10,
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    marginTop: 11,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },

  emptyButton: {
    marginTop: 18,
    backgroundColor: '#111827',
    borderRadius: 13,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },

  leadContent: {
    flex: 1,
  },

  leadName: {
    fontWeight: '800',
    fontSize: 14,
    color: '#111827',
  },

  leadCompany: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },

  stageBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },

  stageText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4B5563',
  },

  actions: {
    gap: 7,
  },

  actionIcon: {
    width: 35,
    height: 35,
    backgroundColor: '#F3F4F6',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOverlay: {
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
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
  },

  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 10,
    color: '#111827',
  },

  modalMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  modalSave: {
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },

  modalSaveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});

