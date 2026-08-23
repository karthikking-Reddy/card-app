import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

import { getCurrentSession } from '../../services/authService';
import { getCard } from '../../services/cardService';
import {
  ensureDefaultLinks,
  updateCardLink,
} from '../../services/linkService';

const TYPES = [
  ['whatsapp', 'WhatsApp', 'logo-whatsapp'],
  ['phone', 'Phone', 'call-outline'],
  ['email', 'Email', 'mail-outline'],
  ['website', 'Website', 'globe-outline'],
  ['instagram', 'Instagram', 'logo-instagram'],
  ['facebook', 'Facebook', 'logo-facebook'],
  ['linkedin', 'LinkedIn', 'logo-linkedin'],
  ['youtube', 'YouTube', 'logo-youtube'],
  ['google_reviews', 'Google Reviews', 'star-outline'],
  ['location', 'Location', 'location-outline'],
];

export default function SocialLinksScreen({ navigation }) {
  const [card, setCard] = useState(null);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const session = await getCurrentSession();
      const currentCard = await getCard(session.user.id);

      setCard(currentCard);

      const links = await ensureDefaultLinks(currentCard);

      const map = {};

      for (const link of links) {
        map[link.link_type] = {
          ...link,
        };
      }

      setItems(map);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  function change(type, key, value) {
    setItems((previous) => ({
      ...previous,
      [type]: {
        ...(previous[type] || {}),
        [key]: value,
      },
    }));
  }

  async function save() {
    if (!card) return;

    setSaving(true);

    try {
      await Promise.all(
        TYPES.map(async ([type, label, icon], index) => {
          const item = items[type] || {};

          return updateCardLink(card.id, type, {
            label,
            icon_name: icon,
            value: item.value || '',
            is_active: Boolean(item.is_active && item.value),
            sort_order: index + 1,
          });
        })
      );

      Alert.alert('Saved', 'Your links have been updated.');
    } catch (error) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Links & Social</Text>

        <TouchableOpacity onPress={save}>
          <Text style={styles.topSave}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.help}>
          Add your links and choose which buttons visitors can see on your digital card.
        </Text>

        {TYPES.map(([type, label, icon]) => {
          const item = items[type] || {};

          return (
            <View key={type} style={styles.card}>
              <View style={styles.topRow}>
                <View style={styles.identity}>
                  <View style={styles.icon}>
                    <Ionicons name={icon} size={22} color="#111827" />
                  </View>

                  <Text style={styles.label}>{label}</Text>
                </View>

                <Switch
                  value={Boolean(item.is_active)}
                  onValueChange={(value) =>
                    change(type, 'is_active', value)
                  }
                />
              </View>

              <TextInput
                value={item.value || ''}
                onChangeText={(value) => change(type, 'value', value)}
                placeholder={
                  type === 'whatsapp' || type === 'phone'
                    ? '+91 9876543210'
                    : `Enter ${label} link`
                }
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>Save Links</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingBottom: 70,
  },
  help: {
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontWeight: '800',
    color: '#111827',
  },
  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
