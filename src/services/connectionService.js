import { supabase } from '../../lib/supabase';

export const CONNECTION_STAGES = [
  'new',
  'pending',
  'interested',
  'follow_up',
  'not_connected',
  'in_progress',
  'not_answered',
  'visited',
  'converted',
  'dead',
  'lost',
];

export const STAGE_LABELS = {
  new: 'New',
  pending: 'Pending',
  interested: 'Interested',
  follow_up: 'Follow Up',
  not_connected: 'Not Connected',
  in_progress: 'In Progress',
  not_answered: 'Not Answered',
  visited: 'Visited',
  converted: 'Converted',
  dead: 'Dead',
  lost: 'Lost',
};

export const CONNECTION_PAGE_SIZE = 25;

export const PRIORITY_LABELS = { low: 'Low', normal: 'Medium', medium: 'Medium', high: 'High' };

export const SOURCE_LABELS = {
  public_card: 'Digital Card Enquiry',
  card_enquiry: 'Digital Card Enquiry',
  qr: 'QR',
  qr_code: 'QR',
  manual: 'Manual',
  mobile_app: 'Manual',
  website: 'Website',
  whatsapp: 'WhatsApp',
  meta: 'Meta Lead Ad',
  meta_lead_ad: 'Meta Lead Ad',
  import: 'Import',
};

export function getSourceLabel(source, sourceDetail) {
  const key = String(sourceDetail || source || '').toLowerCase();
  return SOURCE_LABELS[key] || SOURCE_LABELS[String(source || '').toLowerCase()] || 'Other';
}

export function getPriorityLabel(priority) {
  return PRIORITY_LABELS[String(priority || '').toLowerCase()] || 'Medium';
}

function pageResult(data, page, pageSize) {
  const rows = data || [];
  return { data: rows.slice(0, pageSize), page, pageSize, hasMore: rows.length > pageSize };
}

export async function getConnectionsPage({
  userId,
  page = 0,
  pageSize = CONNECTION_PAGE_SIZE,
  search = '',
  stage = 'all',
  priority = 'all',
  source = 'all',
  followup = 'all',
} = {}) {
  if (!userId) throw new Error('A signed-in user is required.');

  const from = page * pageSize;
  let query = supabase
    .from('connections')
    .select('*')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (stage && stage !== 'all') query = query.eq('stage', stage);
  if (priority && priority !== 'all') {
    query =
      priority === 'medium'
        ? query.in('priority', ['normal', 'medium'])
        : query.eq('priority', priority);
  }
  if (source && source !== 'all') {
    if (source === 'manual') {
      query = query.or('source.eq.manual,source.eq.mobile_app,source_detail.eq.manual');
    } else if (source === 'meta_lead_ad') {
      query = query.in('source', ['meta', 'meta_lead_ad']);
    } else if (source === 'public_card') {
      query = query.in('source', ['public_card', 'card_enquiry']);
    } else if (source === 'qr') {
      query = query.in('source', ['qr', 'qr_code']);
    } else {
      query = query.eq('source', source);
    }
  }
  const now = new Date().toISOString();
  if (followup === 'overdue')
    query = query.not('next_follow_up_at', 'is', null).lt('next_follow_up_at', now);
  if (followup === 'upcoming') query = query.gte('next_follow_up_at', now);
  if (followup === 'none') query = query.is('next_follow_up_at', null);
  const term = search.trim().replace(/[,%()]/g, ' ');
  if (term) {
    const pattern = `%${term}%`;
    query = query.or(
      `name.ilike.${pattern},phone.ilike.${pattern},email.ilike.${pattern},company.ilike.${pattern},requirement.ilike.${pattern}`
    );
  }

  const { data, error } = await query.range(from, from + pageSize);
  if (error) throw error;
  return pageResult(data, page, pageSize);
}

export async function getConnectionSummary(userId, wonStages = [], lostStages = []) {
  if (!userId) throw new Error('A signed-in user is required.');
  const count = (configure = (query) => query) =>
    configure(
      supabase
        .from('connections')
        .select('id', { count: 'exact', head: true })
        .eq('owner_user_id', userId)
    );
  const terminalStages = [...new Set([...wonStages, ...lostStages])];
  const [total, won, lost, open] = await Promise.all([
    count(),
    wonStages.length ? count((query) => query.in('stage', wonStages)) : { count: 0 },
    lostStages.length ? count((query) => query.in('stage', lostStages)) : { count: 0 },
    terminalStages.length
      ? count((query) => query.not('stage', 'in', `(${terminalStages.join(',')})`))
      : count(),
  ]);
  const error = total.error || won.error || lost.error || open.error;
  if (error) throw error;
  return {
    total: total.count || 0,
    open: open.count || 0,
    won: won.count || 0,
    lost: lost.count || 0,
  };
}

export async function getConnections(cardId) {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function getAllConnections(userId) {
  let ownerId = userId;
  if (!ownerId) {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    ownerId = data.user?.id;
  }
  if (!ownerId) throw new Error('A signed-in user is required.');
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('owner_user_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
export async function getConnection(userId, connectionId) {
  if (!userId) throw new Error('A signed-in user is required.');
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .eq('owner_user_id', userId)
    .single();

  if (error) throw error;

  return data;
}

export async function createConnection(userId, cardId, values) {
  if (!userId) throw new Error('A signed-in user is required.');
  const { data, error } = await supabase
    .from('connections')
    .insert({
      owner_user_id: userId,
      card_id: cardId,
      ...values,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateConnection(userId, connectionId, values) {
  if (!userId) throw new Error('A signed-in user is required.');
  const { data, error } = await supabase
    .from('connections')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .eq('owner_user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function addLeadActivity(
  userId,
  connectionId,
  activityType,
  title,
  description = '',
  metadata = {}
) {
  await getConnection(userId, connectionId);
  const { data, error } = await supabase
    .from('lead_activities')
    .insert({
      connection_id: connectionId,
      activity_type: activityType,
      title,
      description,
      metadata,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getLeadActivities(userId, connectionId) {
  await getConnection(userId, connectionId);
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}

export async function findPossibleDuplicates(userId, { phone = '', email = '' } = {}) {
  if (!userId) throw new Error('A signed-in user is required.');
  const normalizedPhone = String(phone).replace(/\D/g, '');
  const normalizedEmail = String(email)
    .trim()
    .toLowerCase()
    .replace(/[,%()]/g, '');
  if (!normalizedPhone && !normalizedEmail) return [];

  let query = supabase
    .from('connections')
    .select('id,name,phone,email,company,stage')
    .eq('owner_user_id', userId)
    .limit(10);
  const clauses = [];
  if (normalizedEmail) clauses.push(`email.ilike.${normalizedEmail}`);
  if (normalizedPhone) clauses.push(`phone.ilike.%${normalizedPhone.slice(-10)}%`);
  if (clauses.length) query = query.or(clauses.join(','));
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export function calculateConnectionStats(connections) {
  const stats = {
    all: connections.length,
    new: 0,
    pending: 0,
    interested: 0,
    follow_up: 0,
    not_connected: 0,
    in_progress: 0,
    not_answered: 0,
    visited: 0,
    converted: 0,
    dead: 0,
    lost: 0,
  };

  for (const connection of connections) {
    if (Object.prototype.hasOwnProperty.call(stats, connection.stage)) {
      stats[connection.stage] += 1;
    }
  }

  return stats;
}
