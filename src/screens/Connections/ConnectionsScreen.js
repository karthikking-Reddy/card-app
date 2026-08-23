import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ConnectionsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Connections</Text>
      <Text style={styles.subtitle}>
        Leads, follow-ups and CRM pipeline will appear here.
      </Text>

      <View style={styles.card}>
        <Text style={styles.empty}>No connections yet</Text>
        <Text style={styles.description}>
          New leads from your digital card will appear here.
        </Text>
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
  },

  card: {
    marginTop: 25,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 22,
  },

  empty: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },

  description: {
    color: "#6B7280",
    marginTop: 8,
    lineHeight: 20,
  },
});
