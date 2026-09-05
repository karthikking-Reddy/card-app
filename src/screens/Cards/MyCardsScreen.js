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

import { getCurrentSession } from '../../services/authService';

import { createCard, deleteCard, getCards, setPrimaryCard } from '../../services/cardService';

import ApprovalStatusBadge from '../../components/ApprovalStatusBadge';
import ApprovalRequiredModal from '../../components/ApprovalRequiredModal';

export default function MyCardsScreen({ navigation }) {
  const [user, setUser] = useState(null);

  const [cards, setCards] = useState([]);

  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);

  const [name, setName] = useState('');

  const [designation, setDesignation] = useState('');

  const [company, setCompany] = useState('');

  const [approvalCard, setApprovalCard] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const session = await getCurrentSession();

      if (!session?.user) {
        return;
      }

      setUser(session.user);

      const data = await getCards(session.user.id);

      setCards(data);
    } catch (error) {
      Alert.alert('Unable to load cards', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function makePrimary(cardId) {
    try {
      await setPrimaryCard(user.id, cardId);

      await load();
    } catch (error) {
      Alert.alert('Unable to switch card', error.message);
    }
  }

  async function editCard(card) {
    try {
      if (!card.is_primary) {
        await setPrimaryCard(user.id, card.id);
      }

      navigation.navigate('CardEditor');
    } catch (error) {
      Alert.alert('Unable to open card', error.message);
    }
  }

  async function addCard() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a card name.');

      return;
    }

    setCreating(true);

    try {
      const newCard = await createCard(user.id, {
        name: name.trim(),

        designation: designation.trim(),

        company: company.trim(),
      });

      await setPrimaryCard(user.id, newCard.id);

      setName('');
      setDesignation('');
      setCompany('');

      setModalVisible(false);

      await load();

      navigation.navigate('CardEditor');
    } catch (error) {
      Alert.alert('Unable to create card', error.message);
    } finally {
      setCreating(false);
    }
  }

  function confirmDelete(card) {
    Alert.alert('Delete Card', `Delete "${card.name}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCard(user.id, card.id);

            await load();
          } catch (error) {
            Alert.alert('Unable to delete card', error.message);
          }
        },
      },
    ]);
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

        <Text style={styles.headerTitle}>My Cards</Text>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={27} color="#F6B91A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.help}>
          Create multiple digital cards and choose which one is your primary card.
        </Text>

        {cards.map((card) => (
          <View key={card.id} style={[styles.card, card.is_primary && styles.primaryCard]}>
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>{card.name?.charAt(0)?.toUpperCase() || 'Y'}</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.name}>{card.name}</Text>

                <Text style={styles.designation}>{card.designation || 'Digital Card'}</Text>

                <Text style={styles.company}>{card.company || ''}</Text>
              </View>

              {card.is_primary ? (
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.slug}>/card/{card.card_slug}</Text>

            <View style={styles.statusRow}>
              <ApprovalStatusBadge status={card.approval_status} compact />

              <Status active={card.is_active} text={card.is_active ? 'Active' : 'Inactive'} />

              <Status active={card.is_public} text={card.is_public ? 'Public' : 'Private'} />

              <Status active text={card.theme || 'standard'} />
            </View>

            {card.approval_status === 'pending' ? (
              <Text style={styles.approvalMessage}>
                Your card is waiting for administrator approval.
              </Text>
            ) : null}

            {card.approval_status === 'rejected' && card.rejection_reason ? (
              <View style={styles.rejectionBox}>
                <Text style={styles.rejectionLabel}>Rejection reason:</Text>
                <Text style={styles.rejectionText}>{card.rejection_reason}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={() => editCard(card)}>
                <Ionicons name="create-outline" size={18} color="#06162D" />

                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>

              {card.approval_status === 'draft' || card.approval_status === 'rejected' ? (
                <TouchableOpacity
                  style={styles.approvalButton}
                  onPress={() => setApprovalCard(card)}
                >
                  <Ionicons name="shield-checkmark-outline" size={18} color="#06162D" />
                  <Text style={styles.approvalButtonText}>
                    {card.approval_status === 'rejected' ? 'Request Again' : 'Request Approval'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {!card.is_primary ? (
                <TouchableOpacity style={styles.actionButton} onPress={() => makePrimary(card.id)}>
                  <Ionicons name="star-outline" size={18} color="#06162D" />

                  <Text style={styles.actionText}>Set Primary</Text>
                </TouchableOpacity>
              ) : null}

              {cards.length > 1 ? (
                <TouchableOpacity style={styles.deleteButton} onPress={() => confirmDelete(card)}>
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.newCard} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={25} color="#06162D" />

          <Text style={styles.newCardText}>Add New Digital Card</Text>
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
              <Text style={styles.modalTitle}>Create Card</Text>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color="#06162D" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Card / person name *"
              placeholderTextColor="#98A2B3"
            />

            <TextInput
              style={styles.input}
              value={designation}
              onChangeText={setDesignation}
              placeholder="Designation"
              placeholderTextColor="#98A2B3"
            />

            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Company"
              placeholderTextColor="#98A2B3"
            />

            <TouchableOpacity style={styles.createButton} onPress={addCard} disabled={creating}>
              {creating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Card</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ApprovalRequiredModal
        visible={Boolean(approvalCard)}
        card={approvalCard}
        onClose={() => setApprovalCard(null)}
        onUpdated={load}
        onEdit={() => {
          const selected = approvalCard;
          setApprovalCard(null);
          if (selected) editCard(selected);
        }}
      />
    </SafeAreaView>
  );
}

function Status({ active, text }) {
  return (
    <View style={styles.status}>
      <View style={[styles.statusDot, !active && styles.statusDotInactive]} />

      <Text style={styles.statusText}>{text}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
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

  headerTitle: {
    fontSize: 18,

    fontWeight: '900',

    color: '#FFFFFF',

    letterSpacing: 0.1,
  },

  container: {
    padding: 16,
    paddingBottom: 60,
  },

  help: {
    color: '#667085',
    lineHeight: 20,
    marginBottom: 15,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    padding: 17,
    marginBottom: 12,
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

  primaryCard: {
    borderColor: '#F6B91A',

    backgroundColor: '#FFFCF3',

    borderWidth: 1.5,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#06162D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  initial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: '900',
    color: '#06162D',
  },

  designation: {
    color: '#667085',
    fontSize: 11,
    marginTop: 2,
  },

  company: {
    color: '#06162D',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  primaryBadge: {
    backgroundColor: '#FFF4D6',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  primaryBadgeText: {
    color: '#C98B16',
    fontSize: 8,
    fontWeight: '900',
  },

  slug: {
    color: '#98A2B3',
    fontSize: 10,
    marginTop: 14,
  },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 11,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F5F7FB',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },

  statusDotInactive: {
    backgroundColor: '#98A2B3',
  },

  statusText: {
    fontSize: 9,
    color: '#667085',
    textTransform: 'capitalize',
  },

  approvalMessage: {
    color: '#B7791F',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 10,
    fontWeight: '700',
  },
  rejectionBox: { backgroundColor: '#FEF2F2', borderRadius: 11, padding: 10, marginTop: 10 },
  rejectionLabel: { color: '#991B1B', fontSize: 9, fontWeight: '900' },
  rejectionText: { color: '#7F1D1D', fontSize: 10, lineHeight: 15, marginTop: 3 },
  approvalButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#FFF4D6',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
  },
  approvalButtonText: { color: '#06162D', fontSize: 9, fontWeight: '900' },

  actions: {
    borderTopWidth: 1,
    borderTopColor: '#F5F7FB',
    marginTop: 14,
    paddingTop: 13,
    flexDirection: 'row',
    gap: 8,
  },

  actionButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },

  actionText: {
    color: '#06162D',
    fontWeight: '700',
    fontSize: 10,
  },

  deleteButton: {
    marginLeft: 'auto',
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newCard: {
    borderWidth: 1.5,

    borderStyle: 'dashed',

    borderColor: '#F6B91A',

    backgroundColor: '#FFFCF3',

    borderRadius: 20,

    padding: 22,

    flexDirection: 'row',

    gap: 8,

    justifyContent: 'center',

    alignItems: 'center',
  },

  newCardText: {
    color: '#06162D',
    fontWeight: '800',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#06162D',
  },

  input: {
    borderWidth: 1,
    borderColor: '#E6EAF0',
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    padding: 13,
    marginBottom: 10,
    color: '#06162D',
  },

  createButton: {
    backgroundColor: '#06162D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 5,
  },

  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
