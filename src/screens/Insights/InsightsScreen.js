import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Polyline,
  Polygon,
  Line,
  Circle,
} from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../../lib/supabase';
import { ErrorState, LoadingState } from '../../components/ui/ScreenState';
import { colors, fontFamilies } from '../../theme';

const C = {
  navy: colors.navy,
  gold: colors.gold,
  bg: colors.background,
  text: colors.text,
  text2: colors.textSecondary,
  muted: colors.textMuted,
  border: colors.border,
  blue: colors.blue,
  blueSoft: colors.blueSoft,
  green: colors.success,
  greenSoft: colors.successSoft,
  purple: '#7C3AED',
  purpleSoft: '#F5F3FF',
  orange: '#EA7B00',
  orangeSoft: '#FFF7ED',
  red: colors.danger,
  redSoft: colors.dangerSoft,
};
export default function InsightsScreen() {
  const [loading, setLoading] = useState(true),
    [loadError, setLoadError] = useState(''),
    [refreshing, setRefreshing] = useState(false),
    [cards, setCards] = useState([]),
    [events, setEvents] = useState([]),
    [connections, setConnections] = useState([]),
    [links, setLinks] = useState([]),
    [blocks, setBlocks] = useState([]),
    [stages, setStages] = useState([]),
    [range, setRange] = useState('30'),
    [cardId, setCardId] = useState('all');
  const load = useCallback(async (refresh = false) => {
    setLoadError('');
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const u = session?.user;
      if (!u) return;
      const cr = await supabase
        .from('digital_cards')
        .select('*')
        .eq('user_id', u.id)
        .order('is_primary', { ascending: false });
      if (cr.error) throw cr.error;
      const cs = cr.data || [];
      setCards(cs);
      const ids = cs.map((x) => x.id);
      const [er, lr, sr, br, kr] = await Promise.all([
        ids.length
          ? supabase
              .from('card_events')
              .select('*')
              .in('card_id', ids)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        supabase
          .from('connections')
          .select('*')
          .eq('owner_user_id', u.id)
          .order('created_at', { ascending: false }),
        supabase.from('lead_stages').select('*').eq('user_id', u.id),
        ids.length
          ? supabase.from('card_blocks').select('id,card_id,title,block_type').in('card_id', ids)
          : Promise.resolve({ data: [] }),
        ids.length
          ? supabase.from('card_links').select('id,card_id,label,link_type').in('card_id', ids)
          : Promise.resolve({ data: [] }),
      ]);
      if (er.error) throw er.error;
      if (lr.error) throw lr.error;
      if (sr.error) throw sr.error;
      if (br.error) throw br.error;
      if (kr.error) throw kr.error;
      setEvents(er.data || []);
      setConnections(lr.data || []);
      setStages(sr.data || []);
      setBlocks(br.data || []);
      setLinks(kr.data || []);
    } catch (e) {
      setLoadError('We could not load your insights. Check your connection and try again.');
      Alert.alert('Unable to load insights', e?.message || 'Please try again.');
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
  const data = useMemo(() => {
    const min = range === 'all' ? 0 : Date.now() - Number(range) * 86400000;
    const match = (id) => cardId === 'all' || id === cardId;
    const ev = events.filter(
      (x) => match(x.card_id) && (min === 0 || new Date(x.created_at).getTime() >= min)
    );
    const leads = connections.filter(
      (x) => match(x.card_id) && (min === 0 || new Date(x.created_at).getTime() >= min)
    );
    const views = ev.filter((x) => x.event_type === 'card_view').length;
    const clicks = ev.filter(
      (x) => String(x.event_type || '').endsWith('_click') || x.event_type === 'block_click'
    ).length;
    const wa = ev.filter((x) => String(x.event_type || '').includes('whatsapp')).length;
    const wonSet = new Set(stages.filter((x) => x.is_won).map((x) => x.stage_key));
    const won = leads.filter((x) => wonSet.has(x.stage)).length;
    const map = {};
    links.forEach((x) => (map[x.id] = { title: x.label || x.link_type, type: x.link_type }));
    blocks.forEach((x) => (map[x.id] = { title: x.title || x.block_type, type: x.block_type }));
    const counts = {};
    ev.forEach((x) => {
      const id = x.link_id || x.block_id;
      if (!id) return;
      const m = map[id] || {
        title: x.metadata?.title || 'Link',
        type: x.metadata?.block_type || x.event_type,
      };
      counts[id] ??= { id, title: m.title, type: m.type, count: 0 };
      counts[id].count++;
    });
    const top = Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const daily = {};
    ev.filter((x) => x.event_type === 'card_view').forEach((x) => {
      const d = new Date(x.created_at).toISOString().slice(0, 10);
      daily[d] = (daily[d] || 0) + 1;
    });
    const series = Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, value]) => ({ date, value }));
    return { views, clicks, wa, leads: leads.length, won, top, recent: ev.slice(0, 8), series };
  }, [events, connections, links, blocks, stages, range, cardId]);
  if (loading) return <LoadingState message="Loading your insights…" />;
  if (loadError && cards.length === 0)
    return (
      <ErrorState
        title="Insights unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={() => load()}
        fullScreen
      />
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
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Ionicons name="bar-chart" size={28} color={C.gold} />
                <Text style={s.title}>Insights</Text>
              </View>
              <Text style={s.subtitle}>Track your performance</Text>
            </View>
            <View style={s.rangeTop}>
              <Ionicons name="calendar-outline" size={18} color="#FFF" />
              <Text style={s.rangeTopText}>{range === 'all' ? 'All Time' : `${range} Days`}</Text>
            </View>
          </View>
          <View style={s.body}>
            <Text style={s.sectionTitle}>Overview</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              <Metric icon="eye-outline" label="Profile Views" value={data.views} tone="blue" />
              <Metric
                icon="navigate-outline"
                label="Card Clicks"
                value={data.clicks}
                tone="purple"
              />
              <Metric icon="logo-whatsapp" label="WhatsApp Clicks" value={data.wa} tone="green" />
              <Metric
                icon="person-add-outline"
                label="New Leads"
                value={data.leads}
                tone="orange"
              />
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 13 }}
              contentContainerStyle={{ gap: 7 }}
            >
              {[
                ['7', '7 Days'],
                ['30', '30 Days'],
                ['90', '90 Days'],
                ['all', 'All'],
              ].map(([v, l]) => (
                <Chip key={v} label={l} active={range === v} onPress={() => setRange(v)} />
              ))}
            </ScrollView>
            {cards.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
                contentContainerStyle={{ gap: 7 }}
              >
                <Chip
                  label="All Cards"
                  active={cardId === 'all'}
                  onPress={() => setCardId('all')}
                />
                {cards.map((c) => (
                  <Chip
                    key={c.id}
                    label={c.name || c.card_slug}
                    active={cardId === c.id}
                    onPress={() => setCardId(c.id)}
                  />
                ))}
              </ScrollView>
            )}
            <View style={s.chartCard}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Views Over Time</Text>
                <Text style={s.smallBlue}>Views</Text>
              </View>
              <LineChart series={data.series} />
            </View>
            <View style={s.listCard}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Top Performing Links</Text>
                <Text style={s.smallBlue}>{data.top.length} items</Text>
              </View>
              {data.top.length === 0 ? (
                <Empty text="No link clicks in this period." />
              ) : (
                data.top.map((x) => <TopRow key={x.id} item={x} />)
              )}
            </View>
            <View style={s.listCard}>
              <View style={s.sectionRow}>
                <Text style={s.sectionTitle}>Recent Activity</Text>
                <Text style={s.smallBlue}>Latest</Text>
              </View>
              {data.recent.length === 0 ? (
                <Empty text="No activity yet." />
              ) : (
                data.recent.map((x) => <Activity key={x.id} item={x} />)
              )}
            </View>
            <View style={s.funnel}>
              <Text style={s.sectionTitle}>Conversion Summary</Text>
              <View style={s.funnelRow}>
                <Funnel label="Views" value={data.views} />
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
                <Funnel label="Clicks" value={data.clicks} />
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
                <Funnel label="Leads" value={data.leads} />
                <Ionicons name="chevron-forward" size={18} color={C.muted} />
                <Funnel label="Won" value={data.won} />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
function Metric({ icon, label, value, tone }) {
  const p =
    tone === 'green'
      ? [C.green, C.greenSoft]
      : tone === 'purple'
        ? [C.purple, C.purpleSoft]
        : tone === 'orange'
          ? [C.orange, C.orangeSoft]
          : [C.blue, C.blueSoft];
  return (
    <View style={[s.metric, { backgroundColor: p[1] }]}>
      <View style={s.metricIcon}>
        <Ionicons name={icon} size={26} color={p[0]} />
      </View>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{Number(value || 0).toLocaleString()}</Text>
      <Text style={{ color: C.green, fontSize: 8, fontWeight: '800', marginTop: 5 }}>
        ↑ Current period
      </Text>
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
function LineChart({ series }) {
  const W = 320,
    H = 170,
    P = 18;
  if (series.length === 0)
    return (
      <View style={s.chartEmpty}>
        <Text style={{ color: C.muted, fontSize: 10 }}>No view data yet.</Text>
      </View>
    );
  const max = Math.max(...series.map((x) => x.value), 1);
  const pts = series.map((x, i) => [
    P + (i * (W - P * 2)) / Math.max(series.length - 1, 1),
    H - P - (x.value / max) * (H - P * 2),
  ]);
  const line = pts.map((p) => p.join(',')).join(' '),
    poly = `${P},${H - P} ${line} ${W - P},${H - P}`;
  return (
    <View style={{ alignItems: 'center', marginTop: 10 }}>
      <Svg width={W} height={H}>
        <Defs>
          <SvgGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#7C3AED" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#7C3AED" stopOpacity="0.02" />
          </SvgGradient>
        </Defs>
        {[0.25, 0.5, 0.75].map((v, i) => (
          <Line
            key={i}
            x1={P}
            x2={W - P}
            y1={P + (H - P * 2) * v}
            y2={P + (H - P * 2) * v}
            stroke="#E8ECF2"
            strokeWidth="1"
          />
        ))}
        <Polygon points={poly} fill="url(#fill)" />
        <Polyline
          points={line}
          fill="none"
          stroke="#0866FF"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {pts.map((p, i) => (
          <Circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#0866FF" />
        ))}
      </Svg>
    </View>
  );
}
function iconFor(v) {
  v = String(v || '');
  if (v.includes('whatsapp')) return ['logo-whatsapp', C.green, C.greenSoft];
  if (v.includes('email')) return ['mail-outline', C.red, C.redSoft];
  if (v.includes('phone')) return ['call-outline', C.blue, C.blueSoft];
  if (v.includes('website')) return ['globe-outline', C.blue, C.blueSoft];
  return ['link-outline', C.purple, C.purpleSoft];
}
function TopRow({ item }) {
  const [icon, main, soft] = iconFor(item.type);
  return (
    <View style={s.topRow}>
      <View style={[s.rowIcon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={20} color={main} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{item.title}</Text>
        <Text style={s.rowSub}>{item.count} clicks</Text>
      </View>
      <Text style={{ color: C.green, fontSize: 9, fontWeight: '800' }}>↑ {item.count}</Text>
      <Ionicons name="chevron-forward" size={18} color={C.text2} />
    </View>
  );
}
function Activity({ item }) {
  const [icon, main, soft] = iconFor(item.event_type);
  return (
    <View style={s.topRow}>
      <View style={[s.rowIcon, { backgroundColor: soft }]}>
        <Ionicons name={icon} size={20} color={main} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>
          {String(item.event_type || 'activity')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (m) => m.toUpperCase())}
        </Text>
        <Text style={s.rowSub}>
          {item.source || 'organic'} • {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}
function Funnel({ label, value }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: C.text, fontSize: 19, fontWeight: '900' }}>{value}</Text>
      <Text style={{ color: C.text2, fontSize: 8, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
function Empty({ text }) {
  return (
    <View style={{ padding: 25, alignItems: 'center' }}>
      <Ionicons name="analytics-outline" size={28} color={C.muted} />
      <Text style={{ color: C.muted, fontSize: 9, marginTop: 7 }}>{text}</Text>
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 205 },
  loading: { flex: 1, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#FFF', fontFamily: fontFamilies.medium, fontSize: 29, fontWeight: '800' },
  subtitle: { color: '#D5DDE8', fontSize: 12, marginTop: 5 },
  rangeTop: {
    minHeight: 45,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.2)',
    borderRadius: 13,
    paddingHorizontal: 13,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  rangeTopText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  body: { backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '900' },
  metric: {
    width: 145,
    minHeight: 150,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,.03)',
  },
  metricIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: { color: C.text, fontSize: 10, marginTop: 11 },
  metricValue: { color: C.text, fontSize: 27, fontWeight: '900', marginTop: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 11,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { color: C.text2, fontSize: 9, fontWeight: '800' },
  chipTextActive: { color: '#FFF' },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    marginTop: 14,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  smallBlue: { color: C.blue, fontSize: 9, fontWeight: '800' },
  chartEmpty: { height: 170, alignItems: 'center', justifyContent: 'center' },
  listCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    marginTop: 12,
  },
  topRow: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F6',
  },
  rowIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { color: C.text, fontSize: 11, fontWeight: '800' },
  rowSub: { color: C.text2, fontSize: 8, marginTop: 2 },
  funnel: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    marginTop: 12,
  },
  funnelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
});
