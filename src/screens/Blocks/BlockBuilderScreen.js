import {
  useCallback,
  useMemo,
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
  getCards,
} from '../../services/cardService';

import {
  BLOCK_LIBRARY,
  createCardBlock,
  deleteCardBlock,
  getBlockDefinition,
  getCardBlocks,
  reorderCardBlocks,
  updateCardBlock,
} from '../../services/cardBlockService';

export default function BlockBuilderScreen({
  navigation,
}) {
  const [cards, setCards] =
    useState([]);

  const [selectedCard, setSelectedCard] =
    useState(null);

  const [blocks, setBlocks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingBlocks, setLoadingBlocks] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [libraryVisible, setLibraryVisible] =
    useState(false);

  const [editorVisible, setEditorVisible] =
    useState(false);

  const [editingBlock, setEditingBlock] =
    useState(null);

  const [selectedType, setSelectedType] =
    useState(null);

  const [form, setForm] =
    useState({
      title: '',
      subtitle: '',
      value: '',
      url: '',
    });

  const load =
    useCallback(async () => {
      setLoading(true);

      try {
        const session =
          await getCurrentSession();

        if (!session?.user) {
          return;
        }

        const cardData =
          await getCards(
            session.user.id
          );

        setCards(cardData);

        if (!cardData.length) {
          setSelectedCard(null);
          setBlocks([]);
          return;
        }

        const currentSelected =
          selectedCard
            ? cardData.find(
                (item) =>
                  item.id ===
                  selectedCard.id
              )
            : null;

        const cardToUse =
          currentSelected ||
          cardData.find(
            (item) =>
              item.is_primary
          ) ||
          cardData[0];

        setSelectedCard(
          cardToUse
        );

        const blockData =
          await getCardBlocks(
            cardToUse.id
          );

        setBlocks(blockData);
      } catch (error) {
        Alert.alert(
          'Unable to load blocks',
          error.message
        );
      } finally {
        setLoading(false);
      }
    }, [selectedCard?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function chooseCard(card) {
    if (
      selectedCard?.id ===
      card.id
    ) {
      return;
    }

    setSelectedCard(card);
    setLoadingBlocks(true);

    try {
      const data =
        await getCardBlocks(
          card.id
        );

      setBlocks(data);
    } catch (error) {
      Alert.alert(
        'Unable to load card blocks',
        error.message
      );
    } finally {
      setLoadingBlocks(false);
    }
  }

  async function reloadBlocks() {
    if (!selectedCard) {
      return;
    }

    const data =
      await getCardBlocks(
        selectedCard.id
      );

    setBlocks(data);
  }

  const groupedLibrary =
    useMemo(() => {
      const result = {};

      for (
        const item of BLOCK_LIBRARY
      ) {
        if (
          !result[item.category]
        ) {
          result[item.category] =
            [];
        }

        result[item.category].push(
          item
        );
      }

      return result;
    }, []);

  function resetForm() {
    setForm({
      title: '',
      subtitle: '',
      value: '',
      url: '',
    });

    setSelectedType(null);
    setEditingBlock(null);
  }

  function selectLibraryItem(item) {
    setLibraryVisible(false);

    setSelectedType(
      item.type
    );

    setForm({
      title: item.label,
      subtitle: '',
      value: '',
      url: '',
    });

    setEditorVisible(true);
  }

  function editBlock(block) {
    setEditingBlock(block);

    setSelectedType(
      block.block_type
    );

    setForm({
      title:
        block.title || '',

      subtitle:
        block.subtitle || '',

      value:
        block.value || '',

      url:
        block.url || '',
    });

    setEditorVisible(true);
  }

  async function saveBlock() {
    if (!selectedCard) {
      Alert.alert(
        'Select a card',
        'Please choose a card first.'
      );

      return;
    }

    if (!selectedType) {
      return;
    }

    if (!form.title.trim()) {
      Alert.alert(
        'Required',
        'Please enter a block title.'
      );

      return;
    }

    const definition =
      getBlockDefinition(
        selectedType
      );

    setSaving(true);

    try {
      if (editingBlock) {
        await updateCardBlock(
          editingBlock.id,
          {
            title:
              form.title.trim(),

            subtitle:
              form.subtitle.trim() ||
              null,

            value:
              form.value.trim() ||
              null,

            url:
              form.url.trim() ||
              null,

            icon_name:
              definition.icon,
          }
        );
      } else {
        await createCardBlock(
          selectedCard.id,
          {
            block_type:
              selectedType,

            title:
              form.title.trim(),

            subtitle:
              form.subtitle.trim(),

            value:
              form.value.trim(),

            url:
              form.url.trim(),

            icon_name:
              definition.icon,
          }
        );
      }

      setEditorVisible(false);

      resetForm();

      await reloadBlocks();
    } catch (error) {
      Alert.alert(
        'Unable to save block',
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleBlock(
    block,
    value
  ) {
    try {
      await updateCardBlock(
        block.id,
        {
          is_active: value,
        }
      );

      setBlocks(
        (previous) =>
          previous.map(
            (item) =>
              item.id === block.id
                ? {
                    ...item,
                    is_active:
                      value,
                  }
                : item
          )
      );
    } catch (error) {
      Alert.alert(
        'Unable to update block',
        error.message
      );
    }
  }

  async function moveBlock(
    index,
    direction
  ) {
    const newIndex =
      index + direction;

    if (
      newIndex < 0 ||
      newIndex >=
        blocks.length
    ) {
      return;
    }

    const updated = [
      ...blocks,
    ];

    const [moved] =
      updated.splice(
        index,
        1
      );

    updated.splice(
      newIndex,
      0,
      moved
    );

    setBlocks(updated);

    try {
      const saved =
        await reorderCardBlocks(
          updated
        );

      setBlocks(saved);
    } catch (error) {
      Alert.alert(
        'Unable to reorder blocks',
        error.message
      );

      await reloadBlocks();
    }
  }

  function confirmDelete(
    block
  ) {
    Alert.alert(
      'Delete Block',
      `Remove "${block.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',

          onPress:
            async () => {
              try {
                await deleteCardBlock(
                  block.id
                );

                await reloadBlocks();
              } catch (error) {
                Alert.alert(
                  'Unable to delete block',
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
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
          color="#06162D"
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text
          style={
            styles.headerTitle
          }
        >
          Card Blocks
        </Text>

        <TouchableOpacity
          onPress={() =>
            setLibraryVisible(
              true
            )
          }
        >
          <Ionicons
            name="add-circle-outline"
            size={28}
            color="#F6B91A"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Text
          style={
            styles.sectionTitle
          }
        >
          SELECT CARD
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          style={
            styles.cardSelector
          }
        >
          {cards.map(
            (card) => {
              const active =
                selectedCard?.id ===
                card.id;

              return (
                <TouchableOpacity
                  key={card.id}
                  style={[
                    styles.cardChip,
                    active &&
                      styles.cardChipActive,
                  ]}
                  onPress={() =>
                    chooseCard(
                      card
                    )
                  }
                >
                  <Text
                    style={[
                      styles.cardChipName,
                      active &&
                        styles.cardChipNameActive,
                    ]}
                  >
                    {card.name ||
                      'Card'}
                  </Text>

                  <Text
                    style={[
                      styles.cardChipSlug,
                      active &&
                        styles.cardChipSlugActive,
                    ]}
                  >
                    /{card.card_slug}
                  </Text>

                  {card.is_primary ? (
                    <Text
                      style={[
                        styles.primaryText,
                        active &&
                          styles.primaryTextActive,
                      ]}
                    >
                      PRIMARY
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>

        {selectedCard ? (
          <View
            style={
              styles.selectedCardBox
            }
          >
            <Text
              style={
                styles.selectedLabel
              }
            >
              Editing
            </Text>

            <Text
              style={
                styles.selectedName
              }
            >
              {selectedCard.name}
            </Text>

            <Text
              style={
                styles.selectedSlug
              }
            >
              /card/
              {selectedCard.card_slug}
            </Text>
          </View>
        ) : null}

        <View
          style={styles.intro}
        >
          <Ionicons
            name="grid-outline"
            size={28}
            color="#06162D"
          />

          <View
            style={{ flex: 1 }}
          >
            <Text
              style={
                styles.introTitle
              }
            >
              Build this card
            </Text>

            <Text
              style={
                styles.introText
              }
            >
              Blocks are saved only
              to the card selected
              above.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={
            styles.addBlock
          }
          onPress={() =>
            setLibraryVisible(
              true
            )
          }
          disabled={
            !selectedCard
          }
        >
          <Ionicons
            name="add"
            size={22}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.addBlockText
            }
          >
            Add Block
          </Text>
        </TouchableOpacity>

        <Text
          style={
            styles.sectionTitle
          }
        >
          YOUR BLOCKS (
          {blocks.length})
        </Text>

        {loadingBlocks ? (
          <ActivityIndicator
            color="#06162D"
            style={{
              marginTop: 20,
            }}
          />
        ) : blocks.length ===
          0 ? (
          <View
            style={styles.empty}
          >
            <Ionicons
              name="grid-outline"
              size={45}
              color="#98A2B3"
            />

            <Text
              style={
                styles.emptyTitle
              }
            >
              No blocks for this
              card
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Add WhatsApp,
              YouTube, PDF, Maps,
              Google Reviews or
              another custom block.
            </Text>
          </View>
        ) : (
          blocks.map(
            (
              block,
              index
            ) => {
              const definition =
                getBlockDefinition(
                  block.block_type
                );

              return (
                <View
                  key={
                    block.id
                  }
                  style={
                    styles.block
                  }
                >
                  <View
                    style={
                      styles.blockIcon
                    }
                  >
                    <Ionicons
                      name={
                        block.icon_name ||
                        definition.icon
                      }
                      size={22}
                      color="#06162D"
                    />
                  </View>

                  <View
                    style={
                      styles.blockInfo
                    }
                  >
                    <Text
                      style={
                        styles.blockTitle
                      }
                    >
                      {block.title}
                    </Text>

                    <Text
                      style={
                        styles.blockType
                      }
                    >
                      {
                        definition.label
                      }
                    </Text>

                    {block.value ||
                    block.url ? (
                      <Text
                        numberOfLines={
                          1
                        }
                        style={
                          styles.blockValue
                        }
                      >
                        {block.value ||
                          block.url}
                      </Text>
                    ) : null}
                  </View>

                  <Switch
                    value={
                      block.is_active
                    }
                    onValueChange={(
                      value
                    ) =>
                      toggleBlock(
                        block,
                        value
                      )
                    }
                  />

                  <View
                    style={
                      styles.blockActions
                    }
                  >
                    <TouchableOpacity
                      disabled={
                        index === 0
                      }
                      onPress={() =>
                        moveBlock(
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
                            ? '#D0D5DD'
                            : '#06162D'
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={
                        index ===
                        blocks.length -
                          1
                      }
                      onPress={() =>
                        moveBlock(
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
                          blocks.length -
                            1
                            ? '#D0D5DD'
                            : '#06162D'
                        }
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        editBlock(
                          block
                        )
                      }
                    >
                      <Ionicons
                        name="create-outline"
                        size={19}
                        color="#06162D"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() =>
                        confirmDelete(
                          block
                        )
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={19}
                        color="#DC2626"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
          )
        )}
      </ScrollView>

      <Modal
        visible={
          libraryVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() =>
          setLibraryVisible(
            false
          )
        }
      >
        <View
          style={styles.overlay}
        >
          <View
            style={
              styles.libraryModal
            }
          >
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
                Block Library
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setLibraryVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#06162D"
                />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {Object.entries(
                groupedLibrary
              ).map(
                ([
                  category,
                  items,
                ]) => (
                  <View
                    key={category}
                  >
                    <Text
                      style={
                        styles.category
                      }
                    >
                      {category}
                    </Text>

                    <View
                      style={
                        styles.libraryGrid
                      }
                    >
                      {items.map(
                        (item) => (
                          <TouchableOpacity
                            key={
                              item.type
                            }
                            style={
                              styles.libraryItem
                            }
                            onPress={() =>
                              selectLibraryItem(
                                item
                              )
                            }
                          >
                            <View
                              style={
                                styles.libraryIcon
                              }
                            >
                              <Ionicons
                                name={
                                  item.icon
                                }
                                size={23}
                                color="#06162D"
                              />
                            </View>

                            <Text
                              style={
                                styles.libraryLabel
                              }
                            >
                              {
                                item.label
                              }
                            </Text>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  </View>
                )
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={
          editorVisible
        }
        transparent
        animationType="slide"
        onRequestClose={() => {
          setEditorVisible(
            false
          );

          resetForm();
        }}
      >
        <View
          style={styles.overlay}
        >
          <View
            style={
              styles.editorModal
            }
          >
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
                {editingBlock
                  ? 'Edit Block'
                  : 'Add Block'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setEditorVisible(
                    false
                  );

                  resetForm();
                }}
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#06162D"
                />
              </TouchableOpacity>
            </View>

            <Text
              style={styles.label}
            >
              Title
            </Text>

            <TextInput
              style={styles.input}
              value={form.title}
              onChangeText={(
                value
              ) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    title: value,
                  })
                )
              }
              placeholder="Button title"
              placeholderTextColor="#98A2B3"
            />

            <Text
              style={styles.label}
            >
              Subtitle
            </Text>

            <TextInput
              style={styles.input}
              value={
                form.subtitle
              }
              onChangeText={(
                value
              ) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    subtitle:
                      value,
                  })
                )
              }
              placeholder="Optional description"
              placeholderTextColor="#98A2B3"
            />

            <Text
              style={styles.label}
            >
              Value
            </Text>

            <TextInput
              style={styles.input}
              value={form.value}
              onChangeText={(
                value
              ) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    value,
                  })
                )
              }
              placeholder={
                selectedType
                  ? getBlockDefinition(
                      selectedType
                    ).placeholder
                  : 'Enter value'
              }
              placeholderTextColor="#98A2B3"
              autoCapitalize="none"
            />

            <Text
              style={styles.label}
            >
              URL
            </Text>

            <TextInput
              style={styles.input}
              value={form.url}
              onChangeText={(
                value
              ) =>
                setForm(
                  (previous) => ({
                    ...previous,
                    url: value,
                  })
                )
              }
              placeholder="Optional URL"
              placeholderTextColor="#98A2B3"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={
                styles.saveButton
              }
              onPress={
                saveBlock
              }
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  {editingBlock
                    ? 'Update Block'
                    : 'Add Block'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#F5F7FB',
      },

    loading: {
      flex: 1,
      backgroundColor:
        '#F5F7FB',
      alignItems: 'center',
      justifyContent:
        'center',


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

    sectionTitle: {
      marginTop: 16,
      marginBottom: 10,
      color: '#667085',
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: '800',
    },

    cardSelector: {
      marginBottom: 12,
    },

    cardChip: {
      minWidth: 150,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      padding: 13,
      marginRight: 9,
      borderWidth: 1,
      borderColor:
        '#E6EAF0',


      borderWidth: 1,

      borderColor: '#E6EAF0',

      shadowColor: '#06162D',

      shadowOffset: { width: 0, height: 4 },

      shadowOpacity: 0.045,

      shadowRadius: 10,

      elevation: 2,
},

    cardChipActive: {
      backgroundColor:
        '#06162D',
      borderColor:
        '#06162D',


      borderColor: '#F6B91A',
},

    cardChipName: {
      color: '#06162D',
      fontWeight: '800',
    },

    cardChipNameActive: {
      color: '#FFFFFF',
    },

    cardChipSlug: {
      color: '#667085',
      fontSize: 9,
      marginTop: 4,
    },

    cardChipSlugActive: {
      color: '#D0D5DD',
    },

    primaryText: {
      color: '#C98B16',
      fontSize: 8,
      fontWeight: '900',
      marginTop: 7,
    },

    primaryTextActive: {
      color: '#FCD34D',
    },

    selectedCardBox: {
      backgroundColor:
        '#FFF4D6',
      borderRadius: 15,
      padding: 14,
      marginBottom: 12,


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

    selectedLabel: {
      color: '#C98B16',
      fontSize: 9,
      fontWeight: '900',
    },

    selectedName: {
      color: '#06162D',
      fontWeight: '900',
      fontSize: 16,
      marginTop: 3,
    },

    selectedSlug: {
      color: '#667085',
      fontSize: 10,
      marginTop: 3,
    },

    intro: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      padding: 18,
      flexDirection: 'row',
      gap: 13,
      alignItems: 'center',


      borderWidth: 1,

      borderColor: '#E6EAF0',

      shadowColor: '#06162D',

      shadowOffset: { width: 0, height: 4 },

      shadowOpacity: 0.045,

      shadowRadius: 10,

      elevation: 2,
},

    introTitle: {
      color: '#06162D',
      fontSize: 17,
      fontWeight: '900',
    },

    introText: {
      color: '#667085',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 4,
    },

    addBlock: {
      backgroundColor:
        '#06162D',
      borderRadius: 15,
      paddingVertical: 14,
      marginTop: 12,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent:
        'center',


      borderWidth: 1,

      borderColor: '#F6B91A',
},

    addBlockText: {
      color: '#FFFFFF',
      fontWeight: '800',
    },

    empty: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      padding: 30,
      alignItems: 'center',
    },

    emptyTitle: {
      marginTop: 10,
      color: '#06162D',
      fontWeight: '800',
    },

    emptyText: {
      color: '#667085',
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 17,
      marginTop: 5,
    },

    block: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 17,
      padding: 12,
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
},

    blockIcon: {

        width: 43,

        height: 43,

        borderRadius: 13,

        backgroundColor: '#FFF4D6',

        alignItems: 'center',

        justifyContent: 'center',

        borderWidth: 1,

        borderColor: '#F6B91A',

      },

    blockInfo: {
      flex: 1,
    },

    blockTitle: {
      color: '#06162D',
      fontWeight: '800',
      fontSize: 13,
    },

    blockType: {
      color: '#C98B16',
      fontSize: 9,
      fontWeight: '800',
      marginTop: 2,
    },

    blockValue: {
      color: '#98A2B3',
      fontSize: 9,
      marginTop: 3,
    },

    blockActions: {
      gap: 5,
    },

    overlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.55)',
      justifyContent:
        'flex-end',
    },

    libraryModal: {
      maxHeight: '82%',
      backgroundColor:
        '#FFFFFF',
      borderTopLeftRadius:
        28,
      borderTopRightRadius:
        28,
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

    editorModal: {
      backgroundColor:
        '#FFFFFF',
      borderTopLeftRadius:
        28,
      borderTopRightRadius:
        28,
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
      justifyContent:
        'space-between',
      marginBottom: 16,
    },

    modalTitle: {
      color: '#06162D',
      fontSize: 21,
      fontWeight: '900',
    },

    category: {
      color: '#667085',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1,
      marginTop: 17,
      marginBottom: 9,
    },

    libraryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },

    libraryItem: {
      width: '31%',
      backgroundColor:
        '#F8FAFC',
      borderRadius: 16,
      padding: 12,
      alignItems: 'center',


      borderWidth: 1,

      borderColor: '#E6EAF0',

      shadowColor: '#06162D',

      shadowOffset: { width: 0, height: 4 },

      shadowOpacity: 0.045,

      shadowRadius: 10,

      elevation: 2,
},

    libraryIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    libraryLabel: {
      color: '#06162D',
      fontSize: 10,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 7,
    },

    label: {
      color: '#344054',
      fontSize: 11,
      fontWeight: '800',
      marginBottom: 5,
    },

    input: {
      backgroundColor:
        '#F8FAFC',
      borderWidth: 1,
      borderColor:
        '#E6EAF0',
      borderRadius: 12,
      padding: 12,
      color: '#06162D',
      marginBottom: 12,
    },

    saveButton: {
      backgroundColor:
        '#06162D',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 5,


      borderWidth: 1,

      borderColor: '#F6B91A',
},

    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
  });
