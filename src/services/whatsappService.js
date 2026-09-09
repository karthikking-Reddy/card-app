import { supabase } from '../../lib/supabase';

export const WHATSAPP_CONVERSATION_PAGE_SIZE = 25;
export const WHATSAPP_MESSAGE_PAGE_SIZE = 50;

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error('Please sign in again.');
  return data.user.id;
}

export async function getWhatsAppConversationsPage({
  userId,
  page = 0,
  pageSize = WHATSAPP_CONVERSATION_PAGE_SIZE,
  status = 'all',
  search = '',
} = {}) {
  if (!userId) throw new Error('A signed-in user is required.');
  const from = page * pageSize;
  let query = supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false });
  if (status === 'unread') query = query.gt('unread_count', 0);
  else if (status !== 'all') query = query.eq('status', status);
  const term = search.trim().replace(/[,%()]/g, ' ');
  if (term) query = query.or(`contact_name.ilike.%${term}%,phone.ilike.%${term}%`);
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

export async function getWhatsAppInboxSummary(userId) {
  if (!userId) throw new Error('A signed-in user is required.');
  const base = () =>
    supabase
      .from('whatsapp_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
  const [total, open] = await Promise.all([base(), base().eq('status', 'open')]);
  const { data: unreadRows, error: unreadError } = await supabase
    .from('whatsapp_conversations')
    .select('unread_count')
    .eq('user_id', userId)
    .gt('unread_count', 0);
  const error = total.error || open.error || unreadError;
  if (error) throw error;
  return {
    total: total.count || 0,
    open: open.count || 0,
    unread: (unreadRows || []).reduce((sum, row) => sum + Number(row.unread_count || 0), 0),
  };
}

export async function getWhatsAppMessagesPage({
  conversationId,
  page = 0,
  pageSize = WHATSAPP_MESSAGE_PAGE_SIZE,
} = {}) {
  if (!conversationId) return { data: [], page, pageSize, hasMore: false };
  const userId = await getCurrentUserId();
  const { data: ownedConversation, error: ownershipError } = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();
  if (ownershipError) throw ownershipError;
  if (!ownedConversation) throw new Error('Conversation unavailable.');
  const from = page * pageSize;
  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + pageSize);
  if (error) throw error;
  const rows = data || [];
  return {
    data: rows.slice(0, pageSize).reverse(),
    page,
    pageSize,
    hasMore: rows.length > pageSize,
  };
}

export async function getWhatsAppConversations(userId) {
  let ownerId = userId;
  if (!ownerId) {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    ownerId = data.user?.id;
  }
  if (!ownerId) throw new Error('A signed-in user is required.');
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select(
      `
        id,
        user_id,
        whatsapp_account_id,
        connection_id,
        wa_contact_id,
        phone,
        contact_name,
        status,
        unread_count,
        last_message_at,
        metadata,
        created_at,
        updated_at
      `
    )
    .eq('user_id', ownerId)
    .order('last_message_at', {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getWhatsAppMessages(conversationId) {
  if (!conversationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .select(
      `
        id,
        conversation_id,
        wa_message_id,
        direction,
        message_type,
        body,
        media_url,
        status,
        sent_at,
        delivered_at,
        read_at,
        created_at
      `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function markConversationRead(conversationId) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .update({
      unread_count: 0,
    })
    .eq('id', conversationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateConversationStatus(conversationId, status) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .update({
      status,
    })
    .eq('id', conversationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getWhatsAppInboxStats() {
  const conversations = await getWhatsAppConversations();

  return {
    total: conversations.length,

    open: conversations.filter((item) => item.status === 'open').length,

    unread: conversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0),
  };
}
