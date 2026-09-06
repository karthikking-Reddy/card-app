import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import {
  approveCard,
  getPendingCardApprovals,
  rejectCard,
} from '../../services/cardApprovalService';
import { getCurrentProfile, isAdminUser } from '../../services/profileService';

export default function AdminApprovalsScreen({ navigation }) {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [denied, setDenied] = useState(false),
    [actingId, setActingId] = useState(null),
    [rejecting, setRejecting] = useState(null),
    [reason, setReason] = useState(''),
    [summary, setSummary] = useState({ approved: 0, rejected: 0 });
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setDenied(true);
    setItems([]);
    try {
      const profile = await getCurrentProfile();
      if (!isAdminUser(profile)) {
        setDenied(true);
        return;
      }
      setDenied(false);
      setItems(await getPendingCardApprovals());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [a, r] = await Promise.all([
        supabase
          .from('digital_cards')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'approved')
          .gte('approved_at', today.toISOString()),
        supabase
          .from('digital_cards')
          .select('id', { count: 'exact', head: true })
          .eq('approval_status', 'rejected'),
      ]);
      setSummary({ approved: a.count || 0, rejected: r.count || 0 });
    } catch {
      Alert.alert('Unable to load approvals', 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
  function confirmApprove(card) {
    Alert.alert('Approve Card', 'Approve this card for public sharing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => runApprove(card) },
    ]);
  }
  async function runApprove(card) {
    if (actingId) return;
    setActingId(card.id);
    try {
      await approveCard(card.id);
      setItems((v) => v.filter((x) => x.id !== card.id));
      setSummary((v) => ({ ...v, approved: v.approved + 1 }));
      Alert.alert('Approved', 'Card approved successfully.');
    } catch {
      Alert.alert('Unable to approve', 'Please try again.');
    } finally {
      setActingId(null);
    }
  }
  async function runReject() {
    const clean = reason.trim();
    if (!clean) return Alert.alert('Reason required', 'Enter a reason for rejection.');
    if (actingId) return;
    setActingId(rejecting.id);
    try {
      await rejectCard(rejecting.id, clean);
      setItems((v) => v.filter((x) => x.id !== rejecting.id));
      setSummary((v) => ({ ...v, rejected: v.rejected + 1 }));
      setRejecting(null);
      setReason('');
      Alert.alert('Rejected', 'The card owner can now update and resubmit the card.');
    } catch {
      Alert.alert('Unable to reject', 'Please try again.');
    } finally {
      setActingId(null);
    }
  }
  if (loading)
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color="#F6B91A" />
      </View>
    );
  return (
    <SafeAreaView style={s.safe}>
      <Header navigation={navigation} />
      {denied ? (
        <View style={s.empty}>
          <Ionicons name="lock-closed" size={40} color="#DC2626" />
          <Text style={s.emptyTitle}>Administrator access required</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#F6B91A"
            />
          }
        >
          <View style={s.summary}>
            <Summary label="Pending" value={items.length} color="#F6B91A" />
            <Summary label="Approved Today" value={summary.approved} color="#16A34A" />
            <Summary label="Rejected" value={summary.rejected} color="#DC2626" />
          </View>
          <Text style={s.sectionTitle}>PENDING REVIEW</Text>
          {items.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={38} color="#16A34A" />
              <Text style={s.emptyTitle}>All caught up</Text>
            </View>
          ) : (
            items.map((card) => (
              <Card
                key={card.id}
                card={card}
                busy={actingId === card.id}
                preview={() => navigation.navigate('AdminCardPreview', { cardId: card.id, card })}
                approve={() => confirmApprove(card)}
                reject={() => {
                  setRejecting(card);
                  setReason('');
                }}
              />
            ))
          )}
        </ScrollView>
      )}
      <Modal
        visible={Boolean(rejecting)}
        transparent
        animationType="slide"
        onRequestClose={() => !actingId && setRejecting(null)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Reject Card</Text>
            <Text style={s.modalSub}>Reason for rejection</Text>
            <TextInput
              style={s.input}
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder="Incorrect phone number, profile image needs improvement..."
              placeholderTextColor="#98A2B3"
              maxLength={500}
            />
            <TouchableOpacity
              style={s.rejectPrimary}
              onPress={runReject}
              disabled={Boolean(actingId)}
            >
              {actingId ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={s.rejectText}>Reject Card</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={s.cancel}
              onPress={() => setRejecting(null)}
              disabled={Boolean(actingId)}
            >
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
function Header({ navigation }) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={25} color="#FFF" />
      </TouchableOpacity>
      <View>
        <Text style={s.brand}>YNS CARD</Text>
        <Text style={s.title}>Card Approvals</Text>
      </View>
      <View style={{ width: 25 }} />
    </View>
  );
}
function Summary({ label, value, color }) {
  return (
    <View style={s.summaryCard}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.value}>{value}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}
function Card({ card, busy, preview, approve, reject }) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        {card.profile_image_url ? (
          <Image source={{ uri: card.profile_image_url }} style={s.avatar} />
        ) : (
          <View style={s.avatarFallback}>
            <Text style={s.initial}>{card.name?.charAt(0)?.toUpperCase() || 'Y'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{card.name || 'Digital Card'}</Text>
          <Text style={s.detail}>
            {card.designation || 'No designation'}
            {card.company ? ` • ${card.company}` : ''}
          </Text>
          <Text style={s.detail}>
            {card.email || 'No email'} • {card.phone || 'No phone'}
          </Text>
        </View>
      </View>
      <Text style={s.slug}>/card/{card.card_slug}</Text>
      <Text style={s.requested}>
        Requested{' '}
        {card.approval_requested_at
          ? new Date(card.approval_requested_at).toLocaleString()
          : 'Not available'}
      </Text>
      <View style={s.actions}>
        <Button text="Preview" style={s.preview} textStyle={s.previewText} onPress={preview} />
        <Button
          text={busy ? 'Working...' : 'Approve'}
          style={s.approve}
          textStyle={s.approveText}
          onPress={approve}
          disabled={busy}
        />
        <Button
          text="Reject"
          style={s.reject}
          textStyle={s.rejectOutlineText}
          onPress={reject}
          disabled={busy}
        />
      </View>
    </View>
  );
}
function Button({ text, style, textStyle, ...props }) {
  return (
    <TouchableOpacity style={[s.button, style]} {...props}>
      <Text style={textStyle}>{text}</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FB' },
  loading: { flex: 1, backgroundColor: '#06162D', alignItems: 'center', justifyContent: 'center' },
  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    backgroundColor: '#06162D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(246,185,26,.3)',
  },
  brand: {
    color: '#F6B91A',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  title: { color: '#FFF', fontSize: 19, fontWeight: '900' },
  container: { padding: 16, paddingBottom: 50 },
  summary: { flexDirection: 'row', gap: 8 },
  summaryCard: {
    flex: 1,
    minHeight: 92,
    backgroundColor: '#FFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    padding: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  value: { color: '#06162D', fontSize: 23, fontWeight: '900', marginTop: 8 },
  label: { color: '#667085', fontSize: 8, fontWeight: '800' },
  sectionTitle: {
    color: '#06162D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 9,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    padding: 15,
    marginBottom: 11,
  },
  cardTop: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  avatar: { width: 54, height: 54, borderRadius: 18 },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: '#06162D', fontSize: 20, fontWeight: '900' },
  name: { color: '#06162D', fontSize: 15, fontWeight: '900' },
  detail: { color: '#667085', fontSize: 9, marginTop: 3 },
  slug: { color: '#C98B16', fontSize: 10, fontWeight: '800', marginTop: 12 },
  requested: { color: '#98A2B3', fontSize: 9, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 7, marginTop: 13 },
  button: {
    flex: 1,
    minHeight: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { borderWidth: 1, borderColor: '#D0D5DD' },
  previewText: { color: '#06162D', fontSize: 10, fontWeight: '800' },
  approve: { backgroundColor: '#F6B91A' },
  approveText: { color: '#06162D', fontSize: 10, fontWeight: '900' },
  reject: { borderWidth: 1, borderColor: '#FCA5A5' },
  rejectOutlineText: { color: '#DC2626', fontSize: 10, fontWeight: '900' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 28, alignItems: 'center' },
  emptyTitle: { color: '#06162D', fontSize: 17, fontWeight: '900', marginTop: 10 },
  overlay: { flex: 1, backgroundColor: 'rgba(6,22,45,.72)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 36,
  },
  modalTitle: { color: '#06162D', fontSize: 21, fontWeight: '900' },
  modalSub: { color: '#667085', fontSize: 11, fontWeight: '800', marginTop: 15, marginBottom: 7 },
  input: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 13,
    color: '#06162D',
    textAlignVertical: 'top',
  },
  rejectPrimary: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  rejectText: { color: '#FFF', fontWeight: '900' },
  cancel: { minHeight: 45, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#667085', fontWeight: '800' },
});
