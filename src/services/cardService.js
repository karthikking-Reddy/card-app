import { supabase } from '../../lib/supabase';
import { DEFAULT_CARD } from '../constants/config';

export async function getCard(userId) {
  const { data, error } =
    await supabase
      .from('digital_cards')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    return data;
  }

  return createDefaultCard(userId);
}

export async function createDefaultCard(userId) {
  const slug = `karthik-${userId.slice(0, 8)}`;

  const { data, error } =
    await supabase
      .from('digital_cards')
      .insert({
        user_id: userId,
        name: DEFAULT_CARD.name,
        designation: DEFAULT_CARD.designation,
        company: DEFAULT_CARD.company,
        phone: DEFAULT_CARD.phone,
        email: DEFAULT_CARD.email,
        website: DEFAULT_CARD.website,
        profile_image_url:
          DEFAULT_CARD.profile_image_url,
        card_slug: slug,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCard(userId, cardId, values) {
  const { data, error } =
    await supabase
      .from('digital_cards')
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .eq('user_id', userId)
      .select()
      .single();

  if (error) {
    throw error;
  }

  return data;
}
