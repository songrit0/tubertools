import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';

export default function GameLog({ logs = [], players = {} }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd?.({ animated: true });
  }, [logs.length]);

  if (logs.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>💬</Text>
        <Text style={styles.headerText}>LOG</Text>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {logs.map((log, i) => (
          <LogEntry key={i} log={log} players={players} isLatest={i === logs.length - 1} />
        ))}
      </ScrollView>
    </View>
  );
}

function LogEntry({ log, players, isLatest }) {
  const fadeAnim = useRef(new Animated.Value(isLatest ? 0 : 1)).current;

  useEffect(() => {
    if (isLatest) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, []);

  const text = formatLog(log, players);
  const icon = getLogIcon(log.type);

  return (
    <Animated.View style={[styles.entry, isLatest && styles.entryLatest, { opacity: fadeAnim }]}>
      <Text style={styles.entryIcon}>{icon}</Text>
      <Text style={styles.entryText} numberOfLines={1}>{text}</Text>
    </Animated.View>
  );
}

function getLogIcon(type) {
  switch (type) {
    case 'bought': return '🏗️';
    case 'pay-rent': return '💸';
    case 'tax': return '💰';
    case 'chance': return '⭐';
    case 'go-to-jail': return '🚔';
    case 'can-buy': return '🏠';
    default: return '📋';
  }
}

function formatLog(action, players) {
  switch (action.type) {
    case 'safe': return `หยุด ${action.tileName}`;
    case 'can-buy': return `${action.tileName} ว่าง ฿${action.price}`;
    case 'bought': return `ซื้อ ${action.tileName}`;
    case 'skip-buy': return 'ข้ามไม่ซื้อ';
    case 'pay-rent': return `จ่าย ฿${action.amount} → ${players[action.to]?.name || '?'}`;
    case 'tax': return `ภาษี ฿${action.amount}`;
    case 'chance': return action.card?.text || 'โชคชะตา';
    case 'go-to-jail': return 'ไปคุก!';
    case 'jail-stay': return 'ยังอยู่ในคุก';
    case 'jail-free-double': return 'ออกจากคุก!';
    case 'own-land': return `${action.tileName} (ของตัวเอง)`;
    default: return '';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#2A2A2A',
    height: '100%',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 12,
  },
  headerText: {
    color: '#666',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 6,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  entryLatest: {
    backgroundColor: '#242424',
    borderWidth: 1,
    borderColor: '#333',
  },
  entryIcon: {
    fontSize: 11,
  },
  entryText: {
    color: '#AAA',
    fontSize: 11,
    maxWidth: 160,
  },
});
