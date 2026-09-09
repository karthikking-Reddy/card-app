import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

const YNS_LOGO = require('../../../assets/brand/yns-card-logo.jpeg');

export default function AuthBrandHeader({ progress }) {
  const version = Constants.expoConfig?.version || '0.1.0';
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { height: 250 + insets.top }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <View style={styles.goldRibbonBack} />
        <View style={styles.navyRibbon} />
        <View style={styles.goldRibbonFront} />
        <Image
          source={YNS_LOGO}
          style={[styles.logo, { top: insets.top + 16 }]}
          resizeMode="contain"
          accessibilityLabel="YNS Card — Your Digital Identity"
        />
        <Text style={[styles.version, { top: insets.top + 12 }]}>v{version}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    overflow: 'hidden',
    backgroundColor: '#FFFEFA',
  },
  logo: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    width: 218,
    height: 156,
  },
  version: {
    position: 'absolute',
    top: 12,
    right: 18,
    color: colors.navySoft,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  goldRibbonBack: {
    position: 'absolute',
    left: -132,
    bottom: -50,
    width: 330,
    height: 188,
    borderRadius: 120,
    borderWidth: 32,
    borderColor: '#F4BE45',
    transform: [{ rotate: '25deg' }],
  },
  navyRibbon: {
    position: 'absolute',
    left: -52,
    right: -62,
    bottom: -56,
    height: 112,
    borderRadius: 76,
    backgroundColor: '#071A33',
    transform: [{ rotate: '-3deg' }],
  },
  goldRibbonFront: {
    position: 'absolute',
    right: -128,
    bottom: -49,
    width: 326,
    height: 184,
    borderRadius: 120,
    borderWidth: 30,
    borderColor: '#E9AA28',
    transform: [{ rotate: '-25deg' }],
  },
});
