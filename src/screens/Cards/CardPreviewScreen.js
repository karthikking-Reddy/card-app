import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import ApprovalStatusBadge from '../../components/ApprovalStatusBadge';
import { ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { getCurrentSession } from '../../services/authService';
import { getCard, getCardById } from '../../services/cardService';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getCardPublicAvailability, getPublicCardUrl } from '../../utils/cardPublicAccess';

const THEME_COLORS = {
  standard: [colors.navy, '#0C3157'],
  gold: ['#5B3B03', colors.navyDeep],
  ocean: ['#075985', '#0C4A6E'],
};

export default function CardPreviewScreen({ navigation, route }) {
  const [card, setCard] = useState(route.params?.draftCard || null);
  const [loading, setLoading] = useState(!route.params?.draftCard);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (route.params?.draftCard) {
      setCard(route.params.draftCard);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await getCurrentSession();
      if (!session?.user) return;
      const value = route.params?.cardId
        ? await getCardById(session.user.id, route.params.cardId)
        : await getCard(session.user.id);
      setCard(value);
    } catch {
      setError('We could not prepare this card preview.');
    } finally {
      setLoading(false);
    }
  }, [route.params?.cardId, route.params?.draftCard]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <LoadingState message="Preparing card preview…" />;
  if (error || !card)
    return (
      <ErrorState
        title="Preview unavailable"
        message={error || 'This card could not be found.'}
        actionLabel="Try Again"
        onAction={load}
        fullScreen
      />
    );

  const availability = getCardPublicAvailability(card);
  const publicUrl = availability.available ? getPublicCardUrl(card) : null;
  const palette = THEME_COLORS[card.theme] || THEME_COLORS.standard;

  function openPublicCard() {
    if (!publicUrl) {
      Alert.alert('Public card unavailable', availability.message);
      return;
    }
    Linking.openURL(publicUrl);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={25} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Card Preview</Text>
          <Text style={styles.headerSubtitle}>Authenticated in-app preview</Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('CardEditor', { cardId: card.id })}
        >
          <Ionicons name="create-outline" size={20} color={colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.availability,
            availability.available ? styles.available : styles.restricted,
          ]}
        >
          <Ionicons
            name={availability.available ? 'globe-outline' : 'eye-off-outline'}
            size={18}
            color={availability.available ? colors.success : colors.warning}
          />
          <View style={styles.flex}>
            <Text style={styles.availabilityTitle}>
              {availability.available ? 'Live public card' : 'Preview only'}
            </Text>
            <Text style={styles.availabilityText}>
              {availability.available
                ? 'This card is approved, public and active.'
                : availability.message}
            </Text>
          </View>
        </View>

        <LinearGradient colors={palette} style={styles.preview}>
          <View style={styles.previewTop}>
            <Text style={styles.brand}>YNS CARD</Text>
            <ApprovalStatusBadge status={card.approval_status} compact />
          </View>

          <View style={styles.identity}>
            {card.profile_image_url ? (
              <Image source={{ uri: card.profile_image_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.initial}>{card.name?.charAt(0)?.toUpperCase() || 'Y'}</Text>
              </View>
            )}
            <Text style={styles.name}>{card.name || 'Digital Card'}</Text>
            <Text style={styles.designation}>
              {card.designation || (card.card_type === 'personal' ? 'Professional' : 'Business')}
            </Text>
            {card.company ? <Text style={styles.company}>{card.company}</Text> : null}
            {card.tagline ? <Text style={styles.tagline}>“{card.tagline}”</Text> : null}
          </View>

          <View style={styles.contactGrid}>
            <Contact icon="call-outline" value={card.phone} />
            <Contact icon="mail-outline" value={card.email} />
            <Contact icon="globe-outline" value={card.website} />
            <Contact icon="location-outline" value={card.location} />
          </View>

          {card.bio ? (
            <View style={styles.about}>
              <Text style={styles.aboutLabel}>ABOUT</Text>
              <Text style={styles.aboutText}>{card.bio}</Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={styles.stateRow}>
          <State label={card.card_type === 'personal' ? 'Personal' : 'Business'} />
          <State label={card.is_public ? 'Public' : 'Private'} active={card.is_public} />
          <State label={card.is_active ? 'Active' : 'Inactive'} active={card.is_active} />
          <State label={card.theme || 'Standard'} />
        </View>

        <TouchableOpacity
          style={[styles.publicButton, !publicUrl && styles.publicButtonDisabled]}
          onPress={openPublicCard}
        >
          <Ionicons name="open-outline" size={20} color={colors.white} />
          <Text style={styles.publicButtonText}>
            {publicUrl ? 'Open Live Public Card' : 'Public Card Unavailable'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Contact({ icon, value }) {
  if (!value) return null;
  return (
    <View style={styles.contact}>
      <Ionicons name={icon} size={17} color={colors.gold} />
      <Text numberOfLines={1} style={styles.contactText}>
        {value}
      </Text>
    </View>
  );
}

function State({ label, active = true }) {
  return (
    <View style={styles.state}>
      <View style={[styles.dot, !active && styles.dotInactive]} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    minHeight: 72,
    paddingHorizontal: spacing[18],
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  headerCopy: { flex: 1 },
  headerTitle: { ...typography.h2, color: colors.white },
  headerSubtitle: { ...typography.caption, color: '#C9D3DF' },
  editButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(244,185,31,.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: spacing[16], paddingBottom: spacing[48] },
  availability: {
    flexDirection: 'row',
    gap: spacing[10],
    padding: spacing[14],
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  available: { backgroundColor: colors.successSoft, borderColor: '#B7E4D1' },
  restricted: { backgroundColor: colors.warningSoft, borderColor: '#FED7AA' },
  availabilityTitle: { ...typography.bodyMedium },
  availabilityText: { ...typography.caption, marginTop: 2 },
  preview: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    padding: spacing[20],
    ...shadows.medium,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { ...typography.label, color: colors.gold, letterSpacing: 1.3 },
  identity: { alignItems: 'center', paddingVertical: spacing[24] },
  avatar: { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: colors.gold },
  avatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.gold,
  },
  initial: { ...typography.display, color: colors.navy },
  name: { ...typography.display, color: colors.white, textAlign: 'center', marginTop: spacing[14] },
  designation: { ...typography.bodyMedium, color: '#DCE5EF', marginTop: 3, textAlign: 'center' },
  company: { ...typography.small, color: colors.gold, marginTop: 4, textAlign: 'center' },
  tagline: { ...typography.small, color: '#DCE5EF', marginTop: spacing[10], textAlign: 'center' },
  contactGrid: { gap: spacing[8] },
  contact: {
    minHeight: 44,
    paddingHorizontal: spacing[12],
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
  },
  contactText: { ...typography.small, color: colors.white, flex: 1 },
  about: {
    marginTop: spacing[18],
    paddingTop: spacing[16],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,.15)',
  },
  aboutLabel: { ...typography.label, color: colors.gold },
  aboutText: { ...typography.small, color: '#DCE5EF', marginTop: spacing[6] },
  stateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8], marginTop: spacing[14] },
  state: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[8],
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  dotInactive: { backgroundColor: colors.textMuted },
  stateText: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },
  publicButton: {
    marginTop: spacing[16],
    minHeight: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  publicButtonDisabled: { opacity: 0.55 },
  publicButtonText: { ...typography.button, color: colors.white },
});
