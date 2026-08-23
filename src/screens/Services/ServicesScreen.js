import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
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
  createService,
  deleteService,
  ensureDefaultServices,
  updateService,
} from '../../services/serviceService';

export default function ServicesScreen({ navigation }) {
  const [card, setCard] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const session = await getCurrentSession();
      const currentCard = await getCard(session.user.id);

      setCard(currentCard);

      const data = await ensureDefaultServices(currentCard.id);
      setServices(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  function edit(service) {
    setEditingId(service.id);
    setTitle(service.title || '');
    setDescription(service.short_description || '');
  }

  function clear() {
    setEditingId(null);
    setTitle('');
    setDescription('');
  }

  async function save() {
    if (!title.trim()) {
      Alert.alert('Required', 'Enter a service name.');
      return;
    }

    try {
      if (editingId) {
        await updateService(editingId, {
          title: title.trim(),
          short_description: description.trim(),
        });
      } else {
        await createService(card.id, {
          title: title.trim(),
          short_description: description.trim(),
          icon_name: 'briefcase-outline',
          sort_order: services.length + 1,
          is_active: true,
        });
      }

      clear();
      await load();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  function confirmDelete(service) {
    Alert.alert(
      'Delete Service',
      `Remove "${service.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteService(service.id);
              await load();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
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

        <Text style={styles.headerTitle}>Services</Text>

        <View style={{ width: 25 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {editingId ? 'Edit Service' : 'Add New Service'}
          </Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Service name"
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={[styles.input, styles.description]}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description"
            placeholderTextColor="#9CA3AF"
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={save}>
            <Text style={styles.saveText}>
              {editingId ? 'Update Service' : 'Add Service'}
            </Text>
          </TouchableOpacity>

          {editingId ? (
            <TouchableOpacity onPress={clear}>
              <Text style={styles.cancel}>Cancel Editing</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>YOUR SERVICES</Text>

        {services.map((service) => (
          <View key={service.id} style={styles.service}>
            <View style={styles.serviceIcon}>
              <Ionicons
                name={service.icon_name || 'briefcase-outline'}
                size={22}
                color="#111827"
              />
            </View>

            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>{service.title}</Text>

              <Text style={styles.serviceDescription}>
                {service.short_description || 'No description'}
              </Text>
            </View>

            <TouchableOpacity onPress={() => edit(service)}>
              <Ionicons name="create-outline" size={21} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => confirmDelete(service)}>
              <Ionicons name="trash-outline" size={21} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}
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
    fontWeight: '800',
    fontSize: 18,
    color: '#111827',
  },
  container: {
    padding: 16,
    paddingBottom: 70,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: '#111827',
  },
  description: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#111827',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  cancel: {
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#6B7280',
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 10,
  },
  service: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    gap: 11,
    alignItems: 'center',
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontWeight: '800',
    color: '#111827',
  },
  serviceDescription: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },
});
