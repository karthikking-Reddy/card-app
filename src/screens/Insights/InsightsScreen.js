import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { getCurrentSession } from '../../services/authService';
import {
  buildInsightsSnapshot,
  buildMetricComparison,
  buildRollingSummary,
  getAdvancedInsightsData,
  INSIGHTS_RANGES,
} from '../../services/advancedInsightsService';
import { exportInsightsCsv } from '../../services/insightsReportService';
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/ScreenState';
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
  red: colors.danger,
  redSoft: colors.dangerSoft,
  orange: '#EA7B00',
  orangeSoft: '#FFF7ED',
  purple: '#7C3AED',
  purpleSoft: '#F5F3FF',
};

const SERIES = [
  ['views', 'Views'],
  ['unique', 'Visitors'],
  ['contacts', 'Contact Actions'],
  ['leads', 'Leads'],
  ['won', 'Won'],
];

export default function InsightsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [source, setSource] = useState(null);
  const [range, setRange] = useState('30');
  const [cardId, setCardId] = useState('all');
  const [seriesMetric, setSeriesMetric] = useState('views');
  const [compare, setCompare] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      setLoadError('');
      refresh ? setRefreshing(true) : setLoading(true);
      try {
        const session = await getCurrentSession();
        if (!session?.user) return;
        const result = await getAdvancedInsightsData(session.user.id, range);
        setSource(result);
        setCardId((current) =>
          current !== 'all' && !result.cards.some((card) => card.id === current) ? 'all' : current
        );
      } catch {
        setLoadError('We could not load your analytics. Check your connection and try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [range]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const current = useMemo(
    () =>
      source
        ? buildInsightsSnapshot(source, { selectedCardId: cardId, range, seriesMetric })
        : null,
    [source, cardId, range, seriesMetric]
  );
  const previous = useMemo(
    () =>
      source
        ? buildInsightsSnapshot(source, {
            selectedCardId: cardId,
            range,
            seriesMetric,
            period: 'previous',
          })
        : null,
    [source, cardId, range, seriesMetric]
  );
  const comparisons = useMemo(
    () => (current && previous ? buildMetricComparison(current, previous) : null),
    [current, previous]
  );
  const weekly = useMemo(
    () => (source ? buildRollingSummary(source, 7, cardId) : null),
    [source, cardId]
  );
  const monthly = useMemo(
    () => (source ? buildRollingSummary(source, 30, cardId) : null),
    [source, cardId]
  );

  function openRoot(name, params) {
    const parent = navigation.getParent?.();
    parent ? parent.navigate(name, params) : navigation.navigate(name, params);
  }

  async function downloadReport() {
    if (exporting || !current) return;
    setExporting(true);
    try {
      const rangeLabel = INSIGHTS_RANGES.find(([key]) => key === range)?.[1] || range;
      const cardLabel =
        cardId === 'all'
          ? 'All Cards'
          : source.cards.find((card) => card.id === cardId)?.name || 'Selected Card';
      await exportInsightsCsv({ snapshot: current, rangeLabel, cardLabel });
    } catch {
      Alert.alert(
        'Report unavailable',
        'The analytics report could not be prepared. Please try again.'
      );
    } finally {
      setExporting(false);
    }
  }

  if (loading) return <LoadingState message="Loading business insights…" />;
  if (loadError && !source)
    return (
      <ErrorState
        title="Insights unavailable"
        message={loadError}
        actionLabel="Try Again"
        onAction={load}
        fullScreen
      />
    );
  if (!source?.cards.length)
    return (
      <EmptyState
        title="No insights yet"
        message="Create and share a digital card to begin tracking engagement."
        actionLabel="Create Card"
        onAction={() => openRoot('MyCards')}
        fullScreen
      />
    );

  const noActivity = !current.events.length && !current.leads.length;
  const primary = source.cards.find((card) => card.is_primary) || source.cards[0];
  const chartWidth = Math.max(250, Math.min(width - 68, 620));
  const recommendations = buildRecommendations(source, current);

  return (
    <View style={s.root}>
      <LinearGradient colors={[C.navy, '#0B2447']} style={s.headerBg} />
      <SafeAreaView style={s.flex} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
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
              <Text style={s.title}>Insights</Text>
              <Text style={s.subtitle}>Business performance from real activity</Text>
            </View>
            <TouchableOpacity
              style={s.reportButton}
              onPress={downloadReport}
              disabled={exporting}
              accessibilityLabel="Download insights report"
            >
              <Ionicons
                name={exporting ? 'hourglass-outline' : 'download-outline'}
                size={21}
                color={C.gold}
              />
            </TouchableOpacity>
          </View>
          <View style={s.body}>
            <Text style={s.controlLabel}>DATE RANGE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipRow}
            >
              {INSIGHTS_RANGES.map(([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  active={range === key}
                  onPress={() => setRange(key)}
                />
              ))}
              <Chip
                label="Custom"
                onPress={() =>
                  Alert.alert(
                    'Custom range',
                    'A native date-range picker is deferred until a stable project-compatible picker is selected.'
                  )
                }
              />
            </ScrollView>
            <Text style={s.controlLabel}>CARD</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipRow}
            >
              <Chip label="All Cards" active={cardId === 'all'} onPress={() => setCardId('all')} />
              <Chip
                label="Primary Card"
                active={cardId === primary.id}
                onPress={() => setCardId(primary.id)}
              />
              {source.cards.map((card) => (
                <Chip
                  key={card.id}
                  label={card.name || card.card_slug}
                  active={cardId === card.id}
                  onPress={() => setCardId(card.id)}
                />
              ))}
            </ScrollView>
            <TouchableOpacity style={s.compareRow} onPress={() => setCompare((value) => !value)}>
              <Ionicons
                name={compare ? 'checkbox' : 'square-outline'}
                size={21}
                color={compare ? C.gold : C.muted}
              />
              <View style={s.flex}>
                <Text style={s.compareTitle}>Compare previous period</Text>
                <Text style={s.compareText}>Uses an equal preceding date window</Text>
              </View>
            </TouchableOpacity>

            {noActivity ? (
              <EmptyState
                title="No insights yet"
                message="Share your digital card or QR code to begin tracking engagement."
              />
            ) : null}

            <SectionTitle title="Performance" action={() => showDefinitions()} />
            <View style={s.metricGrid}>
              <Metric
                label="Unique Visitors"
                value={
                  current.metrics.uniqueVisitors.available
                    ? current.metrics.uniqueVisitors.value
                    : '—'
                }
                comparison={compare ? comparisons.uniqueVisitors : null}
                unavailable={!current.metrics.uniqueVisitors.available}
              />
              <Metric
                label="Card Views"
                value={current.metrics.views}
                comparison={compare ? comparisons.views : null}
              />
              <Metric
                label="Contact Actions"
                value={current.metrics.contactActions}
                comparison={compare ? comparisons.contactActions : null}
              />
              <Metric
                label="Contact Saves"
                value={current.metrics.contactSaves}
                comparison={compare ? comparisons.contactSaves : null}
              />
              <Metric
                label="New Leads"
                value={current.metrics.leads}
                comparison={compare ? comparisons.leads : null}
              />
              <Metric
                label="Conversion Rate"
                value={
                  current.metrics.conversionRate == null
                    ? '—'
                    : `${current.metrics.conversionRate.toFixed(1)}%`
                }
                comparison={compare ? comparisons.conversionRate : null}
                unavailable={current.metrics.conversionRate == null}
              />
            </View>

            <Panel title="Conversion Funnel">
              <View style={s.funnelRow}>
                <Funnel label="Visitors" metric={current.funnel.visitors} />
                <Arrow />
                <Funnel label="Engaged" metric={current.funnel.engaged} />
                <Arrow />
                <Funnel label="Leads" value={current.funnel.leads} />
                <Arrow />
                <Funnel label="Won" metric={current.funnel.won} />
              </View>
              <FunnelRates funnel={current.funnel} />
              <Text style={s.honesty}>
                {!current.funnel.visitors.available || !current.funnel.engaged.available
                  ? 'Visitor stages are unavailable when historical events lack anonymous visitor tokens. '
                  : ''}
                Won cohort attribution is unavailable because enquiry events are not linked to the
                resulting lead ID.
              </Text>
            </Panel>

            <Panel title="Performance Over Time">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.chipRow}
              >
                {SERIES.map(([key, label]) => (
                  <Chip
                    key={key}
                    label={label}
                    active={seriesMetric === key}
                    onPress={() => setSeriesMetric(key)}
                  />
                ))}
              </ScrollView>
              <LineChart series={current.series} width={chartWidth} />
              <Text style={s.honesty}>
                {range === 'year' ? 'Monthly' : range === '90' ? 'Weekly' : 'Daily'} grouping. Scale
                begins at zero.
              </Text>
            </Panel>

            <Panel title="Top Links & Sections">
              <RankedList
                items={current.topContent}
                renderMeta={(item) =>
                  `${item.clicks} clicks${item.uniqueClicks == null ? '' : ` • ${item.uniqueClicks} unique`} • ${item.cardName}`
                }
                empty="No attributable link or section clicks in this period."
              />
            </Panel>
            <UnavailablePanel
              title="Top Services"
              text="Service-detail events are not currently linked to service IDs, so views and enquiry conversion cannot be attributed safely."
            />
            <UnavailablePanel
              title="Top Portfolio"
              text="Portfolio views and influenced enquiries are not currently recorded with portfolio item IDs."
            />

            <Panel title="Traffic Sources">
              <RankedList items={current.trafficSources} empty="No card views in this period." />
              <Text style={s.honesty}>
                Unknown is retained when acquisition source is not captured; it is not relabelled as
                Direct.
              </Text>
            </Panel>
            <UnavailablePanel
              title="Visitor Insights"
              text="Device, browser, language and approximate location are not reliably captured. No identity, exact location or raw IP is inferred."
            />
            <Panel title="Contact Actions">
              <RankedList
                items={current.contactActions.map((item) => ({
                  ...item,
                  label: eventLabel(item.label),
                }))}
                empty="No contact actions in this period."
              />
              <Text style={s.honesty}>
                These are clicks or app opens, not confirmed calls, messages or appointments.
              </Text>
            </Panel>
            <UnavailablePanel
              title="QR Analytics"
              text="Current QR codes contain the static public URL. QR scan and campaign attribution events are not recorded, so scan counts are unavailable."
            />

            <Panel title="Lead & Pipeline Analytics">
              <StatRow
                label="Estimated Pipeline Value"
                value={`₹${current.estimatedPipeline.toLocaleString('en-IN')}`}
              />
              <StatRow label="Created in range, now Won" value={current.won} />
              <StatRow label="Created in range, now Lost" value={current.lost} />
              <SubList title="By Stage" items={current.leadsByStage} />
              <SubList title="By Source" items={current.leadsBySource} />
              <SubList title="By Card" items={current.leadsByCard} />
              <Text style={s.honesty}>
                Won Revenue is unavailable because authoritative won-value data is not stored.
                Estimated pipeline is never presented as revenue.
              </Text>
            </Panel>

            <Panel title="Recommended Actions">
              <RankedList
                items={recommendations}
                renderMeta={(item) => item.detail}
                empty="No action is recommended from the currently available data."
                onPress={(item) => openRoot(item.route, item.params)}
              />
            </Panel>
            <Panel title="Weekly & Monthly Summary">
              <SummaryRow label="Last 7 days" data={weekly} />
              <SummaryRow label="Last 30 days" data={monthly} />
              <Text style={s.honesty}>
                In-app summary only. No email, WhatsApp or push delivery is claimed.
              </Text>
            </Panel>
            <Panel title="Reports">
              <Text style={s.panelText}>
                Card Performance CSV includes the selected range, card scope, generated date, real
                metrics and definitions.
              </Text>
              <TouchableOpacity
                style={s.primaryButton}
                onPress={downloadReport}
                disabled={exporting}
              >
                <Ionicons name="download-outline" size={19} color="#FFF" />
                <Text style={s.primaryText}>
                  {exporting ? 'Preparing…' : 'Download Card Performance CSV'}
                </Text>
              </TouchableOpacity>
              <Text style={s.honesty}>
                Campaign/QR, team and won-revenue reports remain unavailable until their underlying
                data exists.
              </Text>
            </Panel>

            {noActivity ? (
              <View style={s.emptyActions}>
                <Action
                  label="Share Card"
                  onPress={() => openRoot('QRCentre', { cardId: primary.id })}
                />
                <Action
                  label="Open QR Centre"
                  onPress={() => openRoot('QRCentre', { cardId: primary.id })}
                />
                <Action
                  label="Preview Card"
                  onPress={() => openRoot('CardPreview', { cardId: primary.id })}
                />
              </View>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function showDefinitions() {
  Alert.alert(
    'Metric definitions',
    'Unique Visitors: distinct anonymous visitor tokens when complete.\n\nCard Views: recorded public card openings.\n\nContact Actions: recorded phone, email, WhatsApp and related contact clicks.\n\nContact Saves: recorded VCF saves.\n\nNew Leads: CRM leads created in the period.\n\nConversion Rate: new leads divided by trustworthy unique visitors.'
  );
}
function buildRecommendations(source, snapshot) {
  const items = [];
  if (source.cards.some((card) => !card.whatsapp))
    items.push({
      id: 'whatsapp',
      label: 'Add WhatsApp',
      detail: 'Improve the contact options on an incomplete card.',
      route: 'MyCards',
    });
  if ((source.followups.overdue || 0) > 0)
    items.push({
      id: 'followups',
      label: `${source.followups.overdue} overdue follow-up${source.followups.overdue === 1 ? '' : 's'}`,
      detail: 'Review due CRM tasks.',
      route: 'FollowUps',
    });
  if (source.cards.some((card) => !card.profile_image_url || !card.bio))
    items.push({
      id: 'profile',
      label: 'Complete card identity',
      detail: 'Add a profile photo and about information.',
      route: 'MyCards',
    });
  if (snapshot.metrics.views > 0)
    items.push({
      id: 'preview',
      label: 'Review your public card',
      detail: 'Check the visitor experience after recent activity.',
      route: 'CardPreview',
      params: { cardId: source.cards.find((card) => card.is_primary)?.id || source.cards[0].id },
    });
  return items;
}
function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[s.chip, active && s.chipActive]} onPress={onPress}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function SectionTitle({ title, action }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action ? (
        <TouchableOpacity onPress={action}>
          <Ionicons name="information-circle-outline" size={22} color={C.blue} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
function Metric({ label, value, comparison, unavailable }) {
  const tone =
    comparison?.direction === 'down' ? C.red : comparison?.direction === 'up' ? C.green : C.text2;
  return (
    <View style={s.metric}>
      <Text style={s.metricLabel}>{label}</Text>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={[s.metricCompare, { color: tone }]}>
        {unavailable ? 'Unavailable' : comparison?.label || 'Current period'}
      </Text>
    </View>
  );
}
function Panel({ title, children }) {
  return (
    <View style={s.panel}>
      <Text style={s.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}
function UnavailablePanel({ title, text }) {
  return (
    <Panel title={title}>
      <View style={s.unavailable}>
        <Ionicons name="analytics-outline" size={22} color={C.muted} />
        <Text style={s.unavailableText}>{text}</Text>
      </View>
    </Panel>
  );
}
function Funnel({ label, metric, value }) {
  const available = metric ? metric.available : true;
  return (
    <View style={s.funnelItem}>
      <Text style={s.funnelValue}>{available ? (metric?.value ?? value) : '—'}</Text>
      <Text style={s.funnelLabel}>{label}</Text>
    </View>
  );
}
function Arrow() {
  return <Ionicons name="chevron-forward" size={16} color={C.muted} />;
}
function FunnelRates({ funnel }) {
  const rate = (next, prior) => (prior > 0 ? `${((next / prior) * 100).toFixed(1)}%` : '—');
  const visitors = funnel.visitors.available ? funnel.visitors.value : null;
  const engaged = funnel.engaged.available ? funnel.engaged.value : null;
  return (
    <View style={s.rateRow}>
      <Text style={s.rateText}>
        {visitors == null || engaged == null ? '—' : rate(engaged, visitors)} engaged
      </Text>
      <Text style={s.rateText}>
        {engaged == null ? '—' : rate(funnel.leads, engaged)} became leads
      </Text>
      <Text style={s.rateText}>Won attribution —</Text>
    </View>
  );
}
function LineChart({ series, width }) {
  const [selected, setSelected] = useState(null);
  const height = 170,
    pad = 20;
  if (series.length < 2)
    return (
      <View style={s.chartEmpty}>
        <Text style={s.unavailableText}>
          {series.length
            ? 'More data points are needed for a meaningful trend.'
            : 'No data for this metric in the selected period.'}
        </Text>
      </View>
    );
  const max = Math.max(...series.map((item) => item.value), 1);
  const points = series.map((item, index) => [
    pad + (index * (width - pad * 2)) / Math.max(series.length - 1, 1),
    height - pad - (item.value / max) * (height - pad * 2),
  ]);
  return (
    <View style={s.chartWrap}>
      {selected ? (
        <Text style={s.chartSelection}>
          {selected.date}: {selected.value}
        </Text>
      ) : (
        <Text style={s.chartSelection}>Tap a point for its value</Text>
      )}
      <Svg width={width} height={height}>
        <Line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke={C.border} />
        <Polyline
          points={points.map((point) => point.join(',')).join(' ')}
          fill="none"
          stroke={C.blue}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point, index) => (
          <Circle
            key={series[index].date}
            cx={point[0]}
            cy={point[1]}
            r={selected?.date === series[index].date ? 6 : 4}
            fill={C.blue}
            onPress={() => setSelected(series[index])}
            accessible
            accessibilityLabel={`${series[index].date}: ${series[index].value}`}
          />
        ))}
      </Svg>
      <View style={s.axis}>
        <Text style={s.axisText}>{series[0].date}</Text>
        <Text style={s.axisText}>{series[series.length - 1].date}</Text>
      </View>
    </View>
  );
}
function RankedList({ items, empty, renderMeta, onPress }) {
  if (!items.length) return <Text style={s.emptyText}>{empty}</Text>;
  return items.slice(0, 8).map((item, index) => {
    const row = (
      <>
        <View style={s.rank}>
          <Text style={s.rankText}>{index + 1}</Text>
        </View>
        <View style={s.flex}>
          <Text style={s.rowTitle}>{item.title || item.label}</Text>
          <Text style={s.rowMeta}>{renderMeta ? renderMeta(item) : `${item.value}`}</Text>
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={18} color={C.muted} /> : null}
      </>
    );
    return onPress ? (
      <TouchableOpacity key={item.id || item.label} style={s.row} onPress={() => onPress(item)}>
        {row}
      </TouchableOpacity>
    ) : (
      <View key={item.id || item.label} style={s.row}>
        {row}
      </View>
    );
  });
}
function SubList({ title, items }) {
  return (
    <View style={s.subList}>
      <Text style={s.subTitle}>{title}</Text>
      {items.length ? (
        items
          .slice(0, 5)
          .map((item) => <StatRow key={item.label} label={item.label} value={item.value} />)
      ) : (
        <Text style={s.emptyText}>No data in this period.</Text>
      )}
    </View>
  );
}
function StatRow({ label, value }) {
  return (
    <View style={s.statRow}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}
function SummaryRow({ label, data }) {
  return (
    <View style={s.summary}>
      <Text style={s.summaryTitle}>{label}</Text>
      <Text style={s.summaryText}>
        {data.views} views • {data.contactActions} actions • {data.leads} enquiries • {data.won} won
        • {data.overdue == null ? 'card-filtered overdue unavailable' : `${data.overdue} overdue`}
      </Text>
    </View>
  );
}
function Action({ label, onPress }) {
  return (
    <TouchableOpacity style={s.secondaryButton} onPress={onPress}>
      <Text style={s.secondaryText}>{label}</Text>
    </TouchableOpacity>
  );
}
function eventLabel(value) {
  const map = {
    whatsapp_click: 'WhatsApp clicks',
    phone_click: 'Phone clicks',
    email_click: 'Email clicks',
    website_click: 'Website clicks',
    location_click: 'Directions opened',
    appointment_request: 'Appointment requests',
    save_contact_click: 'Contact saves',
    contact_save: 'Contact saves',
    file_download: 'File downloads',
    pdf_click: 'PDF opens',
    drive_click: 'Drive opens',
    instagram_click: 'Instagram clicks',
    facebook_click: 'Facebook clicks',
    linkedin_click: 'LinkedIn clicks',
    youtube_click: 'YouTube clicks',
    google_review_click: 'Google Review clicks',
  };
  return map[value] || String(value).replace(/_/g, ' ');
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, height: 190 },
  scroll: { paddingBottom: 105 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#FFF', fontFamily: fontFamilies.medium, fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#D5DDE8', fontSize: 12, marginTop: 4 },
  reportButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18 },
  controlLabel: {
    color: C.text2,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 7,
  },
  chipRow: { gap: 7 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: C.navy, borderColor: C.gold },
  chipText: { color: C.text2, fontSize: 9, fontWeight: '800' },
  chipTextActive: { color: '#FFF' },
  compareRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: C.border,
  },
  compareTitle: { color: C.text, fontSize: 11, fontWeight: '800' },
  compareText: { color: C.text2, fontSize: 8, marginTop: 2 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 9,
  },
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: '900' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  metric: {
    width: '48%',
    minHeight: 112,
    padding: 14,
    borderRadius: 17,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: C.border,
  },
  metricLabel: { color: C.text2, fontSize: 9, fontWeight: '700' },
  metricValue: { color: C.text, fontSize: 25, fontWeight: '900', marginTop: 8 },
  metricCompare: { fontSize: 8, fontWeight: '800', marginTop: 7 },
  panel: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 15,
    marginTop: 12,
  },
  panelTitle: { color: C.text, fontSize: 16, fontWeight: '900', marginBottom: 10 },
  panelText: { color: C.text2, fontSize: 10, lineHeight: 16 },
  funnelRow: { flexDirection: 'row', alignItems: 'center' },
  funnelItem: { flex: 1, alignItems: 'center' },
  funnelValue: { color: C.text, fontSize: 20, fontWeight: '900' },
  funnelLabel: { color: C.text2, fontSize: 8, marginTop: 3 },
  honesty: { color: C.text2, fontSize: 8, lineHeight: 13, marginTop: 10 },
  rateRow: { flexDirection: 'row', gap: 5, marginTop: 10 },
  rateText: { flex: 1, color: C.blue, fontSize: 7, textAlign: 'center' },
  chartWrap: { alignItems: 'center', marginTop: 8 },
  chartSelection: { color: C.blue, fontSize: 9, fontWeight: '800' },
  chartEmpty: { minHeight: 145, alignItems: 'center', justifyContent: 'center', padding: 20 },
  axis: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  axisText: { color: C.muted, fontSize: 7 },
  unavailable: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.bg,
    borderRadius: 13,
    padding: 12,
  },
  unavailableText: { flex: 1, color: C.text2, fontSize: 9, lineHeight: 14 },
  emptyText: { color: C.muted, fontSize: 9, textAlign: 'center', paddingVertical: 18 },
  row: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F6',
  },
  rank: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: C.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: C.blue, fontSize: 10, fontWeight: '900' },
  rowTitle: { color: C.text, fontSize: 10, fontWeight: '800' },
  rowMeta: { color: C.text2, fontSize: 8, marginTop: 3 },
  statRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F6',
  },
  statLabel: { color: C.text2, fontSize: 9 },
  statValue: { color: C.text, fontSize: 11, fontWeight: '900' },
  subList: { marginTop: 12 },
  subTitle: { color: C.text, fontSize: 10, fontWeight: '900', marginBottom: 4 },
  summary: { backgroundColor: C.bg, borderRadius: 13, padding: 12, marginBottom: 8 },
  summaryTitle: { color: C.text, fontSize: 10, fontWeight: '900' },
  summaryText: { color: C.text2, fontSize: 8, lineHeight: 13, marginTop: 4 },
  primaryButton: {
    minHeight: 50,
    backgroundColor: C.navy,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  primaryText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  emptyActions: { gap: 8, marginTop: 12 },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.gold,
    backgroundColor: '#FFF4D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: C.navy, fontSize: 10, fontWeight: '800' },
});
