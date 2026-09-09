import { CARD_WEB_URL } from '../constants/config';

export function getPublicCardUrl(card) {
  return card?.card_slug ? `${CARD_WEB_URL}/${encodeURIComponent(card.card_slug)}` : null;
}

export function getCardPublicAvailability(card) {
  if (!card) {
    return { available: false, code: 'missing', message: 'Choose a digital card first.' };
  }
  if (!card.card_slug) {
    return { available: false, code: 'missing_slug', message: 'This card has no public URL yet.' };
  }
  if (card.approval_status !== 'approved') {
    return {
      available: false,
      code: 'approval',
      message: 'Administrator approval is required before public sharing.',
    };
  }
  if (!card.is_public) {
    return {
      available: false,
      code: 'private',
      message: 'This card is private. Enable Public Card in Card Settings first.',
    };
  }
  if (!card.is_active) {
    return {
      available: false,
      code: 'inactive',
      message: 'This card is inactive. Enable Active Card in Card Settings first.',
    };
  }

  return { available: true, code: 'available', message: 'Public card is ready to share.' };
}

export function canExposePublicCard(card) {
  return getCardPublicAvailability(card).available;
}
