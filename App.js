import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuth } from './src/hooks/useAuth';
import IntroScreen from './src/screens/Intro/IntroScreen';
import GlobalErrorBoundary from './src/components/GlobalErrorBoundary';

function AppContent() {
  const { session, loading } = useAuth();
  const [launchComplete, setLaunchComplete] = useState(false);
  const [destinationReady, setDestinationReady] = useState(false);
  const [presentedSession, setPresentedSession] = useState(null);
  const [authExiting, setAuthExiting] = useState(false);
  const transitionTimer = useRef(null);
  const appOpacity = useRef(new Animated.Value(1)).current;
  const appTranslate = useRef(new Animated.Value(0)).current;

  const enterDestination = useCallback(() => {
    appOpacity.setValue(0);
    appTranslate.setValue(18);
    Animated.parallel([
      Animated.timing(appOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(appTranslate, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [appOpacity, appTranslate]);

  const finishLaunch = useCallback(() => {
    setPresentedSession(session);
    setDestinationReady(true);
    setLaunchComplete(true);
    enterDestination();
  }, [enterDestination, session]);

  useEffect(
    () => () => {
      clearTimeout(transitionTimer.current);
      appOpacity.stopAnimation();
      appTranslate.stopAnimation();
    },
    [appOpacity, appTranslate]
  );

  useEffect(() => {
    if (!destinationReady) return undefined;
    clearTimeout(transitionTimer.current);
    if (session && !presentedSession) {
      setAuthExiting(true);
      transitionTimer.current = setTimeout(() => {
        setPresentedSession(session);
        setAuthExiting(false);
        enterDestination();
      }, 380);
    } else if (!session && presentedSession) {
      setAuthExiting(false);
      setPresentedSession(null);
      enterDestination();
    } else if (
      session &&
      presentedSession &&
      session.access_token !== presentedSession.access_token
    ) {
      setPresentedSession(session);
    }
    return () => clearTimeout(transitionTimer.current);
  }, [destinationReady, enterDestination, presentedSession, session]);

  if (!launchComplete || !destinationReady) {
    return <IntroScreen authReady={!loading} onComplete={finishLaunch} />;
  }

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.root, { opacity: appOpacity, transform: [{ translateX: appTranslate }] }]}
      >
        <AppNavigator session={presentedSession} authExiting={authExiting} />
      </Animated.View>
    </View>
  );
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AppContent />
    </GlobalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#071A33' },
});
