import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>YNS CARD</Text>
        <Text style={styles.subtitle}>Your digital identity</Text>

        <View style={styles.hero}>
          <Text style={styles.hello}>Hello ??</Text>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.description}>
            Manage your business card, connections and activity from one place.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>MY CARD</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            YUVARAJ NETWORKS & SOLUTIONS
          </Text>

          <Text style={styles.cardText}>
            Digital Marketing
          </Text>

          <Text style={styles.cardText}>
            Web Development
          </Text>

          <Text style={styles.cardText}>
            Automation
          </Text>
        </View>

        <Text style={styles.sectionTitle}>QUICK STATS</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Clicks</Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Leads</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  container: {
    padding: 20,
    paddingBottom: 100,
  },

  brand: {
    fontSize: 25,
    fontWeight: "900",
    color: "#111827",
  },

  subtitle: {
    color: "#6B7280",
    marginTop: 3,
    marginBottom: 24,
  },

  hero: {
    backgroundColor: "#111827",
    borderRadius: 24,
    padding: 22,
    marginBottom: 26,
  },

  hello: {
    color: "#D1D5DB",
    fontSize: 14,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    marginTop: 5,
  },

  description: {
    color: "#9CA3AF",
    lineHeight: 20,
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    marginBottom: 10,
    letterSpacing: 1,
  },

  card: {
    backgroundColor: "#FFFFFF",
    padding: 22,
    borderRadius: 22,
    marginBottom: 26,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 15,
  },

  cardText: {
    color: "#4B5563",
    fontSize: 14,
    marginBottom: 7,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
  },

  stat: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  statLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 5,
  },
});
