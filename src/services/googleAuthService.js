import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();
let signingIn = false;
let exchanging = null;

export function getGoogleRedirectUrl() {
  return Linking.createURL('auth/callback', { scheme: 'online.ynscrm.card' });
}

export async function completeGoogleSignIn(url) {
  if (!url) return false;
  let callback;
  try {
    callback = new URL(url);
  } catch {
    return false;
  }
  const expected = new URL(getGoogleRedirectUrl());
  if (
    callback.protocol !== expected.protocol ||
    callback.host !== expected.host ||
    callback.pathname !== expected.pathname
  )
    return false;
  if (callback.searchParams.has('error'))
    throw new Error('Google sign-in was not completed. Please try again.');
  const code = callback.searchParams.get('code');
  if (!code) return false;
  if (exchanging) return exchanging;
  exchanging = (async () => {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error('Unable to complete Google sign-in. Please start again.');
    return true;
  })();
  try {
    return await exchanging;
  } finally {
    exchanging = null;
  }
}

export async function signInWithGoogle() {
  if (signingIn) return;
  if (Constants.appOwnership === 'expo')
    throw new Error('Google sign-in requires an installed preview or development build.');
  if (Platform.OS === 'web')
    throw new Error('Please use the installed YNS Card app for Google sign-in.');
  signingIn = true;
  try {
    const redirectTo = getGoogleRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data?.url)
      throw new Error(
        'Unable to start Google sign-in. Please check the Google provider configuration.'
      );
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success' && !(await completeGoogleSignIn(result.url)))
      throw new Error('Google sign-in returned an invalid callback. Please start again.');
  } finally {
    signingIn = false;
  }
}
