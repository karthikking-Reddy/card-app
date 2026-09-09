import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

function csv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export async function exportInsightsCsv({ snapshot, rangeLabel, cardLabel }) {
  if (!snapshot) throw new Error('Insights are not available to export.');
  const generatedAt = new Date().toISOString();
  const rows = [
    ['YNS Card Performance Report', ''],
    ['Date range', rangeLabel],
    ['Selected cards', cardLabel],
    ['Generated at', generatedAt],
    ['', ''],
    ['Metric', 'Value'],
    [
      'Unique visitors',
      snapshot.metrics.uniqueVisitors.available
        ? snapshot.metrics.uniqueVisitors.value
        : 'Unavailable',
    ],
    ['Card views', snapshot.metrics.views],
    ['Contact actions', snapshot.metrics.contactActions],
    ['Contact saves', snapshot.metrics.contactSaves],
    ['New leads', snapshot.metrics.leads],
    [
      'Conversion rate',
      snapshot.metrics.conversionRate == null
        ? 'Unavailable'
        : `${snapshot.metrics.conversionRate.toFixed(1)}%`,
    ],
    ['Leads created in range and currently Won', snapshot.won],
    ['Lost leads', snapshot.lost],
    ['Estimated pipeline value', snapshot.estimatedPipeline],
    ['Won revenue', 'Unavailable — authoritative won value is not stored'],
    ['', ''],
    ['Definitions', ''],
    ['Card views', 'Recorded public card openings'],
    ['Contact actions', 'Recorded contact/link clicks; not confirmed outcomes'],
    ['New leads', 'Connections created in the selected period'],
    [
      'Conversion rate',
      'New leads divided by privacy-safe unique visitors when tokens are complete',
    ],
  ];
  const body = `\uFEFF${rows.map((row) => row.map(csv).join(',')).join('\r\n')}`;
  const path = `${FileSystem.cacheDirectory}YNS-Insights-${new Date().toISOString().slice(0, 10)}.csv`;
  await FileSystem.writeAsStringAsync(path, body, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('File sharing is unavailable on this device.');
  await Sharing.shareAsync(path, {
    mimeType: 'text/csv',
    dialogTitle: 'Export YNS Insights report',
    UTI: 'public.comma-separated-values-text',
  });
  return path;
}
