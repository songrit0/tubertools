import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, Pressable } from 'react-native';
import { CheckCircle, Clock } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { subscribeToUserSelections } from '../services/vtuberDatabaseService';

export default function ResultSelectionScreen({ route, navigation }) {
  const { gameId, character, selectedVTuber, alreadySelected } = route.params || {};
  const [currentSelection, setCurrentSelection] = useState(selectedVTuber);

  useEffect(() => {
    const unsubscribe = subscribeToUserSelections((selections) => {
      const mine = selections.find(
        (s) => s.gameId === gameId && s.character?.id === character?.id
      );
      if (mine) {
        setCurrentSelection(mine.selectedVTuber);
      } else {
        setTimeout(() => {
          navigation.replace('SelectVTuber', { gameId, character });
        }, 500);
      }
    });
    return unsubscribe;
  }, [gameId, character?.id]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Text style={styles.navLogo}>12VTuber</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            {alreadySelected
              ? <Clock color={Colors.accent} size={36} />
              : <CheckCircle color="#1DB954" size={36} />
            }
          </View>
          <Text style={styles.statusTitle}>
            {alreadySelected ? 'เลือกไปแล้ว' : 'บันทึกเรียบร้อย!'}
          </Text>
          <Text style={styles.statusDesc}>
            {alreadySelected
              ? 'คุณได้ทำการเลือกไปแล้วก่อนหน้านี้'
              : 'การเลือกของคุณถูกบันทึกแล้ว รอผลได้เลย'}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>สรุปการเลือก</Text>

          {/* Playing As */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>ฉันคือ</Text>
            <View style={styles.personCard}>
              <Image source={{ uri: character?.imageUrl }} style={styles.personAvatar} />
              <Text style={styles.personName}>{character?.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Selected */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>ฉันเลือก</Text>
            <View style={styles.personCard}>
              <Image source={{ uri: currentSelection?.imageUrl }} style={styles.personAvatar} />
              <Text style={styles.personName}>{currentSelection?.name}</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <View style={styles.liveDot} />
          <Text style={styles.infoText}>รอผลการแข่งขัน — หน้านี้จะอัปเดตอัตโนมัติ</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  navbar: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#181818',
  },
  navInner: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  navLogo: { color: Colors.accent, fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },

  scroll: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    gap: 16,
  },

  // Status
  statusCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    marginBottom: 4,
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  summaryTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    minWidth: 60,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#141414',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  personAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  personName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 4,
  },

  // Info
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1A2A1A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1DB95440',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DB954',
  },
  infoText: {
    color: '#1DB954',
    fontSize: 13,
    flex: 1,
  },
});
