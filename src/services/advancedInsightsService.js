import { supabase } from '../../lib/supabase';
import { getCards } from './cardService';
import { getFollowupSummary } from './followupTaskService';
import { getLeadStages } from './leadStageService';
import { getSourceLabel } from './connectionService';

export const INSIGHTS_RANGES = [
  ['today', 'Today'],
  ['7', '7 Days'],
  ['30', '30 Days'],
  ['90', '90 Days'],
  ['year', 'This Year'],
];

export const CONTACT_EVENT_TYPES = new Set([
  'whatsapp_click',
  'phone_click',
  'email_click',
  'website_click',
  'location_click',
  'appointment_request',
  'save_contact_click',
  'contact_save',
  'file_download',
  'pdf_click',
  'drive_click',
  'instagram_click',
  'facebook_click',
  'linkedin_click',
  'youtube_click',
  'google_review_click',
]);

const ENGAGEMENT_EVENT_TYPES = new Set([
  ...CONTACT_EVENT_TYPES,
  'service_click',
  'portfolio_click',
  'block_click',
  'lead_submit',
  'enquiry_submit',
]);

function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getInsightsWindow(range, nowValue = new Date()) {
  const now = new Date(nowValue);
  let currentStart;
  let previousStart;
  let previousEnd;
  if (range === 'today') {
    currentStart = startOfDay(now);
    previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 1);
    previousEnd = new Date(previousStart.getTime() + (now.getTime() - currentStart.getTime()));
  } else if (range === 'year') {
    currentStart = new Date(now.getFullYear(), 0, 1);
    previousStart = new Date(now.getFullYear() - 1, 0, 1);
    previousEnd = new Date(now);
    previousEnd.setFullYear(now.getFullYear() - 1);
  } else {
    const days = Number(range) || 30;
    currentStart = new Date(now.getTime() - days * 86400000);
    previousStart = new Date(now.getTime() - days * 2 * 86400000);
    previousEnd = currentStart;
  }
  const summaryStart = new Date(now.getTime() - 60 * 86400000);
  return {
    now,
    currentStart,
    previousStart,
    previousEnd,
    queryStart: previousStart < summaryStart ? previousStart : summaryStart,
  };
}

export async function getAdvancedInsightsData(userId, range = '30') {
  if (!userId) throw new Error('A signed-in user is required.');
  const window = getInsightsWindow(range);
  const cards = await getCards(userId);
  const cardIds = cards.map((card) => card.id);
  if (!cardIds.length) {
    return {
      cards: [],
      events: [],
      connections: [],
      links: [],
      blocks: [],
      services: [],
      portfolio: [],
      stages: [],
      followups: {},
      window,
    };
  }
  const [
    eventsResult,
    leadsResult,
    linksResult,
    blocksResult,
    servicesResult,
    portfolioResult,
    stages,
    followups,
  ] = await Promise.all([
    supabase
      .from('card_events')
      .select('*')
      .in('card_id', cardIds)
      .gte('created_at', window.queryStart.toISOString())
      .order('created_at', { ascending: false }),
    supabase
      .from('connections')
      .select('*')
      .eq('owner_user_id', userId)
      .gte('created_at', window.queryStart.toISOString())
      .order('created_at', { ascending: false }),
    supabase.from('card_links').select('id,card_id,label,link_type').in('card_id', cardIds),
    supabase.from('card_blocks').select('id,card_id,title,block_type').in('card_id', cardIds),
    supabase.from('card_services').select('id,card_id,title').in('card_id', cardIds),
    supabase.from('portfolio_items').select('id,card_id,title').in('card_id', cardIds),
    getLeadStages(userId),
    getFollowupSummary(userId),
  ]);
  const error =
    eventsResult.error ||
    leadsResult.error ||
    linksResult.error ||
    blocksResult.error ||
    servicesResult.error ||
    portfolioResult.error;
  if (error) throw error;
  return {
    cards,
    events: eventsResult.data || [],
    connections: leadsResult.data || [],
    links: linksResult.data || [],
    blocks: blocksResult.data || [],
    services: servicesResult.data || [],
    portfolio: portfolioResult.data || [],
    stages,
    followups,
    window,
  };
}

function inPeriod(item, start, end) {
  const time = new Date(item.created_at).getTime();
  return Number.isFinite(time) && time >= start.getTime() && time < end.getTime();
}

function comparison(current, previous) {
  if (previous === 0)
    return current > 0
      ? { label: 'New activity', direction: 'up' }
      : { label: 'No activity', direction: 'flat' };
  const change = ((current - previous) / previous) * 100;
  return {
    label: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
  };
}

function uniqueMetric(events) {
  if (!events.length) return { available: true, value: 0 };
  if (events.some((event) => !event.visitor_token)) return { available: false, value: null };
  return { available: true, value: new Set(events.map((event) => event.visitor_token)).size };
}

function isContact(event) {
  return CONTACT_EVENT_TYPES.has(event.event_type);
}

function normalizeTrafficSource(event) {
  const raw = String(
    event.metadata?.traffic_source || event.metadata?.campaign_source || ''
  ).toLowerCase();
  const map = {
    direct: 'Direct link',
    qr: 'QR code',
    whatsapp: 'WhatsApp share',
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    email: 'Email',
    nfc: 'NFC',
    website: 'Website',
    campaign: 'Campaign link',
  };
  return map[raw] || 'Unknown';
}

function groupCount(items, keyFn) {
  const counts = {};
  items.forEach((item) => {
    const key = keyFn(item) || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function bucketKey(dateValue, range) {
  const date = new Date(dateValue);
  if (range === 'year') return date.toISOString().slice(0, 7);
  if (range === '90') {
    const first = startOfDay(date);
    first.setDate(first.getDate() - first.getDay());
    return first.toISOString().slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
}

function buildSeries(events, leadEvents, leads, wonKeys, range, metric, uniqueAvailable) {
  const items = metric === 'leads' ? leadEvents : metric === 'won' ? leads : events;
  const filtered = items.filter((item) => {
    if (metric === 'views' || metric === 'unique') return item.event_type === 'card_view';
    if (metric === 'contacts') return isContact(item);
    if (metric === 'won') return wonKeys.has(item.stage);
    return true;
  });
  if (metric === 'unique' && !uniqueAvailable) return [];
  const buckets = {};
  filtered.forEach((item) => {
    const key = bucketKey(item.created_at, range);
    if (metric === 'unique') {
      buckets[key] ||= new Set();
      buckets[key].add(item.visitor_token);
    } else buckets[key] = (buckets[key] || 0) + 1;
  });
  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: value instanceof Set ? value.size : value }));
}

export function buildInsightsSnapshot(
  data,
  { selectedCardId = 'all', range = '30', seriesMetric = 'views', period = 'current' } = {}
) {
  const start = period === 'previous' ? data.window.previousStart : data.window.currentStart;
  const end = period === 'previous' ? data.window.previousEnd : data.window.now;
  const cardMatches = (id) => selectedCardId === 'all' || id === selectedCardId;
  const events = data.events.filter(
    (item) => cardMatches(item.card_id) && inPeriod(item, start, end)
  );
  const leads = data.connections.filter(
    (item) => cardMatches(item.card_id) && inPeriod(item, start, end)
  );
  const views = events.filter((event) => event.event_type === 'card_view');
  const contactEvents = events.filter(isContact);
  const leadEvents = events.filter((event) =>
    ['lead_submit', 'enquiry_submit'].includes(event.event_type)
  );
  const saves = events.filter((event) =>
    ['contact_save', 'save_contact_click'].includes(event.event_type)
  );
  const uniqueVisitors = uniqueMetric(views);
  const engagementEvents = events.filter((event) => ENGAGEMENT_EVENT_TYPES.has(event.event_type));
  const engagedVisitors = uniqueMetric(engagementEvents);
  const wonKeys = new Set(
    data.stages.filter((stage) => stage.is_won).map((stage) => stage.stage_key)
  );
  const lostKeys = new Set(
    data.stages.filter((stage) => stage.is_lost).map((stage) => stage.stage_key)
  );
  const won = leads.filter((lead) => wonKeys.has(lead.stage));
  const lost = leads.filter((lead) => lostKeys.has(lead.stage));
  const conversionRate =
    uniqueVisitors.available && uniqueVisitors.value > 0
      ? (leadEvents.length / uniqueVisitors.value) * 100
      : null;
  const cardMap = Object.fromEntries(data.cards.map((card) => [card.id, card]));
  const contentMap = {};
  data.links.forEach((item) => {
    contentMap[item.id] = { ...item, kind: 'link', title: item.label || item.link_type };
  });
  data.blocks.forEach((item) => {
    contentMap[item.id] = { ...item, kind: 'block', title: item.title || item.block_type };
  });
  const contentClicks = {};
  events.forEach((event) => {
    const id = event.link_id || event.block_id;
    if (!id || !contentMap[id]) return;
    const content = contentMap[id];
    contentClicks[id] ||= {
      ...content,
      clicks: 0,
      tokens: [],
      cardName: cardMap[content.card_id]?.name || 'Card',
    };
    contentClicks[id].clicks += 1;
    if (event.visitor_token) contentClicks[id].tokens.push(event.visitor_token);
  });
  const topContent = Object.values(contentClicks)
    .map((item) => ({
      ...item,
      uniqueClicks: item.tokens.length === item.clicks ? new Set(item.tokens).size : null,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8);
  const estimatedPipeline = leads
    .filter((lead) => !wonKeys.has(lead.stage) && !lostKeys.has(lead.stage))
    .reduce((sum, lead) => sum + (Number(lead.estimated_value) || 0), 0);
  return {
    events,
    leads,
    metrics: {
      uniqueVisitors,
      views: views.length,
      contactActions: contactEvents.length,
      contactSaves: saves.length,
      leads: leadEvents.length,
      conversionRate,
    },
    funnel: {
      visitors: uniqueVisitors,
      engaged: engagedVisitors,
      leads: leadEvents.length,
      won: { available: false, value: null },
    },
    series: buildSeries(
      events,
      leadEvents,
      leads,
      wonKeys,
      range,
      seriesMetric,
      uniqueVisitors.available
    ),
    topContent,
    trafficSources: groupCount(views, normalizeTrafficSource),
    contactActions: groupCount(contactEvents, (event) => event.event_type),
    leadsBySource: groupCount(leads, (lead) => getSourceLabel(lead.source, lead.source_detail)),
    leadsByStage: groupCount(
      leads,
      (lead) =>
        data.stages.find((stage) => stage.stage_key === lead.stage)?.label ||
        lead.stage ||
        'Unknown'
    ),
    leadsByCard: groupCount(leads, (lead) => cardMap[lead.card_id]?.name || 'Unknown card'),
    won: won.length,
    lost: lost.length,
    estimatedPipeline,
  };
}

export function buildMetricComparison(current, previous) {
  return {
    views: comparison(current.metrics.views, previous.metrics.views),
    contactActions: comparison(current.metrics.contactActions, previous.metrics.contactActions),
    contactSaves: comparison(current.metrics.contactSaves, previous.metrics.contactSaves),
    leads: comparison(current.metrics.leads, previous.metrics.leads),
    uniqueVisitors:
      current.metrics.uniqueVisitors.available && previous.metrics.uniqueVisitors.available
        ? comparison(current.metrics.uniqueVisitors.value, previous.metrics.uniqueVisitors.value)
        : null,
    conversionRate:
      current.metrics.conversionRate != null && previous.metrics.conversionRate != null
        ? comparison(current.metrics.conversionRate, previous.metrics.conversionRate)
        : null,
  };
}

export function buildRollingSummary(data, days, selectedCardId = 'all') {
  const start = new Date(data.window.now.getTime() - days * 86400000);
  const matches = (item) =>
    (selectedCardId === 'all' || item.card_id === selectedCardId) &&
    new Date(item.created_at) >= start;
  const events = data.events.filter(matches);
  const leads = data.connections.filter(matches);
  const wonKeys = new Set(
    data.stages.filter((stage) => stage.is_won).map((stage) => stage.stage_key)
  );
  return {
    views: events.filter((event) => event.event_type === 'card_view').length,
    contactActions: events.filter(isContact).length,
    leads: events.filter((event) => ['lead_submit', 'enquiry_submit'].includes(event.event_type))
      .length,
    won: leads.filter((lead) => wonKeys.has(lead.stage)).length,
    overdue: selectedCardId === 'all' ? data.followups.overdue || 0 : null,
  };
}
