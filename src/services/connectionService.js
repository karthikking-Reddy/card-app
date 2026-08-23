import { supabase } from '../../lib/supabase';

export async function getConnections(cardId) {
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createConnection(
  cardId,
  values
) {
  const { data, error } = await supabase
    .from('connections')
    .insert({
      card_id: cardId,
      ...values,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

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

  if (error) {
    throw error;
  }

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

  if (error) {
    throw error;
  }

  return data;
}

export function calculateConnectionStats(connections) {
  const stats = {
    all: connections.length,
    new: 0,
    pending: 0,
    interested: 0,
    follow_up: 0,
    in_progress: 0,
    converted: 0,
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
