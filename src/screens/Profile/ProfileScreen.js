import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { signOut } from "../../services/authService";

export default function ProfileScreen() {
  async function handleLogout() {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Logout failed", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.subtitle}>
        Manage your YNS Card account and settings.
      </Text>

      <View style={styles.card}>
        <Text style={styles.option}>My Profile</Text>
        <Text style={styles.option}>My Cards</Text>
        <Text style={styles.option}>Social Links</Text>
        <Text style={styles.option}>Themes</Text>
        <Text style={styles.option}>Notifications</Text>
        <Text style={styles.option}>Privacy & Settings</Text>
      </View>

      <TouchableOpacity
        style={styles.logout}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
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
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 20,
    marginTop: 25,
  },

  option: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },

  logout: {
    marginTop: 20,
    backgroundColor: "#FEE2E2",
    padding: 17,
    borderRadius: 16,
    alignItems: "center",
  },

  logoutText: {
    color: "#DC2626",
    fontWeight: "800",
  },
});
