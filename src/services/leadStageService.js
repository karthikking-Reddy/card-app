import { supabase } from '../../lib/supabase';

export async function getLeadStages(userId) {
  const { data, error } = await supabase
    .from('lead_stages')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createLeadStage(userId, values) {
  const existing = await getLeadStages(userId);

  const baseKey = String(values.label || 'stage')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const stageKey = `${baseKey}_${Date.now().toString(36).slice(-4)}`;

  const { data, error } = await supabase
    .from('lead_stages')
    .insert({
      user_id: userId,

      stage_key: stageKey,

      label: values.label.trim(),

      sort_order: existing.length + 1,

      is_won: Boolean(values.is_won),

      is_lost: Boolean(values.is_lost),

      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLeadStage(stageId, values) {
  const { data, error } = await supabase
    .from('lead_stages')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stageId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteLeadStage(stageId, stageKey) {
  const { count, error: countError } = await supabase
    .from('connections')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('stage', stageKey);

  if (countError) {
    throw countError;
  }

  if ((count || 0) > 0) {
    throw new Error(
      'This stage is currently used by leads. Move those leads to another stage before deleting it.'
    );
  }

  const { error } = await supabase.from('lead_stages').delete().eq('id', stageId);

  if (error) {
    throw error;
  }
}

export async function reorderLeadStages(stages) {
  await Promise.all(
    stages.map((stage, index) =>
      updateLeadStage(stage.id, {
        sort_order: index + 1,
      })
    )
  );

  return stages.map((stage, index) => ({
    ...stage,
    sort_order: index + 1,
  }));
}
