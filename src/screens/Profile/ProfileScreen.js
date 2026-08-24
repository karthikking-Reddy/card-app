import {
  useEffect,
  useState,
} from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
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
  signOut,
} from '../../services/authService';

export default function ProfileScreen({
  navigation,
}) {
  const [email, setEmail] =
    useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const session =
      await getCurrentSession();

    setEmail(
      session?.user?.email || ''
    );
  }

  async function logout() {
    try {
      await signOut();
    } catch (error) {
      Alert.alert(
        'Error',
        error.message
      );
    }
  }

  function openRoot(screen) {
    navigation
      .getParent()
      ?.navigate(screen);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Text style={styles.title}>
          Profile
        </Text>

        <Text style={styles.subtitle}>
          {email}
        </Text>

        <Text style={styles.section}>
          MY DIGITAL CARDS
        </Text>

        <Menu
          icon="albums-outline"
          title="My Cards"
          description="Create, switch and manage multiple cards"
          onPress={() =>
            openRoot('MyCards')
          }
        />

        <Menu
          icon="create-outline"
          title="Edit Primary Card"
          description="Profile, company, contact details and photo"
          onPress={() =>
            openRoot(
              'CardEditor'
            )
          }
        />

        <Menu
          icon="color-palette-outline"
          title="Card Settings"
          description="Themes, public/private and active status"
          onPress={() =>
            openRoot(
              'CardSettings'
            )
          }
        />

        <Menu
          icon="link-outline"
          title="Links & Social Media"
          description="WhatsApp, Instagram, YouTube, LinkedIn and more"
          onPress={() =>
            openRoot(
              'SocialLinks'
            )
          }
        />

        <Menu
          icon="grid-outline"
          title="Card Block Builder"
          description="Add and reorder custom links, media, documents and actions"
          onPress={() =>
            openRoot(
              'BlockBuilder'
            )
          }
        />

        <Menu
          icon="briefcase-outline"
          title="Services"
          description="Manage services shown on your card"
          onPress={() =>
            openRoot('Services')
          }
        />

        <Menu
          icon="people-outline"
          title="Portfolio"
          description="Students and Employees portfolio"
          onPress={() =>
            openRoot(
              'Portfolio'
            )
          }
        />

        <Text style={styles.section}>
          CRM SETTINGS
        </Text>

        <Menu
          icon="git-branch-outline"
          title="CRM Stages"
          description="Customize your lead pipeline stages"
          onPress={() =>
            openRoot(
              'LeadStages'
            )
          }
        />

        <Text style={styles.section}>
          ACTIVITY
        </Text>

        <Menu
          icon="notifications-outline"
          title="Notifications"
          description="New leads and card activity"
          onPress={() =>
            openRoot(
              'Notifications'
            )
          }
        />

        <Text style={styles.section}>
          ACCOUNT
        </Text>

        <TouchableOpacity
          style={styles.logout}
          onPress={logout}
        >
          <Ionicons
            name="log-out-outline"
            size={21}
            color="#DC2626"
          />

          <Text
            style={styles.logoutText}
          >
            Log Out
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          YNS CARD v1.0.0
          {'\n'}
          Powered by YUVARAJ NETWORKS & SOLUTIONS
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Menu({
  icon,
  title,
  description,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.menu}
      onPress={onPress}
    >
      <View style={styles.icon}>
        <Ionicons
          name={icon}
          size={22}
          color="#111827"
        />
      </View>

      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>
          {title}
        </Text>

        <Text
          style={styles.menuDescription}
        >
          {description}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#9CA3AF"
      />
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

