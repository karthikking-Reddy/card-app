import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';

const C = {
  navy: '#06162D',
  gold: '#F6B91A',
  white: '#FFF',
  bg: '#F5F7FB',
  text: '#071A33',
  text2: '#667085',
  muted: '#98A2B3',
  border: '#E6EAF0',
  blue: '#0866FF',
  blueSoft: '#EFF6FF',
  green: '#16A34A',
  greenSoft: '#ECFDF3',
  purple: '#7C3AED',
  purpleSoft: '#F5F3FF',
  orange: '#EA7B00',
  orangeSoft: '#FFF7ED',
  red: '#DC2626',
  redSoft: '#FEF2F2',
};

export default function ConnectionsScreen({ navigation }) {
  const [loading, setLoading] = useState(true),
    [refreshing, setRefreshing] = useState(false),
    [user, setUser] = useState(null),
    [leads, setLeads] = useState([]),
    [stages, setStages] = useState([]),
    [cards, setCards] = useState([]),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [modal, setModal] = useState(false),
    [saving, setSaving] = useState(false),
    [form, setForm] = useState({ name: '', phone: '', email: '', company: '', requirement: '' });
  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = session?.user;
      if (!u) return;
      setUser(u);
      const [lr, sr, cr] = await Promise.all([
        supabase
          .from('connections')
          .select('*')
          .eq('owner_user_id', u.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('lead_stages')
          .select('*')
          .eq('user_id', u.id)
          .order('sort_order', { ascending: true }),
        supabase
          .from('digital_cards')
          .select('id,name,is_primary')
          .eq('user_id', u.id)
          .order('is_primary', { ascending: false }),
      ]);
      if (lr.error) throw lr.error;
      if (sr.error) throw sr.error;
      if (cr.error) throw cr.error;
      setLeads(lr.data || []);
      setStages(sr.data || []);
      setCards(cr.data || []);
    } catch (e) {
      Alert.alert('Unable to load leads', e?.message || 'Please try again.');
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
  const wonKeys = useMemo(
    () => new Set(stages.filter((x) => x.is_won).map((x) => x.stage_key)),
    [stages]
  );
  const lostKeys = useMemo(
    () => new Set(stages.filter((x) => x.is_lost).map((x) => x.stage_key)),
    [stages]
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      const mq =
        !q ||
        [l.name, l.phone, l.email, l.company, l.requirement].some((v) =>
          String(v || '')
            .toLowerCase()
            .includes(q)
        );
      return mq && (filter === 'all' || l.stage === filter);
    });
  }, [leads, search, filter]);
  const open = leads.filter((l) => !wonKeys.has(l.stage) && !lostKeys.has(l.stage)).length,
    won = leads.filter((l) => wonKeys.has(l.stage)).length,
    lost = leads.filter((l) => lostKeys.has(l.stage)).length;
  async function addLead() {
    if (!form.name.trim()) return Alert.alert('Name required', 'Enter the lead name.');
    const card = cards.find((x) => x.is_primary) || cards[0];
    if (!card) return Alert.alert('Card required', 'Create a digital card first.');
    setSaving(true);
    try {
      const st =
        stages.find((x) => x.stage_key === 'new' && x.is_active) || stages.find((x) => x.is_active);
      const { error } = await supabase.from('connections').insert({
        owner_user_id: user.id,
        card_id: card.id,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        company: form.company.trim() || null,
        requirement: form.requirement.trim() || null,
        stage: st?.stage_key || 'new',
        source: 'mobile_app',
        source_detail: 'manual',
        priority: 'normal',
      });
      if (error) throw error;
      setModal(false);
      setForm({ name: '', phone: '', email: '', company: '', requirement: '' });
      await load(true);
    } catch (e) {
      Alert.alert('Unable to add lead', e.message);
    } finally {
      setSaving(false);
    }
  }
  if (loading)
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  return (
    <View style={s.root}>
      <LinearGradient colors={['#06162D', '#0B2447']} style={s.headerBg} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={C.gold}
            />
          }
        >
          <View style={s.header}>
            <View>
              <Text style={s.title}>Connections</Text>
              <Text style={s.subtitle}>Manage your leads & customers</Text>
            </View>
            <TouchableOpacity style={s.addTop} onPress={() => setModal(true)}>
              <Ionicons name="add" size={30} color={C.gold} />
            </TouchableOpacity>
          </View>
          <View style={s.body}>
            <View style={s.searchRow}>
              <View style={s.searchBox}>
                <Ionicons name="search-outline" size={21} color={C.text2} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search leads by name, phone or email..."
                  placeholderTextColor={C.muted}
                  style={s.searchInput}
                />
              </View>
              <TouchableOpacity style={s.filterBtn} onPress={() => setFilter('all')}>
                <Ionicons name="options-outline" size={22} color={C.text} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.summaryRow}
            >
              <Summary icon="people-outline" label="Total Leads" value={leads.length} tone="blue" />
              <Summary icon="briefcase-outline" label="Open" value={open} tone="green" />
              <Summary icon="trophy-outline" label="Won" value={won} tone="purple" />
              <Summary icon="person-remove-outline" label="Lost" value={lost} tone="red" />
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 14 }}
              contentContainerStyle={{ gap: 8 }}
            >
              <Chip label="All Leads" active={filter === 'all'} onPress={() => setFilter('all')} />
              {stages
                .filter((x) => x.is_active)
                .map((st) => (
                  <Chip
                    key={st.id}
                    label={st.label}
                    active={filter === st.stage_key}
                    onPress={() => setFilter(st.stage_key)}
                  />
                ))}
            </ScrollView>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recent Leads</Text>
              <Text style={s.sortText}>Newest</Text>
            </View>
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="people-outline" size={38} color={C.muted} />
                <Text style={s.emptyTitle}>No leads found</Text>
                <Text style={s.emptyText}>Add a new lead or change your filters.</Text>
              </View>
            ) : (
              filtered.map((lead) => (
                <Lead
                  key={lead.id}
                  lead={lead}
                  stages={stages}
                  onPress={() => {
                    const parent = navigation.getParent?.();
                    parent
                      ? parent.navigate('LeadDetail', { connectionId: lead.id })
                      : navigation.navigate('LeadDetail', { connectionId: lead.id });
                  }}
                />
              ))
            )}
            <TouchableOpacity style={s.addLead} onPress={() => setModal(true)}>
              <Ionicons name="add" size={23} color="#FFF" />
              <Text style={s.addLeadText}>Add New Lead</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
      <Modal
        visible={modal}
        transparent
        animationType="slide"
        onRequestClose={() => setModal(false)}
      >
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHead}>
              <View>
                <Text style={s.modalTitle}>Add New Lead</Text>
                <Text style={s.modalSub}>Create a connection in YNS CRM</Text>
              </View>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={26} color={C.text} />
              </TouchableOpacity>
            </View>
            {[
              ['NAME', 'name'],
              ['PHONE', 'phone'],
              ['EMAIL', 'email'],
              ['COMPANY', 'company'],
              ['REQUIREMENT', 'requirement'],
            ].map(([label, key]) => (
              <View key={key}>
                <Text style={s.label}>{label}</Text>
                <TextInput
                  value={form[key]}
                  onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  placeholderTextColor={C.muted}
                  keyboardType={
                    key === 'phone' ? 'phone-pad' : key === 'email' ? 'email-address' : 'default'
                  }
                  autoCapitalize={key === 'email' ? 'none' : 'sentences'}
                  multiline={key === 'requirement'}
                  style={[
                    s.input,
                    key === 'requirement' && {
                      height: 80,
                      textAlignVertical: 'top',
                      paddingTop: 12,
                    },
                  ]}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[s.save, saving && { opacity: 0.6 }]}
              disabled={saving}
              onPress={addLead}
            >
              <Text style={s.saveText}>{saving ? 'Saving...' : 'Save Lead'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
function palette(t) {
  if (t === 'green') return [C.green, C.greenSoft];
  if (t === 'purple') return [C.purple, C.purpleSoft];
  if (t === 'red') return [C.red, C.redSoft];
  return [C.blue, C.blueSoft];
}
function Summary({ icon, label, value, tone }) {
  const [main, soft] = palette(tone);
  return (
    <View style={[s.summaryCard, { backgroundColor: soft, borderColor: main + '22' }]}>
      <View style={s.sumIcon}>
        <Ionicons name={icon} size={23} color={main} />
      </View>
      <Text style={s.sumLabel}>{label}</Text>
      <Text style={s.sumValue}>{value}</Text>
    </View>
  );
}
function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[s.chip, active && s.chipActive]} onPress={onPress}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function stageTone(v) {
  v = String(v || '').toLowerCase();
  if (v.includes('convert') || v.includes('won')) return [C.green, C.greenSoft];
  if (v.includes('lost') || v.includes('dead')) return [C.red, C.redSoft];
  if (v.includes('follow') || v.includes('contact')) return [C.orange, C.orangeSoft];
  return [C.blue, C.blueSoft];
}
function Lead({ lead, stages, onPress }) {
  const st = stages.find((x) => x.stage_key === lead.stage);
  const [main, soft] = stageTone(st?.label || lead.stage);
  return (
    <TouchableOpacity style={s.lead} onPress={onPress}>
      <View style={s.leadAvatar}>
        <Text style={s.leadInitial}>
          {String(lead.name || '?')
            .charAt(0)
            .toUpperCase()}
        </Text>
        <View style={s.waDot}>
          <Ionicons name="logo-whatsapp" size={10} color="#FFF" />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.leadName}>{lead.name || 'Unnamed Lead'}</Text>
        {lead.phone && <Text style={s.leadMeta}>{lead.phone}</Text>}
        {lead.email && (
          <Text numberOfLines={1} style={s.leadMeta}>
            {lead.email}
          </Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 7 }}>
        <View style={[s.stage, { backgroundColor: soft }]}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: main }} />
          <Text style={[s.stageText, { color: main }]}>{st?.label || lead.stage || 'New'}</Text>
        </View>
        <Text style={s.time}>{timeAgo(lead.created_at)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={C.text2} />
    </TouchableOpacity>
  );
}
function timeAgo(v) {
  if (!v) return '';
  const m = Math.max(1, Math.round((Date.now() - new Date(v).getTime()) / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 240 },
  loading: { flex: 1, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#FFF', fontSize: 31, fontWeight: '900' },
  subtitle: { color: '#D5DDE8', fontSize: 13, marginTop: 4 },
  addTop: {
    width: 53,
    height: 53,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18 },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBox: {
    flex: 1,
    minHeight: 54,
    backgroundColor: '#FFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, color: C.text, fontSize: 12 },
  filterBtn: {
    width: 54,
    height: 54,
    borderRadius: 15,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: { gap: 10, marginTop: 15 },
  summaryCard: { width: 135, minHeight: 130, borderWidth: 1, borderRadius: 18, padding: 14 },
  sumIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sumLabel: { color: C.text2, fontSize: 10, marginTop: 9 },
  sumValue: { color: C.text, fontSize: 26, fontWeight: '900', marginTop: 3 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { color: C.text2, fontSize: 10, fontWeight: '800' },
  chipTextActive: { color: '#FFF' },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: '900' },
  sortText: { color: C.blue, fontSize: 10, fontWeight: '800' },
  lead: {
    backgroundColor: '#FFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leadAvatar: {
    width: 51,
    height: 51,
    borderRadius: 17,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadInitial: { color: C.blue, fontSize: 17, fontWeight: '900' },
  waDot: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  leadName: { color: C.text, fontSize: 13, fontWeight: '900' },
  leadMeta: { color: C.text2, fontSize: 9, marginTop: 2 },
  stage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stageText: { fontSize: 8, fontWeight: '800' },
  time: { color: C.muted, fontSize: 8 },
  addLead: {
    minHeight: 52,
    borderRadius: 15,
    backgroundColor: C.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  addLeadText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  empty: { backgroundColor: '#FFF', borderRadius: 20, padding: 32, alignItems: 'center' },
  emptyTitle: { color: C.text, fontSize: 15, fontWeight: '900', marginTop: 9 },
  emptyText: { color: C.text2, fontSize: 9, marginTop: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(3,13,28,.65)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 34,
  },
  modalHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: { color: C.text, fontSize: 22, fontWeight: '900' },
  modalSub: { color: C.text2, fontSize: 9, marginTop: 2 },
  label: { color: C.text2, fontSize: 8, fontWeight: '900', marginTop: 12, marginBottom: 6 },
  input: {
    minHeight: 47,
    backgroundColor: C.bg,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    color: C.text,
    fontSize: 11,
  },
  save: {
    minHeight: 50,
    backgroundColor: C.navy,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveText: { color: '#FFF', fontWeight: '900' },
});
