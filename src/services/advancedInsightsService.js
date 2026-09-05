import { supabase } from '../../lib/supabase';

import { getCards } from './cardService';

import { getAllConnections } from './connectionService';

import { getLeadStages } from './leadStageService';

export async function getAdvancedInsightsData(userId) {
  const cards = await getCards(userId);

  if (!cards.length) {
    return {
      cards: [],
      events: [],
      connections: [],
      blocks: [],
      links: [],
      stages: [],
    };
  }

  const cardIds = cards.map((card) => card.id);

  const [eventsResult, connections, blocksResult, linksResult, stages] = await Promise.all([
    supabase.from('card_events').select('*').in('card_id', cardIds).order('created_at', {
      ascending: false,
    }),

    getAllConnections(),

    supabase.from('card_blocks').select('id, card_id, title, block_type').in('card_id', cardIds),

    supabase.from('card_links').select('id, card_id, label, link_type').in('card_id', cardIds),

    getLeadStages(userId),
  ]);

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (blocksResult.error) {
    throw blocksResult.error;
  }

  if (linksResult.error) {
    throw linksResult.error;
  }

  return {
    cards,

    events: eventsResult.data || [],

    connections: connections || [],

    blocks: blocksResult.data || [],

    links: linksResult.data || [],

    stages: stages || [],
  };
}

function isInsideRange(dateValue, range) {
  if (range === 'all') {
    return true;
  }

  if (!dateValue) {
    return false;
  }

  const days = Number(range);

  const time = new Date(dateValue).getTime();

  if (Number.isNaN(time)) {
    return false;
  }

  const minimum = Date.now() - days * 24 * 60 * 60 * 1000;

  return time >= minimum;
}

function isClickEvent(eventType) {
  const value = String(eventType || '');

  return value.endsWith('_click') || value === 'block_click';
}

function countBy(items, getKey) {
  const result = {};

  for (const item of items) {
    const key = getKey(item) || 'unknown';

    result[key] = (result[key] || 0) + 1;
  }

  return result;
}

export function buildInsightsSnapshot(data, options = {}) {
  const {
    selectedCardId = 'all',

    range = '30',
  } = options;

  const cardMatches = (cardId) => selectedCardId === 'all' || cardId === selectedCardId;

  const events = data.events.filter(
    (event) => cardMatches(event.card_id) && isInsideRange(event.created_at, range)
  );

  const connections = data.connections.filter(
    (connection) => cardMatches(connection.card_id) && isInsideRange(connection.created_at, range)
  );

  const views = events.filter((event) => event.event_type === 'card_view');

  const clicks = events.filter((event) => isClickEvent(event.event_type));

  const leadSubmits = events.filter((event) => event.event_type === 'lead_submit');

  const wonKeys = new Set(
    data.stages.filter((stage) => stage.is_won).map((stage) => stage.stage_key)
  );

  /*
   * Keep backwards compatibility
   * if the default converted stage
   * exists but stage settings have
   * not loaded yet.
   */
  wonKeys.add('converted');

  const converted = connections.filter((connection) => wonKeys.has(connection.stage));

  const conversionRate = connections.length
    ? ((converted.length / connections.length) * 100).toFixed(1)
    : '0.0';

  const clickRate = views.length ? ((clicks.length / views.length) * 100).toFixed(1) : '0.0';

  /*
   * BLOCK PERFORMANCE
   */

  const blockMap = {};

  for (const block of data.blocks) {
    blockMap[block.id] = block;
  }

  const blockCounts = {};

  for (const event of events) {
    if (!event.block_id) {
      continue;
    }

    if (!blockCounts[event.block_id]) {
      const block = blockMap[event.block_id];

      blockCounts[event.block_id] = {
        id: event.block_id,

        title: block?.title || event.metadata?.title || 'Block',

        type: block?.block_type || event.metadata?.block_type || 'custom',

        clicks: 0,
      };
    }

    blockCounts[event.block_id].clicks += 1;
  }

  const topBlocks = Object.values(blockCounts)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  /*
   * STANDARD CARD LINK
   * PERFORMANCE
   */

  const linkMap = {};

  for (const link of data.links) {
    linkMap[link.id] = link;
  }

  const linkCounts = {};

  for (const event of events) {
    if (!event.link_id) {
      continue;
    }

    if (!linkCounts[event.link_id]) {
      const link = linkMap[event.link_id];

      linkCounts[event.link_id] = {
        id: event.link_id,

        title: link?.label || event.metadata?.label || 'Link',

        type: link?.link_type || 'link',

        clicks: 0,
      };
    }

    linkCounts[event.link_id].clicks += 1;
  }

  const topLinks = Object.values(linkCounts)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  /*
   * LEAD SOURCES
   */

  const sourceCounts = countBy(connections, (connection) => connection.source || 'unknown');

  const leadSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({
      source,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  /*
   * CARD PERFORMANCE
   */

  const cardPerformance = data.cards
    .filter((card) => selectedCardId === 'all' || card.id === selectedCardId)
    .map((card) => {
      const cardEvents = events.filter((event) => event.card_id === card.id);

      const cardConnections = connections.filter((connection) => connection.card_id === card.id);

      const cardViews = cardEvents.filter((event) => event.event_type === 'card_view').length;

      const cardClicks = cardEvents.filter((event) => isClickEvent(event.event_type)).length;

      const cardConverted = cardConnections.filter((connection) =>
        wonKeys.has(connection.stage)
      ).length;

      return {
        ...card,

        views: cardViews,

        clicks: cardClicks,

        leads: cardConnections.length,

        converted: cardConverted,
      };
    })
    .sort((a, b) => b.views - a.views);

  return {
    views: views.length,

    clicks: clicks.length,

    connections: connections.length,

    converted: converted.length,

    leadSubmits: leadSubmits.length,

    conversionRate,

    clickRate,

    totalEvents: events.length,

    topBlocks,

    topLinks,

    leadSources,

    cardPerformance,

    recentEvents: events.slice(0, 20),

    recentConnections: connections.slice(0, 10),
  };
}
