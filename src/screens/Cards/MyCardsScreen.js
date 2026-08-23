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
  createCard,
  deleteCard,
  getCards,
  setPrimaryCard,
} from '../../services/cardService';

export default function MyCardsScreen({
  navigation,
}) {
  const [user, setUser] =
    useState(null);

  const [cards, setCards] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [modalVisible, setModalVisible] =
    useState(false);

  const [name, setName] =
    useState('');

  const [designation, setDesignation] =
    useState('');

  const [company, setCompany] =
    useState('');

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
          await getCards(
            session.user.id
          );

        setCards(data);
      } catch (error) {
        Alert.alert(
          'Unable to load cards',
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

  async function makePrimary(
    cardId
  ) {
    try {
      await setPrimaryCard(
        user.id,
        cardId
      );

      await load();
    } catch (error) {
      Alert.alert(
        'Unable to switch card',
        error.message
      );
    }
  }

  async function editCard(card) {
    try {
      if (!card.is_primary) {
        await setPrimaryCard(
          user.id,
          card.id
        );
      }

      navigation.navigate(
        'CardEditor'
      );
    } catch (error) {
      Alert.alert(
        'Unable to open card',
        error.message
      );
    }
  }

  async function addCard() {
    if (!name.trim()) {
      Alert.alert(
        'Required',
        'Please enter a card name.'
      );

      return;
    }

    setCreating(true);

    try {
      const newCard =
        await createCard(
          user.id,
          {
            name: name.trim(),

            designation:
              designation.trim(),

            company:
              company.trim(),
          }
        );

      await setPrimaryCard(
        user.id,
        newCard.id
      );

      setName('');
      setDesignation('');
      setCompany('');

      setModalVisible(false);

      await load();

      navigation.navigate(
        'CardEditor'
      );
    } catch (error) {
      Alert.alert(
        'Unable to create card',
        error.message
      );
    } finally {
      setCreating(false);
    }
  }

  function confirmDelete(card) {
    Alert.alert(
      'Delete Card',
      `Delete "${card.name}"?`,
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
              await deleteCard(
                user.id,
                card.id
              );

              await load();
            } catch (error) {
              Alert.alert(
                'Unable to delete card',
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

        <Text style={styles.headerTitle}>
          My Cards
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
          Create multiple digital cards and choose which one is your primary card.
        </Text>

        {cards.map((card) => (
          <View
            key={card.id}
            style={[
              styles.card,
              card.is_primary &&
                styles.primaryCard,
            ]}
          >
            <View style={styles.cardTop}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>
                  {card.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    'Y'}
                </Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.name}>
                  {card.name}
                </Text>

                <Text
                  style={styles.designation}
                >
                  {card.designation ||
                    'Digital Card'}
                </Text>

                <Text
                  style={styles.company}
                >
                  {card.company || ''}
                </Text>
              </View>

              {card.is_primary ? (
                <View
                  style={styles.primaryBadge}
                >
                  <Text
                    style={
                      styles.primaryBadgeText
                    }
                  >
                    PRIMARY
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.slug}>
              /card/{card.card_slug}
            </Text>

            <View style={styles.statusRow}>
              <Status
                active={card.is_active}
                text={
                  card.is_active
                    ? 'Active'
                    : 'Inactive'
                }
              />

              <Status
                active={card.is_public}
                text={
                  card.is_public
                    ? 'Public'
                    : 'Private'
                }
              />

              <Status
                active
                text={
                  card.theme ||
                  'standard'
                }
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  editCard(card)
                }
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color="#111827"
                />

                <Text
                  style={
                    styles.actionText
                  }
                >
                  Edit
                </Text>
              </TouchableOpacity>

              {!card.is_primary ? (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    makePrimary(card.id)
                  }
                >
                  <Ionicons
                    name="star-outline"
                    size={18}
                    color="#111827"
                  />

                  <Text
                    style={
                      styles.actionText
                    }
                  >
                    Set Primary
                  </Text>
                </TouchableOpacity>
              ) : null}

              {cards.length > 1 ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() =>
                    confirmDelete(card)
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#DC2626"
                  />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.newCard}
          onPress={() =>
            setModalVisible(true)
          }
        >
          <Ionicons
            name="add"
            size={25}
            color="#111827"
          />

          <Text style={styles.newCardText}>
            Add New Digital Card
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
              style={styles.modalHeader}
            >
              <Text
                style={styles.modalTitle}
              >
                Create Card
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalVisible(false)
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
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Card / person name *"
              placeholderTextColor="#9CA3AF"
            />

            <TextInput
              style={styles.input}
              value={designation}
              onChangeText={setDesignation}
              placeholder="Designation"
              placeholderTextColor="#9CA3AF"
            />

            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="Company"
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={addCard}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  Create Card
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Status({
  active,
  text,
}) {
  return (
    <View style={styles.status}>
      <View
        style={[
          styles.statusDot,
          !active &&
            styles.statusDotInactive,
        ]}
      />

      <Text style={styles.statusText}>
        {text}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },

  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    paddingBottom: 60,
  },

  help: {
    color: '#6B7280',
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
  },

  primaryCard: {
    borderColor: '#D4A94E',
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#111827',
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
    color: '#111827',
  },

  designation: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },

  company: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },

  primaryBadge: {
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  primaryBadgeText: {
    color: '#B7791F',
    fontSize: 8,
    fontWeight: '900',
  },

  slug: {
    color: '#9CA3AF',
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#9CA3AF',
  },

  statusText: {
    fontSize: 9,
    color: '#6B7280',
    textTransform: 'capitalize',
  },

  actions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 14,
    paddingTop: 13,
    flexDirection: 'row',
    gap: 8,
  },

  actionButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },

  actionText: {
    color: '#111827',
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
    borderColor: '#9CA3AF',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  newCardText: {
    color: '#111827',
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
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    padding: 20,
    paddingBottom: 35,
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
    color: '#111827',
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 13,
    padding: 13,
    marginBottom: 10,
    color: '#111827',
  },

  createButton: {
    backgroundColor: '#111827',
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
