import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BOARD } from '../../data/monopolyBoard';

export default function PropertyCard({ position, property, compact = false }) {
  const tile = BOARD[position];
  if (!tile || tile.type !== 'land') return null;

  const levelText = property ? '★'.repeat((property.level || 0) + 1) : '';

  if (compact) {
    return (
      <View style={[styles.compactCard, { borderLeftColor: tile.color }]}>
        <Text style={styles.compactName} numberOfLines={1}>{tile.name}</Text>
        <Text style={styles.compactLevel}>{levelText}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderTopColor: tile.color }]}>
      <View style={[styles.colorBar, { backgroundColor: tile.color }]} />
      <Text style={styles.name}>{tile.name}</Text>
      <Text style={styles.price}>฿{tile.price}</Text>
      <Text style={styles.level}>{levelText}</Text>
      <View style={styles.rentSection}>
        {tile.rent.map((r, i) => (
          <Text key={i} style={[styles.rentRow, property?.level === i && styles.rentActive]}>
            {'★'.repeat(i + 1)} ฿{r}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 12,
    borderTopWidth: 4,
    width: 140,
  },
  colorBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  name: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  price: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  level: {
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 8,
  },
  rentSection: {
    gap: 2,
  },
  rentRow: {
    color: '#888',
    fontSize: 11,
  },
  rentActive: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  compactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 3,
  },
  compactName: {
    color: '#FFF',
    fontSize: 11,
    flex: 1,
  },
  compactLevel: {
    color: '#FFD700',
    fontSize: 10,
    marginLeft: 4,
  },
});
