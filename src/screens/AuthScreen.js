import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import {
  signIn,
  signUp,
} from '../services/authService';

export default function AuthScreen() {
  const [mode, setMode] =
    useState('login');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function handleAuth() {
    if (
      !email.trim() ||
      !password.trim()
    ) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Password too short',
        'Password must contain at least 6 characters.'
      );
      return;
    }

    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(
          email.trim(),
          password
        );
      } else {
        const data =
          await signUp(
            email.trim(),
            password
          );

        if (!data.session) {
          Alert.alert(
            'Account created',
            'Please check your email if confirmation is required.'
          );
        }
      }
    } catch (error) {
      Alert.alert(
        mode === 'login'
          ? 'Login failed'
          : 'Sign up failed',
        error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={styles.brandArea}
        >
          <Text
            style={styles.brand}
          >
            YNS CARD
          </Text>

          <Text
            style={styles.subtitle}
          >
            Your digital identity
          </Text>
        </View>

        <View
          style={styles.card}
        >
          <Text
            style={styles.title}
          >
            {mode === 'login'
              ? 'Welcome Back'
              : 'Create Account'}
          </Text>

          <Text
            style={styles.description}
          >
            {mode === 'login'
              ? 'Sign in to manage your digital business card.'
              : 'Create your YNS Card account and build your digital identity.'}
          </Text>

          <Text
            style={styles.label}
          >
            EMAIL
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={
              setEmail
            }
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text
            style={styles.label}
          >
            PASSWORD
          </Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={
              setPassword
            }
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={
              handleAuth
            }
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                {mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={
              styles.switchButton
            }
            onPress={() =>
              setMode(
                mode === 'login'
                  ? 'signup'
                  : 'login'
              )
            }
          >
            <Text
              style={
                styles.switchText
              }
            >
              {mode === 'login'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    container: {
      flexGrow: 1,
      justifyContent:
        'center',
      padding: 20,
    },

    brandArea: {
      alignItems:
        'center',
      marginBottom: 30,
    },

    brand: {
      color: colors.white,
      fontSize: 32,
      fontWeight: '900',
      letterSpacing: 2,
    },

    subtitle: {
      color:
        colors.textMuted,
      fontSize: 14,
      marginTop: 6,
    },

    card: {
      backgroundColor:
        colors.white,
      borderRadius: 24,
      padding: 25,
    },

    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '800',
    },

    description: {
      color:
        colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 8,
      marginBottom: 25,
    },

    label: {
      color:
        colors.textSecondary,
      fontSize: 11,
      fontWeight: '700',
      marginBottom: 7,
    },

    input: {
      height: 52,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 12,
      paddingHorizontal: 15,
      color: colors.text,
      fontSize: 15,
      marginBottom: 18,
    },

    button: {
      height: 52,
      borderRadius: 12,
      backgroundColor:
        colors.primary,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    buttonText: {
      color: colors.white,
      fontSize: 15,
      fontWeight: '700',
    },

    switchButton: {
      alignItems:
        'center',
      marginTop: 20,
    },

    switchText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
    },
  });
