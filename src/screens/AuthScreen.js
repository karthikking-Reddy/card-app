import {
  useState,
} from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  LinearGradient,
} from 'expo-linear-gradient';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  supabase,
} from '../../lib/supabase';


const COLORS = {
  navy: '#071A33',
  navy2: '#0B2447',
  navy3: '#102D52',

  gold: '#F6B91A',
  goldDark: '#C47E00',
  goldSoft: '#FFF4D6',

  blue: '#0866FF',

  background: '#F5F7FB',
  white: '#FFFFFF',

  text: '#071A33',
  text2: '#536179',
  muted: '#98A2B3',

  border: '#E1E6ED',
  input: '#FAFBFD',

  green: '#16A34A',
  red: '#DC2626',
};


export default function AuthScreen() {
  const [
    mode,
    setMode,
  ] = useState('login');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    resetLoading,
    setResetLoading,
  ] = useState(false);


  const isSignup =
    mode === 'signup';


  async function handleSubmit() {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    if (!cleanEmail) {
      Alert.alert(
        'Email required',
        'Please enter your email address.'
      );

      return;
    }


    if (!isValidEmail(
      cleanEmail
    )) {
      Alert.alert(
        'Invalid email',
        'Please enter a valid email address.'
      );

      return;
    }


    if (!password) {
      Alert.alert(
        'Password required',
        'Please enter your password.'
      );

      return;
    }


    if (
      password.length < 6
    ) {
      Alert.alert(
        'Password too short',
        'Password must contain at least 6 characters.'
      );

      return;
    }


    if (
      isSignup &&
      password !==
        confirmPassword
    ) {
      Alert.alert(
        'Passwords do not match',
        'Please enter the same password again.'
      );

      return;
    }


    setLoading(true);


    try {
      if (isSignup) {
        const {
          data,
          error,
        } =
          await supabase.auth.signUp({
            email:
              cleanEmail,

            password,
          });


        if (error) {
          throw error;
        }


        if (
          data?.session
        ) {
          return;
        }


        Alert.alert(
          'Account created',
          'Please check your email and confirm your account before signing in.',
          [
            {
              text: 'OK',

              onPress: () => {
                setMode(
                  'login'
                );

                setPassword(
                  ''
                );

                setConfirmPassword(
                  ''
                );
              },
            },
          ]
        );

        return;
      }


      const {
        error,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              cleanEmail,

            password,
          });


      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert(
        isSignup
          ? 'Unable to create account'
          : 'Unable to sign in',

        getFriendlyError(
          error
        )
      );
    } finally {
      setLoading(false);
    }
  }


  async function forgotPassword() {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();


    if (!cleanEmail) {
      Alert.alert(
        'Enter your email',
        'Enter your email address first, then tap Forgot password.'
      );

      return;
    }


    if (!isValidEmail(
      cleanEmail
    )) {
      Alert.alert(
        'Invalid email',
        'Please enter a valid email address.'
      );

      return;
    }


    setResetLoading(true);


    try {
      const {
        error,
      } =
        await supabase.auth
          .resetPasswordForEmail(
            cleanEmail
          );


      if (error) {
        throw error;
      }


      Alert.alert(
        'Reset email sent',
        'Check your inbox for the password reset link.'
      );
    } catch (error) {
      Alert.alert(
        'Unable to send email',
        getFriendlyError(
          error
        )
      );
    } finally {
      setResetLoading(false);
    }
  }


  function changeMode() {
    setMode(
      isSignup
        ? 'login'
        : 'signup'
    );

    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }


  function socialLogin(
    provider
  ) {
    if (
      provider === 'google'
    ) {
      Alert.alert(
        'Google Sign In',
        'Google authentication is not configured yet. We can connect it after the main UI redesign is completed.'
      );

      return;
    }


    Alert.alert(
      'Meta Sign In',
      'Meta authentication will be enabled after your Meta Developer account verification is completed.'
    );
  }


  return (
    <View
      style={styles.root}
    >
      <StatusBar
        style="light"
      />


      <LinearGradient
        colors={[
          '#06162D',
          '#081D39',
          '#0D294C',
        ]}
        locations={[
          0,
          0.55,
          1,
        ]}
        style={
          styles.background
        }
      >
        <View
          style={
            styles.glowOne
          }
        />

        <View
          style={
            styles.glowTwo
          }
        />


        <SafeAreaView
          style={
            styles.safe
          }
        >
          <KeyboardAvoidingView
            style={{
              flex: 1,
            }}
            behavior={
              Platform.OS ===
              'ios'
                ? 'padding'
                : undefined
            }
          >
            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                styles.scrollContent
              }
            >
              <View
                style={
                  styles.brandArea
                }
              >
                <View
                  style={
                    styles.logoOuter
                  }
                >
                  <View
                    style={
                      styles.logoInner
                    }
                  >
                    <Ionicons
                      name="id-card-outline"
                      size={31}
                      color={
                        COLORS.gold
                      }
                    />

                    <Text
                      style={
                        styles.logoMiniText
                      }
                    >
                      YNS
                    </Text>
                  </View>
                </View>


                <View
                  style={
                    styles.brandTitleRow
                  }
                >
                  <Text
                    style={
                      styles.brandGold
                    }
                  >
                    YNS
                  </Text>

                  <Text
                    style={
                      styles.brandWhite
                    }
                  >
                    CARD
                  </Text>
                </View>


                <Text
                  style={
                    styles.brandSubtitle
                  }
                >
                  Your digital identity
                </Text>
              </View>


              <View
                style={
                  styles.sheet
                }
              >
                <View
                  style={
                    styles.securityBadge
                  }
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={
                      COLORS.goldDark
                    }
                  />

                  <Text
                    style={
                      styles.securityText
                    }
                  >
                    SECURE BUSINESS ACCESS
                  </Text>
                </View>


                <Text
                  style={
                    styles.heading
                  }
                >
                  {isSignup
                    ? 'Create Account'
                    : 'Welcome Back'}
                </Text>


                <Text
                  style={
                    styles.headingSubtitle
                  }
                >
                  {isSignup
                    ? 'Create your YNS Card account and build your digital identity.'
                    : 'Sign in to manage your digital business card.'}
                </Text>


                <View
                  style={
                    styles.form
                  }
                >
                  <FieldLabel>
                    EMAIL ADDRESS
                  </FieldLabel>


                  <View
                    style={
                      styles.inputShell
                    }
                  >
                    <View
                      style={
                        styles.inputIconBox
                      }
                    >
                      <Ionicons
                        name="mail-outline"
                        size={21}
                        color={
                          COLORS.text2
                        }
                      />
                    </View>

                    <TextInput
                      value={
                        email
                      }
                      onChangeText={
                        setEmail
                      }
                      placeholder="name@example.com"
                      placeholderTextColor={
                        COLORS.muted
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={
                        false
                      }
                      style={
                        styles.input
                      }
                    />
                  </View>


                  <View
                    style={
                      styles.passwordLabelRow
                    }
                  >
                    <FieldLabel>
                      PASSWORD
                    </FieldLabel>


                    {!isSignup ? (
                      <TouchableOpacity
                        onPress={
                          forgotPassword
                        }
                        disabled={
                          resetLoading
                        }
                      >
                        <Text
                          style={
                            styles.forgotText
                          }
                        >
                          {resetLoading
                            ? 'Sending...'
                            : 'Forgot password?'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>


                  <View
                    style={
                      styles.inputShell
                    }
                  >
                    <View
                      style={
                        styles.inputIconBox
                      }
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={21}
                        color={
                          COLORS.text2
                        }
                      />
                    </View>

                    <TextInput
                      value={
                        password
                      }
                      onChangeText={
                        setPassword
                      }
                      placeholder="Enter your password"
                      placeholderTextColor={
                        COLORS.muted
                      }
                      secureTextEntry={
                        !showPassword
                      }
                      autoCapitalize="none"
                      style={
                        styles.input
                      }
                    />


                    <TouchableOpacity
                      style={
                        styles.eyeButton
                      }
                      onPress={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
                      }
                    >
                      <Ionicons
                        name={
                          showPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={22}
                        color={
                          COLORS.text2
                        }
                      />
                    </TouchableOpacity>
                  </View>


                  {isSignup ? (
                    <>
                      <FieldLabel>
                        CONFIRM PASSWORD
                      </FieldLabel>

                      <View
                        style={
                          styles.inputShell
                        }
                      >
                        <View
                          style={
                            styles.inputIconBox
                          }
                        >
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={21}
                            color={
                              COLORS.text2
                            }
                          />
                        </View>

                        <TextInput
                          value={
                            confirmPassword
                          }
                          onChangeText={
                            setConfirmPassword
                          }
                          placeholder="Enter password again"
                          placeholderTextColor={
                            COLORS.muted
                          }
                          secureTextEntry={
                            !showConfirmPassword
                          }
                          autoCapitalize="none"
                          style={
                            styles.input
                          }
                        />

                        <TouchableOpacity
                          style={
                            styles.eyeButton
                          }
                          onPress={() =>
                            setShowConfirmPassword(
                              (value) =>
                                !value
                            )
                          }
                        >
                          <Ionicons
                            name={
                              showConfirmPassword
                                ? 'eye-off-outline'
                                : 'eye-outline'
                            }
                            size={22}
                            color={
                              COLORS.text2
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : null}


                  <TouchableOpacity
                    activeOpacity={
                      0.88
                    }
                    disabled={
                      loading
                    }
                    onPress={
                      handleSubmit
                    }
                    style={[
                      styles.primaryButton,

                      loading && {
                        opacity: 0.7,
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.primaryArrow
                      }
                    >
                      <Ionicons
                        name={
                          isSignup
                            ? 'person-add-outline'
                            : 'arrow-forward'
                        }
                        size={21}
                        color={
                          COLORS.navy
                        }
                      />
                    </View>


                    <Text
                      style={
                        styles.primaryButtonText
                      }
                    >
                      {loading
                        ? isSignup
                          ? 'Creating Account...'
                          : 'Signing In...'
                        : isSignup
                          ? 'Create Account'
                          : 'Sign In'}
                    </Text>


                    <View
                      style={
                        styles.primaryRightSpace
                      }
                    />
                  </TouchableOpacity>


                  <View
                    style={
                      styles.orRow
                    }
                  >
                    <View
                      style={
                        styles.orLine
                      }
                    />

                    <Text
                      style={
                        styles.orText
                      }
                    >
                      OR CONTINUE WITH
                    </Text>

                    <View
                      style={
                        styles.orLine
                      }
                    />
                  </View>


                  <View
                    style={
                      styles.socialRow
                    }
                  >
                    <TouchableOpacity
                      activeOpacity={
                        0.75
                      }
                      style={
                        styles.socialButton
                      }
                      onPress={() =>
                        socialLogin(
                          'google'
                        )
                      }
                    >
                      <Text
                        style={
                          styles.googleG
                        }
                      >
                        G
                      </Text>

                      <Text
                        style={
                          styles.socialButtonText
                        }
                      >
                        Google
                      </Text>
                    </TouchableOpacity>


                    <TouchableOpacity
                      activeOpacity={
                        0.75
                      }
                      style={
                        styles.socialButton
                      }
                      onPress={() =>
                        socialLogin(
                          'meta'
                        )
                      }
                    >
                      <Ionicons
                        name="logo-facebook"
                        size={23}
                        color={
                          COLORS.blue
                        }
                      />

                      <Text
                        style={
                          styles.socialButtonText
                        }
                      >
                        Meta
                      </Text>
                    </TouchableOpacity>
                  </View>


                  <TouchableOpacity
                    onPress={
                      changeMode
                    }
                    style={
                      styles.createAccountRow
                    }
                  >
                    <Text
                      style={
                        styles.createAccountMuted
                      }
                    >
                      {isSignup
                        ? 'Already have an account?'
                        : "Don't have an account?"}
                    </Text>

                    <Text
                      style={
                        styles.createAccountGold
                      }
                    >
                      {isSignup
                        ? ' Sign In'
                        : ' Create Account'}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={
                        COLORS.goldDark
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>


              <View
                style={
                  styles.trustBar
                }
              >
                <TrustItem
                  icon="shield-checkmark-outline"
                  title="Secure"
                  subtitle="Your data is safe"
                />

                <View
                  style={
                    styles.trustDivider
                  }
                />

                <TrustItem
                  icon="cloud-outline"
                  title="Cloud Sync"
                  subtitle="Access anywhere"
                />

                <View
                  style={
                    styles.trustDivider
                  }
                />

                <TrustItem
                  icon="briefcase-outline"
                  title="Business Ready"
                  subtitle="Built for professionals"
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}


function FieldLabel({
  children,
}) {
  return (
    <Text
      style={
        styles.fieldLabel
      }
    >
      {children}
    </Text>
  );
}


function TrustItem({
  icon,
  title,
  subtitle,
}) {
  return (
    <View
      style={
        styles.trustItem
      }
    >
      <View
        style={
          styles.trustIcon
        }
      >
        <Ionicons
          name={icon}
          size={18}
          color={
            COLORS.navy
          }
        />
      </View>

      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={
            styles.trustTitle
          }
        >
          {title}
        </Text>

        <Text
          numberOfLines={
            1
          }
          style={
            styles.trustSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}


function isValidEmail(
  value
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}


function getFriendlyError(
  error
) {
  const message =
    String(
      error?.message ||
        'Something went wrong.'
    );


  const lower =
    message.toLowerCase();


  if (
    lower.includes(
      'invalid login credentials'
    )
  ) {
    return 'The email or password is incorrect.';
  }


  if (
    lower.includes(
      'email not confirmed'
    )
  ) {
    return 'Please confirm your email address before signing in.';
  }


  if (
    lower.includes(
      'user already registered'
    )
  ) {
    return 'An account already exists with this email address.';
  }


  return message;
}


const systemFont =
  Platform.OS ===
  'android'
    ? 'sans-serif'
    : undefined;


const styles =
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor:
        COLORS.navy,
    },

    background: {
      flex: 1,
    },

    safe: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
      paddingBottom: 25,
    },


    /*
     * BACKGROUND DECORATION
     */

    glowOne: {
      position: 'absolute',
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor:
        'rgba(41,98,170,0.15)',
      top: 30,
      right: -100,
    },

    glowTwo: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 1,
      borderColor:
        'rgba(246,185,26,0.10)',
      top: 90,
      left: -120,
    },


    /*
     * BRAND
     */

    brandArea: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 27,
    },

    logoOuter: {
      width: 88,
      height: 88,
      borderRadius: 27,
      borderWidth: 3,
      borderColor:
        '#F7C851',
      padding: 6,
      backgroundColor:
        'rgba(255,255,255,0.04)',
      shadowColor:
        '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },

    logoInner: {
      flex: 1,
      borderRadius: 19,
      backgroundColor:
        '#0A1D37',
      alignItems: 'center',
      justifyContent: 'center',
    },

    logoMiniText: {
      fontFamily:
        systemFont,
      fontSize: 12,
      fontWeight: '900',
      color:
        COLORS.gold,
      marginTop: 1,
    },

    brandTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
    },

    brandGold: {
      fontFamily:
        systemFont,
      fontSize: 31,
      fontWeight: '900',
      letterSpacing: 0.7,
      color:
        COLORS.gold,
    },

    brandWhite: {
      fontFamily:
        systemFont,
      fontSize: 31,
      fontWeight: '900',
      letterSpacing: 0.7,
      color:
        COLORS.white,
      marginLeft: 7,
    },

    brandSubtitle: {
      fontFamily:
        systemFont,
      color:
        '#CCD5E2',
      fontSize: 14,
      fontWeight: '400',
      marginTop: 3,
    },


    /*
     * WHITE SHEET
     */

    sheet: {
      marginHorizontal: 18,
      backgroundColor:
        COLORS.white,
      borderRadius: 34,
      paddingHorizontal: 22,
      paddingTop: 27,
      paddingBottom: 25,
      shadowColor:
        '#00142C',
      shadowOffset: {
        width: 0,
        height: 12,
      },
      shadowOpacity: 0.19,
      shadowRadius: 24,
      elevation: 12,
    },

    securityBadge: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor:
        COLORS.goldSoft,
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 25,
    },

    securityText: {
      fontFamily:
        systemFont,
      color:
        '#55421F',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    heading: {
      fontFamily:
        systemFont,
      textAlign: 'center',
      color:
        COLORS.text,
      fontSize: 30,
      fontWeight: '900',
      marginTop: 18,
    },

    headingSubtitle: {
      fontFamily:
        systemFont,
      textAlign: 'center',
      color:
        COLORS.text2,
      fontSize: 13,
      lineHeight: 19,
      marginTop: 5,
      paddingHorizontal: 10,
    },

    form: {
      marginTop: 23,
    },


    /*
     * FIELDS
     */

    fieldLabel: {
      fontFamily:
        systemFont,
      color:
        '#475467',
      fontSize: 10,
      fontWeight: '800',
      marginBottom: 7,
      marginTop: 13,
    },

    passwordLabelRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-end',
      marginTop: 4,
    },

    forgotText: {
      fontFamily:
        systemFont,
      color:
        '#005FF9',
      fontSize: 10,
      fontWeight: '600',
      marginBottom: 7,
    },

    inputShell: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        COLORS.white,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius: 14,
      overflow: 'hidden',
    },

    inputIconBox: {
      width: 53,
      height: 55,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        '#F7F8FB',
    },

    input: {
      fontFamily:
        systemFont,
      flex: 1,
      minHeight: 54,
      color:
        COLORS.text,
      fontSize: 13,
      paddingHorizontal: 13,
    },

    eyeButton: {
      width: 49,
      minHeight: 54,
      alignItems: 'center',
      justifyContent: 'center',
    },


    /*
     * PRIMARY BUTTON
     */

    primaryButton: {
      minHeight: 58,
      marginTop: 23,
      borderRadius: 14,
      backgroundColor:
        COLORS.navy,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      paddingHorizontal: 13,
      shadowColor:
        COLORS.gold,
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.22,
      shadowRadius: 11,
      elevation: 6,
    },

    primaryArrow: {
      width: 39,
      height: 39,
      borderRadius: 11,
      backgroundColor:
        COLORS.gold,
      alignItems: 'center',
      justifyContent: 'center',
    },

    primaryButtonText: {
      fontFamily:
        systemFont,
      color:
        COLORS.white,
      fontSize: 16,
      fontWeight: '800',
    },

    primaryRightSpace: {
      width: 39,
    },


    /*
     * SOCIAL
     */

    orRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },

    orLine: {
      flex: 1,
      height: 1,
      backgroundColor:
        COLORS.border,
    },

    orText: {
      fontFamily:
        systemFont,
      color:
        COLORS.text2,
      fontSize: 9,
      fontWeight: '700',
      marginHorizontal: 10,
    },

    socialRow: {
      flexDirection: 'row',
      gap: 10,
    },

    socialButton: {
      flex: 1,
      minHeight: 51,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.white,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
    },

    socialButtonText: {
      fontFamily:
        systemFont,
      color:
        COLORS.text,
      fontSize: 11,
      fontWeight: '700',
    },

    googleG: {
      fontFamily:
        systemFont,
      color:
        '#4285F4',
      fontSize: 23,
      fontWeight: '900',
    },

    createAccountRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
      minHeight: 30,
    },

    createAccountMuted: {
      fontFamily:
        systemFont,
      color:
        COLORS.text2,
      fontSize: 11,
    },

    createAccountGold: {
      fontFamily:
        systemFont,
      color:
        COLORS.goldDark,
      fontSize: 11,
      fontWeight: '800',
    },


    /*
     * TRUST BAR
     */

    trustBar: {
      marginTop: 17,
      marginHorizontal: 18,
      minHeight: 72,
      backgroundColor:
        'rgba(255,255,255,0.96)',
      borderRadius: 19,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    trustItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    trustIcon: {
      width: 33,
      height: 33,
      borderRadius: 11,
      backgroundColor:
        COLORS.goldSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    trustTitle: {
      fontFamily:
        systemFont,
      color:
        COLORS.text,
      fontSize: 9,
      fontWeight: '800',
    },

    trustSubtitle: {
      fontFamily:
        systemFont,
      color:
        COLORS.text2,
      fontSize: 7,
      marginTop: 1,
    },

    trustDivider: {
      width: 1,
      height: 34,
      backgroundColor:
        COLORS.border,
      marginHorizontal: 7,
    },
  });
