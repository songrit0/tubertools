import React, { useEffect, useRef } from 'react';
import {
  Pressable, Text, View, Animated, StyleSheet, Platform,
} from 'react-native';
import { Volume2, Repeat } from 'lucide-react-native';

export default function SoundButton({
  button, isPlaying, onPress, onLongPress, style,
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isPlaying) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 400, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
    pulse.setValue(1);
  }, [isPlaying]);

  const bg = button.color || '#2A2A2A';

  const inner = (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: pressed ? 0.75 : 1 },
        isPlaying && styles.btnPlaying,
        style,
      ]}
    >
      <Text style={styles.name} numberOfLines={2}>{button.name}</Text>
      <View style={styles.badges}>
        <Volume2 size={11} color="rgba(255,255,255,0.6)" />
        <Text style={styles.vol}>{Math.round((button.volume ?? 1) * 100)}%</Text>
        {button.loop && <Repeat size={11} color="rgba(255,255,255,0.6)" />}
      </View>
    </Pressable>
  );

  if (Platform.OS === 'web') {
    return (
      <Animated.View
        style={[styles.wrap, { transform: [{ scale: pulse }] }]}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('buttonId', button.id)}
      >
        {inner}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale: pulse }] }]}>
      {inner}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    justifyContent: 'space-between',
    minHeight: 72,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  btnPlaying: {
    borderColor: 'rgba(255,255,255,0.6)',
  },
  name: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  vol: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
});
