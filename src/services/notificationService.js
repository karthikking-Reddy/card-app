import { supabase } from '../../lib/supabase';

export const NOTIFICATION_PAGE_SIZE = 25;

export async function getNotificationsPage({
  userId,
  page = 0,
  pageSize = NOTIFICATION_PAGE_SIZE,
} = {}) {
  if (!userId) throw new Error('A signed-in user is required.');
  const from = page * pageSize;
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + pageSize);
  if (error) throw error;
  const rows = data || [];
  return {
    data: rows.slice(0, pageSize),
    page,
    pageSize,
    hasMore: rows.length > pageSize,
  };
}

export async function getUnreadNotificationCount(userId) {
  if (!userId) throw new Error('A signed-in user is required.');
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function markNotificationRead(notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
    })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    throw error;
  }
}
