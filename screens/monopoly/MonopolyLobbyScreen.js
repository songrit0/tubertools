import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, FlatList, Alert, ActivityIndicator,
  Animated, Easing, Share, Clipboard, RefreshControl, ScrollView,
} from 'react-native';
import { ArrowLeft, Play, LogOut, Users, Search, Zap, RefreshCw, Share2, Copy, Clock, Globe } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { PLAYER_COLORS } from '../../data/monopolyBoard';
import {
  createRoom, joinRoom, subscribeToRoom, startGame, leaveRoom, deleteRoom,
  getOpenRooms, quickJoin,
} from '../../services/monopolyService';

const AVATARS = ['👑', '⚡', '🔥', '💎', '🎮', '🎯', '🦊', '🐉', '🌟', '🎪', '🚀', '🎭'];

export default function MonopolyLobbyScreen({ navigation }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join' | 'browse'
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [roomCode, setRoomCode] = useState('');
  const [room, setRoom] = useState(null);
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [myRoomCode, setMyRoomCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openRooms, setOpenRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Pulse animation for quick join
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Subscribe to room updates
  useEffect(() => {
    if (!myRoomCode) return;
    const unsub = subscribeToRoom(myRoomCode, (data) => {
      if (!data) {
        setRoom(null);
        setMyRoomCode(null);
        setMyPlayerId(null);
        setMode(null);
        return;
      }
      setRoom(data);
      if (data.status === 'playing') {
        navigation.replace('MonopolyGame', {
          roomCode: myRoomCode,
          playerId: myPlayerId,
        });
      }
    });
    return unsub;
  }, [myRoomCode, myPlayerId]);

  // Fetch open rooms when browse mode
  const fetchOpenRooms = useCallback(async () => {
    setRefreshing(true);
    try {
      const rooms = await getOpenRooms();
      setOpenRooms(rooms);
    } catch (e) {
      console.log('Error fetching rooms:', e);
    }
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (mode === 'browse') fetchOpenRooms();
  }, [mode]);

  const handleCreate = async () => {
    if (!playerName.trim()) return Alert.alert('', 'ใส่ชื่อก่อน');
    setLoading(true);
    try {
      const { roomCode: code, playerId } = await createRoom(playerName.trim());
      setMyRoomCode(code);
      setMyPlayerId(playerId);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return Alert.alert('', 'ใส่ชื่อก่อน');
    if (!roomCode.trim()) return Alert.alert('', 'ใส่รหัสห้อง');
    setLoading(true);
    try {
      const { roomCode: code, playerId } = await joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
      setMyRoomCode(code);
      setMyPlayerId(playerId);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleJoinRoom = async (code) => {
    if (!playerName.trim()) return Alert.alert('', 'ใส่ชื่อก่อน');
    setLoading(true);
    try {
      const { roomCode: rCode, playerId } = await joinRoom(code, playerName.trim());
      setMyRoomCode(rCode);
      setMyPlayerId(playerId);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleQuickJoin = async () => {
    if (!playerName.trim()) return Alert.alert('', 'ใส่ชื่อก่อน');
    setLoading(true);
    try {
      const { roomCode: code, playerId } = await quickJoin(playerName.trim());
      setMyRoomCode(code);
      setMyPlayerId(playerId);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleStart = async () => {
    try {
      await startGame(myRoomCode);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveRoom(myRoomCode, myPlayerId);
      setRoom(null);
      setMyRoomCode(null);
      setMyPlayerId(null);
      setMode(null);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleShareRoom = async () => {
    try {
      await Share.share({ message: `มาเล่นเกมเศรษฐีกัน!\nรหัสห้อง: ${myRoomCode}` });
    } catch (_) {}
  };

  const handleCopyCode = () => {
    if (Clipboard.setString) Clipboard.setString(myRoomCode);
    Alert.alert('', 'คัดลอกรหัสห้องแล้ว!');
  };

  const requireName = (cb) => {
    if (!playerName.trim()) { Alert.alert('', 'ใส่ชื่อก่อน'); return; }
    cb();
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  // ========== ในห้องแล้ว ==========
  if (room && myRoomCode) {
    const players = room.players ? Object.entries(room.players) : [];
    const isHost = room.hostId === myPlayerId;

    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={handleLeave} style={s.headerBtn}>
            <LogOut color="#FF4444" size={20} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>ห้องรอ</Text>
          <TouchableOpacity onPress={handleShareRoom} style={s.headerBtn}>
            <Share2 color="#FFD700" size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content}>
          {/* Room Code */}
          <View style={s.codeBox}>
            <Text style={s.codeLabel}>รหัสห้อง</Text>
            <View style={s.codeRow}>
              <Text style={s.codeText}>{myRoomCode}</Text>
              <TouchableOpacity onPress={handleCopyCode} style={s.copyBtn}>
                <Copy color="#FFD700" size={18} />
              </TouchableOpacity>
            </View>
            <Text style={s.codeHint}>แชร์รหัสนี้ให้เพื่อน</Text>
          </View>

          {/* Players */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Users color="#888" size={16} />
              <Text style={s.sectionTitle}>ผู้เล่น ({players.length}/4)</Text>
            </View>
            {players.map(([id, p], i) => (
              <View key={id} style={[s.playerRow, id === myPlayerId && s.playerRowMe]}>
                <View style={[s.playerAvatar, { backgroundColor: p.color || PLAYER_COLORS[i] }]}>
                  <Text style={s.playerAvatarText}>{AVATARS[i % AVATARS.length]}</Text>
                </View>
                <Text style={s.playerName}>{p.name}</Text>
                {id === room.hostId && <Text style={s.hostBadge}>HOST</Text>}
                {id === myPlayerId && <Text style={s.meBadge}>คุณ</Text>}
              </View>
            ))}
            {/* Empty slots */}
            {Array(4 - players.length).fill(0).map((_, i) => (
              <View key={`empty-${i}`} style={s.playerRowEmpty}>
                <View style={s.playerAvatarEmpty}>
                  <Text style={{ fontSize: 16, opacity: 0.3 }}>?</Text>
                </View>
                <Text style={s.emptyText}>รอผู้เล่น...</Text>
              </View>
            ))}
          </View>

          {/* Start Button */}
          {isHost && (
            <TouchableOpacity
              style={[s.startBtn, players.length < 2 && s.btnDisabled]}
              onPress={handleStart}
              disabled={players.length < 2}
            >
              <Play color="#FFF" size={20} />
              <Text style={s.startBtnText}>เริ่มเกม</Text>
            </TouchableOpacity>
          )}

          {!isHost && (
            <View style={s.waitingBox}>
              <ActivityIndicator color={Colors.accent} />
              <Text style={s.waitingText}>รอ Host เริ่มเกม...</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ========== หน้าหลัก ==========
  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => (mode ? setMode(null) : navigation.goBack())} style={s.headerBtn}>
          <ArrowLeft color="#FFF" size={22} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {!mode ? 'เกมเศรษฐี' : mode === 'create' ? 'สร้างห้อง' : mode === 'join' ? 'เข้าร่วมห้อง' : 'ค้นหาห้อง'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {!mode ? (
          <>
            {/* Title */}
            <Text style={s.lobbyEmoji}>🎲</Text>
            <Text style={s.lobbyTitle}>เกมเศรษฐี</Text>
            <Text style={s.lobbySubtitle}>Monopoly Online</Text>

            {/* Name Input */}
            <Text style={s.label}>ชื่อผู้เล่น</Text>
            <TextInput
              style={s.input}
              placeholder="ใส่ชื่อของคุณ..."
              placeholderTextColor="#555"
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={12}
            />

            {/* Avatar Select */}
            <Text style={s.label}>เลือกตัวละคร</Text>
            <View style={s.avatarGrid}>
              {AVATARS.map((av, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.avatarItem, selectedAvatar === i && s.avatarSelected]}
                  onPress={() => setSelectedAvatar(i)}
                >
                  <Text style={s.avatarEmoji}>{av}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Join — big prominent button */}
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={s.quickJoinBtn} onPress={() => requireName(handleQuickJoin)} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Zap color="#000" size={22} fill="#000" />
                    <Text style={s.quickJoinText}>เล่นเลย!</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
            <Text style={s.quickJoinHint}>เข้าห้องอัตโนมัติ หรือสร้างใหม่ถ้าไม่มีห้องว่าง</Text>

            {/* Action Buttons */}
            <View style={s.actionRow}>
              <TouchableOpacity style={s.actionBtn} onPress={() => requireName(() => setMode('create'))}>
                <View style={[s.actionIcon, { backgroundColor: '#FFD70020' }]}>
                  <Text style={{ fontSize: 20 }}>🏠</Text>
                </View>
                <Text style={s.actionBtnText}>สร้างห้อง</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.actionBtn} onPress={() => requireName(() => setMode('join'))}>
                <View style={[s.actionIcon, { backgroundColor: '#44AAFF20' }]}>
                  <Text style={{ fontSize: 20 }}>🔑</Text>
                </View>
                <Text style={s.actionBtnText}>ใส่รหัส</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.actionBtn} onPress={() => requireName(() => setMode('browse'))}>
                <View style={[s.actionIcon, { backgroundColor: '#44DD4420' }]}>
                  <Globe color="#44DD44" size={20} />
                </View>
                <Text style={s.actionBtnText}>ค้นหาห้อง</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : mode === 'create' ? (
          <>
            <View style={s.modeHeader}>
              <Text style={{ fontSize: 40 }}>🏠</Text>
              <Text style={s.modeTitle}>สร้างห้องใหม่</Text>
              <Text style={s.modeSubtitle}>สร้างห้องแล้วรอเพื่อนเข้าร่วม</Text>
            </View>

            <View style={s.previewCard}>
              <Text style={s.previewLabel}>ผู้เล่น</Text>
              <View style={s.previewRow}>
                <View style={[s.playerAvatar, { backgroundColor: PLAYER_COLORS[0] }]}>
                  <Text style={s.playerAvatarText}>{AVATARS[selectedAvatar]}</Text>
                </View>
                <Text style={s.previewName}>{playerName || '...'}</Text>
                <Text style={s.hostBadge}>HOST</Text>
              </View>
            </View>

            <TouchableOpacity style={s.primaryBtn} onPress={handleCreate} disabled={loading}>
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.primaryBtnText}>สร้างห้อง</Text>}
            </TouchableOpacity>
          </>
        ) : mode === 'join' ? (
          <>
            <View style={s.modeHeader}>
              <Text style={{ fontSize: 40 }}>🔑</Text>
              <Text style={s.modeTitle}>เข้าร่วมด้วยรหัส</Text>
              <Text style={s.modeSubtitle}>ใส่รหัสห้อง 6 ตัวอักษร</Text>
            </View>

            <TextInput
              style={s.codeInput}
              placeholder="A B C D E F"
              placeholderTextColor="#444"
              value={roomCode}
              onChangeText={setRoomCode}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[s.primaryBtn, !roomCode.trim() && s.btnDisabled]}
              onPress={handleJoin}
              disabled={loading || !roomCode.trim()}
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text style={s.primaryBtnText}>เข้าร่วม</Text>}
            </TouchableOpacity>
          </>
        ) : mode === 'browse' ? (
          <>
            <View style={s.modeHeader}>
              <Text style={{ fontSize: 40 }}>🌍</Text>
              <Text style={s.modeTitle}>ห้องที่เปิดอยู่</Text>
              <Text style={s.modeSubtitle}>เลือกห้องที่ต้องการเข้าร่วม</Text>
            </View>

            <TouchableOpacity style={s.refreshBtn} onPress={fetchOpenRooms}>
              <RefreshCw color="#888" size={16} />
              <Text style={s.refreshText}>รีเฟรช</Text>
            </TouchableOpacity>

            {refreshing ? (
              <ActivityIndicator color={Colors.accent} style={{ marginTop: 30 }} />
            ) : openRooms.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 40 }}>😴</Text>
                <Text style={s.emptyStateTitle}>ไม่มีห้องว่าง</Text>
                <Text style={s.emptyStateText}>ลองสร้างห้องใหม่แทน</Text>
                <TouchableOpacity style={s.secondaryBtn} onPress={() => setMode('create')}>
                  <Text style={s.secondaryBtnText}>สร้างห้อง</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.roomList}>
                {openRooms.map((r) => (
                  <TouchableOpacity
                    key={r.roomCode}
                    style={s.roomCard}
                    onPress={() => handleJoinRoom(r.roomCode)}
                    disabled={loading}
                  >
                    <View style={s.roomCardLeft}>
                      <Text style={s.roomCardCode}>{r.roomCode}</Text>
                      <Text style={s.roomCardHost}>Host: {r.hostName}</Text>
                    </View>
                    <View style={s.roomCardRight}>
                      <View style={s.roomCardPlayers}>
                        <Users color="#888" size={14} />
                        <Text style={s.roomCardCount}>{r.playerCount}/4</Text>
                      </View>
                      {/* Player slot dots */}
                      <View style={s.slotDots}>
                        {Array(4).fill(0).map((_, i) => (
                          <View key={i} style={[s.slotDot, i < r.playerCount ? { backgroundColor: PLAYER_COLORS[i] } : { backgroundColor: '#333' }]} />
                        ))}
                      </View>
                      <View style={s.roomCardTime}>
                        <Clock color="#555" size={10} />
                        <Text style={s.roomCardTimeText}>{timeAgo(r.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={s.joinArrow}>
                      <Text style={s.joinArrowText}>JOIN</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A24',
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, maxWidth: 500, alignSelf: 'center', width: '100%' },

  // Main lobby
  lobbyEmoji: { fontSize: 50, textAlign: 'center', marginBottom: 4 },
  lobbyTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  lobbySubtitle: { color: '#555', fontSize: 13, textAlign: 'center', marginBottom: 24, marginTop: 2, letterSpacing: 2 },

  label: { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: '#14141E', color: '#FFF', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16,
    borderWidth: 1.5, borderColor: '#2A2A3A', marginBottom: 16,
  },

  // Avatar grid
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, justifyContent: 'center',
  },
  avatarItem: {
    width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#14141E', borderWidth: 2, borderColor: '#2A2A3A',
  },
  avatarSelected: { borderColor: '#FFD700', backgroundColor: '#FFD70015' },
  avatarEmoji: { fontSize: 22 },

  // Quick Join
  quickJoinBtn: {
    backgroundColor: '#FFD700', borderRadius: 16, paddingVertical: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    shadowColor: '#FFD700', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  quickJoinText: { color: '#000', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  quickJoinHint: { color: '#555', fontSize: 10, textAlign: 'center', marginTop: 8, marginBottom: 24 },

  // Action row
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1, alignItems: 'center', backgroundColor: '#14141E',
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A2A3A',
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  actionBtnText: { color: '#CCC', fontSize: 11, fontWeight: '700' },

  // Mode header
  modeHeader: { alignItems: 'center', marginBottom: 24 },
  modeTitle: { color: '#FFF', fontSize: 22, fontWeight: '900', marginTop: 8 },
  modeSubtitle: { color: '#666', fontSize: 13, marginTop: 4 },

  // Code input (big style)
  codeInput: {
    backgroundColor: '#14141E', color: '#FFD700', borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 20, fontSize: 28, fontWeight: '900',
    textAlign: 'center', letterSpacing: 10,
    borderWidth: 2, borderColor: '#2A2A3A', marginBottom: 20,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: '#FFD700', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 12,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  secondaryBtn: {
    borderWidth: 1.5, borderColor: '#FFD700', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 16, paddingHorizontal: 30,
  },
  secondaryBtnText: { color: '#FFD700', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },

  // Preview card
  previewCard: {
    backgroundColor: '#14141E', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#2A2A3A', marginBottom: 20,
  },
  previewLabel: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewName: { color: '#FFF', fontSize: 16, fontWeight: '700', flex: 1 },

  // Browse / Room list
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 12,
    padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)',
  },
  refreshText: { color: '#888', fontSize: 11, fontWeight: '600' },

  roomList: { gap: 10 },
  roomCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#14141E', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#2A2A3A',
  },
  roomCardLeft: { flex: 1 },
  roomCardCode: { color: '#FFD700', fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  roomCardHost: { color: '#777', fontSize: 11, marginTop: 2 },
  roomCardRight: { alignItems: 'flex-end', marginRight: 12 },
  roomCardPlayers: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roomCardCount: { color: '#AAA', fontSize: 12, fontWeight: '700' },
  slotDots: { flexDirection: 'row', gap: 4, marginTop: 6 },
  slotDot: { width: 10, height: 10, borderRadius: 5 },
  roomCardTime: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  roomCardTimeText: { color: '#555', fontSize: 9 },
  joinArrow: {
    backgroundColor: '#FFD70020', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  joinArrowText: { color: '#FFD700', fontSize: 11, fontWeight: '900' },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyStateTitle: { color: '#888', fontSize: 16, fontWeight: '700', marginTop: 8 },
  emptyStateText: { color: '#555', fontSize: 12, marginTop: 4 },

  // In-room
  codeBox: {
    backgroundColor: '#14141E', borderRadius: 18, padding: 20,
    alignItems: 'center', marginBottom: 24, borderWidth: 1.5, borderColor: '#2A2A3A',
  },
  codeLabel: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeText: { color: '#FFD700', fontSize: 36, fontWeight: '900', letterSpacing: 8 },
  copyBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,215,0,0.1)' },
  codeHint: { color: '#444', fontSize: 10, marginTop: 8 },

  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  playerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#14141E', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 6, borderWidth: 1, borderColor: '#2A2A3A',
  },
  playerRowMe: { borderColor: '#FFD70060' },
  playerRowEmpty: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0E0E16', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 6, borderWidth: 1, borderColor: '#1A1A24', borderStyle: 'dashed',
  },
  playerAvatar: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
  },
  playerAvatarText: { fontSize: 18 },
  playerAvatarEmpty: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1A1A24', borderWidth: 1, borderColor: '#2A2A3A',
  },
  playerName: { color: '#FFF', fontSize: 15, fontWeight: '600', flex: 1 },
  emptyText: { color: '#333', fontSize: 13, flex: 1 },
  hostBadge: {
    backgroundColor: '#FFD70020', color: '#FFD700',
    fontSize: 9, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, letterSpacing: 1,
  },
  meBadge: {
    backgroundColor: '#44AAFF20', color: '#44AAFF',
    fontSize: 9, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },

  startBtn: {
    backgroundColor: '#22C55E', borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  startBtnText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 1 },

  waitingBox: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    paddingVertical: 20,
  },
  waitingText: { color: '#888', fontSize: 14 },
});
