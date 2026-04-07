import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, Animated, Easing, useWindowDimensions } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { BOARD, BOARD_SIZE } from '../../data/monopolyBoard';

const PLAYER_ICONS = ['👑', '⚡', '🔥', '💎'];

// ========== GRID LAYOUT ==========
function getTileGridPos(index) {
  if (index <= 7) return { x: 7 - index, y: 7, edge: 'bottom' };
  if (index <= 14) return { x: 0, y: 7 - (index - 7), edge: 'left' };
  if (index <= 21) return { x: index - 14, y: 0, edge: 'top' };
  return { x: 7, y: index - 21, edge: 'right' };
}

function getSpecialEmoji(type) {
  return { start: '🚀', jail: '⛔', chance: '✨', tax: '💎', 'free-parking': '🛸', 'go-to-jail': '👮' }[type] || '';
}

// ========== RESPONSIVE TILE ==========
function BoardTile({ tile, x, y, tileW, tileH, sz, edge, players, isCurrentPlayerHere, isAnimTarget, property, ownerColor, onPress, currentPlayerId }) {
  const isLand = tile.type === 'land';
  const playersHere = players.filter((p) => p.position === tile.position && p.status !== 'bankrupt');
  const hasOwner = property && ownerColor;
  const level = property?.level || 0;
  const tileColor = isLand ? (tile.color || '#444') : '#444';
  const glowColor = isCurrentPlayerHere ? '#FFD700' : isAnimTarget ? '#44FF44' : tileColor;
  const rent = isLand && tile.rent ? tile.rent[level] : 0;

  return (
    <View style={{ position: 'absolute', left: x, top: y, width: tileW, height: tileH, zIndex: 10 }}>
      {/* Growth dots — owned property indicator */}
      {isLand && property && (
        <View style={{
          position: 'absolute', zIndex: 20,
          ...(edge === 'bottom' ? { top: -sz.dot - 2, left: '50%', flexDirection: 'row', transform: [{ translateX: -((level + 1) * (sz.dot + 2)) / 2 }] } :
            edge === 'top' ? { bottom: -sz.dot - 2, left: '50%', flexDirection: 'row', transform: [{ translateX: -((level + 1) * (sz.dot + 2)) / 2 }] } :
              edge === 'left' ? { right: -sz.dot - 2, top: '50%', flexDirection: 'column', transform: [{ translateY: -((level + 1) * (sz.dot + 2)) / 2 }] } :
                { left: -sz.dot - 2, top: '50%', flexDirection: 'column', transform: [{ translateY: -((level + 1) * (sz.dot + 2)) / 2 }] }),
          gap: 2,
        }}>
          {Array(level + 1).fill(0).map((_, i) => (
            <View key={i} style={{ width: sz.dot, height: sz.dot, borderRadius: sz.dot / 2, backgroundColor: ownerColor, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }} />
          ))}
        </View>
      )}

      <Pressable style={{ flex: 1 }} onPress={() => onPress?.(tile)}>
        {/* Glow border */}
        <View style={{ position: 'absolute', top: 1, left: 1, right: 1, bottom: 1, borderRadius: sz.radius, borderWidth: 1, borderColor: `${glowColor}60` }} />

        {/* Body */}
        <View style={{
          flex: 1, backgroundColor: isCurrentPlayerHere ? '#3D3510' : isAnimTarget ? '#103520' : '#1A1A24',
          borderRadius: sz.radius, overflow: 'hidden',
          borderWidth: hasOwner ? 2 : 1, borderColor: hasOwner ? ownerColor : 'rgba(255,255,255,0.2)',
          padding: sz.pad,
        }}>
          {/* Color bar */}
          {isLand && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: sz.colorBar, borderTopLeftRadius: sz.radius, borderTopRightRadius: sz.radius, backgroundColor: tileColor }} />}

          {/* Content */}
          <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', gap: sz.gap }}>
            {isLand && property ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: sz.labelFont, fontWeight: '900', letterSpacing: 1 }}>FINE</Text>
                <Text style={{ color: ownerColor || '#FFF', fontSize: sz.rentFont, fontWeight: '900' }}>฿{rent}</Text>
              </View>
            ) : (
              <Text style={{ fontSize: sz.emojiFont }}>
                {isLand ? (tile.group === 'STATION' ? '🚉' : '') : getSpecialEmoji(tile.type)}
              </Text>
            )}
            <Text style={{ color: '#FFF', fontSize: sz.nameFont, fontWeight: '800', textAlign: 'center', lineHeight: sz.nameFont * 1.3 }} numberOfLines={2}>
              {tile.name}
            </Text>
            {isLand && !property && (
              <Text style={{ color: '#00E5FF', fontSize: sz.priceFont, fontWeight: '900' }}>฿{tile.price}</Text>
            )}
          </View>

          {/* Player tokens — larger with icons */}
          {playersHere.length > 0 && (
            <View style={{
              position: 'absolute', bottom: sz.pad, left: 0, right: 0,
              flexDirection: 'row', justifyContent: 'center', gap: 1,
              flexWrap: 'wrap',
            }}>
              {playersHere.map((p) => {
                const tokenSz = Math.max(14, Math.min(sz.token * 2.2, (tileW - sz.pad * 2) / Math.min(playersHere.length, 2) - 2));
                const iconSz = Math.max(8, tokenSz * 0.55);
                const isCurrentPlayer = p.id === currentPlayerId;
                return (
                  <View key={p.id} style={{
                    width: tokenSz, height: tokenSz, borderRadius: tokenSz / 2,
                    backgroundColor: p.color,
                    borderWidth: isCurrentPlayer ? 2.5 : 1.5,
                    borderColor: isCurrentPlayer ? '#FFD700' : '#FFF',
                    justifyContent: 'center', alignItems: 'center',
                    shadowColor: p.color, shadowOpacity: 0.8, shadowRadius: 6,
                    shadowOffset: { width: 0, height: 2 }, elevation: 10,
                  }}>
                    <Text style={{ fontSize: iconSz, lineHeight: iconSz + 2 }}>
                      {PLAYER_ICONS[p.order % PLAYER_ICONS.length]}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

// ========== ANIMATED TOKEN (ช้าๆ ชัดเจน) ==========
function AnimatedToken({ color, playerIcon, tilePositions, tileW, tileH, fromPos, toPos, onDone }) {
  const progress = useRef(new Animated.Value(0)).current;
  const jump = useRef(new Animated.Value(0)).current;
  const tokenSize = Math.max(34, tileW * 0.55);

  const allPos = useMemo(() => {
    const arr = [fromPos];
    let p = fromPos;
    let safety = 0;
    while (p !== toPos && safety < 40) {
      p = (p + 1) % BOARD_SIZE;
      arr.push(p);
      safety++;
    }
    return arr;
  }, [fromPos, toPos]);

  useEffect(() => {
    if (allPos.length < 2) {
      onDone?.();
      return;
    }

    const steps = allPos.length - 1;
    const durPerTile = 1500; // 1.5s as requested
    const jumpH = Math.max(40, tileW * 0.7);

    console.log(`[TOKEN] Animating ${fromPos} -> ${toPos} in ${steps} steps`);

    const anims = [];
    for (let i = 0; i < steps; i++) {
      anims.push(
        Animated.parallel([
          Animated.timing(progress, {
            toValue: i + 1,
            duration: durPerTile,
            easing: Easing.linear,
            useNativeDriver: false,
          }),
          Animated.sequence([
            Animated.timing(jump, { toValue: -jumpH, duration: durPerTile * 0.4, easing: Easing.out(Easing.quad), useNativeDriver: false }),
            Animated.timing(jump, { toValue: 0, duration: durPerTile * 0.6, easing: Easing.bounce, useNativeDriver: false }),
          ]),
        ])
      );
    }

    // Landing bounce
    anims.push(
      Animated.sequence([
        Animated.timing(jump, { toValue: -jumpH * 0.3, duration: 200, useNativeDriver: false }),
        Animated.timing(jump, { toValue: 0, duration: 300, easing: Easing.bounce, useNativeDriver: false }),
      ])
    );

    progress.setValue(0);
    jump.setValue(0);

    const sequence = Animated.sequence(anims);
    sequence.start(({ finished }) => {
      console.log(`[TOKEN] Animation finish state: ${finished}`);
      if (finished) onDone?.();
    });

    return () => sequence.stop();
  }, [allPos, onDone, tileW]);

  const cx = tileW / 2 - tokenSize / 2;
  const cy = tileH / 2 - tokenSize / 2;

  // Wait for coordinates
  if (!tilePositions[fromPos] || !tilePositions[toPos]) return null;

  const inp = allPos.map((_, i) => i);
  const xOut = allPos.map(p => (tilePositions[p]?.x ?? 0) + cx);
  const yOut = allPos.map(p => (tilePositions[p]?.y ?? 0) + cy);

  const animX = progress.interpolate({ inputRange: inp, outputRange: xOut, extrapolate: 'clamp' });
  const baseY = progress.interpolate({ inputRange: inp, outputRange: yOut, extrapolate: 'clamp' });
  const animY = Animated.add(baseY, jump);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} pointerEvents="none">
      <Animated.View style={{
        position: 'absolute',
        width: tokenSize,
        height: tokenSize,
        borderRadius: tokenSize / 2,
        backgroundColor: color,
        borderWidth: 3,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        left: animX,
        top: animY,
        shadowColor: color,
        shadowOpacity: 0.9,
        shadowRadius: 15,
        elevation: 20,
      }}>
        <Text style={{ fontSize: tokenSize * 0.5 }}>{playerIcon || '👑'}</Text>
      </Animated.View>
    </View>
  );
}

// ========== MAIN BOARD (RESPONSIVE) ==========
export default function BoardView({ players = {}, properties = {}, currentPlayerId, onTilePress, animatingPlayer, onAnimationDone }) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // คำนวณขนาด tile ให้พอดีจอ — ใช้ด้านที่เล็กกว่า, หัก topBar + controlBar + bottomBar (~220px)
  const availH = screenH - 220;
  const availW = screenW - 16;
  const boardSize = Math.min(availW, availH, 960);
  const TILE_W = Math.floor(boardSize / 8);
  const TILE_H = TILE_W;
  const actualBoard = TILE_W * 8;

  // Scale font/sizes ตาม tile size
  const sz = useMemo(() => {
    const base = TILE_W;
    return {
      emojiFont: Math.max(14, base * 0.28),
      nameFont: Math.max(7, base * 0.11),
      priceFont: Math.max(8, base * 0.12),
      rentFont: Math.max(10, base * 0.16),
      labelFont: Math.max(6, base * 0.07),
      token: Math.max(12, base * 0.18),
      dot: Math.max(5, base * 0.08),
      radius: Math.max(6, base * 0.1),
      colorBar: Math.max(4, base * 0.06),
      pad: Math.max(3, base * 0.06),
      gap: Math.max(2, base * 0.03),
    };
  }, [TILE_W]);

  const tilePositions = useMemo(() => {
    const pos = {};
    BOARD.forEach((tile, index) => {
      const grid = getTileGridPos(index);
      pos[tile.position] = { x: grid.x * TILE_W, y: grid.y * TILE_H, edge: grid.edge };
    });
    return pos;
  }, [TILE_W, TILE_H]);

  const playerList = Object.entries(players).map(([id, p]) => ({ id, ...p }));

  return (
    <View style={{ width: actualBoard, height: actualBoard, alignSelf: 'center', overflow: 'visible', position: 'relative' }}>
      {/* Center decoration */}
      <View style={{ position: 'absolute', top: TILE_H, left: TILE_W, right: TILE_W, bottom: TILE_H, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ position: 'absolute', width: TILE_W * 2, height: TILE_W * 2, borderRadius: TILE_W, backgroundColor: '#00E5FF', opacity: 0.06 }} />
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(10,10,15,0.9)', borderWidth: 2, borderColor: '#00E5FF', alignItems: 'center' }}>
          <Text style={{ color: '#00E5FF', fontSize: Math.max(12, TILE_W * 0.2), fontWeight: '900', letterSpacing: 2 }}>V-PRO</Text>
          <Text style={{ color: '#FFF', fontSize: Math.max(6, TILE_W * 0.06), fontWeight: 'bold', letterSpacing: 4, opacity: 0.5, marginTop: 2 }}>WORLD</Text>
        </View>
      </View>

      {/* Tiles */}
      {BOARD.map((tile, index) => {
        const pos = tilePositions[tile.position];
        if (!pos) return null;
        const isMe = playerList.some((p) => p.id === currentPlayerId && p.position === tile.position);
        const isTarget = animatingPlayer?.to === tile.position;
        const prop = properties[tile.position];
        const oc = prop ? players[prop.owner]?.color : null;
        return (
          <BoardTile key={tile.position} tile={tile} x={pos.x} y={pos.y} tileW={TILE_W} tileH={TILE_H} sz={sz} edge={pos.edge}
            players={animatingPlayer ? playerList.filter((p) => p.id !== animatingPlayer.id) : playerList}
            isCurrentPlayerHere={isMe && !animatingPlayer} isAnimTarget={isTarget} property={prop} ownerColor={oc} onPress={onTilePress}
            currentPlayerId={currentPlayerId}
          />
        );
      })}

      {/* Animated token */}
      {animatingPlayer && (
        <AnimatedToken color={animatingPlayer.color}
          playerIcon={PLAYER_ICONS[(players[animatingPlayer.id]?.order || 0) % PLAYER_ICONS.length]}
          tilePositions={tilePositions} tileW={TILE_W} tileH={TILE_H}
          fromPos={animatingPlayer.from} toPos={animatingPlayer.to} onDone={onAnimationDone}
        />
      )}
    </View>
  );
}
