import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Pressable } from 'react-native';

export default function RollButton({ onRoll, disabled, rolling, hasDoubleToken }) {
  const gaugeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [pressing, setPressing] = useState(false);
  const [gaugeValue, setGaugeValue] = useState(0);
  const gaugeLoop = useRef(null);

  // Idle pulse
  useEffect(() => {
    if (!disabled && !rolling) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [disabled, rolling]);

  // Gauge when pressing
  useEffect(() => {
    if (pressing) {
      Animated.timing(glowAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
      gaugeLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(gaugeAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(gaugeAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      gaugeLoop.current.start();

      const listenerId = gaugeAnim.addListener(({ value }) => setGaugeValue(value));
      return () => gaugeAnim.removeListener(listenerId);
    } else {
      Animated.timing(glowAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
      if (gaugeLoop.current) {
        gaugeLoop.current.stop();
        gaugeLoop.current = null;
      }
      gaugeAnim.setValue(0);
      setGaugeValue(0);
    }
  }, [pressing]);

  // Rolling spin
  const spinAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (rolling) {
      const spin = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 500, easing: Easing.linear, useNativeDriver: true })
      );
      spin.start();
      return () => spin.stop();
    }
    spinAnim.setValue(0);
  }, [rolling]);

  const handlePressIn = () => {
    if (disabled || rolling) return;
    setPressing(true);
  };

  const handlePressOut = () => {
    if (!pressing) return;
    const power = gaugeValue;
    setPressing(false);
    onRoll?.(power);
  };

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowColor = glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,215,0,0)', 'rgba(255,215,0,0.3)'] });
  const gaugeRotate = gaugeAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // คำนวณระยะทอยโดยประมาณจาก power
  const estimatedMin = pressing ? Math.max(2, Math.round(2 + gaugeValue * 4)) : 0;
  const estimatedMax = pressing ? Math.min(12, Math.round(estimatedMin + 4)) : 0;

  // สี gauge ตาม %
  const getPowerColor = () => {
    if (gaugeValue < 0.3) return '#44AAFF';
    if (gaugeValue < 0.6) return '#FFD700';
    if (gaugeValue < 0.85) return '#FF8C00';
    return '#FF4444';
  };

  return (
    <View style={styles.wrapper}>
      {/* Power gauge ring */}
      {pressing && (
        <Animated.View style={[styles.gaugeRing, { transform: [{ rotate: gaugeRotate }], borderTopColor: getPowerColor(), borderRightColor: getPowerColor() }]}>
          <View style={[styles.gaugeArc, { backgroundColor: getPowerColor() }]} />
        </Animated.View>
      )}

      {/* Gauge level bar */}
      {pressing && (
        <View style={styles.gaugeLevel}>
          <View style={[styles.gaugeFill, { height: `${gaugeValue * 100}%`, backgroundColor: getPowerColor() }]} />
        </View>
      )}

      {/* Glow */}
      <Animated.View style={[styles.glow, { backgroundColor: glowColor }]} />

      {/* Double token badge */}
      {hasDoubleToken && !rolling && (
        <View style={styles.doubleBadge}>
          <Text style={styles.doubleBadgeText}>x2</Text>
        </View>
      )}

      {/* Button */}
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || rolling}
        style={({ pressed }) => [
          styles.button,
          hasDoubleToken && styles.buttonDouble,
          (disabled || rolling) && styles.buttonDisabled,
          pressed && !disabled && styles.buttonPressed,
        ]}
      >
        <Animated.View style={{
          transform: [
            { scale: pressing ? 0.92 : 1 },
            ...(rolling ? [{ rotate: spin }] : [{ scale: pulseAnim }]),
          ],
        }}>
          <Text style={styles.buttonEmoji}>{rolling ? '🎲' : hasDoubleToken ? '⚡' : '🎲'}</Text>
          <Text style={[styles.buttonText, rolling && styles.buttonTextRolling]}>
            {rolling ? 'ROLLING' : pressing ? 'RELEASE!' : hasDoubleToken ? 'ROLL x2' : 'ROLL'}
          </Text>
        </Animated.View>
      </Pressable>

      {/* Power % + ระยะโดยประมาณ */}
      {pressing && (
        <View style={styles.powerInfo}>
          <Text style={[styles.powerText, { color: getPowerColor() }]}>⚡ {Math.round(gaugeValue * 100)}%</Text>
          <Text style={styles.rangeText}>ระยะ ~{estimatedMin}-{estimatedMax} ช่อง</Text>
        </View>
      )}
    </View>
  );
}

const BUTTON_SIZE = 88;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: BUTTON_SIZE + 40,
    height: BUTTON_SIZE + 55,
  },
  glow: {
    position: 'absolute',
    width: BUTTON_SIZE + 30,
    height: BUTTON_SIZE + 30,
    borderRadius: (BUTTON_SIZE + 30) / 2,
    top: 0,
  },
  gaugeRing: {
    position: 'absolute',
    top: 0,
    width: BUTTON_SIZE + 20,
    height: BUTTON_SIZE + 20,
    borderRadius: (BUTTON_SIZE + 20) / 2,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#FFD700',
    borderRightColor: '#FF8C00',
  },
  gaugeArc: {
    position: 'absolute',
    top: -3,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  gaugeLevel: {
    position: 'absolute',
    right: -6,
    top: 10,
    bottom: 25,
    width: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  gaugeFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 2,
  },
  doubleBadge: {
    position: 'absolute',
    top: -4,
    right: 4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  doubleBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  buttonDouble: {
    backgroundColor: '#FF6B00',
    shadowColor: '#FF6B00',
    borderColor: '#FFD700',
  },
  buttonDisabled: {
    backgroundColor: '#444',
    borderColor: '#555',
    shadowOpacity: 0,
  },
  buttonPressed: {
    backgroundColor: '#E6C200',
  },
  buttonEmoji: {
    fontSize: 28,
    textAlign: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  buttonTextRolling: {
    fontSize: 10,
    color: '#666',
  },
  powerInfo: {
    alignItems: 'center',
    marginTop: 4,
  },
  powerText: {
    fontSize: 12,
    fontWeight: '900',
  },
  rangeText: {
    color: '#888',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
  },
});
