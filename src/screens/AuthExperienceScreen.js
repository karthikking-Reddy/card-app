import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../lib/supabase';
import AnimatedAuthButton from '../components/auth/AnimatedAuthButton';
import AuthBrandHeader from '../components/auth/AuthBrandHeader';
import AppButton from '../components/ui/AppButton';
import { colors, radius, shadows, typography } from '../theme';
import { signInWithGoogle } from '../services/googleAuthService';

export default function AuthExperienceScreen({ authSuccess = false }) {
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
              contentContainerStyle={styles.scrollContent}
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
                    <AppButton
                      title="Continue with Google"
                      icon="logo-google"
                      variant="secondary"
                      loading={loading}
                      disabled={modeSwitching || authSuccess}
                      onPress={socialLogin}
                      accessibilityLabel="Continue with Google"
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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
    paddingTop: 202,
    paddingBottom: 14,
  },
  sheet: {
    marginHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 19,
    paddingTop: 20,
    paddingBottom: 19,
    ...shadows.medium,
  },
  securityBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.goldSoft,
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: radius.round,
  },
  securityText: { ...typography.label, color: '#55421F', fontSize: 10 },
  heading: { ...typography.display, textAlign: 'center', marginTop: 13 },
  headingSubtitle: { ...typography.small, textAlign: 'center', marginTop: 4, paddingHorizontal: 8 },
  form: { marginTop: 12 },
  fieldLabel: {
    ...typography.label,
    color: '#475467',
    fontSize: 10,
    marginBottom: 7,
    marginTop: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  forgotText: { color: colors.blue, fontSize: 10, fontWeight: '700', marginBottom: 7 },
  inputShell: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  inputShellError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  inputIconBox: {
    width: 51,
    minHeight: 53,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  inputIconBoxError: { backgroundColor: colors.dangerSoft },
  input: { flex: 1, minHeight: 52, color: colors.text, fontSize: 13, paddingHorizontal: 13 },
  eyeButton: { width: 49, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 2,
  },
  inlineErrorText: { color: colors.danger, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  createAccountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 13,
    minHeight: 28,
  },
  createAccountMuted: { ...typography.small, fontSize: 11 },
  createAccountGold: {
    ...typography.small,
    color: colors.goldDark,
    fontSize: 11,
    fontWeight: '800',
  },
  trustBar: {
    marginTop: 8,
    marginHorizontal: 13,
    minHeight: 60,
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
  trustTitle: { color: colors.text, fontSize: 8, fontWeight: '800' },
  trustSubtitle: { color: colors.textSecondary, fontSize: 7, marginTop: 1 },
  trustDivider: { width: 1, height: 32, backgroundColor: colors.border, marginHorizontal: 6 },
});
