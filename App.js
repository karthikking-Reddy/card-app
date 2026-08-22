import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Share,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from './lib/supabase';

const DEFAULT_CARD = {
  name: 'Karthik',
  designation: 'Founder & CEO',
  company: 'YUVARAJ NETWORKS & SOLUTIONS',
  phone: '+91 9182640851',
  email: 'karthikking1437@gmail.com',
  website: 'www.yns.com',
  profile_image_url: null,
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [card, setCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);

  const [qrVisible, setQrVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);

      if (newSession) {
        await loadCard(newSession.user.id);
      } else {
        setCard(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadSession() {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);

      if (currentSession) {
        await loadCard(currentSession.user.id);
      }
    } catch (error) {
      console.log('Session error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCard(userId) {
    setCardLoading(true);

    try {
      const { data, error } = await supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.log('Card loading error:', error);
        Alert.alert('Card Error', error.message);
        return;
      }

      if (data) {
        setCard(data);
      } else {
        await createDefaultCard(userId);
      }
    } catch (error) {
      console.log('Load card error:', error);
      Alert.alert('Error', 'Unable to load your card.');
    } finally {
      setCardLoading(false);
    }
  }

  async function createDefaultCard(userId) {
    const slug = `karthik-${userId.slice(0, 8)}`;

    const { data, error } = await supabase
      .from('digital_cards')
      .insert({
        user_id: userId,
        name: DEFAULT_CARD.name,
        designation: DEFAULT_CARD.designation,
        company: DEFAULT_CARD.company,
        phone: DEFAULT_CARD.phone,
        email: DEFAULT_CARD.email,
        website: DEFAULT_CARD.website,
        profile_image_url: DEFAULT_CARD.profile_image_url,
        card_slug: slug,
      })
      .select()
      .single();

    if (error) {
      console.log('Create card error:', error);
      Alert.alert('Card Error', error.message);
      return;
    }

    setCard(data);
  }

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Password must contain at least 6 characters.'
      );
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert('Login failed', error.message);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          Alert.alert('Sign up failed', error.message);
          return;
        }

        if (data.session) {
          Alert.alert(
            'Account created',
            'Your YNS Card account is ready.'
          );
        } else {
          Alert.alert(
            'Account created',
            'Your account was created. Please check your email if confirmation is required.'
          );
        }
      }
    } catch (error) {
      console.log('Authentication error:', error);

      Alert.alert(
        'Error',
        'Something went wrong. Please try again.'
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert('Logout failed', error.message);
      return;
    }

    setSession(null);
    setCard(null);
    setEditing(false);
  }

  function updateField(field, value) {
    setCard((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function saveCard() {
    if (!card) return;

    if (!card.name?.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    const { data, error } = await supabase
      .from('digital_cards')
      .update({
        name: card.name.trim(),
        designation: card.designation?.trim() || '',
        company: card.company?.trim() || '',
        phone: card.phone?.trim() || '',
        email: card.email?.trim() || '',
        website: card.website?.trim() || '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', card.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      Alert.alert('Save failed', error.message);
      return;
    }

    setCard(data);
    setEditing(false);

    Alert.alert('Saved', 'Your card has been updated.');
  }

  function getCardUrl() {
    /*
      TEMPORARY URL

      You currently do not have your own public domain.
      We will replace this after creating the public card page.
    */
    return `https://yns-card-web.vercel.app/card/${
      card?.card_slug || 'karthik'
    }`;
  }

  async function handleShare() {
    if (!card) return;

    try {
      const message = [
        card.name || '',
        card.designation || '',
        card.company || '',
        '',
        `Phone: ${card.phone || ''}`,
        `Email: ${card.email || ''}`,
        `Website: ${card.website || ''}`,
        '',
        'View my digital card:',
        getCardUrl(),
      ].join('\n');

      await Share.share({
        message,
        title: `${card.name} - YNS CARD`,
      });
    } catch (error) {
      console.log('Share Card error:', error);

      Alert.alert(
        'Unable to share',
        'Something went wrong while sharing your card.'
      );
    }
  }

  async function handleSaveContact() {
    if (!card) return;

    try {
      const safeName = (card.name || 'contact')
        .replace(/[^a-zA-Z0-9]/g, '_');

      const fileName = `${safeName}.vcf`;

      const vCard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCard(card.name || '')}`,
        `ORG:${escapeVCard(card.company || '')}`,
        `TITLE:${escapeVCard(card.designation || '')}`,
        `TEL;TYPE=CELL:${escapeVCard(card.phone || '')}`,
        `EMAIL:${escapeVCard(card.email || '')}`,
        `URL:${escapeVCard(normalizeWebsite(card.website || ''))}`,
        'END:VCARD',
      ].join('\r\n');

      const file = new File(Paths.cache, fileName);

      file.write(vCard);

      const available = await Sharing.isAvailableAsync();

      if (!available) {
        Alert.alert(
          'Sharing unavailable',
          'Your device does not support contact sharing.'
        );
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/vcard',
        dialogTitle: 'Save Contact',
        UTI: 'public.vcard',
      });
    } catch (error) {
      console.log('Save Contact error:', error);

      Alert.alert(
        'Unable to save contact',
        error?.message ||
          'Something went wrong while creating the contact file.'
      );
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
        />

        <Text style={styles.loadingText}>
          Loading YNS Card...
        </Text>
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.authContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authLogo}>
            <Text style={styles.authBrand}>
              YNS CARD
            </Text>

            <Text style={styles.authSubtitle}>
              Your digital identity
            </Text>
          </View>

          <View style={styles.authCard}>
            <Text style={styles.authTitle}>
              {authMode === 'login'
                ? 'Welcome Back'
                : 'Create Account'}
            </Text>

            <Text style={styles.authDescription}>
              {authMode === 'login'
                ? 'Sign in to manage your digital business card.'
                : 'Create your YNS Card account and build your digital identity.'}
            </Text>

            <Text style={styles.inputLabel}>
              EMAIL
            </Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>
              PASSWORD
            </Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={styles.authButton}
              onPress={handleAuth}
              disabled={authLoading}
            >
              {authLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.authButtonText}>
                  {authMode === 'login'
                    ? 'Sign In'
                    : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchAuthButton}
              onPress={() =>
                setAuthMode(
                  authMode === 'login'
                    ? 'signup'
                    : 'login'
                )
              }
            >
              <Text style={styles.switchAuthText}>
                {authMode === 'login'
                  ? "Don't have an account? Create one"
                  : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (cardLoading || !card) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
        />

        <Text style={styles.loadingText}>
          Preparing your card...
        </Text>
      </View>
    );
  }

  if (editing) {
    return (
      <SafeAreaView style={styles.authSafeArea}>
        <StatusBar style="light" />

        <ScrollView
          contentContainerStyle={styles.editContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.editHeader}>
            <TouchableOpacity
              onPress={() => setEditing(false)}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>

            <Text style={styles.editTitle}>
              Edit Card
            </Text>

            <TouchableOpacity onPress={saveCard}>
              <Text style={styles.saveText}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editCard}>
            <EditField
              label="NAME"
              value={card.name || ''}
              onChangeText={(value) =>
                updateField('name', value)
              }
            />

            <EditField
              label="DESIGNATION"
              value={card.designation || ''}
              onChangeText={(value) =>
                updateField('designation', value)
              }
            />

            <EditField
              label="COMPANY"
              value={card.company || ''}
              onChangeText={(value) =>
                updateField('company', value)
              }
            />

            <EditField
              label="PHONE"
              value={card.phone || ''}
              onChangeText={(value) =>
                updateField('phone', value)
              }
              keyboardType="phone-pad"
            />

            <EditField
              label="EMAIL"
              value={card.email || ''}
              onChangeText={(value) =>
                updateField('email', value)
              }
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <EditField
              label="WEBSITE"
              value={card.website || ''}
              onChangeText={(value) =>
                updateField('website', value)
              }
              autoCapitalize="none"
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              YNS CARD
            </Text>

            <Text style={styles.subtitle}>
              Your digital identity
            </Text>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => {
              Alert.alert(
                'Account',
                session?.user?.email || 'Signed in',
                [
                  {
                    text: 'EDIT CARD',
                    onPress: () => setEditing(true),
                  },
                  {
                    text: 'SIGN OUT',
                    style: 'destructive',
                    onPress: handleLogout,
                  },
                  {
                    text: 'CANCEL',
                    style: 'cancel',
                  },
                ]
              );
            }}
          >
            <Text style={styles.menuText}>
              ⋮
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitial}>
              {card.name?.charAt(0)?.toUpperCase() || 'K'}
            </Text>
          </View>

          <Text style={styles.name}>
            {card.name}
          </Text>

          <Text style={styles.designation}>
            {card.designation}
          </Text>

          <Text style={styles.company}>
            {card.company}
          </Text>

          <View style={styles.divider} />

          <InfoRow
            icon="☎"
            label="PHONE"
            value={card.phone}
          />

          <InfoRow
            icon="✉"
            label="EMAIL"
            value={card.email}
          />

          <InfoRow
            icon="⌂"
            label="WEBSITE"
            value={card.website}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleShare}
            >
              <Text style={styles.primaryButtonText}>
                Share Card
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSaveContact}
            >
              <Text style={styles.secondaryButtonText}>
                Save Contact
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <QRCode
              value={getCardUrl()}
              size={105}
              backgroundColor="#FFFFFF"
              color="#111827"
            />
          </View>

          <Text style={styles.qrTitle}>
            Share your card instantly
          </Text>

          <Text style={styles.qrSubtitle}>
            Let people scan your QR code to view your digital card.
          </Text>

          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setQrVisible(true)}
          >
            <Text style={styles.qrButtonText}>
              View QR Code
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Powered by YUVARAJ NETWORKS & SOLUTIONS
        </Text>
      </ScrollView>

      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setQrVisible(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Your Digital Card
            </Text>

            <Text style={styles.modalSubtitle}>
              Scan this QR code to view the card
            </Text>

            <View style={styles.largeQr}>
              <QRCode
                value={getCardUrl()}
                size={240}
                backgroundColor="#FFFFFF"
                color="#111827"
              />
            </View>

            <Text style={styles.modalUrl}>
              Card ID: {card.card_slug}
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() =>
                setQrVisible(false)
              }
            >
              <Text style={styles.closeButtonText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function escapeVCard(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function normalizeWebsite(value) {
  if (!value) return '';

  if (
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }

  return `https://${value}`;
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.icon}>
        {icon}
      </Text>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value || '-'}
        </Text>
      </View>
    </View>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize = 'sentences',
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.inputLabel}>
        {label}
      </Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0B1020',
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: '#FFFFFF',
    marginTop: 15,
    fontSize: 14,
  },

  authSafeArea: {
    flex: 1,
    backgroundColor: '#0B1020',
  },

  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  authLogo: {
    alignItems: 'center',
    marginBottom: 30,
  },

  authBrand: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },

  authSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 6,
  },

  authCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 25,
  },

  authTitle: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
  },

  authDescription: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 25,
  },

  inputLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 15,
    color: '#111827',
    fontSize: 15,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
  },

  authButton: {
    backgroundColor: '#111827',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  authButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  switchAuthButton: {
    alignItems: 'center',
    marginTop: 20,
  },

  switchAuthText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '600',
  },

  editContainer: {
    padding: 20,
  },

  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  editTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  cancelText: {
    color: '#9CA3AF',
    fontSize: 14,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  editCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
  },

  editField: {
    marginBottom: 4,
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#0B1020',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },

  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 4,
  },

  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#171D30',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuText: {
    color: '#FFFFFF',
    fontSize: 25,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 25,
    alignItems: 'center',
  },

  profileCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  profileInitial: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },

  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  designation: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 5,
  },

  company: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginVertical: 22,
  },

  infoRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  icon: {
    fontSize: 22,
    width: 45,
    color: '#111827',
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  infoValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    marginTop: 2,
  },

  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 10,
  },

  primaryButton: {
    flex: 1,
    backgroundColor: '#111827',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#111827',
    fontWeight: '700',
  },

  qrSection: {
    backgroundColor: '#171D30',
    borderRadius: 22,
    marginTop: 20,
    padding: 25,
    alignItems: 'center',
  },

  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
  },

  qrTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 18,
  },

  qrSubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 20,
  },

  qrButton: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
  },

  qrButtonText: {
    color: '#111827',
    fontWeight: '700',
  },

  footer: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 10,
    marginTop: 25,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 380,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  modalSubtitle: {
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },

  largeQr: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    marginTop: 25,
    borderRadius: 15,
  },

  modalUrl: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 15,
    textAlign: 'center',
  },

  closeButton: {
    backgroundColor: '#111827',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
