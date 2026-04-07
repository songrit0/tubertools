import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity } from 'react-native';

const EVENT_ICONS = {
  'safe': '🏠', 'can-buy': '🏗️', 'bought': '🎉', 'skip-buy': '👋',
  'pay-rent': '💸', 'tax': '💰', 'chance': '⭐', 'go-to-jail': '🚔',
  'jail-stay': '🔒', 'jail-free-double': '🎰', 'own-land': '🏡', 'used-jail-free-card': '🎫',
};

const EVENT_COLORS = {
  'can-buy': '#22C55E', 'bought': '#22C55E', 'pay-rent': '#FF4444',
  'tax': '#FF8C00', 'chance': '#9333EA', 'go-to-jail': '#FF4444', 'jail-free-double': '#22C55E',
};

export default function EventPopup({ action, players, onDismiss }) {
  const slideX = useRef(new Animated.Value(300)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (action) {
      // Slide in from right
      Animated.parallel([
        Animated.spring(slideX, { toValue: 0, friction: 8, tension: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      // Auto dismiss after 3s
      const timer = setTimeout(() => dismiss(), 3000);
      return () => clearTimeout(timer);
    } else {
      slideX.setValue(300);
      opacity.setValue(0);
    }
  }, [action]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: 300, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  };

  if (!action) return null;

  const icon = EVENT_ICONS[action.type] || '📋';
  const color = EVENT_COLORS[action.type] || '#FFD700';
  const title = getTitle(action.type);
  const text = formatText(action, players);
  const amount = getAmount(action);

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateX: slideX }] }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={dismiss} style={[styles.toast, { borderLeftColor: color }]}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.body}>
          <Text style={[styles.title, { color }]} numberOfLines={1}>{title}</Text>
          <Text style={styles.text} numberOfLines={2}>{text}</Text>
        </View>
        {amount !== null && (
          <Text style={[styles.amount, amount > 0 ? styles.amountPlus : styles.amountMinus]}>
            {amount > 0 ? '+' : ''}฿{amount}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function getTitle(type) {
  const map = {
    'can-buy': 'ที่ดินว่าง!', 'bought': 'ซื้อสำเร็จ!', 'pay-rent': 'จ่ายค่าเช่า',
    'tax': 'ภาษี', 'chance': 'โชคชะตา', 'go-to-jail': 'ไปคุก!',
    'jail-stay': 'ยังอยู่ในคุก', 'jail-free-double': 'ออกจากคุก!',
    'safe': 'ปลอดภัย', 'own-land': 'ที่ดินตัวเอง',
  };
  return map[type] || 'เหตุการณ์';
}

function formatText(action, players) {
  switch (action.type) {
    case 'safe': return `หยุดที่ ${action.tileName}`;
    case 'can-buy': return `${action.tileName} ราคา ฿${action.price}`;
    case 'bought': return `ซื้อ ${action.tileName} แล้ว!`;
    case 'skip-buy': return 'ข้ามไม่ซื้อ';
    case 'pay-rent': return `${action.tileName} → ${players?.[action.to]?.name || '?'}`;
    case 'tax': return `จ่ายภาษี`;
    case 'chance': return action.card?.text || 'โชคชะตา';
    case 'go-to-jail': return 'ถูกจับไปคุก!';
    case 'jail-stay': return `ทอย ${action.dice?.join(',')} ไม่ดับเบิ้ล`;
    case 'jail-free-double': return `ดับเบิ้ล ${action.dice?.[0]}!`;
    case 'own-land': return `${action.tileName}`;
    default: return '';
  }
}

function getAmount(action) {
  if (action.type === 'pay-rent') return -(action.amount || 0);
  if (action.type === 'tax') return -(action.amount || 0);
  if (action.type === 'chance' && action.card?.amount) return action.card.amount;
  if (action.type === 'can-buy') return -(action.price || 0);
  return null;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 12,
    zIndex: 300,
    maxWidth: 320,
    minWidth: 200,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,15,20,0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  icon: {
    fontSize: 24,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  text: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  amount: {
    fontSize: 16,
    fontWeight: '900',
  },
  amountPlus: {
    color: '#22C55E',
  },
  amountMinus: {
    color: '#FF4444',
  },
});
