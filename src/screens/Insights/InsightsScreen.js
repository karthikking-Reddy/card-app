import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  getCurrentSession,
} from '../../services/authService';

import {
  getCard,
} from '../../services/cardService';

import {
  getCardAnalytics,
  getCardEvents,
} from '../../services/analyticsService';

import {
  getConnections,
} from '../../services/connectionService';

export default function InsightsScreen() {
  const [loading, setLoading] =
    useState(true);

  const [analytics, setAnalytics] =
    useState(null);

  const [events, setEvents] =
    useState([]);

  const [connections, setConnections] =
    useState([]);

  const load =
    useCallback(async () => {
      setLoading(true);

      try {
        const session =
          await getCurrentSession();

        if (!session?.user) return;

        const card =
          await getCard(
            session.user.id
          );

        const [
          analyticsData,
          eventData,
          connectionData,
        ] = await Promise.all([
          getCardAnalytics(card.id),
          getCardEvents(card.id),
          getConnections(card.id),
        ]);

        setAnalytics(
          analyticsData
        );

        setEvents(eventData);

        setConnections(
          connectionData
        );
      } catch (error) {
        console.log(
          'Insights error:',
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !analytics) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#111827"
        />
      </View>
    );
  }

  const converted =
    connections.filter(
      (item) =>
        item.stage === 'converted'
    ).length;

  const conversionRate =
    connections.length > 0
      ? (
          (converted /
            connections.length) *
          100
        ).toFixed(1)
      : '0.0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Text style={styles.title}>
          Insights
        </Text>

        <Text style={styles.subtitle}>
          Track your card performance
          and conversions
        </Text>

        <View style={styles.grid}>
          <Metric
            value={
              analytics.cardViews
            }
            label="Card Views"
          />

          <Metric
            value={
              analytics.linkClicks
            }
            label="Link Clicks"
          />

          <Metric
            value={
              connections.length
            }
            label="Connections"
          />

          <Metric
            value={`${conversionRate}%`}
            label="Conversion"
          />
        </View>

        <Text
          style={styles.sectionTitle}
        >
          ENGAGEMENT
        </Text>

        <View style={styles.card}>
          <Row
            label="WhatsApp Clicks"
            value={
              analytics.whatsappClicks
            }
          />

          <Row
            label="Phone Clicks"
            value={
              analytics.phoneClicks
            }
          />

          <Row
            label="Website Clicks"
            value={
              analytics.websiteClicks
            }
          />

          <Row
            label="Email Clicks"
            value={
              analytics.emailClicks
            }
          />

          <Row
            label="Social Clicks"
            value={
              analytics.socialClicks
            }
          />

          <Row
            label="Lead Submissions"
            value={
              analytics.leadSubmits
            }
            last
          />
        </View>

        <Text
          style={styles.sectionTitle}
        >
          LEAD PERFORMANCE
        </Text>

        <View style={styles.card}>
          <Row
            label="Total Leads"
            value={
              connections.length
            }
          />

          <Row
            label="Converted"
            value={converted}
          />

          <Row
            label="Conversion Rate"
            value={`${conversionRate}%`}
            last
          />
        </View>

        <Text
          style={styles.sectionTitle}
        >
          RECENT CARD ACTIVITY
        </Text>

        {events.length === 0 ? (
          <View style={styles.empty}>
            <Text
              style={styles.emptyTitle}
            >
              No activity yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              Card views and link clicks
              will appear here.
            </Text>
          </View>
        ) : (
          events
            .slice(0, 15)
            .map((event) => (
              <View
                key={event.id}
                style={
                  styles.eventCard
                }
              >
                <View
                  style={
                    styles.eventDot
                  }
                />

                <View style={{ flex: 1 }}>
                  <Text
                    style={
                      styles.eventTitle
                    }
                  >
                    {formatEvent(
                      event.event_type
                    )}
                  </Text>

                  <Text
                    style={
                      styles.eventMeta
                    }
                  >
                    {event.source ||
                      'organic'}{' '}
                    •{' '}
                    {new Date(
                      event.created_at
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label }) {
  return (
    <View style={styles.metric}>
      <Text
        style={styles.metricValue}
      >
        {value}
      </Text>

      <Text
        style={styles.metricLabel}
      >
        {label}
      </Text>
    </View>
  );
}

function Row({
  label,
  value,
  last,
}) {
  return (
    <View
      style={[
        styles.row,
        last && styles.lastRow,
      ]}
    >
      <Text style={styles.rowLabel}>
        {label}
      </Text>

      <Text style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
}

function formatEvent(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  loading: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  container: {
    padding: 18,
    paddingBottom: 110,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },

  subtitle: {
    color: '#6B7280',
    marginTop: 4,
    fontSize: 12,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },

  metric: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
  },

  metricValue: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '900',
  },

  metricLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },

  sectionTitle: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 25,
    marginBottom: 9,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    paddingHorizontal: 16,
  },

  row: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  rowLabel: {
    color: '#6B7280',
    fontSize: 13,
  },

  rowValue: {
    color: '#111827',
    fontWeight: '900',
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 27,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#111827',
    fontWeight: '800',
  },

  emptyText: {
    color: '#6B7280',
    marginTop: 5,
    fontSize: 11,
  },

  eventCard: {
    flexDirection: 'row',
    gap: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },

  eventDot: {
    width: 10,
    height: 10,
    backgroundColor: '#111827',
    borderRadius: 5,
    marginTop: 4,
  },

  eventTitle: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 13,
  },

  eventMeta: {
    color: '#9CA3AF',
    fontSize: 9,
    marginTop: 4,
  },
});
