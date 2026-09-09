import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, shadows } from '../../theme';

const YNS_LOGO = require('../../../assets/brand/yns-card-logo.jpeg');

export default function BrandLogo({ compact = false, animatedStyle }) {
  return (
    <View style={[styles.surface, compact && styles.compact, animatedStyle]}>
      <Image
        source={YNS_LOGO}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="YNS Card — Your Digital Identity"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    width: 238,
    height: 142,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(244,183,64,0.42)',
    ...shadows.medium,
  },
  compact: {
    width: 210,
    height: 126,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
