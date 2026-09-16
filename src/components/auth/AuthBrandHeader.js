import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '../../theme';

const YNS_LOGO = require('../../../assets/brand/yns-card-logo.jpeg');

export default function AuthBrandHeader({ progress }) {
  const version = Constants.expoConfig?.version || 'Unavailable';
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { height: 250 + insets.top }]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 430 270"
          preserveAspectRatio="none"
          style={styles.waves}
        >
          <Defs>
            <LinearGradient id="navyWave" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#031326" />
              <Stop offset="0.55" stopColor="#0D3157" />
              <Stop offset="1" stopColor="#061B36" />
            </LinearGradient>
            <LinearGradient id="goldWave" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFF0AF" />
              <Stop offset="0.28" stopColor="#F4B91F" />
              <Stop offset="0.62" stopColor="#B97808" />
              <Stop offset="1" stopColor="#FFE38A" />
            </LinearGradient>
            <LinearGradient id="goldHighlight" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#B97808" />
              <Stop offset="0.48" stopColor="#F4B91F" />
              <Stop offset="0.75" stopColor="#FFE8A0" />
              <Stop offset="1" stopColor="#D99A12" />
            </LinearGradient>
          </Defs>
          <Path
            d="M0 119 C72 172 110 239 198 244 C291 249 335 142 430 105 L430 140 C343 173 304 270 198 264 C96 258 54 193 0 153 Z"
            fill="url(#goldWave)"
          />
          <Path
            d="M0 151 C78 204 116 252 205 252 C307 252 342 143 430 119 L430 270 L0 270 Z"
            fill="url(#navyWave)"
          />
          <Path
            d="M210 242 C301 222 340 139 430 101 L430 132 C351 163 310 247 218 267 C145 281 73 250 0 194 L0 179 C78 231 142 258 210 242 Z"
            fill="url(#goldHighlight)"
          />
          <Path
            d="M0 180 C73 230 139 257 208 244 C301 226 338 153 430 120"
            fill="none"
            stroke="rgba(255,241,180,0.72)"
            strokeWidth="1.2"
          />
        </Svg>
        <Image
          source={YNS_LOGO}
          style={[styles.logo, { top: insets.top + 21 }]}
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
    width: 232,
    height: 165,
    zIndex: 1,
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
    zIndex: 3,
  },
  waves: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2 },
});
