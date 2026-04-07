import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList,
} from 'react-native';
import { Trophy, Home } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { subscribeToRoom, deleteRoom } from '../../services/monopolyService';
import { BOARD } from '../../data/monopolyBoard';

export default function MonopolyResultScreen({ route, navigation }) {
  const { roomCode, playerId } = route.params;
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const unsub = subscribeToRoom(roomCode, (data) => {
      if (data) setRoom(data);
    });
    return unsub;
  }, [roomCode]);

  if (!room) return null;

  const players = room.players || {};
  const ranked = Object.entries(players)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => {
      if (a.status === 'alive' && b.status !== 'alive') return -1;
      if (a.status !== 'alive' && b.status === 'alive') return 1;
      return b.money - a.money;
    });

  const winner = ranked[0];
  const isHost = room.hostId === playerId;

  // Count properties per player
  const propCount = {};
  if (room.properties) {
    Object.values(room.properties).forEach((p) => {
      if (p) propCount[p.owner] = (propCount[p.owner] || 0) + 1;
    });
  }

  const handleGoHome = async () => {
    if (isHost) {
      await deleteRoom(roomCode);
    }
    navigation.replace('MonopolyLobby');
  };

  const medals = ['🥇', '🥈', '🥉', '4'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Trophy */}
        <View style={styles.trophySection}>
          <Text style={styles.trophyEmoji}>🏆</Text>
          <Text style={styles.winnerName}>{winner?.name}</Text>
          <Text style={styles.winnerLabel}>ผู้ชนะ!</Text>
          <Text style={styles.winnerMoney}>฿{winner?.money}</Text>
        </View>

        {/* Rankings */}
        <View style={styles.rankSection}>
          <Text style={styles.sectionTitle}>อันดับ</Text>
          {ranked.map((p, i) => (
            <View key={p.id} style={[styles.rankRow, i === 0 && styles.rankRowFirst]}>
              <Text style={styles.medal}>{medals[i] || `${i + 1}`}</Text>
              <View style={[styles.rankDot, { backgroundColor: p.color }]} />
              <View style={styles.rankInfo}>
                <Text style={[styles.rankName, p.id === playerId && styles.rankNameMe]}>{p.name}</Text>
                <Text style={styles.rankSub}>
                  {p.status === 'bankrupt' ? 'ล้มละลาย' : `ที่ดิน ${propCount[p.id] || 0} แปลง`}
                </Text>
              </View>
              <Text style={styles.rankMoney}>฿{p.money}</Text>
            </View>
          ))}
        </View>

        {/* Round info */}
        <Text style={styles.roundInfo}>จบเกมในรอบที่ {room.currentRound || '?'}</Text>

        {/* Back */}
        <TouchableOpacity style={styles.homeBtn} onPress={handleGoHome}>
          <Home color="#FFF" size={18} />
          <Text style={styles.homeBtnText}>กลับหน้าหลัก</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 30, maxWidth: 500, alignSelf: 'center', width: '100%' },

  trophySection: { alignItems: 'center', marginBottom: 32 },
  trophyEmoji: { fontSize: 60, marginBottom: 8 },
  winnerName: { color: '#FFD700', fontSize: 28, fontWeight: 'bold' },
  winnerLabel: { color: '#888', fontSize: 14, marginTop: 2 },
  winnerMoney: { color: '#FFD700', fontSize: 20, fontWeight: 'bold', marginTop: 4 },

  sectionTitle: { color: '#888', fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },

  rankSection: { marginBottom: 24 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1E1E1E', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 6,
  },
  rankRowFirst: { borderWidth: 1, borderColor: '#FFD700', backgroundColor: '#2A2A1A' },
  medal: { fontSize: 20, width: 30, textAlign: 'center' },
  rankDot: { width: 12, height: 12, borderRadius: 6 },
  rankInfo: { flex: 1 },
  rankName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  rankNameMe: { color: '#44AAFF' },
  rankSub: { color: '#666', fontSize: 11, marginTop: 2 },
  rankMoney: { color: '#FFD700', fontSize: 16, fontWeight: 'bold' },

  roundInfo: { color: '#555', fontSize: 12, textAlign: 'center', marginBottom: 20 },

  homeBtn: {
    backgroundColor: '#333', borderRadius: 12, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  homeBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
