import { supabase } from '../../lib/supabase';

export async function getWhatsAppConversations() {
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
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .update({
      unread_count: 0,
    })
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateConversationStatus(conversationId, status) {
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .update({
      status,
    })
    .eq('id', conversationId)
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
