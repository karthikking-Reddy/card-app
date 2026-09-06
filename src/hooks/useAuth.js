import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { getCurrentSession, onAuthStateChange } from '../services/authService';
import { getCurrentProfile } from '../services/profileService';
import { completeGoogleSignIn } from '../services/googleAuthService';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    let revision = 0;
    const apply = (value) => {
      if (!mounted) return;
      setSession(value);
      setLoading(false);
    };
    const subscription = onAuthStateChange((_event, value) => {
      revision += 1;
      apply(value);
    });
    const initialRevision = revision;
    getCurrentSession().then((value) => {
      if (revision === initialRevision) apply(value);
    });
    // Warm callbacks belong to openAuthSessionAsync. Only recover a cold-start URL here.
    Linking.getInitialURL()
      .then(completeGoogleSignIn)
      .catch(() => {
        if (mounted) Alert.alert('Google sign-in', 'Please start Google sign-in again.');
      });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (session?.user?.id)
      getCurrentProfile().catch((error) => {
        if (active) Alert.alert('Account profile unavailable', error.message);
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);
  return { session, user: session?.user ?? null, loading, isAuthenticated: !!session };
}
