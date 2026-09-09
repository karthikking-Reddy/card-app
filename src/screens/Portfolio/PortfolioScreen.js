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
import { getCard, getCardById } from '../../services/cardService';
import {
  createPortfolioItem,
  deletePortfolioItem,
  getPortfolioItems,
} from '../../services/portfolioService';

export default function PortfolioScreen({ navigation, route }) {
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
      const currentCard = route.params?.cardId
        ? await getCardById(session.user.id, route.params.cardId)
        : await getCard(session.user.id);

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
    Alert.alert('Delete Portfolio Item', `Remove "${item.title}"?`, [
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
    ]);
  }

  const visibleItems = items.filter((item) => item.portfolio_type === type);

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

        <Text style={styles.headerTitle}>Portfolio</Text>

        <View style={{ width: 25 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.tabs}>
          <Tab label="Students" selected={type === 'student'} onPress={() => setType('student')} />

          <Tab
            label="Employees"
            selected={type === 'employee'}
            onPress={() => setType('employee')}
          />
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>Add {type === 'student' ? 'Student' : 'Employee'}</Text>

          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={type === 'student' ? 'Student name / Project title' : 'Employee name'}
            placeholderTextColor="#98A2B3"
          />

          <TextInput
            style={styles.input}
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder={type === 'student' ? 'Course / Skill' : 'Designation / Department'}
            placeholderTextColor="#98A2B3"
          />

          <TextInput
            style={[styles.input, styles.description]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description, projects, achievements..."
            multiline
            placeholderTextColor="#98A2B3"
          />

          <TouchableOpacity style={styles.addButton} onPress={add}>
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.addText}>Add to Portfolio</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{type === 'student' ? 'STUDENTS' : 'EMPLOYEES'}</Text>

        {visibleItems.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name={type === 'student' ? 'school-outline' : 'people-outline'}
              size={38}
              color="#98A2B3"
            />

            <Text style={styles.emptyTitle}>
              No {type === 'student' ? 'students' : 'employees'} yet
            </Text>
          </View>
        ) : (
          visibleItems.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.avatar}>
                <Text style={styles.initial}>{item.title.charAt(0).toUpperCase()}</Text>
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
    <TouchableOpacity style={[styles.tab, selected && styles.activeTab]} onPress={onPress}>
      <Text style={[styles.tabText, selected && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
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
  tabs: {
    backgroundColor: '#E9EEF5',
    borderRadius: 15,
    padding: 4,
    flexDirection: 'row',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E6EAF0',
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 11,
  },
  activeTab: {
    backgroundColor: '#06162D',
    borderWidth: 1,
    borderColor: '#F6B91A',
  },
  tabText: {
    fontWeight: '700',
    color: '#667085',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '900',
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
    marginBottom: 13,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E6EAF0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    color: '#06162D',
  },
  description: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#06162D',
    borderRadius: 13,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,

    borderWidth: 1,
    borderColor: '#F6B91A',
  },
  addText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    color: '#667085',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  empty: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',

    borderWidth: 1,
    borderColor: '#E6EAF0',
    shadowColor: '#06162D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: {
    marginTop: 10,
    color: '#667085',
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

    borderWidth: 1,
    borderColor: '#E6EAF0',
    shadowColor: '#06162D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#06162D',
    alignItems: 'center',
    justifyContent: 'center',

    borderWidth: 2,
    borderColor: '#F6B91A',
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
    color: '#06162D',
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#667085',
    marginTop: 2,
  },
  itemDescription: {
    fontSize: 11,
    color: '#98A2B3',
    marginTop: 3,
  },
});
