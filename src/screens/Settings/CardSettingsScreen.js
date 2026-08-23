import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import {
  getCurrentSession,
} from '../../services/authService';

import {
  getCard,
  updateCard,
} from '../../services/cardService';

import {
  CARD_WEB_URL,
} from '../../constants/config';

const THEMES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Clean professional style',
  },
  {
    id: 'gold',
    name: 'YNS Gold',
    description: 'Premium gold business style',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Modern blue technology style',
  },
];

const CARD_TYPES = [
  ['business', 'Business'],
  ['student', 'Student'],
  ['employee', 'Employee'],
];

export default function CardSettingsScreen({
  navigation,
}) {
  const [user, setUser] =
    useState(null);

  const [card, setCard] =
    useState(null);

  const [theme, setTheme] =
    useState('standard');

  const [cardType, setCardType] =
    useState('business');

  const [isPublic, setIsPublic] =
    useState(true);

  const [isActive, setIsActive] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const session =
        await getCurrentSession();

      if (!session?.user) return;

      setUser(session.user);

      const currentCard =
        await getCard(
          session.user.id
        );

      setCard(currentCard);

      setTheme(
        currentCard.theme ||
        'standard'
      );

      setCardType(
        currentCard.card_type ||
        'business'
      );

      setIsPublic(
        currentCard.is_public !== false
      );

      setIsActive(
        currentCard.is_active !== false
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);

    try {
      const updated =
        await updateCard(
          user.id,
          card.id,
          {
            theme,
            card_type: cardType,
            is_public: isPublic,
            is_active: isActive,
          }
        );

      setCard(updated);

      Alert.alert(
        'Saved',
        'Card settings updated.'
      );
    } catch (error) {
      Alert.alert(
        'Save failed',
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  function openPublicCard() {
    if (!card?.card_slug) return;

    Linking.openURL(
      `${CARD_WEB_URL}/${card.card_slug}`
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
          Card Settings
        </Text>

        <TouchableOpacity
          onPress={save}
        >
          <Text style={styles.topSave}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Text style={styles.sectionTitle}>
          CARD VISIBILITY
        </Text>

        <View style={styles.card}>
          <SettingRow
            title="Public Card"
            description="Allow people with your card link or QR code to view it."
            value={isPublic}
            onValueChange={setIsPublic}
          />

          <SettingRow
            title="Active Card"
            description="Temporarily enable or disable this digital card."
            value={isActive}
            onValueChange={setIsActive}
            last
          />
        </View>

        <Text style={styles.sectionTitle}>
          CARD TYPE
        </Text>

        <View style={styles.optionGrid}>
          {CARD_TYPES.map(
            ([id, label]) => (
              <TouchableOpacity
                key={id}
                onPress={() =>
                  setCardType(id)
                }
                style={[
                  styles.typeButton,
                  cardType === id &&
                    styles.selectedOption,
                ]}
              >
                <Text
                  style={[
                    styles.typeText,
                    cardType === id &&
                      styles.selectedText,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Text style={styles.sectionTitle}>
          CARD THEME
        </Text>

        {THEMES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.themeCard,
              theme === item.id &&
                styles.selectedTheme,
            ]}
            onPress={() =>
              setTheme(item.id)
            }
          >
            <View
              style={[
                styles.themePreview,
                item.id === 'gold' &&
                  styles.goldPreview,
                item.id === 'ocean' &&
                  styles.oceanPreview,
              ]}
            >
              <Text
                style={
                  styles.themeInitial
                }
              >
                Y
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={styles.themeName}
              >
                {item.name}
              </Text>

              <Text
                style={
                  styles.themeDescription
                }
              >
                {item.description}
              </Text>
            </View>

            {theme === item.id ? (
              <Ionicons
                name="checkmark-circle"
                size={23}
                color="#B7791F"
              />
            ) : (
              <Ionicons
                name="ellipse-outline"
                size={23}
                color="#D1D5DB"
              />
            )}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.previewButton}
          onPress={openPublicCard}
        >
          <Ionicons
            name="open-outline"
            size={20}
            color="#111827"
          />

          <Text
            style={styles.previewText}
          >
            Preview Public Card
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={styles.saveText}
            >
              Save Card Settings
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  title,
  description,
  value,
  onValueChange,
  last,
}) {
  return (
    <View
      style={[
        styles.settingRow,
        last &&
          styles.settingRowLast,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={styles.settingTitle}
        >
          {title}
        </Text>

        <Text
          style={
            styles.settingDescription
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
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
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

  topSave: {
    color: '#B7791F',
    fontWeight: '800',
  },

  container: {
    padding: 16,
    paddingBottom: 65,
  },

  sectionTitle: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 17,
    marginBottom: 9,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  settingRowLast: {
    borderBottomWidth: 0,
  },

  settingTitle: {
    color: '#111827',
    fontWeight: '800',
  },

  settingDescription: {
    color: '#6B7280',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  optionGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  typeButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  selectedOption: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },

  typeText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 11,
  },

  selectedText: {
    color: '#FFFFFF',
  },

  themeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 13,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  selectedTheme: {
    borderColor: '#D4A94E',
  },

  themePreview: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goldPreview: {
    backgroundColor: '#B7791F',
  },

  oceanPreview: {
    backgroundColor: '#075985',
  },

  themeInitial: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
  },

  themeName: {
    color: '#111827',
    fontWeight: '800',
  },

  themeDescription: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 3,
  },

  previewButton: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  previewText: {
    color: '#111827',
    fontWeight: '800',
  },

  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },

  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
