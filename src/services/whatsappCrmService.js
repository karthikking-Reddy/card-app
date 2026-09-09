import { supabase } from '../../lib/supabase';

import { getAllConnections } from './connectionService';

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data?.user) {
    throw new Error('Please sign in again.');
  }

  return data.user;
}

export async function getAvailableCrmLeads() {
  return getAllConnections();
}

export async function getLinkedCrmLead(connectionId) {
  if (!connectionId) {
    return null;
  }

  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('id', connectionId)
    .eq('owner_user_id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

export async function linkConversationToLead(conversationId, connectionId) {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .update({
      connection_id: connectionId,
    })
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function unlinkConversationFromLead(conversationId) {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .update({
      connection_id: null,
    })
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getPrimaryCard(userId) {
  const { data, error } = await supabase
    .from('digital_cards')
    .select('id, name, card_slug, is_primary')
    .eq('user_id', userId)
    .order('is_primary', {
      ascending: false,
    })
    .order('created_at', {
      ascending: true,
    })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

async function getDefaultLeadStage(userId) {
  const { data, error } = await supabase
    .from('lead_stages')
    .select('stage_key, sort_order, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('sort_order', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  const stages = data || [];

  const newStage = stages.find((item) => item.stage_key === 'new');

  return newStage?.stage_key || stages[0]?.stage_key || 'new';
}

async function findLeadByPhone(userId, phone) {
  if (!phone) {
    return null;
  }

  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .eq('owner_user_id', userId)
    .eq('phone', phone)
    .order('created_at', {
      ascending: false,
    })
    .limit(1);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function createLeadFromWhatsApp(conversation) {
  if (!conversation?.id) {
    throw new Error('WhatsApp conversation is missing.');
  }

  const user = await getCurrentUser();

  /*
   * Prevent duplicate CRM leads
   * when the same phone already
   * exists.
   */
  const existing = await findLeadByPhone(user.id, conversation.phone);

  if (existing) {
    await linkConversationToLead(conversation.id, existing.id);

    return {
      lead: existing,
      created: false,
    };
  }

  const card = await getPrimaryCard(user.id);

  if (!card) {
    throw new Error('Create a digital card before creating CRM leads.');
  }

  const stage = await getDefaultLeadStage(user.id);

  const { data: lead, error } = await supabase
    .from('connections')
    .insert({
      owner_user_id: user.id,

      card_id: card.id,

      name: conversation.contact_name || conversation.phone || 'WhatsApp Lead',

      phone: conversation.phone || null,

      email: null,

      company: null,

      requirement: 'WhatsApp enquiry',

      stage,

      source: 'whatsapp',

      source_detail: 'whatsapp_inbox',

      priority: 'normal',

      notes: 'CRM lead created automatically from WhatsApp Inbox.',

      last_contacted_at: conversation.last_message_at || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await linkConversationToLead(conversation.id, lead.id);

  return {
    lead,
    created: true,
  };
}
