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

export async function getConnections(cardId) {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data || [];
}


export async function getAllConnections() {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
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

export async function updateConnection(
  connectionId,
  values
) {
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

export async function getLeadActivities(
  connectionId
) {
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
    if (
      Object.prototype.hasOwnProperty.call(
        stats,
        connection.stage
      )
    ) {
      stats[connection.stage] += 1;
    }
  }

  return stats;
}

