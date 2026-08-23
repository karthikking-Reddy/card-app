import { supabase } from '../../lib/supabase';

export async function getCardServices(cardId) {
  const { data, error } = await supabase
    .from('card_services')
    .select('*')
    .eq('card_id', cardId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function ensureDefaultServices(cardId) {
  const { data: existing, error: existingError } =
    await supabase
      .from('card_services')
      .select('title')
      .eq('card_id', cardId);

  if (existingError) {
    throw existingError;
  }

  const existingTitles = new Set(
    (existing || []).map((item) =>
      item.title.toLowerCase()
    )
  );

  const defaults = [
    {
      card_id: cardId,
      title: 'Digital Marketing',
      short_description:
        'Grow your business across digital platforms.',
      icon_name: 'megaphone-outline',
      sort_order: 1,
      is_active: true,
    },
    {
      card_id: cardId,
      title: 'Web Development',
      short_description:
        'Modern websites and business web solutions.',
      icon_name: 'code-slash-outline',
      sort_order: 2,
      is_active: true,
    },
    {
      card_id: cardId,
      title: 'Automation',
      short_description:
        'Automate repetitive business processes.',
      icon_name: 'settings-outline',
      sort_order: 3,
      is_active: true,
    },
  ];

  const missing = defaults.filter(
    (item) =>
      !existingTitles.has(item.title.toLowerCase())
  );

  if (missing.length > 0) {
    const { error } = await supabase
      .from('card_services')
      .insert(missing);

    if (error) {
      throw error;
    }
  }

  return getCardServices(cardId);
}

export async function createService(cardId, values) {
  const { data, error } = await supabase
    .from('card_services')
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

export async function updateService(serviceId, values) {
  const { data, error } = await supabase
    .from('card_services')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteService(serviceId) {
  const { error } = await supabase
    .from('card_services')
    .delete()
    .eq('id', serviceId);

  if (error) {
    throw error;
  }
}
