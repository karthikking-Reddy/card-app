import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { getCurrentSession } from '../../services/authService';
import { getCard, getCardById, updateCard } from '../../services/cardService';
import { uploadProfileImage, removeProfileImages } from '../../services/storageService';

export default function CardScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    designation: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    whatsapp: '',
    tagline: '',
    bio: '',
    industry: '',
    location: '',
  });

  useEffect(() => {
    load();
  }, [route.params?.cardId]);

  async function load() {
    try {
      const session = await getCurrentSession();

      if (!session?.user) return;

      setUser(session.user);

      const currentCard = route.params?.cardId
        ? await getCardById(session.user.id, route.params.cardId)
        : await getCard(session.user.id);
      setCard(currentCard);

      setForm({
        name: currentCard.name || '',
        designation: currentCard.designation || '',
        company: currentCard.company || '',
        phone: currentCard.phone || '',
        email: currentCard.email || '',
        website: currentCard.website || '',
        whatsapp: currentCard.whatsapp || currentCard.phone || '',
        tagline: currentCard.tagline || '',
        bio: currentCard.bio || '',
        industry: currentCard.industry || '',
        location: currentCard.location || '',
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  function change(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  async function save() {
    if (!user || !card) return;

    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    setSaving(true);

    try {
      const updated = await updateCard(user.id, card.id, {
        name: form.name.trim(),
        designation: form.designation.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        whatsapp: form.whatsapp.trim(),
        tagline: form.tagline.trim(),
        bio: form.bio.trim(),
        industry: form.industry.trim(),
        location: form.location.trim(),
      });

      setCard(updated);

      Alert.alert('Saved', 'Your digital card has been updated successfully.');
    } catch (error) {
      Alert.alert('Save failed', error.message);
    } finally {
      setSaving(false);
    }
  }

  async function pickProfilePhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      setSaving(true);

      const publicUrl = await uploadProfileImage(user.id, card.id, asset);

      const updated = await updateCard(user.id, card.id, {
        profile_image_url: publicUrl,
      });

      setCard(updated);
    } catch {
      Alert.alert('Upload failed', 'The profile image could not be uploaded. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmRemovePhoto() {
    Alert.alert('Remove profile photo?', 'Your current profile photo will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: removePhoto,
      },
    ]);
  }

  async function removePhoto() {
    try {
      setSaving(true);

      await removeProfileImages(user.id, card.id);

      const updated = await updateCard(user.id, card.id, {
        profile_image_url: null,
      });

      setCard(updated);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
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

        <Text style={styles.headerTitle}>Edit Card</Text>

        <TouchableOpacity onPress={save}>
          <Text style={styles.saveTop}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.photoSection}>
          {card?.profile_image_url ? (
            <Image source={{ uri: card.profile_image_url }} style={styles.photo} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.initial}>{form.name?.charAt(0)?.toUpperCase() || 'Y'}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.photoButton} onPress={pickProfilePhoto}>
            <Ionicons name="camera-outline" size={18} color="#06162D" />
            <Text style={styles.photoButtonText}>Change Photo</Text>
          </TouchableOpacity>

          {card?.profile_image_url ? (
            <TouchableOpacity onPress={confirmRemovePhoto}>
              <Text style={styles.removeText}>Remove Photo</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.previewButton}
          onPress={() =>
            navigation.navigate('CardPreview', { cardId: card.id, draftCard: { ...card, ...form } })
          }
        >
          <Ionicons name="eye-outline" size={20} color="#06162D" />
          <Text style={styles.previewButtonText}>Preview Unsaved Changes</Text>
        </TouchableOpacity>

        <Section title="IDENTITY">
          <Field label="Name" value={form.name} onChangeText={(value) => change('name', value)} />

          <Field
            label="Designation"
            value={form.designation}
            onChangeText={(value) => change('designation', value)}
          />

          <Field
            label="Company"
            value={form.company}
            onChangeText={(value) => change('company', value)}
          />

          <Field
            label="Tagline"
            value={form.tagline}
            onChangeText={(value) => change('tagline', value)}
            placeholder="Your business tagline"
          />

          <Field
            label="Industry"
            value={form.industry}
            onChangeText={(value) => change('industry', value)}
            placeholder="Digital Marketing, Technology..."
          />
        </Section>

        <Section title="CONTACT">
          <Field
            label="Phone"
            value={form.phone}
            onChangeText={(value) => change('phone', value)}
            keyboardType="phone-pad"
          />

          <Field
            label="WhatsApp"
            value={form.whatsapp}
            onChangeText={(value) => change('whatsapp', value)}
            keyboardType="phone-pad"
          />

          <Field
            label="Email"
            value={form.email}
            onChangeText={(value) => change('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Field
            label="Website"
            value={form.website}
            onChangeText={(value) => change('website', value)}
            autoCapitalize="none"
          />

          <Field
            label="Location"
            value={form.location}
            onChangeText={(value) => change('location', value)}
            placeholder="Hyderabad, Telangana"
          />
        </Section>

        <Section title="ABOUT">
          <Field
            label="Bio"
            value={form.bio}
            onChangeText={(value) => change('bio', value)}
            placeholder="Tell visitors about yourself or your business"
            multiline
          />
        </Section>

        <Section title="CARD CONTENT">
          <ManagementLink
            icon="share-social-outline"
            label="Social Links"
            onPress={() => navigation.navigate('SocialLinks', { cardId: card.id })}
          />
          <ManagementLink
            icon="briefcase-outline"
            label="Services"
            onPress={() => navigation.navigate('Services', { cardId: card.id })}
          />
          <ManagementLink
            icon="images-outline"
            label="Portfolio"
            onPress={() => navigation.navigate('Portfolio', { cardId: card.id })}
          />
          <ManagementLink
            icon="albums-outline"
            label="Custom Sections"
            onPress={() => navigation.navigate('BlockBuilder', { cardId: card.id })}
          />
          <ManagementLink
            icon="color-palette-outline"
            label="Appearance & Visibility"
            onPress={() => navigation.navigate('CardSettings', { cardId: card.id })}
          />
          <ManagementLink
            icon="qr-code-outline"
            label="QR Centre"
            onPress={() => navigation.navigate('QRCentre', { cardId: card.id })}
            last
          />
        </Section>

        <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={21} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Card</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Field({ label, multiline, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholderTextColor="#98A2B3"
      />
    </View>
  );
}

function ManagementLink({ icon, label, onPress, last }) {
  return (
    <TouchableOpacity
      style={[styles.managementLink, last && styles.managementLinkLast]}
      onPress={onPress}
    >
      <View style={styles.managementIcon}>
        <Ionicons name={icon} size={19} color="#06162D" />
      </View>
      <Text style={styles.managementText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#98A2B3" />
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
  saveTop: {
    fontWeight: '900',
    color: '#F6B91A',
  },
  container: {
    padding: 16,
    paddingBottom: 70,
  },
  photoSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,

    borderWidth: 1,
    borderColor: '#E6EAF0',
    shadowColor: '#06162D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.045,
    shadowRadius: 10,
    elevation: 2,
  },
  previewButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#FFF4D6',
    borderWidth: 1,
    borderColor: '#F6B91A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  previewButtonText: { color: '#06162D', fontWeight: '800' },
  managementLink: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  managementLinkLast: { borderBottomWidth: 0 },
  managementIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managementText: { flex: 1, color: '#06162D', fontWeight: '700' },
  photo: {
    width: 105,
    height: 105,
    borderRadius: 53,

    borderWidth: 3,
    borderColor: '#F6B91A',
  },
  placeholder: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: '#06162D',
    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 3,
    borderColor: '#F6B91A',
  },
  initial: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
  },
  photoButton: {
    marginTop: 15,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    backgroundColor: '#FFF4D6',
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F6B91A',
  },
  photoButtonText: {
    fontWeight: '700',
    color: '#06162D',
  },
  removeText: {
    marginTop: 12,
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '800',
    color: '#667085',
    marginBottom: 9,
  },
  sectionCard: {
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
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E6EAF0',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#06162D',
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 25,
    backgroundColor: '#06162D',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F6B91A',
    shadowColor: '#06162D',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 4,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
