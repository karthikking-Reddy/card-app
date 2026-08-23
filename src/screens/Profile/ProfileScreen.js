import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import {
  getCurrentSession,
  signOut,
} from '../../services/authService';

export default function ProfileScreen({ navigation }) {
  const [email, setEmail] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const session = await getCurrentSession();
    setEmail(session?.user?.email || '');
  }

  async function logout() {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>{email}</Text>

        <Text style={styles.section}>MY DIGITAL CARD</Text>

        <Menu
          icon="create-outline"
          title="Edit Card"
          description="Profile, company, contact details and photo"
          onPress={() => navigation.navigate('CardEditor')}
        />

        <Menu
          icon="link-outline"
          title="Links & Social Media"
          description="WhatsApp, Instagram, YouTube, LinkedIn and more"
          onPress={() => navigation.navigate('SocialLinks')}
        />

        <Menu
          icon="briefcase-outline"
          title="Services"
          description="Manage the services shown on your card"
          onPress={() => navigation.navigate('Services')}
        />

        <Menu
          icon="people-outline"
          title="Portfolio"
          description="Manage Students and Employees portfolio"
          onPress={() => navigation.navigate('Portfolio')}
        />

        <Text style={styles.section}>ACCOUNT</Text>

        <Menu
          icon="color-palette-outline"
          title="Card Themes"
          description="Coming next in Step 1"
        />

        <Menu
          icon="notifications-outline"
          title="Notifications"
          description="Lead and card activity notifications"
        />

        <TouchableOpacity style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={21} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          YNS CARD v1.0.0{'\n'}
          Powered by YUVARAJ NETWORKS & SOLUTIONS
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Menu({ icon, title, description, onPress }) {
  return (
    <TouchableOpacity
      style={styles.menu}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={22} color="#111827" />
      </View>

      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuDescription}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  container: {
    padding: 18,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginTop: 26,
    marginBottom: 10,
    fontSize: 11,
    letterSpacing: 1,
    color: '#6B7280',
    fontWeight: '800',
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 14,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '800',
    color: '#111827',
  },
  menuDescription: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 3,
  },
  logout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '800',
  },
  footer: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 25,
  },
});
