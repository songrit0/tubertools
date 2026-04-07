import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BOARD } from '../../data/monopolyBoard';
import { User, Shield, Lock, Skull } from 'lucide-react-native';

const AVATARS = ['🦊', '🐱', '🐶', '🐸'];
const RANK_COLORS = ['#FFD700', '#E0E0E0', '#CD7F32', '#607D8B'];

function formatMoney(amount) {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return `${amount}`;
}

function getOwnedColorGroups(playerId, properties) {
  const colors = new Set();
  if (!properties) return [];
  Object.entries(properties).forEach(([pos, prop]) => {
    if (prop?.owner === playerId) {
      const tile = BOARD[parseInt(pos)];
      if (tile?.color && tile.type === 'land') colors.add(tile.color);
    }
  });
  return [...colors];
}

export default function PlayerPanel({
  player,
  playerId,
  rank,
  isCurrentTurn,
  isMe,
  playerIndex,
  properties,
  corner,
}) {
  if (!player) return null;

  const isBankrupt = player.status === 'bankrupt';
  const isJail = player.status === 'jail';
  const ownedColors = getOwnedColorGroups(playerId, properties);
  const avatar = AVATARS[playerIndex] || '👤';
  const rankColor = RANK_COLORS[rank] || '#888';

  const isRight = corner === 'topRight' || corner === 'bottomRight';

  return (
    <View style={[
      styles.panel,
      isBankrupt && styles.panelBankrupt,
      isCurrentTurn && { borderColor: player.color },
      isMe && styles.panelMe,
    ]}>
      {/* Background Glow for current turn */}
      {isCurrentTurn && <View style={[styles.glowBackground, { backgroundColor: player.color }]} />}

      <View style={[styles.header, isRight && { flexDirection: 'row-reverse' }]}>
        {/* Avatar with Glow */}
        <View style={[styles.avatarContainer, { borderColor: player.color }]}>
          <Text style={styles.avatarEmoji}>{avatar}</Text>
          {isMe && <View style={styles.meBadge}><Text style={styles.meBadgeText}>YOU</Text></View>}
        </View>

        <View style={[styles.info, isRight && { alignItems: 'flex-end' }]}>
          <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
          <View style={styles.statusRow}>
            {isCurrentTurn && <View style={[styles.pulseDot, { backgroundColor: player.color }]} />}
            {isJail && <Lock color="#FF4444" size={8} />}
            {isBankrupt && <Skull color="#888" size={8} />}
            <Text style={[styles.statusText, isCurrentTurn && { color: player.color }]}>
              {isBankrupt ? 'OUT' : isJail ? 'JAIL' : isCurrentTurn ? 'PLAYING' : 'WAITING'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.moneyContainer}>
        <Text style={styles.moneySymbol}>฿</Text>
        <Text style={styles.moneyAmount}>{formatMoney(player.money)}</Text>
      </View>

      <View style={styles.bottomRow}>
        {/* Rank indicator */}
        <View style={[styles.rankBox, { backgroundColor: `${rankColor}20`, borderColor: rankColor }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>#{rank + 1}</Text>
        </View>

        {/* Assets indicator */}
        {ownedColors.length > 0 && (
          <View style={styles.assetsRow}>
            {ownedColors.map((c, i) => (
              <View key={i} style={[styles.assetDot, { backgroundColor: c }]} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: 'rgba(20, 20, 25, 0.85)',
    borderRadius: 16,
    padding: 10,
    width: 140,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  panelMe: {
    width: 160,
    backgroundColor: 'rgba(25, 30, 45, 0.95)',
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  panelBankrupt: {
    opacity: 0.5,
    borderColor: '#444',
  },
  glowBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  avatarEmoji: {
    fontSize: 14,
  },
  meBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  meBadgeText: {
    color: '#000',
    fontSize: 6,
    fontWeight: '900',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  statusText: {
    color: '#888',
    fontSize: 7,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moneyContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 6,
  },
  moneySymbol: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  moneyAmount: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 6,
  },
  rankBox: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  rankText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  assetsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  assetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
