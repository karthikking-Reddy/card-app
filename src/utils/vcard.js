export function escapeVCard(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

export function normalizeWebsite(value) {
  if (!value) {
    return '';
  }

  if (
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }

  return `https://${value}`;
}

export function createVCard(card) {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCard(card.name || '')}`,
    `ORG:${escapeVCard(card.company || '')}`,
    `TITLE:${escapeVCard(card.designation || '')}`,
    `TEL;TYPE=CELL:${escapeVCard(card.phone || '')}`,
    `EMAIL:${escapeVCard(card.email || '')}`,
    `URL:${escapeVCard(
      normalizeWebsite(card.website || '')
    )}`,
    'END:VCARD',
  ].join('\r\n');
}
