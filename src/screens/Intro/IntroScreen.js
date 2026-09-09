import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandLogo from '../../components/auth/BrandLogo';
import { colors } from '../../theme';
import {
  INTRO_MODE,
  INTRO_STORAGE_KEY,
  RETURNING_INTRO_DURATION_MS,
  YNS_INTRO_MODE,
} from '../../constants/launch';

const INTRO_VIDEO = require('../../../assets/brand/yns-card-intro.mp4');

export default function IntroScreen({ authReady, onComplete }) {
  const [fullIntro, setFullIntro] = useState(null);
  const [visualComplete, setVisualComplete] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;
  const completed = useRef(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => active && setReducedMotion(value));
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion
    );
    AsyncStorage.getItem(INTRO_STORAGE_KEY)
      .then((seen) => {
        if (active)
          setFullIntro(YNS_INTRO_MODE === INTRO_MODE.ALWAYS_SHOW_FULL_INTRO || seen !== 'true');
      })
      .catch(() => active && setFullIntro(true));
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const finishVisual = useCallback(() => setVisualComplete(true), []);

  useEffect(() => {
    if (!visualComplete || !authReady || completed.current) return;
    completed.current = true;
    AsyncStorage.setItem(INTRO_STORAGE_KEY, 'true').catch(() => {});
    Animated.timing(opacity, {
      toValue: 0,
      duration: reducedMotion ? 120 : 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onComplete());
  }, [authReady, onComplete, opacity, reducedMotion, visualComplete]);

  return (
    <Animated.View style={[styles.root, { opacity }]}>
      <StatusBar style="dark" backgroundColor={colors.white} />
      {fullIntro === true ? (
        <FullIntro onComplete={finishVisual} reducedMotion={reducedMotion} />
      ) : (
        <ReturningIntro
          onComplete={finishVisual}
          reducedMotion={reducedMotion}
          waiting={fullIntro === null}
        />
      )}
    </Animated.View>
  );
}

function FullIntro({ onComplete, reducedMotion }) {
  const [skipVisible, setSkipVisible] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const finishingRef = useRef(false);
  const finishTimer = useRef(null);
  const player = useVideoPlayer(INTRO_VIDEO, (instance) => {
    instance.loop = false;
    instance.play();
  });
  const finish = useCallback(() => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    player.pause();
    const hold = reducedMotion ? 0 : 220;
    finishTimer.current = setTimeout(onComplete, hold);
  }, [onComplete, player, reducedMotion]);
  useEventListener(player, 'playToEnd', finish);
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'error') finish();
  });
  useEffect(() => {
    const timer = setTimeout(() => setSkipVisible(true), 1500);
    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer.current);
      videoOpacity.stopAnimation();
    };
  }, [videoOpacity]);
  return (
    <SafeAreaView style={styles.root}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        onFirstFrameRender={() =>
          Animated.timing(videoOpacity, {
            toValue: 1,
            duration: reducedMotion ? 80 : 220,
            useNativeDriver: true,
          }).start()
        }
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.videoCover,
          { opacity: videoOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
        ]}
      />
      {skipVisible && !finishing ? (
        <TouchableOpacity
          style={styles.skip}
          onPress={finish}
          accessibilityRole="button"
          accessibilityLabel="Skip intro"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

function ReturningIntro({ onComplete, reducedMotion, waiting }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0.96)).current;
  useEffect(() => {
    if (waiting) return undefined;
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: reducedMotion ? 120 : 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: reducedMotion ? 120 : 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    const timer = setTimeout(onComplete, reducedMotion ? 450 : RETURNING_INTRO_DURATION_MS);
    return () => {
      animation.stop();
      clearTimeout(timer);
    };
  }, [onComplete, opacity, reducedMotion, scale, waiting]);
  return (
    <View style={styles.returning}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <BrandLogo />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  video: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white },
  videoCover: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white },
  skip: {
    position: 'absolute',
    top: 10,
    right: 18,
    minWidth: 62,
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(11,18,32,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: { color: colors.navy, fontSize: 12, fontWeight: '800' },
  returning: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
});
