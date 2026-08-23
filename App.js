import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuth } from './src/hooks/useAuth';

export default function App() {
  const {
    session,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <View
        style={styles.loading}
      >
        <StatusBar
          style="light"
        />

        <ActivityIndicator
          size="large"
          color="#FFFFFF"
        />

        <Text
          style={styles.text}
        >
          Loading YNS Card...
        </Text>
      </View>
    );
  }

  return (
    <AppNavigator
      session={session}
    />
  );
}

const styles =
  StyleSheet.create({
    loading: {
      flex: 1,
      backgroundColor:
        '#0B1020',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    text: {
      color: '#FFFFFF',
      marginTop: 15,
      fontSize: 14,
    },
  });
