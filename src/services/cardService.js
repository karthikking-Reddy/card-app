import { supabase } from '../../lib/supabase';
import { DEFAULT_CARD } from '../constants/config';

const APPROVAL_FIELDS = [
  'approval_status',
  'approval_requested_at',
  'approved_at',
  'approved_by',
  'rejection_reason',
];

function slugify(value) {
  return String(value || 'card')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'card';
}

function makeCardSlug(name, userId) {
  const suffix = Date.now()
    .toString(36)
    .slice(-5);

  return `${slugify(name)}-${userId.slice(0, 8)}-${suffix}`;
}

export async function getCards(userId) {
  const { data, error } = await supabase
    .from('digital_cards')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', {
      ascending: false,
    })
    .order('created_at', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getCard(userId) {
  const cards = await getCards(userId);

  if (cards.length > 0) {
    return (
      cards.find(
        (card) => card.is_primary
      ) || cards[0]
    );
  }

  return createDefaultCard(userId);
}

export async function getCardById(
  userId,
  cardId
) {
  const { data, error } = await supabase
    .from('digital_cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createDefaultCard(
  userId
) {
  return createCard(userId, DEFAULT_CARD);
}

export async function createCard(
  userId,
  values = {}
) {
  const existingCards =
    await getCards(userId);

  const name =
    values.name ||
    DEFAULT_CARD.name ||
    'My Card';

  const cardSlug =
    values.card_slug ||
    makeCardSlug(name, userId);

  const { data, error } = await supabase
    .from('digital_cards')
    .insert({
      user_id: userId,

      name,
      designation:
        values.designation ??
        DEFAULT_CARD.designation,

      company:
        values.company ??
        DEFAULT_CARD.company,

      phone:
        values.phone ??
        DEFAULT_CARD.phone,

      email:
        values.email ??
        DEFAULT_CARD.email,

      website:
        values.website ??
        DEFAULT_CARD.website,

      profile_image_url:
        values.profile_image_url ??
        null,

      card_slug: cardSlug,

      bio:
        values.bio || null,

      industry:
        values.industry || null,

      location:
        values.location || null,

      whatsapp:
        values.whatsapp ||
        values.phone ||
        DEFAULT_CARD.phone ||
        null,

      tagline:
        values.tagline || null,

      theme:
        values.theme ||
        'standard',

      card_type:
        values.card_type ||
        'business',

      is_active: true,
      is_public: true,

      is_primary:
        existingCards.length === 0,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCard(
  userId,
  cardId,
  values
) {
  const safeValues = { ...(values || {}) };
  APPROVAL_FIELDS.forEach((field) => delete safeValues[field]);

  const { data, error } = await supabase
    .from('digital_cards')
    .update({
      ...safeValues,
      updated_at:
        new Date().toISOString(),
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

export async function setPrimaryCard(
  userId,
  cardId
) {
  const {
    error: clearError,
  } = await supabase
    .from('digital_cards')
    .update({
      is_primary: false,
      updated_at:
        new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (clearError) {
    throw clearError;
  }

  const { data, error } = await supabase
    .from('digital_cards')
    .update({
      is_primary: true,
      updated_at:
        new Date().toISOString(),
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

export async function deleteCard(
  userId,
  cardId
) {
  const cards =
    await getCards(userId);

  if (cards.length <= 1) {
    throw new Error(
      'You must keep at least one digital card.'
    );
  }

  const selected =
    cards.find(
      (card) => card.id === cardId
    );

  const { error } = await supabase
    .from('digital_cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  if (selected?.is_primary) {
    const remaining =
      cards.filter(
        (card) => card.id !== cardId
      );

    if (remaining.length > 0) {
      await setPrimaryCard(
        userId,
        remaining[0].id
      );
    }
  }
}
