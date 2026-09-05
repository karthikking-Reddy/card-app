import { useCallback, useMemo, useState } from 'react';

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
  getWhatsAppMessages,
  markConversationRead,
  updateConversationStatus,
} from '../../services/whatsappService';

import {
  createLeadFromWhatsApp,
  getAvailableCrmLeads,
  getLinkedCrmLead,
  linkConversationToLead,
  unlinkConversationFromLead,
} from '../../services/whatsappCrmService';

export default function WhatsAppChatScreen({ navigation, route }) {
  const initialConversation = route.params?.conversation;

  const [conversation, setConversation] = useState(initialConversation);

  const [messages, setMessages] = useState([]);

  const [linkedLead, setLinkedLead] = useState(null);

  const [crmLeads, setCrmLeads] = useState([]);

  const [loading, setLoading] = useState(true);

  const [crmLoading, setCrmLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!conversation?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const messageData = await getWhatsAppMessages(conversation.id);

      setMessages(messageData);

      if (conversation.connection_id) {
        const lead = await getLinkedCrmLead(conversation.connection_id);

        setLinkedLead(lead);
      } else {
        setLinkedLead(null);
      }

      if (conversation.unread_count > 0) {
        await markConversationRead(conversation.id);
      }
    } catch (error) {
      Alert.alert('Unable to load chat', error.message);
    } finally {
      setLoading(false);
    }
  }, [conversation?.id, conversation?.connection_id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return crmLeads;
    }

    return crmLeads.filter(
      (lead) =>
        String(lead.name || '')
          .toLowerCase()
          .includes(term) ||
        String(lead.phone || '')
          .toLowerCase()
          .includes(term) ||
        String(lead.email || '')
          .toLowerCase()
          .includes(term)
    );
  }, [crmLeads, search]);

  async function openCrmLinker() {
    setCrmLoading(true);

    try {
      const leads = await getAvailableCrmLeads();

      setCrmLeads(leads);

      setModalVisible(true);
    } catch (error) {
      Alert.alert('Unable to load CRM', error.message);
    } finally {
      setCrmLoading(false);
    }
  }

  async function selectLead(lead) {
    setCrmLoading(true);

    try {
      const updated = await linkConversationToLead(conversation.id, lead.id);

      setConversation((current) => ({
        ...current,
        connection_id: updated.connection_id,
      }));

      setLinkedLead(lead);

      setModalVisible(false);

      Alert.alert('CRM Linked', `WhatsApp conversation linked to ${lead.name || 'CRM lead'}.`);
    } catch (error) {
      Alert.alert('Unable to link CRM', error.message);
    } finally {
      setCrmLoading(false);
    }
  }

  async function createCrmLead() {
    setCrmLoading(true);

    try {
      const result = await createLeadFromWhatsApp(conversation);

      setLinkedLead(result.lead);

      setConversation((current) => ({
        ...current,
        connection_id: result.lead.id,
      }));

      setModalVisible(false);

      Alert.alert(
        result.created ? 'CRM Lead Created' : 'Existing Lead Found',

        result.created
          ? 'WhatsApp contact has been added to YNS CRM.'
          : 'An existing CRM lead with this phone number was found and linked.'
      );
    } catch (error) {
      Alert.alert('Unable to create lead', error.message);
    } finally {
      setCrmLoading(false);
    }
  }

  function confirmUnlink() {
    Alert.alert('Unlink CRM Lead', 'Remove the CRM link from this WhatsApp conversation?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },

      {
        text: 'Unlink',
        style: 'destructive',

        onPress: async () => {
          try {
            await unlinkConversationFromLead(conversation.id);

            setLinkedLead(null);

            setConversation((current) => ({
              ...current,
              connection_id: null,
            }));
          } catch (error) {
            Alert.alert('Unable to unlink', error.message);
          }
        },
      },
    ]);
  }

  async function changeStatus() {
    try {
      const next = conversation.status === 'closed' ? 'open' : 'closed';

      await updateConversationStatus(conversation.id, next);

      setConversation((current) => ({
        ...current,
        status: next,
      }));

      Alert.alert('Updated', next === 'closed' ? 'Conversation closed.' : 'Conversation reopened.');
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

  if (!conversation?.id) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.contactName}>WhatsApp Chat</Text>
          <View style={{ width: 25 }} />
        </View>
        <View style={styles.empty}>
          <Ionicons name="alert-circle-outline" size={38} color="#98A2B3" />
          <Text style={styles.emptyTitle}>Conversation unavailable</Text>
          <Text style={styles.crmMeta}>Return to the inbox and select a conversation.</Text>
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

        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={21} color="#16A34A" />
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text style={styles.contactName}>{conversation.contact_name || conversation.phone}</Text>

          <Text style={styles.phone}>{conversation.phone}</Text>
        </View>

        <TouchableOpacity onPress={changeStatus} style={styles.actionButton}>
          <Ionicons
            name={conversation.status === 'closed' ? 'refresh-outline' : 'checkmark-outline'}
            size={20}
            color="#06162D"
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.messages}>
        <View style={styles.crmCard}>
          <View style={styles.crmIcon}>
            <Ionicons name="people-outline" size={21} color="#06162D" />
          </View>

          <View
            style={{
              flex: 1,
            }}
          >
            <Text style={styles.crmLabel}>CRM CONNECTION</Text>

            {linkedLead ? (
              <>
                <Text style={styles.crmName}>{linkedLead.name || 'CRM Lead'}</Text>

                <Text style={styles.crmMeta}>
                  {linkedLead.phone || linkedLead.email || 'Linked lead'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.crmName}>Not linked</Text>

                <Text style={styles.crmMeta}>Link this chat to your YNS CRM.</Text>
              </>
            )}
          </View>

          {linkedLead ? (
            <TouchableOpacity style={styles.unlinkButton} onPress={confirmUnlink}>
              <Ionicons name="unlink-outline" size={19} color="#DC2626" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.linkButton}
              onPress={openCrmLinker}
              disabled={crmLoading}
            >
              {crmLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.linkButtonText}>LINK</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={34} color="#98A2B3" />

            <Text style={styles.emptyTitle}>No messages yet</Text>
          </View>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
      </ScrollView>

      <View style={styles.composer}>
        <View style={styles.disabledInput}>
          <Text style={styles.disabledText}>
            Messaging becomes available after WhatsApp Cloud API connection
          </Text>
        </View>

        <View style={styles.sendButton}>
          <Ionicons name="send" size={19} color="#FFFFFF" />
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Link CRM Lead</Text>

                <Text style={styles.modalSubtitle}>{conversation.phone}</Text>
              </View>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color="#06162D" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.createLeadButton}
              onPress={createCrmLead}
              disabled={crmLoading}
            >
              <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.createLeadTitle}>Create CRM Lead</Text>

                <Text style={styles.createLeadSubtitle}>
                  Automatically create or match by phone number
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={19} color="#98A2B3" />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search CRM leads"
                placeholderTextColor="#98A2B3"
                style={styles.searchInput}
              />
            </View>

            <Text style={styles.modalSection}>EXISTING CRM LEADS</Text>

            <ScrollView
              style={{
                maxHeight: 330,
              }}
            >
              {filteredLeads.length === 0 ? (
                <Text style={styles.noLeadText}>No CRM leads found.</Text>
              ) : (
                filteredLeads.map((lead) => (
                  <TouchableOpacity
                    key={lead.id}
                    style={styles.leadRow}
                    onPress={() => selectLead(lead)}
                  >
                    <View style={styles.leadAvatar}>
                      <Text style={styles.leadAvatarText}>
                        {getInitials(lead.name || lead.phone)}
                      </Text>
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text style={styles.leadName}>{lead.name || 'CRM Lead'}</Text>

                      <Text style={styles.leadMeta}>
                        {lead.phone || lead.email || 'No contact'}
                      </Text>
                    </View>

                    <View style={styles.stageBadge}>
                      <Text style={styles.stageText}>{formatStage(lead.stage)}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MessageBubble({ message }) {
  const outbound = message.direction === 'outbound';

  return (
    <View style={[styles.messageRow, outbound && styles.messageRowOutbound]}>
      <View style={[styles.bubble, outbound && styles.bubbleOutbound]}>
        <Text style={styles.messageText}>{message.body || `[${message.message_type}]`}</Text>

        <Text style={styles.messageTime}>{formatTime(message.sent_at || message.created_at)}</Text>
      </View>
    </View>
  );
}

function getInitials(value) {
  return String(value || 'CRM')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function formatStage(value) {
  return String(value || 'new')
    .replace(/_/g, ' ')
    .toUpperCase();
}

function formatTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
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

  avatar: {
    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor: 'rgba(22,163,74,0.14)',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#16A34A',
  },

  contactName: {
    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '900',
  },

  phone: {
    color: '#D0D5DD',

    fontSize: 8,

    marginTop: 2,
  },

  actionButton: {
    width: 40,

    height: 40,

    borderRadius: 13,

    backgroundColor: '#FFF4D6',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  messages: {
    padding: 15,
    paddingBottom: 100,
    flexGrow: 1,
  },

  crmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,

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

  crmIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#F5F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  crmLabel: {
    color: '#98A2B3',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1,
  },

  crmName: {
    color: '#06162D',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },

  crmMeta: {
    color: '#667085',
    fontSize: 8,
    marginTop: 2,
  },

  linkButton: {
    backgroundColor: '#06162D',
    minWidth: 58,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  linkButtonText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },

  unlinkButton: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: '#667085',
    marginTop: 8,
    fontWeight: '800',
  },

  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },

  messageRowOutbound: {
    justifyContent: 'flex-end',
  },

  bubble: {
    maxWidth: '82%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,

    borderWidth: 1,

    borderColor: '#E6EAF0',

    shadowColor: '#06162D',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.045,

    shadowRadius: 10,

    elevation: 2,
  },

  bubbleOutbound: {
    backgroundColor: '#DCFCE7',

    borderWidth: 1,

    borderColor: '#BBF7D0',
  },

  messageText: {
    color: '#06162D',
    fontSize: 12,
    lineHeight: 18,
  },

  messageTime: {
    color: '#98A2B3',
    fontSize: 7,
    marginTop: 4,
    alignSelf: 'flex-end',
  },

  composer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6EAF0',
  },

  disabledInput: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#F5F7FB',
    borderRadius: 15,
    paddingHorizontal: 13,
    justifyContent: 'center',
  },

  disabledText: {
    color: '#98A2B3',
    fontSize: 9,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.45,
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
    marginBottom: 16,
  },

  modalTitle: {
    color: '#06162D',
    fontSize: 20,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: '#667085',
    fontSize: 9,
    marginTop: 2,
  },

  createLeadButton: {
    backgroundColor: '#06162D',
    borderRadius: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,

    borderWidth: 1,

    borderColor: '#F6B91A',
  },

  createLeadTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  createLeadSubtitle: {
    color: '#D0D5DD',
    fontSize: 8,
    marginTop: 2,
  },

  searchBox: {
    marginTop: 13,
    backgroundColor: '#F5F7FB',
    borderRadius: 14,
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },

  searchInput: {
    flex: 1,
    color: '#06162D',
    fontSize: 11,
  },

  modalSection: {
    color: '#667085',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },

  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FB',
  },

  leadAvatar: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#ECFDF3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  leadAvatarText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '900',
  },

  leadName: {
    color: '#06162D',
    fontSize: 11,
    fontWeight: '900',
  },

  leadMeta: {
    color: '#667085',
    fontSize: 8,
    marginTop: 3,
  },

  stageBadge: {
    backgroundColor: '#F5F7FB',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },

  stageText: {
    color: '#667085',
    fontSize: 6,
    fontWeight: '900',
  },

  noLeadText: {
    color: '#98A2B3',
    textAlign: 'center',
    paddingVertical: 25,
    fontSize: 10,
  },
});
