import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  getCurrentSession,
} from '../../services/authService';

import {
  buildInsightsSnapshot,
  getAdvancedInsightsData,
} from '../../services/advancedInsightsService';


export default function InsightsScreen() {
  const [loading, setLoading] =
    useState(true);

  const [rawData, setRawData] =
    useState(null);

  const [
    selectedCardId,
    setSelectedCardId,
  ] = useState('all');

  const [
    range,
    setRange,
  ] = useState('30');


  const load =
    useCallback(async () => {
      setLoading(true);

      try {
        const session =
          await getCurrentSession();

        if (
          !session?.user
        ) {
          return;
        }

        const data =
          await getAdvancedInsightsData(
            session.user.id
          );

        setRawData(data);
      } catch (error) {
        console.log(
          'Advanced Insights error:',
          error
        );

        Alert.alert(
          'Unable to load insights',
          error.message
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


  const snapshot =
    useMemo(() => {
      if (!rawData) {
        return null;
      }

      return buildInsightsSnapshot(
        rawData,
        {
          selectedCardId,
          range,
        }
      );
    }, [
      rawData,
      selectedCardId,
      range,
    ]);


  if (
    loading ||
    !rawData ||
    !snapshot
  ) {
    return (
      <View
        style={styles.loading}
      >
        <ActivityIndicator
          size="large"
          color="#111827"
        />
      </View>
    );
  }


  const selectedCard =
    selectedCardId ===
      'all'
      ? null
      : rawData.cards.find(
          (card) =>
            card.id ===
            selectedCardId
        );


  return (
    <SafeAreaView
      style={styles.safe}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <View
          style={styles.header}
        >
          <View>
            <Text
              style={styles.title}
            >
              Insights
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Advanced card,
              engagement and CRM
              analytics
            </Text>
          </View>

          <View
            style={
              styles.analyticsIcon
            }
          >
            <Ionicons
              name="analytics-outline"
              size={23}
              color="#111827"
            />
          </View>
        </View>


        <Text
          style={
            styles.sectionLabel
          }
        >
          CARD
        </Text>


        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
        >
          <FilterChip
            label="All Cards"
            active={
              selectedCardId ===
              'all'
            }
            onPress={() =>
              setSelectedCardId(
                'all'
              )
            }
          />

          {rawData.cards.map(
            (card) => (
              <FilterChip
                key={card.id}
                label={
                  card.name ||
                  card.card_slug
                }
                sublabel={
                  card.is_primary
                    ? 'PRIMARY'
                    : null
                }
                active={
                  selectedCardId ===
                  card.id
                }
                onPress={() =>
                  setSelectedCardId(
                    card.id
                  )
                }
              />
            )
          )}
        </ScrollView>


        {selectedCard ? (
          <View
            style={
              styles.selectedCard
            }
          >
            <Text
              style={
                styles.selectedCardLabel
              }
            >
              Viewing analytics for
            </Text>

            <Text
              style={
                styles.selectedCardName
              }
            >
              {selectedCard.name}
            </Text>

            <Text
              style={
                styles.selectedCardSlug
              }
            >
              /card/
              {selectedCard.card_slug}
            </Text>
          </View>
        ) : null}


        <Text
          style={
            styles.sectionLabel
          }
        >
          DATE RANGE
        </Text>


        <View
          style={
            styles.rangeRow
          }
        >
          {[
            ['7', '7 Days'],
            ['30', '30 Days'],
            ['90', '90 Days'],
            ['all', 'All'],
          ].map(
            ([
              value,
              label,
            ]) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.rangeButton,

                  range ===
                    value &&
                    styles.rangeButtonActive,
                ]}
                onPress={() =>
                  setRange(
                    value
                  )
                }
              >
                <Text
                  style={[
                    styles.rangeText,

                    range ===
                      value &&
                      styles.rangeTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>


        <View
          style={styles.metrics}
        >
          <Metric
            icon="eye-outline"
            value={
              snapshot.views
            }
            label="Card Views"
          />

          <Metric
            icon="finger-print-outline"
            value={
              snapshot.clicks
            }
            label="Clicks"
          />

          <Metric
            icon="people-outline"
            value={
              snapshot.connections
            }
            label="Connections"
          />

          <Metric
            icon="checkmark-circle-outline"
            value={
              snapshot.converted
            }
            label="Converted"
          />
        </View>


        <View
          style={
            styles.rateRow
          }
        >
          <RateCard
            value={`${snapshot.clickRate}%`}
            label="Click Rate"
          />

          <RateCard
            value={`${snapshot.conversionRate}%`}
            label="Conversion Rate"
          />
        </View>


        <SectionHeader
          kicker="FUNNEL"
          title="Conversion Funnel"
        />

        <View
          style={styles.card}
        >
          <FunnelRow
            label="Card Views"
            value={
              snapshot.views
            }
            icon="eye-outline"
          />

          <FunnelArrow />

          <FunnelRow
            label="Link / Block Clicks"
            value={
              snapshot.clicks
            }
            icon="finger-print-outline"
          />

          <FunnelArrow />

          <FunnelRow
            label="Connections"
            value={
              snapshot.connections
            }
            icon="people-outline"
          />

          <FunnelArrow />

          <FunnelRow
            label="Converted"
            value={
              snapshot.converted
            }
            icon="checkmark-circle-outline"
            last
          />
        </View>


        <SectionHeader
          kicker="CUSTOM BLOCKS"
          title="Top Performing Blocks"
        />

        {snapshot.topBlocks.length ===
        0 ? (
          <EmptyCard
            text="No custom block clicks yet."
          />
        ) : (
          <View
            style={styles.card}
          >
            {snapshot.topBlocks.map(
              (
                block,
                index
              ) => (
                <PerformanceRow
                  key={
                    block.id
                  }
                  index={
                    index + 1
                  }
                  title={
                    block.title
                  }
                  subtitle={
                    block.type
                  }
                  value={
                    block.clicks
                  }
                  max={
                    snapshot
                      .topBlocks[0]
                      ?.clicks || 1
                  }
                />
              )
            )}
          </View>
        )}


        <SectionHeader
          kicker="PROFILE LINKS"
          title="Top Links"
        />

        {snapshot.topLinks.length ===
        0 ? (
          <EmptyCard
            text="No profile-link clicks yet."
          />
        ) : (
          <View
            style={styles.card}
          >
            {snapshot.topLinks.map(
              (
                link,
                index
              ) => (
                <PerformanceRow
                  key={
                    link.id
                  }
                  index={
                    index + 1
                  }
                  title={
                    link.title
                  }
                  subtitle={
                    link.type
                  }
                  value={
                    link.clicks
                  }
                  max={
                    snapshot
                      .topLinks[0]
                      ?.clicks || 1
                  }
                />
              )
            )}
          </View>
        )}


        <SectionHeader
          kicker="LEADS"
          title="Lead Sources"
        />

        {snapshot.leadSources.length ===
        0 ? (
          <EmptyCard
            text="No leads in this period."
          />
        ) : (
          <View
            style={styles.card}
          >
            {snapshot.leadSources.map(
              (item) => (
                <View
                  key={
                    item.source
                  }
                  style={
                    styles.sourceRow
                  }
                >
                  <View
                    style={
                      styles.sourceIcon
                    }
                  >
                    <Ionicons
                      name={
                        sourceIcon(
                          item.source
                        )
                      }
                      size={19}
                      color="#111827"
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.sourceTitle
                      }
                    >
                      {formatSource(
                        item.source
                      )}
                    </Text>

                    <Text
                      style={
                        styles.sourceSub
                      }
                    >
                      Lead source
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.sourceCount
                    }
                  >
                    {item.count}
                  </Text>
                </View>
              )
            )}
          </View>
        )}


        <SectionHeader
          kicker="CARDS"
          title="Card Performance"
        />

        {snapshot.cardPerformance.map(
          (card) => (
            <View
              key={card.id}
              style={
                styles.cardPerformance
              }
            >
              <View
                style={
                  styles.cardPerformanceHeader
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <View
                    style={
                      styles.cardNameRow
                    }
                  >
                    <Text
                      style={
                        styles.cardName
                      }
                    >
                      {card.name ||
                        'Digital Card'}
                    </Text>

                    {card.is_primary ? (
                      <View
                        style={
                          styles.primaryBadge
                        }
                      >
                        <Text
                          style={
                            styles.primaryBadgeText
                          }
                        >
                          PRIMARY
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Text
                    style={
                      styles.cardSlug
                    }
                  >
                    /card/
                    {card.card_slug}
                  </Text>
                </View>

                <Text
                  style={
                    styles.bigView
                  }
                >
                  {card.views}
                </Text>
              </View>

              <View
                style={
                  styles.cardStats
                }
              >
                <SmallStat
                  label="Views"
                  value={
                    card.views
                  }
                />

                <SmallStat
                  label="Clicks"
                  value={
                    card.clicks
                  }
                />

                <SmallStat
                  label="Leads"
                  value={
                    card.leads
                  }
                />

                <SmallStat
                  label="Won"
                  value={
                    card.converted
                  }
                />
              </View>
            </View>
          )
        )}


        <SectionHeader
          kicker="ACTIVITY"
          title="Recent Engagement"
        />

        {snapshot.recentEvents.length ===
        0 ? (
          <EmptyCard
            text="No activity in this period."
          />
        ) : (
          snapshot.recentEvents
            .slice(0, 15)
            .map(
              (event) => (
                <View
                  key={event.id}
                  style={
                    styles.activity
                  }
                >
                  <View
                    style={
                      styles.activityIcon
                    }
                  >
                    <Ionicons
                      name={
                        eventIcon(
                          event.event_type
                        )
                      }
                      size={18}
                      color="#111827"
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.activityTitle
                      }
                    >
                      {formatEvent(
                        event.event_type
                      )}
                    </Text>

                    <Text
                      style={
                        styles.activitySub
                      }
                    >
                      {formatSource(
                        event.source ||
                          'organic'
                      )}
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.activityDate
                    }
                  >
                    {formatDate(
                      event.created_at
                    )}
                  </Text>
                </View>
              )
            )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


function FilterChip({
  label,
  sublabel,
  active,
  onPress,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.cardChip,

        active &&
          styles.cardChipActive,
      ]}
    >
      <Text
        style={[
          styles.cardChipText,

          active &&
            styles.cardChipTextActive,
        ]}
      >
        {label}
      </Text>

      {sublabel ? (
        <Text
          style={[
            styles.cardChipSub,

            active &&
              styles.cardChipSubActive,
          ]}
        >
          {sublabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}


function Metric({
  icon,
  value,
  label,
}) {
  return (
    <View
      style={styles.metric}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#6B7280"
      />

      <Text
        style={
          styles.metricValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.metricLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}


function RateCard({
  value,
  label,
}) {
  return (
    <View
      style={styles.rateCard}
    >
      <Text
        style={styles.rateValue}
      >
        {value}
      </Text>

      <Text
        style={styles.rateLabel}
      >
        {label}
      </Text>
    </View>
  );
}


function SectionHeader({
  kicker,
  title,
}) {
  return (
    <View
      style={
        styles.sectionHeader
      }
    >
      <Text
        style={
          styles.sectionKicker
        }
      >
        {kicker}
      </Text>

      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>
    </View>
  );
}


function FunnelRow({
  label,
  value,
  icon,
}) {
  return (
    <View
      style={styles.funnelRow}
    >
      <View
        style={
          styles.funnelIcon
        }
      >
        <Ionicons
          name={icon}
          size={19}
          color="#111827"
        />
      </View>

      <Text
        style={
          styles.funnelLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.funnelValue
        }
      >
        {value}
      </Text>
    </View>
  );
}


function FunnelArrow() {
  return (
    <View
      style={
        styles.funnelArrow
      }
    >
      <Ionicons
        name="arrow-down"
        size={14}
        color="#9CA3AF"
      />
    </View>
  );
}


function PerformanceRow({
  index,
  title,
  subtitle,
  value,
  max,
}) {
  const percent =
    Math.max(
      4,
      Math.round(
        (value / max) *
          100
      )
    );

  return (
    <View
      style={
        styles.performance
      }
    >
      <View
        style={
          styles.performanceTop
        }
      >
        <View
          style={
            styles.rank
          }
        >
          <Text
            style={
              styles.rankText
            }
          >
            {index}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text
            style={
              styles.performanceTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.performanceSub
            }
          >
            {formatSource(
              subtitle
            )}
          </Text>
        </View>

        <Text
          style={
            styles.performanceValue
          }
        >
          {value}
        </Text>
      </View>

      <View
        style={
          styles.progressTrack
        }
      >
        <View
          style={[
            styles.progressFill,

            {
              width:
                `${percent}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}


function SmallStat({
  label,
  value,
}) {
  return (
    <View
      style={
        styles.smallStat
      }
    >
      <Text
        style={
          styles.smallStatValue
        }
      >
        {value}
      </Text>

      <Text
        style={
          styles.smallStatLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}


function EmptyCard({
  text,
}) {
  return (
    <View
      style={styles.empty}
    >
      <Ionicons
        name="analytics-outline"
        size={32}
        color="#9CA3AF"
      />

      <Text
        style={styles.emptyText}
      >
        {text}
      </Text>
    </View>
  );
}


function formatEvent(
  value
) {
  return String(
    value || ''
  )
    .replace(
      /_/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function formatSource(
  value
) {
  return String(
    value || 'Unknown'
  )
    .replace(
      /_/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function formatDate(
  value
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    }
  );
}


function sourceIcon(
  source
) {
  switch (source) {
    case 'public_card':
      return 'globe-outline';

    case 'mobile_app':
      return 'phone-portrait-outline';

    case 'meta':
    case 'facebook':
      return 'logo-facebook';

    case 'whatsapp':
      return 'logo-whatsapp';

    default:
      return 'navigate-outline';
  }
}


function eventIcon(
  eventType
) {
  const value =
    String(
      eventType || ''
    );

  if (
    value === 'card_view'
  ) {
    return 'eye-outline';
  }

  if (
    value ===
    'lead_submit'
  ) {
    return 'person-add-outline';
  }

  if (
    value.includes(
      'whatsapp'
    )
  ) {
    return 'logo-whatsapp';
  }

  if (
    value.includes(
      'phone'
    )
  ) {
    return 'call-outline';
  }

  if (
    value.includes(
      'email'
    )
  ) {
    return 'mail-outline';
  }

  if (
    value.includes(
      'website'
    )
  ) {
    return 'globe-outline';
  }

  return 'finger-print-outline';
}


const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        '#F3F4F6',
    },

    loading: {
      flex: 1,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    container: {
      padding: 18,
      paddingBottom: 120,
    },

    header: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    title: {
      fontSize: 28,
      fontWeight: '900',
      color: '#111827',
    },

    subtitle: {
      color: '#6B7280',
      fontSize: 11,
      marginTop: 4,
      maxWidth: 250,
    },

    analyticsIcon: {
      width: 45,
      height: 45,
      borderRadius: 15,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    sectionLabel: {
      color: '#6B7280',
      fontWeight: '900',
      fontSize: 10,
      letterSpacing: 1,
      marginTop: 22,
      marginBottom: 9,
    },

    cardChip: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 14,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginRight: 8,
      minWidth: 85,
    },

    cardChipActive: {
      backgroundColor:
        '#111827',
    },

    cardChipText: {
      color: '#6B7280',
      fontSize: 11,
      fontWeight: '800',
    },

    cardChipTextActive: {
      color: '#FFFFFF',
    },

    cardChipSub: {
      color: '#B7791F',
      fontSize: 7,
      fontWeight: '900',
      marginTop: 3,
    },

    cardChipSubActive: {
      color: '#FCD34D',
    },

    selectedCard: {
      marginTop: 11,
      backgroundColor:
        '#FFF7E6',
      borderRadius: 15,
      padding: 13,
    },

    selectedCardLabel: {
      color: '#B7791F',
      fontSize: 8,
      fontWeight: '900',
    },

    selectedCardName: {
      color: '#111827',
      fontSize: 15,
      fontWeight: '900',
      marginTop: 2,
    },

    selectedCardSlug: {
      color: '#6B7280',
      fontSize: 9,
      marginTop: 2,
    },

    rangeRow: {
      flexDirection: 'row',
      gap: 7,
    },

    rangeButton: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
    },

    rangeButtonActive: {
      backgroundColor:
        '#111827',
    },

    rangeText: {
      color: '#6B7280',
      fontSize: 10,
      fontWeight: '800',
    },

    rangeTextActive: {
      color: '#FFFFFF',
    },

    metrics: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
      marginTop: 18,
    },

    metric: {
      width: '48%',
      backgroundColor:
        '#FFFFFF',
      borderRadius: 19,
      padding: 16,
    },

    metricValue: {
      color: '#111827',
      fontSize: 27,
      fontWeight: '900',
      marginTop: 10,
    },

    metricLabel: {
      color: '#6B7280',
      fontSize: 10,
      marginTop: 3,
    },

    rateRow: {
      flexDirection: 'row',
      gap: 9,
      marginTop: 9,
    },

    rateCard: {
      flex: 1,
      backgroundColor:
        '#111827',
      borderRadius: 17,
      padding: 16,
    },

    rateValue: {
      color: '#FFFFFF',
      fontSize: 22,
      fontWeight: '900',
    },

    rateLabel: {
      color: '#D1D5DB',
      fontSize: 9,
      marginTop: 3,
    },

    sectionHeader: {
      marginTop: 27,
      marginBottom: 10,
    },

    sectionKicker: {
      color: '#B7791F',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
    },

    sectionTitle: {
      color: '#111827',
      fontSize: 19,
      fontWeight: '900',
      marginTop: 3,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      padding: 15,
    },

    funnelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
    },

    funnelIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    funnelLabel: {
      flex: 1,
      color: '#374151',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 11,
    },

    funnelValue: {
      color: '#111827',
      fontSize: 18,
      fontWeight: '900',
    },

    funnelArrow: {
      marginLeft: 12,
      height: 20,
      justifyContent:
        'center',
    },

    performance: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        '#F3F4F6',
    },

    performanceTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    rank: {
      width: 29,
      height: 29,
      borderRadius: 9,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    rankText: {
      color: '#111827',
      fontSize: 10,
      fontWeight: '900',
    },

    performanceTitle: {
      color: '#111827',
      fontSize: 12,
      fontWeight: '800',
    },

    performanceSub: {
      color: '#9CA3AF',
      fontSize: 8,
      marginTop: 2,
    },

    performanceValue: {
      color: '#111827',
      fontSize: 16,
      fontWeight: '900',
    },

    progressTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor:
        '#E5E7EB',
      overflow: 'hidden',
      marginTop: 8,
      marginLeft: 39,
    },

    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor:
        '#111827',
    },

    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor:
        '#F3F4F6',
    },

    sourceIcon: {
      width: 39,
      height: 39,
      borderRadius: 12,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    sourceTitle: {
      color: '#111827',
      fontWeight: '800',
      fontSize: 12,
    },

    sourceSub: {
      color: '#9CA3AF',
      fontSize: 8,
      marginTop: 2,
    },

    sourceCount: {
      color: '#111827',
      fontSize: 18,
      fontWeight: '900',
    },

    cardPerformance: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 19,
      padding: 15,
      marginBottom: 9,
    },

    cardPerformanceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    cardNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    cardName: {
      color: '#111827',
      fontSize: 14,
      fontWeight: '900',
    },

    primaryBadge: {
      backgroundColor:
        '#FFF7E6',
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 6,
    },

    primaryBadgeText: {
      color: '#B7791F',
      fontSize: 7,
      fontWeight: '900',
    },

    cardSlug: {
      color: '#9CA3AF',
      fontSize: 8,
      marginTop: 4,
    },

    bigView: {
      color: '#111827',
      fontSize: 27,
      fontWeight: '900',
    },

    cardStats: {
      flexDirection: 'row',
      marginTop: 15,
      backgroundColor:
        '#F9FAFB',
      borderRadius: 13,
      overflow: 'hidden',
    },

    smallStat: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
    },

    smallStatValue: {
      color: '#111827',
      fontSize: 14,
      fontWeight: '900',
    },

    smallStatLabel: {
      color: '#9CA3AF',
      fontSize: 7,
      marginTop: 2,
    },

    activity: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 15,
      padding: 12,
      marginBottom: 7,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    activityIcon: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    activityTitle: {
      color: '#111827',
      fontSize: 11,
      fontWeight: '800',
    },

    activitySub: {
      color: '#9CA3AF',
      fontSize: 8,
      marginTop: 2,
    },

    activityDate: {
      color: '#9CA3AF',
      fontSize: 8,
    },

    empty: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      padding: 27,
      alignItems: 'center',
    },

    emptyText: {
      color: '#6B7280',
      fontSize: 10,
      marginTop: 7,
      textAlign: 'center',
    },
  });
