import { supabase } from '../../lib/supabase';

export async function getCardLinks(cardId) {
  const { data, error } = await supabase
    .from('card_links')
    .select('*')
    .eq('card_id', cardId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function ensureDefaultLinks(card) {
  if (!card?.id) {
    return [];
  }

  const { data: existing, error: existingError } =
    await supabase
      .from('card_links')
      .select('link_type')
      .eq('card_id', card.id);

  if (existingError) {
    throw existingError;
  }

  const existingTypes = new Set(
    (existing || []).map((item) => item.link_type)
  );

  const defaults = [
    {
      card_id: card.id,
      link_type: 'whatsapp',
      label: 'WhatsApp',
      value: card.whatsapp || card.phone || '',
      icon_name: 'logo-whatsapp',
      sort_order: 1,
      is_active: Boolean(card.whatsapp || card.phone),
    },
    {
      card_id: card.id,
      link_type: 'phone',
      label: 'Call',
      value: card.phone || '',
      icon_name: 'call-outline',
      sort_order: 2,
      is_active: Boolean(card.phone),
    },
    {
      card_id: card.id,
      link_type: 'email',
      label: 'Email',
      value: card.email || '',
      icon_name: 'mail-outline',
      sort_order: 3,
      is_active: Boolean(card.email),
    },
    {
      card_id: card.id,
      link_type: 'website',
      label: 'Website',
      value: card.website || '',
      icon_name: 'globe-outline',
      sort_order: 4,
      is_active: Boolean(card.website),
    },
    {
      card_id: card.id,
      link_type: 'instagram',
      label: 'Instagram',
      value: '',
      icon_name: 'logo-instagram',
      sort_order: 5,
      is_active: false,
    },
    {
      card_id: card.id,
      link_type: 'facebook',
      label: 'Facebook',
      value: '',
      icon_name: 'logo-facebook',
      sort_order: 6,
      is_active: false,
    },
    {
      card_id: card.id,
      link_type: 'linkedin',
      label: 'LinkedIn',
      value: '',
      icon_name: 'logo-linkedin',
      sort_order: 7,
      is_active: false,
    },
    {
      card_id: card.id,
      link_type: 'youtube',
      label: 'YouTube',
      value: '',
      icon_name: 'logo-youtube',
      sort_order: 8,
      is_active: false,
    },
    {
      card_id: card.id,
      link_type: 'google_reviews',
      label: 'Google Reviews',
      value: '',
      icon_name: 'star-outline',
      sort_order: 9,
      is_active: false,
    },
    {
      card_id: card.id,
      link_type: 'location',
      label: 'Location',
      value: card.location || '',
      icon_name: 'location-outline',
      sort_order: 10,
      is_active: Boolean(card.location),
    },
  ];

  const missing = defaults.filter(
    (item) => !existingTypes.has(item.link_type)
  );

  if (missing.length > 0) {
    const { error } = await supabase
      .from('card_links')
      .insert(missing);

    if (error) {
      throw error;
    }
  }

  return getCardLinks(card.id);
}

export async function updateCardLink(cardId, linkType, values) {
  const { data: existing, error: findError } =
    await supabase
      .from('card_links')
      .select('id')
      .eq('card_id', cardId)
      .eq('link_type', linkType)
      .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing) {
    const { data, error } = await supabase
      .from('card_links')
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from('card_links')
    .insert({
      card_id: cardId,
      link_type: linkType,
      ...values,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
