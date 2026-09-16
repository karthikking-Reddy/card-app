import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  ActivityIndicator,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../../lib/supabase';
import AnimatedAuthButton from '../components/auth/AnimatedAuthButton';
import AuthBrandHeader from '../components/auth/AuthBrandHeader';
import { colors, radius, shadows, typography } from '../theme';
import { signInWithGoogle } from '../services/googleAuthService';

export default function AuthExperienceScreen({ authSuccess = false }) {
  const { height: viewportHeight } = useWindowDimensions();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [modeSwitching, setModeSwitching] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [authError, setAuthError] = useState('');
  const mounted = useRef(true);
  const entrance = useRef(new Animated.Value(0)).current;
  const panelX = useRef(new Animated.Value(0)).current;
  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelScale = useRef(new Animated.Value(1)).current;
  const contentX = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const arrowTranslate = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const isSignup = mode === 'signup';

  useEffect(() => {
    mounted.current = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (value) => mounted.current && setReducedMotion(value)
    );
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );
    Animated.timing(entrance, {
      toValue: 1,
      duration: 440,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    return () => {
      mounted.current = false;
      subscription.remove();
      [
        entrance,
        panelX,
        panelOpacity,
        panelScale,
        contentX,
        contentOpacity,
        buttonScale,
        arrowTranslate,
        shakeX,
      ].forEach((value) => value.stopAnimation());
    };
  }, [
    arrowTranslate,
    buttonScale,
    contentOpacity,
    contentX,
    entrance,
    panelOpacity,
    panelScale,
    panelX,
    shakeX,
  ]);

  useEffect(() => {
    if (!authSuccess) return;
    Animated.parallel([
      Animated.timing(panelX, {
        toValue: reducedMotion ? -8 : -52,
        duration: reducedMotion ? 180 : 360,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(panelOpacity, {
        toValue: 0,
        duration: reducedMotion ? 180 : 340,
        useNativeDriver: true,
      }),
      Animated.timing(panelScale, {
        toValue: reducedMotion ? 1 : 0.98,
        duration: 340,
        useNativeDriver: true,
      }),
    ]).start();
  }, [authSuccess, panelOpacity, panelScale, panelX, reducedMotion]);

  function animatePress() {
    if (reducedMotion) return Promise.resolve();
    return new Promise((resolve) => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(buttonScale, { toValue: 0.97, duration: 70, useNativeDriver: true }),
          Animated.spring(buttonScale, {
            toValue: 1,
            speed: 28,
            bounciness: 3,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(arrowTranslate, { toValue: 5, duration: 100, useNativeDriver: true }),
          Animated.timing(arrowTranslate, { toValue: 0, duration: 110, useNativeDriver: true }),
        ]),
      ]).start(resolve);
    });
  }

  function shake() {
    if (reducedMotion) return;
    shakeX.setValue(0);
    Animated.sequence(
      [-7, 6, -4, 3, 0].map((value) =>
        Animated.timing(shakeX, { toValue: value, duration: 55, useNativeDriver: true })
      )
    ).start();
  }

  async function handleSubmit() {
    if (loading || modeSwitching) return;
    setAuthError('');
    await animatePress();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return Alert.alert('Email required', 'Please enter your email address.');
    if (!isValidEmail(cleanEmail))
      return Alert.alert('Invalid email', 'Please enter a valid email address.');
    if (!password) return Alert.alert('Password required', 'Please enter your password.');
    if (password.length < 6)
      return Alert.alert('Password too short', 'Password must contain at least 6 characters.');
    if (isSignup && password !== confirmPassword)
      return Alert.alert('Passwords do not match', 'Please enter the same password again.');
    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (error) throw error;
        if (data?.session) return;
        Alert.alert(
          'Account created',
          'Please check your email and confirm your account before signing in.',
          [{ text: 'OK', onPress: () => switchMode('login', true) }]
        );
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw error;
    } catch (error) {
      shake();
      if (!isSignup && isInvalidCredentialsError(error)) {
        setAuthError('Incorrect email or password');
        return;
      }
      Alert.alert(
        isSignup ? 'Unable to create account' : 'Unable to sign in',
        getFriendlyError(error)
      );
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  async function forgotPassword() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail)
      return Alert.alert(
        'Enter your email',
        'Enter your email address first, then tap Forgot password.'
      );
    if (!isValidEmail(cleanEmail))
      return Alert.alert('Invalid email', 'Please enter a valid email address.');
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) throw error;
      Alert.alert('Reset email sent', 'Check your inbox for the password reset link.');
    } catch (error) {
      Alert.alert('Unable to send email', getFriendlyError(error));
    } finally {
      if (mounted.current) setResetLoading(false);
    }
  }

  function switchMode(nextMode, clearPasswords = false) {
    if (modeSwitching || loading || nextMode === mode) return;
    const direction = nextMode === 'signup' ? -1 : 1;
    const finish = () => {
      setMode(nextMode);
      if (clearPasswords) {
        setPassword('');
        setConfirmPassword('');
      }
      setShowPassword(false);
      setShowConfirmPassword(false);
      setAuthError('');
      contentX.setValue(reducedMotion ? 0 : -direction * 42);
      Animated.parallel([
        Animated.timing(contentX, {
          toValue: 0,
          duration: reducedMotion ? 100 : 230,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: reducedMotion ? 100 : 210,
          useNativeDriver: true,
        }),
      ]).start(() => mounted.current && setModeSwitching(false));
    };
    setModeSwitching(true);
    Animated.parallel([
      Animated.timing(contentX, {
        toValue: reducedMotion ? 0 : direction * 42,
        duration: reducedMotion ? 80 : 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: reducedMotion ? 80 : 150,
        useNativeDriver: true,
      }),
    ]).start(finish);
  }

  async function socialLogin() {
    if (loading || modeSwitching) return;
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      shake();
      Alert.alert('Unable to sign in', error.message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }

  const entranceTranslate = entrance.interpolate({ inputRange: [0, 1], outputRange: [30, 0] });
  return (
    <View style={styles.root}>
      <StatusBar style="dark" backgroundColor={colors.white} />
      <View style={styles.background}>
        <AuthBrandHeader progress={entrance} />
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            style={styles.safe}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.scrollContent,
                { paddingTop: getLoginTopOffset(viewportHeight) },
              ]}
            >
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    opacity: Animated.multiply(entrance, panelOpacity),
                    transform: [
                      { translateY: entranceTranslate },
                      { translateX: Animated.add(panelX, shakeX) },
                      { scale: panelScale },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={{ opacity: contentOpacity, transform: [{ translateX: contentX }] }}
                >
                  <View style={styles.securityBadge}>
                    <Ionicons name="shield-checkmark-outline" size={18} color={colors.goldDark} />
                    <Text style={styles.securityText}>SECURE BUSINESS ACCESS</Text>
                  </View>
                  <Text style={styles.heading}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>
                  <Text style={styles.headingSubtitle}>
                    {isSignup
                      ? 'Create your YNS Card account and build your digital identity.'
                      : 'Sign in to manage your digital business card.'}
                  </Text>
                  <View style={styles.form}>
                    <FieldLabel>EMAIL ADDRESS</FieldLabel>
                    <InputShell icon="mail-outline">
                      <TextInput
                        value={email}
                        onChangeText={(value) => {
                          setEmail(value);
                          if (authError) setAuthError('');
                        }}
                        placeholder="name@example.com"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="emailAddress"
                        accessibilityLabel="Email address"
                        style={styles.input}
                      />
                    </InputShell>
                    <View style={styles.passwordLabelRow}>
                      <FieldLabel>PASSWORD</FieldLabel>
                      {!isSignup ? (
                        <TouchableOpacity
                          onPress={forgotPassword}
                          disabled={resetLoading}
                          accessibilityRole="button"
                          accessibilityLabel="Forgot password"
                        >
                          <Text style={styles.forgotText}>
                            {resetLoading ? 'Sending...' : 'Forgot password?'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <PasswordInput
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        if (authError) setAuthError('');
                      }}
                      visible={showPassword}
                      onToggle={() => setShowPassword((value) => !value)}
                      label="Password"
                      error={Boolean(authError)}
                    />
                    {authError ? (
                      <View style={styles.inlineError} accessibilityLiveRegion="polite">
                        <Ionicons name="alert-circle" size={15} color={colors.danger} />
                        <Text style={styles.inlineErrorText}>{authError}</Text>
                      </View>
                    ) : null}
                    {isSignup ? (
                      <>
                        <FieldLabel>CONFIRM PASSWORD</FieldLabel>
                        <PasswordInput
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          visible={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword((value) => !value)}
                          label="Confirm password"
                          icon="shield-checkmark-outline"
                        />
                      </>
                    ) : null}
                    <AnimatedAuthButton
                      title={isSignup ? 'Create Account' : 'Sign In'}
                      loadingTitle={isSignup ? 'Creating account...' : 'Signing in...'}
                      loading={loading}
                      disabled={modeSwitching || authSuccess}
                      icon={isSignup ? 'person-add-outline' : 'arrow-forward'}
                      onPress={handleSubmit}
                      scale={buttonScale}
                      arrowTranslate={arrowTranslate}
                    />
                    <View style={styles.orRow}>
                      <View style={styles.orLine} />
                      <Text style={styles.orText}>OR CONTINUE WITH</Text>
                      <View style={styles.orLine} />
                    </View>
                    <GoogleButton
                      loading={loading}
                      disabled={modeSwitching || authSuccess}
                      onPress={socialLogin}
                    />
                    <TouchableOpacity
                      onPress={() => switchMode(isSignup ? 'login' : 'signup', true)}
                      disabled={modeSwitching || loading}
                      style={styles.createAccountRow}
                      accessibilityRole="button"
                      accessibilityLabel={isSignup ? 'Back to Sign In' : 'Create Account'}
                    >
                      <Text style={styles.createAccountMuted}>
                        {isSignup ? 'Already have an account?' : "Don't have an account?"}
                      </Text>
                      <Text style={styles.createAccountGold}>
                        {isSignup ? ' Sign In' : ' Create Account'}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.goldDark} />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </Animated.View>
              <Animated.View style={[styles.trustBar, { opacity: entrance }]}>
                <TrustItem
                  icon="shield-checkmark-outline"
                  title="Secure"
                  subtitle="Your data is safe"
                />
                <View style={styles.trustDivider} />
                <TrustItem icon="cloud-outline" title="Cloud Sync" subtitle="Access anywhere" />
                <View style={styles.trustDivider} />
                <TrustItem
                  icon="briefcase-outline"
                  title="Business Ready"
                  subtitle="For professionals"
                />
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

function FieldLabel({ children }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function InputShell({ icon, children, error = false }) {
  return (
    <View style={[styles.inputShell, error && styles.inputShellError]}>
      <View style={[styles.inputIconBox, error && styles.inputIconBoxError]}>
        <Ionicons name={icon} size={21} color={error ? colors.danger : colors.textSecondary} />
      </View>
      {children}
    </View>
  );
}

function PasswordInput({
  value,
  onChangeText,
  visible,
  onToggle,
  label,
  icon = 'lock-closed-outline',
  error = false,
}) {
  return (
    <InputShell icon={icon} error={error}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label === 'Password' ? 'Enter your password' : 'Enter password again'}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={!visible}
        autoCapitalize="none"
        textContentType={label === 'Password' ? 'password' : 'newPassword'}
        accessibilityLabel={label}
        style={styles.input}
      />
      <TouchableOpacity
        style={styles.eyeButton}
        activeOpacity={0.58}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
      >
        <Ionicons
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={22}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </InputShell>
  );
}

function TrustItem({ icon, title, subtitle }) {
  return (
    <View style={styles.trustItem}>
      <View style={styles.trustIcon}>
        <Ionicons name={icon} size={20} color={colors.goldDark} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.trustTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.trustSubtitle}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

function GoogleButton({ loading, disabled, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.googleButton, disabled && styles.googleButtonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.72}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.navy} />
      ) : (
        <>
          <GoogleGIcon />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function GoogleGIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" accessibilityLabel="Google">
      <Path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />
      <Path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <Path
        fill="#FBBC05"
        d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.54l3.35-2.62Z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.95c1.47 0 2.79.51 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z"
      />
    </Svg>
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getLoginTopOffset(viewportHeight) {
  const responsiveOffset = 202 + (viewportHeight - 800) * 0.27;
  return Math.round(Math.min(234, Math.max(185, responsiveOffset)));
}

function getFriendlyError(error) {
  const message = String(error?.message || 'Something went wrong.');
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'The email or password is incorrect.';
  if (lower.includes('email not confirmed'))
    return 'Please confirm your email address before signing in.';
  if (lower.includes('user already registered'))
    return 'An account already exists with this email address.';
  return message;
}

function isInvalidCredentialsError(error) {
  const message = String(error?.message || '').toLowerCase();
  return message.includes('invalid login credentials');
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFAF6' },
  background: { flex: 1, backgroundColor: '#FBFAF6' },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 4,
  },
  sheet: {
    marginHorizontal: 11,
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 15,
    ...shadows.medium,
  },
  securityBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: radius.round,
  },
  securityText: { ...typography.label, color: '#55421F', fontSize: 9.5 },
  heading: {
    ...typography.display,
    color: colors.navy,
    fontSize: 29,
    lineHeight: 36,
    textAlign: 'center',
    marginTop: 9,
  },
  headingSubtitle: {
    ...typography.small,
    color: colors.navySoft,
    textAlign: 'center',
    marginTop: 2,
    paddingHorizontal: 8,
  },
  form: { marginTop: 8 },
  fieldLabel: {
    ...typography.label,
    color: colors.navy,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 7,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  forgotText: { color: colors.blue, fontSize: 10, fontWeight: '700', marginBottom: 6 },
  inputShell: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#DDE2EA',
    borderRadius: 13,
    overflow: 'hidden',
  },
  inputShellError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  inputIconBox: {
    width: 45,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  inputIconBoxError: { backgroundColor: 'transparent' },
  input: { flex: 1, minHeight: 47, color: colors.navy, fontSize: 13, paddingHorizontal: 8 },
  eyeButton: { width: 45, minHeight: 47, alignItems: 'center', justifyContent: 'center' },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  inlineErrorText: { color: colors.danger, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: '#EEF0F4' },
  orText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 8.5,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  googleButton: {
    width: '100%',
    minHeight: 49,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonDisabled: { opacity: 0.62 },
  googleButtonText: {
    ...typography.button,
    color: colors.navy,
    fontSize: 13.5,
  },
  createAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 26,
  },
  createAccountMuted: { ...typography.small, fontSize: 11 },
  createAccountGold: {
    ...typography.small,
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  trustBar: {
    marginTop: 3,
    marginHorizontal: 13,
    minHeight: 58,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTitle: { color: colors.navy, fontSize: 8, fontWeight: '800' },
  trustSubtitle: { color: colors.textSecondary, fontSize: 7, marginTop: 1 },
  trustDivider: { width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 6 },
});
