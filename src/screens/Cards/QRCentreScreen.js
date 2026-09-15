import { useCallback, useRef, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ApprovalRequiredModal from '../../components/ApprovalRequiredModal';
import ApprovalStatusBadge from '../../components/ApprovalStatusBadge';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { getCurrentSession } from '../../services/authService';
import { getCards } from '../../services/cardService';
import { colors, radius, shadows, spacing, typography } from '../../theme';
import { getCardPublicAvailability, getPublicCardUrl } from '../../utils/cardPublicAccess';
import { safeGoBack } from '../../utils/navigation';

function safeFilePart(value) {
  return (
    String(value || 'card')
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'card'
  );
}

export default function QRCentreScreen({ navigation, route }) {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [approvalVisible, setApprovalVisible] = useState(false);
  const qrRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const session = await getCurrentSession();
      if (!session?.user) return;
      const items = await getCards(session.user.id);
      setCards(items);
      const requestedCardId = route.params?.cardId;
      if (requestedCardId) {
        const requested = items.find((item) => item.id === requestedCardId);
        if (!requested) {
          setSelectedCard(null);
          setError('The selected card could not be found. Return to My Cards and try again.');
          return;
        }
        setSelectedCard(requested);
        return;
      }
      setSelectedCard((current) => {
        return (
          items.find((item) => item.id === current?.id) ||
          items.find((item) => item.is_primary) ||
          items[0] ||
          null
        );
      });
    } catch {
      setError('We could not load your cards. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [route.params?.cardId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <LoadingState message="Preparing QR Centre…" />;
  if (error)
    return (
      <ErrorState
        title="QR Centre unavailable"
        message={error}
        actionLabel="Try Again"
        onAction={load}
        fullScreen
      />
    );
  if (!cards.length)
    return (
      <EmptyState
        title="No digital cards"
        message="Create a card before generating a QR code."
        actionLabel="Create Card"
        onAction={() => navigation.navigate('MyCards')}
        fullScreen
      />
    );

  const availability = getCardPublicAvailability(selectedCard);
  const publicUrl = availability.available ? getPublicCardUrl(selectedCard) : null;
  const unavailableState = getUnavailableState(selectedCard, availability);

  function handleUnavailable() {
    if (['draft', 'pending', 'rejected'].includes(selectedCard?.approval_status)) {
      setApprovalVisible(true);
    } else
      Alert.alert('Public sharing unavailable', availability.message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Card Settings',
          onPress: () => navigation.navigate('CardSettings', { cardId: selectedCard.id }),
        },
      ]);
  }

  async function copyLink() {
    if (working) return;
    if (!publicUrl) return handleUnavailable();
    setWorking('copy');
    try {
      await Clipboard.setStringAsync(publicUrl);
      Alert.alert('Link copied', 'Your approved public card URL is ready to paste.');
    } catch {
      Alert.alert('Unable to copy', 'Please try again.');
    } finally {
      setWorking('');
    }
  }

  async function shareCard() {
    if (working) return;
    if (!publicUrl) return handleUnavailable();
    setWorking('share');
    try {
      await Share.share({
        title: `${selectedCard.name || 'Digital Card'} — YNS Card`,
        message: `View my digital card: ${publicUrl}`,
        url: publicUrl,
      });
    } catch {
      Alert.alert('Unable to share', 'Please try again.');
    } finally {
      setWorking('');
    }
  }

  async function exportQr() {
    if (working) return;
    if (!publicUrl) return handleUnavailable();
    if (!qrRef.current) return;
    setWorking('qr');
    try {
      const base64 = await new Promise((resolve, reject) => {
        qrRef.current.toDataURL((value) => (value ? resolve(value) : reject(new Error('QR'))));
      });
      const uri = `${FileSystem.cacheDirectory}yns-card-${safeFilePart(selectedCard.card_slug)}.png`;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'QR image export is unavailable on this device.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Save or share your YNS Card QR code',
      });
    } catch {
      Alert.alert('Unable to export QR', 'The QR image could not be prepared. Please try again.');
    } finally {
      setWorking('');
    }
  }

  async function shareContact() {
    if (working) return;
    setWorking('contact');
    try {
      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${escapeVCard(selectedCard.name || 'YNS Contact')}`,
        selectedCard.company ? `ORG:${escapeVCard(selectedCard.company)}` : null,
        selectedCard.designation ? `TITLE:${escapeVCard(selectedCard.designation)}` : null,
        selectedCard.phone ? `TEL;TYPE=CELL:${escapeVCard(selectedCard.phone)}` : null,
        selectedCard.email ? `EMAIL;TYPE=INTERNET:${escapeVCard(selectedCard.email)}` : null,
        selectedCard.website ? `URL:${escapeVCard(selectedCard.website)}` : null,
        selectedCard.location ? `ADR;TYPE=WORK:;;${escapeVCard(selectedCard.location)};;;;` : null,
        'END:VCARD',
      ].filter(Boolean);
      const uri = `${FileSystem.cacheDirectory}yns-card-${safeFilePart(selectedCard.card_slug || selectedCard.id)}.vcf`;
      await FileSystem.writeAsStringAsync(uri, `${lines.join('\r\n')}\r\n`);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'Contact export is unavailable on this device.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'text/vcard',
        dialogTitle: 'Share contact',
      });
    } catch {
      Alert.alert('Unable to export contact', 'The contact file could not be prepared.');
    } finally {
      setWorking('');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeGoBack(navigation, { fallbackRoute: 'MyCards' })}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={25} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>QR Centre</Text>
          <Text style={styles.headerSubtitle}>Share your approved digital identity</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="qr-code-outline" size={23} color={colors.gold} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>CHOOSE CARD</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {cards.map((card) => {
            const active = card.id === selectedCard?.id;
            return (
              <TouchableOpacity
                key={card.id}
                style={[styles.cardChip, active && styles.cardChipActive]}
                onPress={() => setSelectedCard(card)}
              >
                <Text style={[styles.cardChipName, active && styles.cardChipNameActive]}>
                  {card.name || 'Digital Card'}
                </Text>
                <Text style={[styles.cardChipType, active && styles.cardChipTypeActive]}>
                  {card.card_type === 'personal' ? 'Personal' : 'Business'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.qrCard}>
          <ApprovalStatusBadge status={selectedCard?.approval_status} compact />
          <Text style={styles.cardName}>{selectedCard?.name || 'Digital Card'}</Text>
          {publicUrl ? (
            <>
              <View style={styles.qrFrame}>
                <QRCode
                  value={publicUrl}
                  size={210}
                  backgroundColor={colors.white}
                  color={colors.navyDeep}
                  getRef={(ref) => {
                    qrRef.current = ref;
                  }}
                />
              </View>
              <Text style={styles.publicUrl} numberOfLines={2}>
                {publicUrl}
              </Text>
              <View style={styles.readyRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.readyText}>Approved, public and active</Text>
              </View>
            </>
          ) : (
            <View style={styles.unavailable}>
              <Ionicons name="lock-closed-outline" size={34} color={colors.goldDark} />
              <Text style={styles.unavailableTitle}>{unavailableState.title}</Text>
              <Text style={styles.unavailableText}>{unavailableState.message}</Text>
              {selectedCard?.approval_status === 'rejected' && selectedCard.rejection_reason ? (
                <View style={styles.rejectionReason}>
                  <Text style={styles.rejectionLabel}>Rejection reason:</Text>
                  <Text style={styles.rejectionText}>{selectedCard.rejection_reason}</Text>
                </View>
              ) : null}
              <TouchableOpacity style={styles.resolveButton} onPress={handleUnavailable}>
                <Text style={styles.resolveText}>{unavailableState.action}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.actionGrid}>
          <Action icon="share-social-outline" label="Share Card" onPress={shareCard} />
          <Action icon="copy-outline" label="Copy Link" onPress={copyLink} />
          <Action icon="download-outline" label="Export QR" onPress={exportQr} />
          <Action icon="person-add-outline" label="Share Contact" onPress={shareContact} />
        </View>

        <View style={styles.nfcCard}>
          <View style={styles.nfcIcon}>
            <Ionicons name="radio-outline" size={24} color={colors.goldDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.nfcTitle}>NFC-ready public link</Text>
            <Text style={styles.nfcText}>
              Use Copy Link when programming a compatible NFC tag. NFC writing is not included yet.
            </Text>
          </View>
        </View>

        {working ? <Text style={styles.working}>Preparing {working}…</Text> : null}
      </ScrollView>

      <ApprovalRequiredModal
        visible={approvalVisible}
        card={selectedCard}
        onClose={() => setApprovalVisible(false)}
        onUpdated={load}
        onEdit={() => {
          setApprovalVisible(false);
          navigation.navigate('CardEditor', { cardId: selectedCard.id });
        }}
      />
    </SafeAreaView>
  );
}

function Action({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.action} onPress={onPress} accessibilityRole="button">
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={colors.navy} />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </TouchableOpacity>
  );
}

function escapeVCard(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/([,;])/g, '\\$1');
}

function getUnavailableState(card, availability) {
  if (card?.approval_status === 'draft') {
    return {
      title: 'Card approval required',
      message: 'Submit this card for administrator approval before sharing its public QR.',
      action: 'Request Approval',
    };
  }
  if (card?.approval_status === 'pending') {
    return {
      title: 'Waiting for approval',
      message: 'Your card has been submitted and is waiting for administrator approval.',
      action: 'View Status',
    };
  }
  if (card?.approval_status === 'rejected') {
    return {
      title: 'Card needs changes',
      message: 'Update the requested details, then submit this card for approval again.',
      action: 'Review & Request Again',
    };
  }
  if (availability.code === 'private') {
    return {
      title: 'Public sharing is disabled',
      message: availability.message,
      action: 'Open Card Settings',
    };
  }
  if (availability.code === 'inactive') {
    return {
      title: 'Card is inactive',
      message: availability.message,
      action: 'Open Card Settings',
    };
  }
  return {
    title: 'Public QR unavailable',
    message: availability.message,
    action: availability.code === 'approval' ? 'Review Approval' : 'Open Card Settings',
  };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    minHeight: 78,
    paddingHorizontal: spacing[18],
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  headerCopy: { flex: 1 },
  headerTitle: { ...typography.h2, color: colors.white },
  headerSubtitle: { ...typography.caption, color: '#C9D3DF', marginTop: 2 },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(244,185,31,.35)',
  },
  content: { padding: spacing[16], paddingBottom: spacing[48] },
  sectionLabel: { ...typography.label, marginBottom: spacing[8] },
  cardChip: {
    minWidth: 142,
    padding: spacing[12],
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing[8],
  },
  cardChipActive: { backgroundColor: colors.navy, borderColor: colors.gold },
  cardChipName: { ...typography.bodyMedium },
  cardChipNameActive: { color: colors.white },
  cardChipType: { ...typography.caption, marginTop: 3, textTransform: 'capitalize' },
  cardChipTypeActive: { color: '#C9D3DF' },
  qrCard: {
    marginTop: spacing[16],
    padding: spacing[20],
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.medium,
  },
  cardName: { ...typography.h2, marginTop: spacing[10], textAlign: 'center' },
  qrFrame: {
    padding: spacing[16],
    marginTop: spacing[14],
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.gold,
  },
  publicUrl: {
    ...typography.small,
    color: colors.blue,
    marginTop: spacing[14],
    textAlign: 'center',
  },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing[10] },
  readyText: { ...typography.caption, color: colors.success },
  unavailable: {
    alignItems: 'center',
    paddingVertical: spacing[28],
    paddingHorizontal: spacing[12],
  },
  unavailableTitle: { ...typography.h3, marginTop: spacing[10] },
  unavailableText: { ...typography.small, textAlign: 'center', marginTop: spacing[6] },
  rejectionReason: {
    width: '100%',
    marginTop: spacing[12],
    padding: spacing[12],
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  rejectionLabel: { ...typography.label, color: colors.danger },
  rejectionText: { ...typography.small, color: colors.danger, marginTop: spacing[4] },
  resolveButton: {
    marginTop: spacing[16],
    backgroundColor: colors.goldSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[10],
  },
  resolveText: { ...typography.button, color: colors.navy },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[10], marginTop: spacing[14] },
  action: {
    width: '48%',
    minHeight: 78,
    padding: spacing[12],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { ...typography.bodyMedium, flex: 1 },
  nfcCard: {
    flexDirection: 'row',
    gap: spacing[12],
    padding: spacing[16],
    marginTop: spacing[14],
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  nfcIcon: {
    width: 45,
    height: 45,
    borderRadius: radius.md,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcTitle: { ...typography.bodyMedium, color: colors.white },
  nfcText: { ...typography.caption, color: '#C9D3DF', marginTop: 3 },
  working: { ...typography.caption, textAlign: 'center', marginTop: spacing[12] },
});
