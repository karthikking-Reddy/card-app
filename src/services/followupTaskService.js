import { supabase } from '../../lib/supabase';

export const FOLLOWUP_PAGE_SIZE = 25;

export async function getFollowupTasksPage({
  userId,
  page = 0,
  pageSize = FOLLOWUP_PAGE_SIZE,
  status = 'pending',
  view = 'all',
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
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  if (view === 'today') {
    query = query.gte('due_at', now.toISOString()).lt('due_at', startOfTomorrow.toISOString());
  }
  if (view === 'upcoming') query = query.gte('due_at', startOfTomorrow.toISOString());
  if (view === 'overdue') query = query.not('due_at', 'is', null).lt('due_at', now.toISOString());
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
  const base = () =>
    supabase
      .from('followup_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [total, pending, overdue, dueToday, upcoming, completed] = await Promise.all([
    base(),
    base().eq('status', 'pending'),
    base().eq('status', 'pending').not('due_at', 'is', null).lt('due_at', new Date().toISOString()),
    base()
      .eq('status', 'pending')
      .gte('due_at', new Date().toISOString())
      .lt('due_at', tomorrow.toISOString()),
    base().eq('status', 'pending').gte('due_at', tomorrow.toISOString()),
    base().eq('status', 'completed'),
  ]);
  const error =
    total.error ||
    pending.error ||
    overdue.error ||
    dueToday.error ||
    upcoming.error ||
    completed.error;
  if (error) throw error;
  return {
    total: total.count || 0,
    pending: pending.count || 0,
    overdue: overdue.count || 0,
    dueToday: dueToday.count || 0,
    upcoming: upcoming.count || 0,
    completed: completed.count || 0,
  };
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

export async function updateFollowupTask(userId, taskId, values) {
  if (!userId) throw new Error('A signed-in user is required.');
  const { data, error } = await supabase
    .from('followup_tasks')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function completeFollowupTask(userId, taskId) {
  return updateFollowupTask(userId, taskId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
}

export async function reopenFollowupTask(userId, taskId) {
  return updateFollowupTask(userId, taskId, {
    status: 'pending',
    completed_at: null,
  });
}

export async function deleteFollowupTask(userId, taskId) {
  if (!userId) throw new Error('A signed-in user is required.');
  const { error } = await supabase
    .from('followup_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }
}
