import { supabase } from '../../lib/supabase';

export const FOLLOWUP_PAGE_SIZE = 25;

export async function getFollowupTasksPage({
  userId,
  page = 0,
  pageSize = FOLLOWUP_PAGE_SIZE,
  status = 'pending',
} = {}) {
  if (!userId) throw new Error('A signed-in user is required.');
  const from = page * pageSize;
  let query = supabase
    .from('followup_tasks')
    .select(`*, connections (id, name, phone, email, company, stage)`)
    .eq('user_id', userId)
    .order('due_at', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query.range(from, from + pageSize);
  if (error) throw error;
  const rows = data || [];
  return {
    data: rows.slice(0, pageSize),
    page,
    pageSize,
    hasMore: rows.length > pageSize,
  };
}

export async function getFollowupSummary(userId) {
  if (!userId) throw new Error('A signed-in user is required.');
  const now = new Date().toISOString();
  const base = () =>
    supabase
      .from('followup_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
  const [total, pending, overdue] = await Promise.all([
    base(),
    base().eq('status', 'pending'),
    base().eq('status', 'pending').not('due_at', 'is', null).lt('due_at', now),
  ]);
  const error = total.error || pending.error || overdue.error;
  if (error) throw error;
  return { total: total.count || 0, pending: pending.count || 0, overdue: overdue.count || 0 };
}

export async function getFollowupTasks(userId) {
  const { data, error } = await supabase
    .from('followup_tasks')
    .select(
      `
      *,
      connections (
        id,
        name,
        phone,
        email,
        company,
        stage
      )
    `
    )
    .eq('user_id', userId)
    .order('due_at', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getConnectionFollowups(userId, connectionId) {
  const { data, error } = await supabase
    .from('followup_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('connection_id', connectionId)
    .order('due_at', {
      ascending: true,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createFollowupTask(userId, connectionId, values) {
  const { data, error } = await supabase
    .from('followup_tasks')
    .insert({
      user_id: userId,
      connection_id: connectionId,
      title: values.title,
      description: values.description || null,
      due_at: values.due_at || null,
      priority: values.priority || 'normal',
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateFollowupTask(taskId, values) {
  const { data, error } = await supabase
    .from('followup_tasks')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function completeFollowupTask(taskId) {
  return updateFollowupTask(taskId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

export async function reopenFollowupTask(taskId) {
  return updateFollowupTask(taskId, {
    status: 'pending',
    completed_at: null,
  });
}

export async function deleteFollowupTask(taskId) {
  const { error } = await supabase.from('followup_tasks').delete().eq('id', taskId);

  if (error) {
    throw error;
  }
}
