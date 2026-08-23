import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function InsightsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Insights</Text>
      <Text style={styles.subtitle}>
        Track card views, clicks and conversions.
      </Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.number}>0</Text>
          <Text style={styles.label}>Card Views</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.number}>0</Text>
          <Text style={styles.label}>Link Clicks</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.number}>0</Text>
          <Text style={styles.label}>Connections</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.number}>0%</Text>
          <Text style={styles.label}>Conversion</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    color: "#6B7280",
    marginTop: 5,
    marginBottom: 24,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  card: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },

  number: {
    fontSize: 25,
    fontWeight: "800",
    color: "#111827",
  },

  label: {
    color: "#6B7280",
    marginTop: 6,
  },
});
