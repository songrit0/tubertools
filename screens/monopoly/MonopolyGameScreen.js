import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Modal, Alert, Dimensions, StatusBar, ScrollView,
} from 'react-native';
import { LogOut, Settings, ArrowUp, MessageCircle, Info } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { BOARD } from '../../data/monopolyBoard';
import BoardView from '../../components/monopoly/BoardView';
import DiceView from '../../components/monopoly/DiceView';
import PropertyCard from '../../components/monopoly/PropertyCard';
import PlayerPanel from '../../components/monopoly/PlayerPanel';
import RollButton from '../../components/monopoly/RollButton';
import EventPopup from '../../components/monopoly/EventPopup';
import GameLog from '../../components/monopoly/GameLog';
import {
  subscribeToRoom, rollDice, buyProperty, skipBuy,
  endTurn, upgradeProperty, useJailFreeCard, leaveRoom,
} from '../../services/monopolyService';

function rankPlayers(players) {
  if (!players) return [];
  return Object.entries(players)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => {
      if (a.status === 'alive' && b.status !== 'alive') return -1;
      if (a.status !== 'alive' && b.status === 'alive') return 1;
      return b.money - a.money;
    });
}

export default function MonopolyGameScreen({ route, navigation }) {
  const { roomCode, playerId } = route.params;
  const [room, setRoom] = useState(null);
  const [selectedTile, setSelectedTile] = useState(null);
  const [actionLog, setActionLog] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [showEvent, setShowEvent] = useState(null);

  const [animatingPlayer, setAnimatingPlayer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevPositionsRef = useRef({});
  const prevActionRef = useRef(null);
  const roomEverLoaded = useRef(false);
  const pendingRoomRef = useRef(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const unsub = subscribeToRoom(roomCode, (data) => {
      if (!data) { navigation.replace('MonopolyLobby'); return; }

      let shouldAnimate = false;
      let animData = null;

      if (data.players) {
        const prev = prevPositionsRef.current;
        const hasInit = Object.keys(prev).length > 0;

        if (hasInit && data.status === 'playing') {
          for (const [pid, p] of Object.entries(data.players)) {
            const oldPos = Number(prev[pid]);
            const newPos = Number(p.position);

            if (oldPos !== undefined && oldPos !== newPos && p.status !== 'bankrupt') {
              console.log(`[ANIM-DETECT] 🔥 ${p.name}: ${oldPos} -> ${newPos}`);
              animData = { id: pid, color: p.color, from: oldPos, to: newPos };
              shouldAnimate = true;
              break;
            }
          }
        }
      }

      if (data.lastAction && data.lastAction !== prevActionRef.current) {
        const t = data.lastAction.type;
        if (['pay-rent', 'tax', 'chance', 'go-to-jail', 'jail-free-double', 'can-buy', 'bought'].includes(t)) {
          // ถ้ากำลัง animate อยู่ ชะลอ event popup ไว้ก่อน
          if (!shouldAnimate && !isAnimatingRef.current) {
            setShowEvent(data.lastAction);
          }
        }
        prevActionRef.current = data.lastAction;
        setActionLog((prev) => [...prev, data.lastAction].slice(-30));
      }

      if (shouldAnimate && animData) {
        console.log(`[ANIM-EXEC] 🚀 STARTING ANIMATION...`, animData);
        isAnimatingRef.current = true;
        pendingRoomRef.current = data;

        const tempData = JSON.parse(JSON.stringify(data));
        if (tempData.players[animData.id]) {
          tempData.players[animData.id].position = animData.from;
        }

        setAnimatingPlayer(animData);
        setIsAnimating(true);
        setRoom(tempData);
      } else if (isAnimatingRef.current) {
        pendingRoomRef.current = data;
      } else {
        setRoom(data);
      }

      // บันทึก positions ไว้เทียบในรอบหน้า (ย้ายมาไว้หลังสุด)
      if (data.players) {
        const np = {};
        for (const [pid, p] of Object.entries(data.players)) np[pid] = p.position;
        prevPositionsRef.current = np;
      }

      roomEverLoaded.current = true;
      if (data.status === 'ended' && !isAnimatingRef.current) {
        navigation.replace('MonopolyResult', { roomCode, playerId });
      }
    });
    return unsub;
  }, [roomCode]);

  const handleAnimationDone = useCallback(() => {
    setAnimatingPlayer(null);
    setIsAnimating(false);
    isAnimatingRef.current = false;
    // Apply pending room data ที่ถูก defer ไว้
    if (pendingRoomRef.current) {
      const pending = pendingRoomRef.current;
      pendingRoomRef.current = null;
      setRoom(pending);
      // แสดง event popup ที่ค้างไว้
      if (pending.lastAction) {
        const t = pending.lastAction.type;
        if (['pay-rent', 'tax', 'chance', 'go-to-jail', 'jail-free-double', 'can-buy', 'bought'].includes(t)) {
          setShowEvent(pending.lastAction);
        }
      }
      if (pending.status === 'ended') {
        navigation.replace('MonopolyResult', { roomCode, playerId });
      }
    }
  }, [roomCode, playerId, navigation]);

  const players = room?.players || {};
  const me = players[playerId];
  const isMyTurn = room?.currentTurn === playerId;
  const phase = room?.turnPhase;
  const currentTurnPlayer = players[room?.currentTurn];
  const ranked = rankPlayers(players);

  if (!roomEverLoaded.current) {
    return <View style={s.loadingWrap}><Text style={s.loadingText}>LOADING...</Text></View>;
  }
  if (!room) return null;

  const playerEntries = Object.entries(players);
  const getCorner = (pid) => {
    if (pid === playerId) return 'bottomRight';
    const others = playerEntries.filter(([id]) => id !== playerId);
    const idx = others.findIndex(([id]) => id === pid);
    return ['topLeft', 'topRight', 'bottomLeft'][idx] || 'topLeft';
  };

  const handleRoll = async (power = 0) => {
    try { setRolling(true); await new Promise(r => setTimeout(r, 800)); await rollDice(roomCode, playerId, power); } catch (e) { Alert.alert('Error', e.message); }
    setRolling(false);
  };
  const handleBuy = async (pos) => { try { await buyProperty(roomCode, playerId, pos); } catch (e) { Alert.alert('Error', e.message); } };
  const handleSkipBuy = async () => { try { await skipBuy(roomCode); } catch (e) { Alert.alert('Error', e.message); } };
  const handleEndTurn = async () => { try { await endTurn(roomCode); } catch (e) { Alert.alert('Error', e.message); } };
  const handleUpgrade = async (pos) => { try { await upgradeProperty(roomCode, playerId, pos); } catch (e) { Alert.alert('Error', e.message); } };
  const handleUseJailFree = async () => { try { await useJailFreeCard(roomCode, playerId); } catch (e) { Alert.alert('Error', e.message); } };
  const handleLeave = () => {
    Alert.alert('LEAVE?', 'You will go bankrupt.', [
      { text: 'CANCEL' },
      { text: 'LEAVE', style: 'destructive', onPress: async () => { await leaveRoom(roomCode, playerId); navigation.replace('MonopolyLobby'); } },
    ]);
  };

  const myProperties = room.properties ? Object.entries(room.properties).filter(([, p]) => p?.owner === playerId) : [];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={s.safe}>

        {/* === TOP BAR === */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={handleLeave} style={s.topBtn}>
            <LogOut color="#FF4444" size={16} />
          </TouchableOpacity>
          <View style={s.topCenter}>
            <Text style={s.roundText}>ROUND {room.currentRound || 1}</Text>
            <Text style={s.roomCode}>{roomCode}</Text>
          </View>
          <TouchableOpacity style={s.topBtn}>
            <Settings color="#888" size={16} />
          </TouchableOpacity>
        </View>

        {/* === TURN BAR === */}
        <View style={[s.turnBar, isMyTurn && s.turnBarActive]}>
          <View style={[s.turnDot, { backgroundColor: currentTurnPlayer?.color || '#FFF' }]} />
          <Text style={s.turnText}>
            {isMyTurn ? 'YOUR TURN' : `${currentTurnPlayer?.name?.toUpperCase() || '...'}'S TURN`}
          </Text>
          {isAnimating && <Text style={s.animLabel}>MOVING...</Text>}
          {me?.doubleToken && !isAnimating && <Text style={s.doubleTokenLabel}>⚡x2</Text>}
        </View>

        {/* === BOARD (responsive, fits screen) === */}
        <View style={s.boardArea}>
          <BoardView
            players={players}
            properties={room.properties || {}}
            currentPlayerId={playerId}
            onTilePress={setSelectedTile}
            animatingPlayer={animatingPlayer}
            onAnimationDone={handleAnimationDone}
          />

          {/* Player panels overlay */}
          {playerEntries.map(([pid, p], index) => {
            const corner = getCorner(pid);
            const posStyle = pid === playerId ? s.panelBR
              : corner === 'topLeft' ? s.panelTL
                : corner === 'topRight' ? s.panelTR
                  : s.panelBL;
            return (
              <View key={pid} style={[s.panelWrap, posStyle]}>
                <PlayerPanel
                  player={p} playerId={pid}
                  rank={ranked.findIndex(r => r.id === pid)}
                  isCurrentTurn={room.currentTurn === pid}
                  isMe={pid === playerId}
                  playerIndex={index}
                  properties={room.properties}
                  corner={corner}
                />
              </View>
            );
          })}

          {/* === CENTER CONTROLS (inside board) === */}
          <View style={s.centerOverlay} pointerEvents="box-none">
            {/* Dice */}
            <DiceView dice={room.dice || [0, 0]} rolling={rolling} lastRoll={room.lastRoll} />

            {/* Roll */}
            {isMyTurn && phase === 'roll' && !isAnimating && (
              <View style={s.rollRow}>
                {me?.status === 'jail' && me?.jailFreeCard && (
                  <TouchableOpacity style={s.jailBtn} onPress={handleUseJailFree}>
                    <Text style={s.jailBtnText}>FREE PASS</Text>
                  </TouchableOpacity>
                )}
                <RollButton onRoll={handleRoll} disabled={false} rolling={rolling} hasDoubleToken={me?.doubleToken || false} />
              </View>
            )}

            {/* Buy decision */}
            {isMyTurn && phase === 'buy-decision' && room.lastAction && !isAnimating && (
              <View style={s.buyCard}>
                <Text style={s.buyTitle}>{room.lastAction.tileName}</Text>
                <Text style={s.buyPrice}>฿{room.lastAction.price}</Text>
                <View style={s.buyBtns}>
                  <TouchableOpacity style={s.investBtn} onPress={() => handleBuy(room.lastAction.position)}>
                    <Text style={s.investBtnText}>INVEST</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.skipBtn} onPress={handleSkipBuy}>
                    <Text style={s.skipBtnText}>SKIP</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* End turn */}
            {isMyTurn && phase === 'ended' && !isAnimating && (
              <TouchableOpacity style={s.endBtn} onPress={handleEndTurn}>
                <Text style={s.endBtnText}>END TURN →</Text>
              </TouchableOpacity>
            )}

            {/* Waiting */}
            {!isMyTurn && !isAnimating && (
              <Text style={s.waitText}>Waiting...</Text>
            )}
          </View>

          {/* My properties bar (bottom of board) */}
          {myProperties.length > 0 && (
            <View style={s.propsOverlay}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.propsRow}>
                {myProperties.map(([pos, prop]) => {
                  const tile = BOARD[parseInt(pos)];
                  return (
                    <TouchableOpacity key={pos} style={[s.propChip, { borderColor: tile?.color || '#333' }]} onPress={() => handleUpgrade(parseInt(pos))}>
                      <View style={[s.propDot, { backgroundColor: tile?.color }]} />
                      <Text style={s.propLv}>L{(prop.level || 0) + 1}</Text>
                      {prop.level < 3 && <ArrowUp color="#00E5FF" size={10} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* === BOTTOM LOG === */}
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.chatBtn}>
            <MessageCircle color="#888" size={18} />
          </TouchableOpacity>
          <View style={s.logWrap}>
            <GameLog logs={actionLog} players={players} />
          </View>
        </View>

      </SafeAreaView>

      {/* Event popup */}
      {showEvent && <EventPopup action={showEvent} players={players} onDismiss={() => setShowEvent(null)} />}

      {/* Tile detail modal */}
      <Modal visible={!!selectedTile} transparent animationType="fade" onRequestClose={() => setSelectedTile(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setSelectedTile(null)}>
          <View style={s.modalBox}>
            {selectedTile && (
              <>
                <Text style={s.modalEmoji}>{selectedTile.emoji || '🏛️'}</Text>
                <Text style={s.modalTitle}>{selectedTile.name}</Text>
                <Text style={s.modalType}>{selectedTile.type.toUpperCase()}</Text>
                {selectedTile.type === 'land' && (
                  <PropertyCard position={selectedTile.position} property={room.properties?.[selectedTile.position]} />
                )}
                {selectedTile.type === 'land' && room.properties?.[selectedTile.position] && (
                  <View style={s.ownerRow}>
                    <View style={[s.ownerDot, { backgroundColor: players[room.properties[selectedTile.position].owner]?.color }]} />
                    <Text style={s.ownerName}>{players[room.properties[selectedTile.position].owner]?.name || '?'}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const { width: SCREEN_W } = Dimensions.get('window');

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060610' },
  loadingWrap: { flex: 1, backgroundColor: '#060610', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#00E5FF', fontSize: 14, fontWeight: 'bold', letterSpacing: 4 },
  safe: { flex: 1 },

  // Top bar
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  topBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  topCenter: { alignItems: 'center' },
  roundText: { color: '#00E5FF', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  roomCode: { color: '#444', fontSize: 9, letterSpacing: 3, marginTop: 2 },

  // Turn bar
  turnBar: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 6,
  },
  turnBarActive: { borderColor: '#00E5FF', backgroundColor: 'rgba(0,229,255,0.08)' },
  turnDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  turnText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  animLabel: { color: '#44FF44', fontSize: 9, marginLeft: 8, fontWeight: 'bold' },
  doubleTokenLabel: { color: '#FF6B00', fontSize: 9, marginLeft: 8, fontWeight: '900', backgroundColor: '#FF6B0020', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },

  // Board area — takes remaining space, centers board
  boardArea: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Player panels — absolute on board area
  panelWrap: { position: 'absolute', zIndex: 50 },
  panelTL: { top: 6, left: 6 },
  panelTR: { top: 6, right: 6 },
  panelBL: { bottom: 6, left: 6 },
  panelBR: { bottom: 6, right: 6 },

  // Center overlay — sits in the middle of the board
  centerOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 60,
    gap: 8,
  },

  // Properties overlay — bottom edge of board area
  propsOverlay: {
    position: 'absolute',
    bottom: 8, left: 8, right: 8,
    zIndex: 55,
  },
  rollRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  jailBtn: {
    backgroundColor: 'rgba(0,229,255,0.1)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: '#00E5FF',
  },
  jailBtnText: { color: '#00E5FF', fontSize: 9, fontWeight: 'bold' },

  buyCard: {
    backgroundColor: 'rgba(15,15,20,0.95)', borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: '#00E5FF', alignItems: 'center', width: 260,
  },
  buyTitle: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  buyPrice: { color: '#FFD700', fontSize: 20, fontWeight: '900', marginVertical: 4 },
  buyBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 6 },
  investBtn: { flex: 2, backgroundColor: '#00E5FF', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  investBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  skipBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  skipBtnText: { color: '#888', fontSize: 13, fontWeight: 'bold' },

  endBtn: {
    backgroundColor: '#1A1A2A', paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  endBtnText: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  waitText: { color: '#555', fontSize: 11 },

  // Properties
  propsRow: { gap: 6, paddingHorizontal: 4, justifyContent: 'center' },
  propChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  propDot: { width: 8, height: 8, borderRadius: 2 },
  propLv: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', height: 44,
    backgroundColor: 'rgba(10,10,15,0.95)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  chatBtn: {
    width: 44, justifyContent: 'center', alignItems: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)',
  },
  logWrap: { flex: 1 },

  // Modal
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalBox: {
    width: '80%', maxWidth: 320, backgroundColor: '#111118', borderRadius: 20,
    padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  modalEmoji: { fontSize: 44, marginBottom: 8 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  modalType: { color: '#666', fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  ownerDot: { width: 10, height: 10, borderRadius: 5 },
  ownerName: { color: '#00E5FF', fontSize: 13, fontWeight: '600' },
});
