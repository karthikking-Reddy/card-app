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
export async function getConnection(connectionId) {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (error) throw error;

  return data;
}

export async function createConnection(cardId, values) {
  const { data, error } = await supabase
    .from('connections')
    .insert({
      card_id: cardId,
      ...values,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateConnection(connectionId, values) {
  const { data, error } = await supabase
    .from('connections')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connectionId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function addLeadActivity(
  connectionId,
  activityType,
  title,
  description = '',
  metadata = {}
) {
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

export async function getLeadActivities(connectionId) {
  const { data, error } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: false });

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
