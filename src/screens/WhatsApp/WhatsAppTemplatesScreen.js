import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
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

import {
  createDefaultWhatsAppTemplates,
  createWhatsAppTemplate,
  deleteWhatsAppTemplate,
  getWhatsAppTemplates,
  toggleWhatsAppTemplate,
  updateWhatsAppTemplate,
} from '../../services/whatsappTemplateService';

export default function WhatsAppTemplatesScreen({ navigation }) {
  const [templates, setTemplates] = useState([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState('');

  const [body, setBody] = useState('');

  const [category, setCategory] = useState('utility');
  const [editingTemplate, setEditingTemplate] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await getWhatsAppTemplates();

      setTemplates(data);
    } catch (error) {
      Alert.alert('Unable to load templates', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function addDefaults() {
    setSaving(true);

    try {
      const data = await createDefaultWhatsAppTemplates();

      setTemplates(data);

      Alert.alert('Quick Messages ready', 'Default YNS Quick Messages have been created.');
    } catch (error) {
      Alert.alert('Unable to create templates', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function createTemplate() {
    if (!name.trim() || !body.trim()) {
      Alert.alert('Missing information', 'Enter a template name and message.');

      return;
    }

    setSaving(true);

    try {
      if (editingTemplate) {
        await updateWhatsAppTemplate(editingTemplate.id, {
          name: name.trim(),
          body: body.trim(),
        });
      } else {
        await createWhatsAppTemplate({ name, body, category, language: 'en' });
      }

      setName('');
      setBody('');
      setCategory('utility');
      setEditingTemplate(null);

      setModalVisible(false);

      await load();
    } catch (error) {
      Alert.alert('Unable to create template', error.message);
    } finally {
      setSaving(false);
    }
  }

  function editTemplate(template) {
    setEditingTemplate(template);
    setName(template.name || '');
    setBody(template.body || '');
    setCategory(template.category || 'utility');
    setModalVisible(true);
  }

  function closeEditor() {
    setModalVisible(false);
    setEditingTemplate(null);
    setName('');
    setBody('');
  }

  function confirmDelete(template) {
    Alert.alert('Delete Template', `Delete "${template.name}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },

      {
        text: 'Delete',
        style: 'destructive',

        onPress: async () => {
          try {
            await deleteWhatsAppTemplate(template.id);

            await load();
          } catch (error) {
            Alert.alert('Unable to delete', error.message);
          }
        },
      },
    ]);
  }

  async function toggle(template) {
    try {
      await toggleWhatsAppTemplate(template);

      await load();
    } catch (error) {
      Alert.alert('Unable to update', error.message);
    }
  }

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

        <View
          style={{
            flex: 1,
          }}
        >
          <Text style={styles.title}>Quick Messages</Text>

          <Text style={styles.subtitle}>Personal reusable WhatsApp messages</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={25} color="#06162D" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="document-text-outline" size={30} color="#16A34A" />
          </View>

          <Text style={styles.heroTitle}>Basic WhatsApp Quick Messages</Text>

          <Text style={styles.heroText}>
            These personal messages open through standard WhatsApp links. Opening WhatsApp does not
            confirm that a message was sent or delivered.
          </Text>
        </View>

        {templates.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={38} color="#98A2B3" />

            <Text style={styles.emptyTitle}>No Quick Messages yet</Text>

            <Text style={styles.emptyText}>Create one or start with safe YNS examples.</Text>

            <TouchableOpacity style={styles.defaultButton} onPress={addDefaults} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="sparkles-outline" size={19} color="#FFFFFF" />

                  <Text style={styles.defaultText}>Create YNS Quick Messages</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summary}>
              <SummaryItem value={templates.length} label="Quick Messages" />

              <SummaryItem
                value={templates.filter((item) => item.is_active).length}
                label="Active"
              />

              <SummaryItem value="Basic" label="WhatsApp mode" />
            </View>

            <Text style={styles.sectionLabel}>YOUR QUICK MESSAGES</Text>

            {templates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateIcon}>
                    <Ionicons name="logo-whatsapp" size={21} color="#16A34A" />
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.templateName}>{template.name}</Text>

                    <View style={styles.badgeRow}>
                      <Badge text={template.category} />
                    </View>
                  </View>
                </View>

                <View style={styles.messagePreview}>
                  <Text style={styles.messageText}>{template.body}</Text>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.action} onPress={() => editTemplate(template)}>
                    <Ionicons name="create-outline" size={18} color="#06162D" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.action}
                    onPress={() =>
                      Alert.alert(
                        'Use Quick Message',
                        'Open a lead and tap WhatsApp to use this message with safe contact and card details.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Open Leads',
                            onPress: () =>
                              navigation.navigate('MainTabs', { screen: 'Connections' }),
                          },
                        ]
                      )
                    }
                  >
                    <Ionicons name="send-outline" size={18} color="#06162D" />
                    <Text style={styles.actionText}>Use</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.action} onPress={() => toggle(template)}>
                    <Ionicons
                      name={template.is_active ? 'pause-outline' : 'play-outline'}
                      size={18}
                      color="#06162D"
                    />

                    <Text style={styles.actionText}>
                      {template.is_active ? 'Disable' : 'Enable'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.action} onPress={() => confirmDelete(template)}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />

                    <Text
                      style={[
                        styles.actionText,
                        {
                          color: '#DC2626',
                        },
                      ]}
                    >
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeEditor}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTemplate ? 'Edit Quick Message' : 'New Quick Message'}
              </Text>

              <TouchableOpacity onPress={closeEditor}>
                <Ionicons name="close" size={26} color="#06162D" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>QUICK MESSAGE NAME</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Example: Quotation Follow Up"
              style={styles.input}
            />

            {!editingTemplate ? <Text style={styles.label}>CATEGORY</Text> : null}

            {!editingTemplate ? (
              <View style={styles.categoryRow}>
                {['utility', 'marketing', 'authentication'].map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setCategory(item)}
                    style={[
                      styles.categoryButton,
                      category === item && styles.categoryButtonActive,
                    ]}
                  >
                    <Text
                      style={[styles.categoryText, category === item && styles.categoryTextActive]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>MESSAGE</Text>

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Enter WhatsApp message..."
              multiline
              style={[styles.input, styles.messageInput]}
            />

            <Text style={styles.variableHelp}>
              Use {'{{1}}'}, {'{{2}}'}
              for variables such as customer name or meeting date.
            </Text>

            <TouchableOpacity style={styles.saveButton} onPress={createTemplate} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveText}>Save Quick Message</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SummaryItem({ value, label }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function Badge({ text }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{String(text || '').toUpperCase()}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7FB',

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

  title: {
    color: '#FFFFFF',

    fontSize: 18,

    fontWeight: '900',
  },

  subtitle: {
    color: '#D0D5DD',

    fontSize: 9,

    marginTop: 2,
  },

  addButton: {
    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor: '#F6B91A',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#FFD36A',
  },

  container: {
    padding: 18,
    paddingBottom: 100,
  },

  hero: {
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
  },

  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroTitle: {
    color: '#06162D',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
  },

  heroText: {
    color: '#667085',
    fontSize: 9,
    lineHeight: 15,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 6,
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 30,
    alignItems: 'center',
    marginTop: 14,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  emptyTitle: {
    color: '#06162D',
    fontWeight: '900',
    fontSize: 16,
    marginTop: 10,
  },

  emptyText: {
    color: '#667085',
    fontSize: 9,
    marginTop: 5,
  },

  defaultButton: {
    backgroundColor: '#06162D',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 18,

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  defaultText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 11,
  },

  summary: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  summaryItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,

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
    fontWeight: '900',
    fontSize: 20,
  },

  summaryLabel: {
    color: '#667085',
    fontSize: 8,
    marginTop: 3,
  },

  sectionLabel: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 23,
    marginBottom: 9,
  },

  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    padding: 15,
    marginBottom: 10,

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

  templateHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },

  templateIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  templateName: {
    color: '#06162D',
    fontSize: 13,
    fontWeight: '900',
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 5,
  },

  badge: {
    backgroundColor: '#F5F7FB',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  badgeText: {
    color: '#667085',
    fontSize: 6,
    fontWeight: '900',
  },

  messagePreview: {
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    padding: 12,
    marginTop: 12,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  messageText: {
    color: '#344054',
    fontSize: 10,
    lineHeight: 16,
  },

  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F5F7FB',
    marginTop: 12,
    paddingTop: 10,
    gap: 18,
  },

  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  actionText: {
    color: '#06162D',
    fontSize: 9,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
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
    marginBottom: 15,
  },

  modalTitle: {
    color: '#06162D',
    fontSize: 20,
    fontWeight: '900',
  },

  label: {
    color: '#667085',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#F5F7FB',
    borderRadius: 13,
    paddingHorizontal: 13,
    minHeight: 47,
    color: '#06162D',
    fontSize: 11,
  },

  messageInput: {
    minHeight: 110,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  categoryRow: {
    flexDirection: 'row',
    gap: 6,
  },

  categoryButton: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    borderRadius: 11,
    paddingVertical: 10,
    alignItems: 'center',
  },

  categoryButtonActive: {
    backgroundColor: '#06162D',
  },

  categoryText: {
    color: '#667085',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'capitalize',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  variableHelp: {
    color: '#98A2B3',
    fontSize: 8,
    lineHeight: 13,
    marginTop: 7,
  },

  saveButton: {
    backgroundColor: '#06162D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
