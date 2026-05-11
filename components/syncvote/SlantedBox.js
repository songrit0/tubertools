import React from 'react';
import { View, StyleSheet } from 'react-native';

// Outer view is skewed -15deg; children are wrapped in a counter-skew so
// content stays upright. Matches the .slanted-box / .slanted-content pair
// from the original Sync-Vote prototype.
export default function SlantedBox({ style, contentStyle, children, ...rest }) {
  return (
    <View style={[styles.box, style]} {...rest}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    transform: [{ skewX: '-15deg' }],
    overflow: 'hidden',
  },
  content: {
    transform: [{ skewX: '15deg' }],
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
