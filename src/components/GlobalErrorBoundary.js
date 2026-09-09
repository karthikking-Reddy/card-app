import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export default class GlobalErrorBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  retry = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text style={styles.eyebrow}>YNS CARD</Text>
        <Text style={styles.title}>The app needs to restart this screen</Text>
        <Text style={styles.message}>
          Your account data has not been changed. Try again, or close and reopen YNS Card if the
          problem continues.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={this.retry}
          accessibilityRole="button"
          accessibilityLabel="Try loading YNS Card again"
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[24],
  },
  eyebrow: { ...typography.label, color: colors.goldDark, letterSpacing: 1.6 },
  title: { ...typography.h2, color: colors.navy, textAlign: 'center', marginTop: spacing[10] },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 360,
    marginTop: spacing[10],
  },
  button: {
    minHeight: 50,
    minWidth: 160,
    marginTop: spacing[20],
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { ...typography.button, color: colors.white },
});
