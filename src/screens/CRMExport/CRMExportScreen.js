import {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
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
  exportConnectionsCsv,
} from '../../services/crmExportService';


export default function CRMExportScreen({
  navigation,
}) {
  const [exporting, setExporting] =
    useState(false);

  async function exportLeads() {
    setExporting(true);

    try {
      const result =
        await exportConnectionsCsv();

      Alert.alert(
        'Export ready',
        `${result.count} leads exported successfully.`
      );
    } catch (error) {
      Alert.alert(
        'Export failed',
        error.message
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#111827"
          />
        </TouchableOpacity>

        <Text
          style={
            styles.headerTitle
          }
        >
          CRM Export
        </Text>

        <View
          style={{ width: 25 }}
        />
      </View>

      <View
        style={styles.container}
      >
        <View
          style={styles.hero}
        >
          <View
            style={
              styles.heroIcon
            }
          >
            <Ionicons
              name="download-outline"
              size={30}
              color="#111827"
            />
          </View>

          <Text
            style={
              styles.heroTitle
            }
          >
            Export Connections
          </Text>

          <Text
            style={
              styles.heroText
            }
          >
            Download your complete
            YNS CRM lead database as
            a CSV file.
          </Text>
        </View>

        <View
          style={styles.card}
        >
          <Feature
            icon="people-outline"
            title="All Leads"
            text="Exports leads from all of your digital cards."
          />

          <Feature
            icon="git-branch-outline"
            title="CRM Stage"
            text="Includes the current pipeline stage for every lead."
          />

          <Feature
            icon="calendar-outline"
            title="Follow-up Data"
            text="Includes next follow-up date and CRM notes."
          />

          <Feature
            icon="analytics-outline"
            title="Lead Source"
            text="Includes public card, app and future campaign sources."
          />
        </View>

        <TouchableOpacity
          style={
            styles.exportButton
          }
          onPress={
            exportLeads
          }
          disabled={
            exporting
          }
        >
          {exporting ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <>
              <Ionicons
                name="download-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.exportText
                }
              >
                Export CRM as CSV
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text
          style={styles.help}
        >
          You can open the exported
          CSV file in Excel, Google
          Sheets or other spreadsheet
          applications.
        </Text>
      </View>
    </SafeAreaView>
  );
}


function Feature({
  icon,
  title,
  text,
}) {
  return (
    <View
      style={styles.feature}
    >
      <View
        style={
          styles.featureIcon
        }
      >
        <Ionicons
          name={icon}
          size={20}
          color="#111827"
        />
      </View>

      <View
        style={{ flex: 1 }}
      >
        <Text
          style={
            styles.featureTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.featureText
          }
        >
          {text}
        </Text>
      </View>
    </View>
  );
}


const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        '#F3F4F6',
    },

    header: {
      height: 60,
      paddingHorizontal: 18,
      backgroundColor:
        '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      borderBottomWidth: 1,
      borderBottomColor:
        '#E5E7EB',
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#111827',
    },

    container: {
      padding: 18,
    },

    hero: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 24,
      padding: 26,
      alignItems: 'center',
    },

    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    heroTitle: {
      color: '#111827',
      fontSize: 22,
      fontWeight: '900',
      marginTop: 15,
    },

    heroText: {
      color: '#6B7280',
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
      marginTop: 6,
      maxWidth: 270,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 20,
      padding: 15,
      marginTop: 14,
    },

    feature: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor:
        '#F3F4F6',
    },

    featureIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor:
        '#F3F4F6',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    featureTitle: {
      color: '#111827',
      fontWeight: '800',
      fontSize: 12,
    },

    featureText: {
      color: '#6B7280',
      fontSize: 9,
      lineHeight: 14,
      marginTop: 3,
    },

    exportButton: {
      marginTop: 15,
      backgroundColor:
        '#111827',
      borderRadius: 15,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
    },

    exportText: {
      color: '#FFFFFF',
      fontWeight: '900',
    },

    help: {
      color: '#9CA3AF',
      textAlign: 'center',
      fontSize: 9,
      lineHeight: 14,
      marginTop: 10,
      paddingHorizontal: 20,
    },
  });
