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
    Alert.alert('Delete Service', `Remove "${service.title}"?`, [
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

        <Text style={styles.headerTitle}>Services</Text>

        <View style={{ width: 25 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.form}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Service' : 'Add New Service'}</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Service name"
            placeholderTextColor="#98A2B3"
          />

          <TextInput
            style={[styles.input, styles.description]}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description"
            placeholderTextColor="#98A2B3"
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={save}>
            <Text style={styles.saveText}>{editingId ? 'Update Service' : 'Add Service'}</Text>
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
              <Ionicons name={service.icon_name || 'briefcase-outline'} size={22} color="#06162D" />
            </View>

            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>{service.title}</Text>

              <Text style={styles.serviceDescription}>
                {service.short_description || 'No description'}
              </Text>
            </View>

            <TouchableOpacity onPress={() => edit(service)}>
              <Ionicons name="create-outline" size={21} color="#06162D" />
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
    backgroundColor: '#F5F7FB',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',

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
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,

    borderWidth: 1,
    borderColor: '#E6EAF0',
    shadowColor: '#06162D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#06162D',
    marginBottom: 14,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6EAF0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: '#06162D',
  },
  description: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#06162D',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#F6B91A',
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
    color: '#667085',
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

    borderWidth: 1,
    borderColor: '#E6EAF0',
    shadowColor: '#06162D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6B91A',
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontWeight: '800',
    color: '#06162D',
  },
  serviceDescription: {
    fontSize: 11,
    color: '#667085',
    marginTop: 3,
  },
});
