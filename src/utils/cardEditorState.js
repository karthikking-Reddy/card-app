export const CARD_EDITOR_FIELDS = [
  'name',
  'designation',
  'company',
  'phone',
  'email',
  'website',
  'whatsapp',
  'tagline',
  'bio',
  'industry',
  'location',
];

export function getCardEditableValues(card = {}) {
  const values = {};
  for (const field of CARD_EDITOR_FIELDS) {
    values[field] = String(card[field] ?? '');
  }
  if (!values.whatsapp) values.whatsapp = values.phone;
  return values;
}

export function areCardEditableValuesEqual(left, right) {
  if (!left || !right) return left === right;
  return CARD_EDITOR_FIELDS.every(
    (field) => String(left[field] ?? '') === String(right[field] ?? '')
  );
}
