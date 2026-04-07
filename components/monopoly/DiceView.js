import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const DOTS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Die({ value, animStyle }) {
  const dots = DOTS[value] || [];
  return (
    <Animated.View style={[styles.die, animStyle]}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.dieRow}>
          {[0, 1, 2].map((col) => (
            <View key={col} style={styles.dotSlot}>
              {dots.some(([r, c]) => r === row && c === col) && (
                <View style={styles.dot} />
              )}
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

export default function DiceView({ dice, rolling }) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  const [displayDice, setDisplayDice] = useState([0, 0]);
  const rollingRef = useRef(null);

  // สุ่มหน้าเต๋าตอน rolling
  useEffect(() => {
    if (rolling) {
      scale.setValue(1);
      // เริ่ม animation หมุน
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rotate1, { toValue: 1, duration: 200, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(rotate1, { toValue: 0, duration: 200, easing: Easing.linear, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rotate2, { toValue: -1, duration: 250, easing: Easing.linear, useNativeDriver: true }),
            Animated.timing(rotate2, { toValue: 0, duration: 250, easing: Easing.linear, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(shake, { toValue: 1, duration: 80, useNativeDriver: true }),
            Animated.timing(shake, { toValue: -1, duration: 80, useNativeDriver: true }),
            Animated.timing(shake, { toValue: 0, duration: 80, useNativeDriver: true }),
          ]),
        ])
      ).start();

      // สุ่มหน้าเร็ว ๆ
      rollingRef.current = setInterval(() => {
        setDisplayDice([
          Math.floor(Math.random() * 6) + 1,
          Math.floor(Math.random() * 6) + 1,
        ]);
      }, 80);
    } else {
      // หยุดหมุน
      if (rollingRef.current) {
        clearInterval(rollingRef.current);
        rollingRef.current = null;
      }
      rotate1.stopAnimation();
      rotate2.stopAnimation();
      shake.stopAnimation();
      rotate1.setValue(0);
      rotate2.setValue(0);
      shake.setValue(0);

      if (dice[0] > 0) {
        setDisplayDice(dice);
        // Bounce เด้งเข้า
        Animated.sequence([
          Animated.timing(bounce, { toValue: 1.3, duration: 120, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
          Animated.spring(bounce, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
        ]).start();
        scale.setValue(1);
      }
    }

    return () => {
      if (rollingRef.current) {
        clearInterval(rollingRef.current);
        rollingRef.current = null;
      }
    };
  }, [rolling]);

  // อัพเดตค่าสุดท้ายเมื่อ dice เปลี่ยน (จากคนอื่นทอย)
  useEffect(() => {
    if (!rolling && dice[0] > 0) {
      setDisplayDice(dice);
      scale.setValue(1);
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1.2, duration: 100, useNativeDriver: true }),
        Animated.spring(bounce, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [dice]);

  if (displayDice[0] === 0 && displayDice[1] === 0 && !rolling) return null;

  const rot1 = rotate1.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-20deg', '0deg', '20deg'] });
  const rot2 = rotate2.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-20deg', '0deg', '20deg'] });
  const shakeX = shake.interpolate({ inputRange: [-1, 0, 1], outputRange: [-6, 0, 6] });

  const isDouble = !rolling && displayDice[0] === displayDice[1] && displayDice[0] > 0;

  return (
    <Animated.View style={[
      styles.container,
      {
        opacity: scale,
        transform: [{ scale: bounce }, { translateX: shakeX }],
      },
    ]}>
      <Die
        value={displayDice[0]}
        animStyle={{ transform: [{ rotate: rot1 }] }}
      />
      <Die
        value={displayDice[1]}
        animStyle={{ transform: [{ rotate: rot2 }] }}
      />
      <View style={styles.totalBox}>
        <Text style={styles.total}>{displayDice[0] + displayDice[1]}</Text>
        {rolling && <Text style={styles.rollingLabel}>...</Text>}
        {isDouble && <Text style={styles.doubleLabel}>DOUBLE!</Text>}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  die: {
    width: 52,
    height: 52,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 6,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  dieRow: {
    flexDirection: 'row',
    flex: 1,
  },
  dotSlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#222',
  },
  totalBox: {
    alignItems: 'center',
    minWidth: 40,
  },
  total: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rollingLabel: {
    color: '#888',
    fontSize: 12,
  },
  doubleLabel: {
    color: '#FF4444',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
