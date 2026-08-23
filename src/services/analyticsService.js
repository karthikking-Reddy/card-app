import { supabase } from '../../lib/supabase';

export async function recordCardEvent(
  cardId,
  eventType,
  options = {}
) {
  const {
    linkId = null,
    connectionId = null,
    source = 'app',
    metadata = {},
  } = options;

  const { error } = await supabase
    .from('card_events')
    .insert({
      card_id: cardId,
      link_id: linkId,
      connection_id: connectionId,
      event_type: eventType,
      source,
      metadata,
    });

  if (error) {
    throw error;
  }
}

export async function getCardEvents(cardId) {
  const { data, error } = await supabase
    .from('card_events')
    .select('*')
    .eq('card_id', cardId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getCardAnalytics(cardId) {
  const events = await getCardEvents(cardId);

  const stats = {
    cardViews: 0,
    linkClicks: 0,
    whatsappClicks: 0,
    phoneClicks: 0,
    emailClicks: 0,
    websiteClicks: 0,
    socialClicks: 0,
    leadSubmits: 0,
    totalEvents: events.length,
  };

  const linkTypes = new Set([
    'whatsapp_click',
    'phone_click',
    'email_click',
    'website_click',
    'instagram_click',
    'facebook_click',
    'linkedin_click',
    'youtube_click',
    'google_review_click',
    'location_click',
    'service_click',
    'portfolio_click',
  ]);

  const socialTypes = new Set([
    'instagram_click',
    'facebook_click',
    'linkedin_click',
    'youtube_click',
    'google_review_click',
  ]);

  for (const event of events) {
    if (event.event_type === 'card_view') {
      stats.cardViews += 1;
    }

    if (linkTypes.has(event.event_type)) {
      stats.linkClicks += 1;
    }

    if (socialTypes.has(event.event_type)) {
      stats.socialClicks += 1;
    }

    if (event.event_type === 'whatsapp_click') {
      stats.whatsappClicks += 1;
    }

    if (event.event_type === 'phone_click') {
      stats.phoneClicks += 1;
    }

    if (event.event_type === 'email_click') {
      stats.emailClicks += 1;
    }

    if (event.event_type === 'website_click') {
      stats.websiteClicks += 1;
    }

    if (event.event_type === 'lead_submit') {
      stats.leadSubmits += 1;
    }
  }

  return stats;
}
