import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MetaScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Meta Ads</Text>
      <Text style={styles.subtitle}>
        Facebook and Instagram advertising.
      </Text>

      <View style={styles.card}>
        <Text style={styles.heading}>Coming in Step 3</Text>

        <Text style={styles.text}>
          Connect Meta Business, create campaigns, sync leads and track ad performance.
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
    borderRadius: 22,
    padding: 24,
  },

  heading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  text: {
    marginTop: 10,
    color: "#6B7280",
    lineHeight: 21,
  },
});
