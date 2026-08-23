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
  createPortfolioItem,
  deletePortfolioItem,
  getPortfolioItems,
} from '../../services/portfolioService';

export default function PortfolioScreen({ navigation }) {
  const [card, setCard] = useState(null);
  const [items, setItems] = useState([]);
  const [type, setType] = useState('student');
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const session = await getCurrentSession();
      const currentCard = await getCard(session.user.id);

      setCard(currentCard);

      const data = await getPortfolioItems(currentCard.id);
      setItems(data);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a name or portfolio title.');
      return;
    }

    try {
      await createPortfolioItem(card.id, {
        portfolio_type: type,
        title: title.trim(),
        subtitle: subtitle.trim(),
        description: description.trim(),
        sort_order: items.length + 1,
        is_active: true,
      });

      setTitle('');
      setSubtitle('');
      setDescription('');

      await load();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  function remove(item) {
    Alert.alert(
      'Delete Portfolio Item',
      `Remove "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePortfolioItem(item.id);
              await load();
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  }

  const visibleItems = items.filter(
    (item) => item.portfolio_type === type
  );

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

        <Text style={styles.headerTitle}>Portfolio</Text>

        <View style={{ width: 25 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tabs}>
          <Tab
            label="Students"
            selected={type === 'student'}
            onPress={() => setType('student')}
          />

          <Tab
            label="Employees"
            selected={type === 'employee'}
            onPress={() => setType('employee')}
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>
            Add {type === 'student' ? 'Student' : 'Employee'}
          </Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={
              type === 'student'
                ? 'Student name / Project title'
                : 'Employee name'
            }
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={styles.input}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder={
              type === 'student'
                ? 'Course / Skill'
                : 'Designation / Department'
            }
            placeholderTextColor="#9CA3AF"
          />

          <TextInput
            style={[styles.input, styles.description]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description, projects, achievements..."
            multiline
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={styles.addButton} onPress={add}>
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addText}>Add to Portfolio</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>
          {type === 'student' ? 'STUDENTS' : 'EMPLOYEES'}
        </Text>

        {visibleItems.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name={type === 'student' ? 'school-outline' : 'people-outline'}
              size={38}
              color="#9CA3AF"
            />

            <Text style={styles.emptyTitle}>
              No {type === 'student' ? 'students' : 'employees'} yet
            </Text>
          </View>
        ) : (
          visibleItems.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>
                  {item.title.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
              </View>

              <TouchableOpacity onPress={() => remove(item)}>
                <Ionicons name="trash-outline" size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tab({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tab, selected && styles.activeTab]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, selected && styles.activeTabText]}>
        {label}
      </Text>
    </TouchableOpacity>
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
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
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
  container: {
    padding: 16,
    paddingBottom: 70,
  },
  tabs: {
    backgroundColor: '#E5E7EB',
    borderRadius: 14,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 11,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontWeight: '700',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
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
    marginBottom: 13,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: '#111827',
  },
  description: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#111827',
    borderRadius: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  addText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  empty: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 10,
    color: '#6B7280',
    fontWeight: '700',
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: '800',
    color: '#111827',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  itemDescription: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
  },
});
