import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
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

import QRCode from 'react-native-qrcode-svg';

import {
  getCurrentSession,
} from '../../services/authService';

import {
  getCard,
} from '../../services/cardService';

import {
  ensureDefaultLinks,
} from '../../services/linkService';

import {
  ensureDefaultServices,
} from '../../services/serviceService';

import {
  getPortfolioItems,
} from '../../services/portfolioService';

import {
  getAllConnections,
} from '../../services/connectionService';

import {
  getAccountAnalytics,
  recordCardEvent,
} from '../../services/analyticsService';

import {
  CARD_WEB_URL,
} from '../../constants/config';

import {
  getNotifications,
} from '../../services/notificationService';

export default function HomeScreen({
  navigation,
}) {
  const [loading, setLoading] =
    useState(true);

  const [card, setCard] =
    useState(null);

  const [links, setLinks] =
    useState([]);

  const [services, setServices] =
    useState([]);

  const [portfolio, setPortfolio] =
    useState([]);

  const [connections, setConnections] =
    useState([]);

  const [analytics, setAnalytics] =
    useState({
      cardViews: 0,
      linkClicks: 0,
      leadSubmits: 0,
    });

  const [qrVisible, setQrVisible] =
    useState(false);

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const loadDashboard =
    useCallback(async () => {
      setLoading(true);

      try {
        const session =
          await getCurrentSession();

        if (!session?.user) {
          return;
        }

        const currentCard =
          await getCard(
            session.user.id
          );

        setCard(currentCard);

        const [
          loadedLinks,
          loadedServices,
          loadedPortfolio,
          loadedConnections,
          loadedAnalytics,
          loadedNotifications,
        ] = await Promise.all([
          ensureDefaultLinks(
            currentCard
          ),

          ensureDefaultServices(
            currentCard.id
          ),

          getPortfolioItems(
            currentCard.id
          ),

          getAllConnections(),

          getAccountAnalytics(),

          getNotifications(
            session.user.id
          ),
        ]);

        setLinks(loadedLinks);
        setServices(loadedServices);
        setPortfolio(loadedPortfolio);
        setConnections(
          loadedConnections
        );
        setAnalytics(
          loadedAnalytics
        );

        setUnreadNotifications(
          (loadedNotifications || []).filter(
            (item) => !item.is_read
          ).length
        );
      } catch (error) {
        console.log(
          'Home dashboard error:',
          error
        );

        Alert.alert(
          'Unable to load dashboard',
          error?.message ||
            'Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  function getPublicUrl() {
    if (!card?.card_slug) {
      return CARD_WEB_URL;
    }

    return `${CARD_WEB_URL}/${card.card_slug}`;
  }

  async function handleShare() {
    try {
      await Share.share({
        title:
          `${card?.name || 'YNS'} - YNS CARD`,
        message: [
          card?.name || '',
          card?.designation || '',
          card?.company || '',
          '',
          'View my digital card:',
          getPublicUrl(),
        ].join('\n'),
      });
    } catch (error) {
      Alert.alert(
        'Share failed',
        error?.message ||
          'Unable to share the card.'
      );
    }
  }

  function cleanPhone(value) {
    return String(value || '')
      .replace(/[^\d+]/g, '');
  }

  function normalizeUrl(value) {
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

  async function openLink(link) {
    if (!link?.value) {
      Alert.alert(
        link?.label || 'Link',
        'Add this link from your card settings first.'
      );
      return;
    }

    let url = '';
    let eventType =
      `${link.link_type}_click`;

    switch (link.link_type) {
      case 'whatsapp':
        url =
          `https://wa.me/${
            cleanPhone(link.value)
              .replace('+', '')
          }`;
        eventType =
          'whatsapp_click';
        break;

      case 'phone':
        url =
          `tel:${cleanPhone(
            link.value
          )}`;
        eventType =
          'phone_click';
        break;

      case 'email':
        url =
          `mailto:${link.value}`;
        eventType =
          'email_click';
        break;

      case 'website':
        url =
          normalizeUrl(
            link.value
          );
        eventType =
          'website_click';
        break;

      case 'google_reviews':
        url =
          normalizeUrl(
            link.value
          );
        eventType =
          'google_review_click';
        break;

      case 'location':
        url =
          link.value.startsWith(
            'http'
          )
            ? link.value
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                link.value
              )}`;
        eventType =
          'location_click';
        break;

      default:
        url =
          normalizeUrl(
            link.value
          );
    }

    try {
      if (card?.id) {
        await recordCardEvent(
          card.id,
          eventType,
          {
            linkId:
              link.id || null,
            source: 'mobile_app',
          }
        );
      }

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Unable to open',
        error?.message ||
          'Please check this link.'
      );
    }
  }

  const activeLinks =
    links.filter(
      (item) =>
        item.is_active &&
        item.value
    );

  const students =
    portfolio.filter(
      (item) =>
        item.portfolio_type ===
        'student'
    );

  const employees =
    portfolio.filter(
      (item) =>
        item.portfolio_type ===
        'employee'
    );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingScreen}
      >
        <ActivityIndicator
          size="large"
          color="#111827"
        />

        <Text
          style={styles.loadingText}
        >
          Preparing your dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={styles.header}
        >
          <View>
            <Text
              style={styles.brand}
            >
              YNS CARD
            </Text>

            <Text
              style={
                styles.headerSubtitle
              }
            >
              Your digital identity
            </Text>
          </View>

          <TouchableOpacity
            style={
              styles.notificationButton
            }
            onPress={() =>
              navigation
                .getParent()
                ?.navigate('Notifications')
            }
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color="#111827"
            />

            {unreadNotifications > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9
                    ? '9+'
                    : unreadNotifications}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View
          style={styles.welcomeRow}
        >
          <View>
            <Text
              style={styles.hello}
            >
              Hello,{' '}
              {card?.name ||
                'Welcome'}
            </Text>

            <Text
              style={styles.welcome}
            >
              Welcome Back
            </Text>
          </View>
        </View>

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            MY CARD
          </Text>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('MyCards')
            }
          >
            <Text
              style={styles.addText}
            >
              + Add New
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={styles.businessCard}
        >
          {card?.profile_image_url ? (
            <Image
              source={{
                uri:
                  card.profile_image_url,
              }}
              style={
                styles.profileImage
              }
            />
          ) : (
            <View
              style={
                styles.profilePlaceholder
              }
            >
              <Text
                style={
                  styles.profileInitial
                }
              >
                {card?.name
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  'Y'}
              </Text>
            </View>
          )}

          <Text
            style={styles.name}
          >
            {card?.name}
          </Text>

          <Text
            style={
              styles.designation
            }
          >
            {card?.designation}
          </Text>

          <Text
            style={styles.company}
          >
            {card?.company}
          </Text>

          <View
            style={
              styles.servicePills
            }
          >
            {services
              .filter(
                (item) =>
                  item.is_active
              )
              .slice(0, 3)
              .map((service) => (
                <View
                  key={service.id}
                  style={
                    styles.servicePill
                  }
                >
                  <Text
                    style={
                      styles.servicePillText
                    }
                  >
                    {service.title}
                  </Text>
                </View>
              ))}
          </View>

          <View
            style={styles.actionRow}
          >
            <CardAction
              icon="create-outline"
              label="Edit"
              onPress={() =>
                navigation
                  .getParent()
                  ?.navigate('CardEditor')
              }
            />

            <CardAction
              icon="share-social-outline"
              label="Share"
              onPress={
                handleShare
              }
            />

            <CardAction
              icon="qr-code-outline"
              label="QR Code"
              onPress={() =>
                setQrVisible(true)
              }
            />

            <CardAction
              icon="ellipsis-horizontal"
              label="More"
              onPress={() =>
                Alert.alert(
                  'YNS Card',
                  getPublicUrl()
                )
              }
            />
          </View>
        </View>

        <Text
          style={styles.sectionTitle}
        >
          QUICK ACTIONS
        </Text>

        <View
          style={styles.quickGrid}
        >
          {activeLinks
            .slice(0, 6)
            .map((link) => (
              <TouchableOpacity
                key={link.id}
                style={
                  styles.quickAction
                }
                onPress={() =>
                  openLink(link)
                }
              >
                <View
                  style={
                    styles.quickIcon
                  }
                >
                  <Ionicons
                    name={
                      link.icon_name ||
                      'link-outline'
                    }
                    size={22}
                    color="#111827"
                  />
                </View>

                <Text
                  numberOfLines={1}
                  style={
                    styles.quickLabel
                  }
                >
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        <Text
          style={styles.sectionTitle}
        >
          OUR SERVICES
        </Text>

        <View>
          {services
            .filter(
              (item) =>
                item.is_active
            )
            .slice(0, 4)
            .map((service) => (
              <View
                key={service.id}
                style={
                  styles.serviceCard
                }
              >
                <View
                  style={
                    styles.serviceIcon
                  }
                >
                  <Ionicons
                    name={
                      service.icon_name ||
                      'briefcase-outline'
                    }
                    size={22}
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
                      styles.serviceTitle
                    }
                  >
                    {service.title}
                  </Text>

                  <Text
                    style={
                      styles.serviceDescription
                    }
                  >
                    {service.short_description ||
                      ''}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#9CA3AF"
                />
              </View>
            ))}
        </View>

        <Text
          style={styles.sectionTitle}
        >
          PORTFOLIO
        </Text>

        <View
          style={
            styles.portfolioRow
          }
        >
          <TouchableOpacity
            style={
              styles.portfolioCard
            }
          >
            <Ionicons
              name="school-outline"
              size={28}
              color="#111827"
            />

            <Text
              style={
                styles.portfolioNumber
              }
            >
              {students.length}
            </Text>

            <Text
              style={
                styles.portfolioLabel
              }
            >
              Students
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.portfolioCard
            }
          >
            <Ionicons
              name="people-outline"
              size={28}
              color="#111827"
            />

            <Text
              style={
                styles.portfolioNumber
              }
            >
              {employees.length}
            </Text>

            <Text
              style={
                styles.portfolioLabel
              }
            >
              Employees
            </Text>
          </TouchableOpacity>
        </View>

        <Text
          style={styles.sectionTitle}
        >
          CONNECTIONS STATUS
        </Text>

        <View
          style={styles.statsGrid}
        >
          <StatBox
            number={
              connections.length
            }
            label="Connections"
          />

          <StatBox
            number={
              analytics.cardViews
            }
            label="Card Views"
          />

          <StatBox
            number={
              analytics.linkClicks
            }
            label="Link Clicks"
          />

          <StatBox
            number={
              analytics.leadSubmits
            }
            label="Leads"
          />
        </View>

        <Text
          style={styles.footer}
        >
          Powered by YUVARAJ NETWORKS
          & SOLUTIONS
        </Text>
      </ScrollView>

      <Modal
        visible={qrVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setQrVisible(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.qrModal
            }
          >
            <Text
              style={
                styles.qrModalTitle
              }
            >
              Your Digital Card
            </Text>

            <Text
              style={
                styles.qrModalSubtitle
              }
            >
              Scan to open your public
              profile
            </Text>

            <View
              style={
                styles.largeQr
              }
            >
              <QRCode
                value={
                  getPublicUrl()
                }
                size={220}
                backgroundColor="#FFFFFF"
                color="#111827"
              />
            </View>

            <Text
              style={
                styles.cardUrl
              }
            >
              {getPublicUrl()}
            </Text>

            <TouchableOpacity
              style={
                styles.closeButton
              }
              onPress={() =>
                setQrVisible(false)
              }
            >
              <Text
                style={
                  styles.closeButtonText
                }
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CardAction({
  icon,
  label,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.cardAction}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#111827"
      />

      <Text
        style={
          styles.cardActionText
        }
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function StatBox({
  number,
  label,
}) {
  return (
    <View
      style={styles.statBox}
    >
      <Text
        style={styles.statNumber}
      >
        {number}
      </Text>

      <Text
        style={styles.statLabel}
      >
        {label}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        '#F3F4F6',
    },

    loadingScreen: {
      flex: 1,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 12,
      color: '#6B7280',
    },

    container: {
      padding: 18,
      paddingBottom: 110,
    },

    header: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    brand: {
      fontSize: 23,
      fontWeight: '900',
      color: '#111827',
    },

    headerSubtitle: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 2,
    },

    notificationButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
      alignItems: 'center',
      justifyContent:
        'center',
      position: 'relative',
    },

    notificationBadge: {
      position: 'absolute',
      right: -4,
      top: -4,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: '#B7791F',
      alignItems: 'center',
      justifyContent: 'center',
    },

    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
    },

    welcomeRow: {
      marginTop: 24,
      marginBottom: 22,
    },

    hello: {
      color: '#6B7280',
      fontSize: 14,
    },

    welcome: {
      color: '#111827',
      fontSize: 25,
      fontWeight: '800',
      marginTop: 3,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    sectionTitle: {
      color: '#6B7280',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      marginTop: 20,
      marginBottom: 11,
    },

    addText: {
      color: '#B7791F',
      fontSize: 13,
      fontWeight: '800',
      marginTop: 20,
    },

    businessCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 24,
      padding: 22,
      alignItems: 'center',
    },

    profileImage: {
      width: 82,
      height: 82,
      borderRadius: 41,
      marginBottom: 12,
    },

    profilePlaceholder: {
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor:
        '#111827',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 12,
    },

    profileInitial: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight: '800',
    },

    name: {
      fontSize: 24,
      fontWeight: '900',
      color: '#111827',
    },

    designation: {
      marginTop: 3,
      color: '#6B7280',
      fontSize: 14,
    },

    company: {
      marginTop: 7,
      color: '#111827',
      fontWeight: '700',
      fontSize: 12,
      textAlign: 'center',
    },

    servicePills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent:
        'center',
      gap: 6,
      marginTop: 16,
    },

    servicePill: {
      backgroundColor:
        '#F3F4F6',
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    servicePillText: {
      color: '#4B5563',
      fontSize: 10,
      fontWeight: '700',
    },

    actionRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      borderTopWidth: 1,
      borderTopColor:
        '#E5E7EB',
      marginTop: 20,
      paddingTop: 17,
    },

    cardAction: {
      alignItems: 'center',
      minWidth: 55,
    },

    cardActionText: {
      marginTop: 5,
      color: '#6B7280',
      fontSize: 10,
      fontWeight: '700',
    },

    quickGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    quickAction: {
      width: '31%',
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      padding: 13,
      alignItems: 'center',
    },

    quickIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    quickLabel: {
      marginTop: 7,
      fontSize: 10,
      fontWeight: '700',
      color: '#111827',
      maxWidth: '100%',
    },

    serviceCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      padding: 15,
      marginBottom: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    serviceIcon: {
      width: 45,
      height: 45,
      borderRadius: 14,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    serviceTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: '#111827',
    },

    serviceDescription: {
      color: '#6B7280',
      fontSize: 11,
      marginTop: 3,
    },

    portfolioRow: {
      flexDirection: 'row',
      gap: 10,
    },

    portfolioCard: {
      flex: 1,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      padding: 18,
      alignItems: 'center',
    },

    portfolioNumber: {
      fontSize: 23,
      fontWeight: '900',
      color: '#111827',
      marginTop: 8,
    },

    portfolioLabel: {
      color: '#6B7280',
      fontSize: 12,
      marginTop: 2,
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    statBox: {
      width: '48%',
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      padding: 17,
    },

    statNumber: {
      fontSize: 23,
      fontWeight: '900',
      color: '#111827',
    },

    statLabel: {
      color: '#6B7280',
      fontSize: 11,
      marginTop: 4,
    },

    footer: {
      textAlign: 'center',
      color: '#9CA3AF',
      fontSize: 10,
      marginTop: 28,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.72)',
      justifyContent:
        'center',
      alignItems: 'center',
      padding: 20,
    },

    qrModal: {
      width: '100%',
      maxWidth: 380,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 26,
      padding: 24,
      alignItems: 'center',
    },

    qrModalTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: '#111827',
    },

    qrModalSubtitle: {
      color: '#6B7280',
      marginTop: 6,
      textAlign: 'center',
    },

    largeQr: {
      padding: 15,
      marginTop: 22,
      backgroundColor:
        '#FFFFFF',
    },

    cardUrl: {
      fontSize: 10,
      color: '#6B7280',
      textAlign: 'center',
      marginTop: 14,
    },

    closeButton: {
      width: '100%',
      backgroundColor:
        '#111827',
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 20,
    },

    closeButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
  });


