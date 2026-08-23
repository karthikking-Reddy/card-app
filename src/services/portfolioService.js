import { supabase } from '../../lib/supabase';

export async function getPortfolioItems(cardId) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('card_id', cardId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getPortfolioByType(
  cardId,
  portfolioType
) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('card_id', cardId)
    .eq('portfolio_type', portfolioType)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function createPortfolioItem(
  cardId,
  values
) {
  const { data, error } = await supabase
    .from('portfolio_items')
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

export async function updatePortfolioItem(
  itemId,
  values
) {
  const { data, error } = await supabase
    .from('portfolio_items')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deletePortfolioItem(itemId) {
  const { error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw error;
  }
}
