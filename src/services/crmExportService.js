import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { getAllConnections } from './connectionService';

function escapeCsv(value) {
  if (value === null || value === undefined) {
    return '""';
  }

  const text = String(value);

  return `"${text.replace(/"/g, '""')}"`;
}

export async function exportConnectionsCsv() {
  const connections = await getAllConnections();

  if (!connections.length) {
    throw new Error('There are no CRM leads to export.');
  }

  const headers = [
    'Name',
    'Phone',
    'Email',
    'Company',
    'Requirement',
    'Stage',
    'Source',
    'Source Detail',
    'Priority',
    'Estimated Value',
    'Next Follow Up',
    'Notes',
    'Created At',
    'Updated At',
    'Card ID',
  ];

  const rows = connections.map((lead) => [
    lead.name,
    lead.phone,
    lead.email,
    lead.company,
    lead.requirement,
    lead.stage,
    lead.source,
    lead.source_detail,
    lead.priority,
    lead.estimated_value,
    lead.next_follow_up_at,
    lead.notes,
    lead.created_at,
    lead.updated_at,
    lead.card_id,
  ]);

  // Excel on mobile and Windows uses the BOM to reliably detect UTF-8.
  const csvContent = `\uFEFF${[
    headers.map(escapeCsv).join(','),

    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\r\n')}`;

  const date = new Date().toISOString().slice(0, 10);

  const fileName = `YNS-CRM-Leads-${date}.csv`;

  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const sharingAvailable = await Sharing.isAvailableAsync();

  if (!sharingAvailable) {
    throw new Error('File sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',

    dialogTitle: 'Export YNS CRM Leads',

    UTI: 'public.comma-separated-values-text',
  });

  return {
    count: connections.length,

    fileName,

    fileUri,
  };
}
