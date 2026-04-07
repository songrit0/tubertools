import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const PLAYER_ICONS = ['👑', '⚡', '🔥', '💎'];

export default function PlayerToken({ color, name, size = 20, showName = false, icon, isActive = false, playerIndex = 0 }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isActive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulse, { toValue: 1.25, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glow, { toValue: 1, duration: 600, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(glow, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          ]),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(1);
      glow.setValue(0.4);
    }
  }, [isActive]);

  const displayIcon = icon || PLAYER_ICONS[playerIndex % PLAYER_ICONS.length];
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const iconSize = Math.max(10, size * 0.5);

  return (
    <View style={styles.container}>
      {/* Glow ring for active player */}
      {isActive && (
        <Animated.View style={[styles.glowRing, {
          width: size + 8, height: size + 8, borderRadius: (size + 8) / 2,
          borderColor: color, opacity: glow,
        }]} />
      )}
      <Animated.View style={[styles.token, {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        transform: [{ scale: pulse }],
        shadowColor: color,
        shadowOpacity: isActive ? 0.8 : 0.4,
        shadowRadius: isActive ? 12 : 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: isActive ? 20 : 8,
      }]}>
        <Text style={{ fontSize: iconSize, textAlign: 'center', lineHeight: iconSize + 2 }}>{displayIcon}</Text>
      </Animated.View>
      {showName && (
        <View style={styles.nameTag}>
          <Text style={[styles.name, { fontSize: Math.max(7, size * 0.3) }]} numberOfLines={1}>{name}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  token: {
    borderWidth: 2.5,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  nameTag: {
    marginTop: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  name: {
    color: '#FFF',
    fontWeight: '800',
    maxWidth: 50,
    textAlign: 'center',
  },
});
