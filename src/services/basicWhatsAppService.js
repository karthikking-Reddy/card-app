const PUBLIC_CARD_BASE_URL = 'https://card.ynscrm.online/card';

export function normalizeWhatsAppPhone(value) {
  return String(value || '').replace(/\D/g, '');
}

export function buildPublicCardUrl(cardSlug) {
  const slug = String(cardSlug || '').trim();
  return slug ? `${PUBLIC_CARD_BASE_URL}/${encodeURIComponent(slug)}` : '';
}

export function buildBasicWhatsAppUrl({ phone, message = '' } = {}) {
  const number = normalizeWhatsAppPhone(phone);
  if (!number) throw new Error('A valid WhatsApp phone number is required.');
  const text = String(message || '').trim();
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function buildLeadWhatsAppMessage(lead, cardSlug) {
  const name = String(lead?.name || '').trim();
  const cardUrl = buildPublicCardUrl(cardSlug);
  return [`Hello${name ? ` ${name}` : ''},`, 'Thank you for connecting with me.', cardUrl]
    .filter(Boolean)
    .join('\n\n');
}

export function applyQuickMessage(templateBody, lead, cardSlug) {
  const replacements = [lead?.name || '', buildPublicCardUrl(cardSlug)];
  return String(templateBody || '').replace(/\{\{(\d+)\}\}/g, (_, index) => {
    return replacements[Number(index) - 1] || '';
  });
}

export async function getBasicWhatsAppOptions(userId, cardId) {
  if (!userId) throw new Error('A signed-in user is required.');
  const [cardResult, templateResult] = await Promise.all([
    supabase
      .from('digital_cards')
      .select('card_slug,approval_status')
      .eq('user_id', userId)
      .eq('id', cardId)
      .maybeSingle(),
    supabase
      .from('whatsapp_templates')
      .select('id,name,body,is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);
  if (cardResult.error) throw cardResult.error;
  if (templateResult.error) throw templateResult.error;
  return {
    cardSlug:
      cardResult.data?.approval_status === 'approved' ? cardResult.data?.card_slug || '' : '',
    quickMessages: templateResult.data || [],
  };
}
import { supabase } from '../../lib/supabase';
