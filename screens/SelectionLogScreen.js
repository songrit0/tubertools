import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, SafeAreaView, Image, ScrollView,
} from 'react-native';
import { ChevronLeft, Trash2, RefreshCw, X, Eye, Monitor } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { vtuberData } from '../data/vtuberData';
import { fetchUserSelections, deleteAllUserSelections, subscribeToUserSelections, subscribeToVtubersInUse, removeCharacterInUse, subscribeToVtubers, setActivePreview } from '../services/vtuberDatabaseService';


export default function SelectionLogScreen({ navigation }) {
  const responsive = useResponsive();
  const [selections, setSelections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [vtubers, setVtubers] = useState([]);


  const isWide = responsive.width >= 768;

  // คำนวณ ranking จาก selectedVTuber
  const ranking = useMemo(() => {
    const countMap = {};
    selections.forEach((s) => {
      const v = s.selectedVTuber;
      if (!v?.id) return;
      if (!countMap[v.id]) {
        countMap[v.id] = { id: v.id, name: v.name, imageUrl: v.imageUrl, count: 0 };
      }
      countMap[v.id].count += 1;
    });
    return Object.values(countMap).sort((a, b) => b.count - a.count);
  }, [selections]);

  useEffect(() => {
    const unsubscribeSelections = subscribeToUserSelections((data) => {
      setSelections(data);
      setIsLoading(false);
    });
    const unsubscribeInUse = subscribeToVtubersInUse((data) => {
      setVtubersInUse(data);
    });
    const unsubscribeVtubers = subscribeToVtubers((data) => {
      setVtubers(data);
    });
    loadSelections();
    return () => {
      unsubscribeSelections();
      unsubscribeInUse();
      unsubscribeVtubers();
    };
  }, []);

  const loadSelections = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserSelections();
      setSelections(data);
    } catch {
      setSelections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearRound = async () => {
    const confirmed = window.confirm(
      `จบรอบ?\n\nจะลบการเลือกทั้งหมด ${selections.length} รายการ และเริ่มรอบใหม่`
    );
    if (!confirmed) return;
    setIsClearing(true);
    try {
      const result = await deleteAllUserSelections();
      if (result.success) {
        setSelections([]);
        window.alert('จบรอบเรียบร้อย ✓\nผู้เล่นสามารถเลือกใหม่ได้แล้ว');
        await loadSelections();
      } else {
        window.alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (e) {
      window.alert(`Error: ${e.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleRemoveCharacter = async (characterId) => {
    console.log('🗑️ Removing character from vtubersInUse:', characterId);
    try {
      await removeCharacterInUse(characterId);
    } catch (e) {
      window.alert(`Error: ${e.message}`);
    }
  };

  const handleRemoveAllInUse = async () => {
    if (vtubersInUse.length === 0) {
      window.alert('ไม่มีตัวละครที่ถูกล็อกอยู่');
      return;
    }
    const confirmed = window.confirm(
      `ลบการล็อกตัวละครทั้งหมด ${vtubersInUse.length} ตัว?`
    );
    if (!confirmed) return;
    setIsRemovingAll(true);
    try {
      await Promise.all(vtubersInUse.map(id => removeCharacterInUse(id)));
      window.alert('ลบการล็อกสำเร็จ ✓');
    } catch (e) {
      window.alert(`Error: ${e.message}`);
    } finally {
      setIsRemovingAll(false);
    }
  };

  const handleShowPreview = async (item) => {
    // Sync to remote Lowerthird only
    try {
      await setActivePreview(item);
    } catch (e) {
      console.error('Failed to sync preview to remote:', e);
    }
  };

  const formatTime = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString('th-TH', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  // Medal colors for top 3
  const medalColor = ['#FFD700', '#C0C0C0', '#CD7F32'];

  const RankingPanel = () => (
    <View style={[styles.panel, styles.rankingPanel]}>
      <Text style={styles.panelTitle}>อันดับ VTuber</Text>
      <Text style={styles.panelSubtitle}>เรียงจากที่ถูกเลือกมากที่สุด</Text>

      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 24 }} />
      ) : ranking.length === 0 ? (
        <Text style={styles.emptySubtitle}>ยังไม่มีข้อมูล</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
          {ranking.map((item, index) => (
            <View key={item.id} style={styles.rankRow}>
              {/* Rank number */}
              <Text style={[
                styles.rankNum,
                index < 3 && { color: medalColor[index], fontWeight: 'bold' }
              ]}>
                {index + 1}
              </Text>

              {/* Avatar */}
              <Image source={{ uri: item.imageUrl }} style={styles.rankAvatar} />

              {/* Name */}
              <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>

              {/* Count bar */}
              <View style={styles.countBarWrap}>
                <View style={[
                  styles.countBar,
                  {
                    width: `${Math.round((item.count / (ranking[0]?.count || 1)) * 100)}%`,
                    backgroundColor: index < 3 ? medalColor[index] : '#333',
                  }
                ]} />
              </View>

              {/* Count number */}
              <Text style={[
                styles.countNum,
                index < 3 && { color: medalColor[index] }
              ]}>
                {item.count}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* VTubers In Use Section */}
      <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>
        <Text style={styles.panelTitle}>VTuber ที่ถูกlogin</Text>
        <Text style={styles.panelSubtitle}>{vtubersInUse.length} ตัวละคร</Text>

        {vtubersInUse.length === 0 ? (
          <Text style={styles.emptySubtitle}>ไม่มีตัวละครที่ถูกlogin</Text>
        ) : (
          <View style={{ marginTop: 8, gap: 6 }}>
            {vtubersInUse.map((charId) => {
              const character = vtubers.find(c => c.id === charId) || vtuberData.find(c => c.id === charId);
              return (
                <View key={charId} style={styles.lockedCharRow}>
                  {character?.imageUrl && (
                    <Image
                      source={{ uri: character.imageUrl }}
                      style={styles.lockedCharAvatar}
                    />
                  )}
                  <Text style={styles.lockedCharName} numberOfLines={1}>
                    {character?.name || charId}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => handleRemoveCharacter(charId)}
                  >
                    <X size={14} color="#fff" />
                  </Pressable>
                </View>
              );
            })}
            <Pressable
              style={({ pressed }) => [
                styles.removeAllBtn,
                isRemovingAll && { opacity: 0.5 },
                pressed && { opacity: 0.7 }
              ]}
              onPress={handleRemoveAllInUse}
              disabled={isRemovingAll}
            >
              <Trash2 size={14} color="#fff" />
              <Text style={styles.removeAllBtnText}>
                {isRemovingAll ? 'กำลังลบ...' : 'ลบทั้งหมด'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  const LogPanel = () => (
    <View style={[styles.panel, styles.logPanel]}>
      {/* Log header row */}
      <View style={styles.logHeaderRow}>
        <Text style={[styles.logHeaderCell, { width: 28 }]}>#</Text>
        <Text style={[styles.logHeaderCell, { flex: 1 }]}>คนที่เลือก</Text>
        <Text style={[styles.logHeaderCell, { width: 24 }]} />
        <Text style={[styles.logHeaderCell, { flex: 1 }]}>คนที่ถูกเลือก</Text>
        <Text style={[styles.logHeaderCell, { width: 80, textAlign: 'right' }]}>เวลา</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      ) : (
        <FlatList
          data={selections}
          keyExtractor={(item, i) => `${item.selectionId}_${i}`}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>ยังไม่มีการเลือก</Text>
              <Text style={styles.emptySubtitle}>รอผู้เล่นทำการเลือก</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <View style={styles.logRow}>
              <Text style={styles.logIndex}>{index + 1}</Text>

              <View style={styles.personCell}>
                <Image source={{ uri: item.character?.imageUrl }} style={styles.logAvatar} />
                <Text style={styles.personName} numberOfLines={1}>{item.character?.name ?? '—'}</Text>
              </View>

              <Text style={styles.logArrow}>→</Text>

              <View style={styles.personCell}>
                <Image source={{ uri: item.selectedVTuber?.imageUrl }} style={styles.logAvatar} />
                <Text style={styles.personName} numberOfLines={1}>{item.selectedVTuber?.name ?? '—'}</Text>
              </View>

              <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>

              <Pressable 
                style={({ pressed }) => [styles.previewBtn, pressed && { opacity: 0.6 }]}
                onPress={() => handleShowPreview(item)}
              >
                <Eye size={16} color={Colors.accent} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={Colors.text} size={20} />
            <Text style={styles.backText}>กลับ</Text>
          </Pressable>

          <View style={styles.navCenter}>
            <Text style={styles.navTitle}>WHO SELECTED WHOM</Text>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.6 }]}
            onPress={loadSelections}
            disabled={isLoading}
          >
            <RefreshCw color={Colors.textSecondary} size={18} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.refreshBtn, { marginLeft: 10 }, pressed && { opacity: 0.6 }]}
            onPress={() => navigation.navigate('SelectionLowerThird')}
          >
            <Monitor color={Colors.accent} size={18} />
          </Pressable>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statsInner}>
          <Text style={styles.statValue}>{selections.length}</Text>
          <Text style={styles.statLabel}>การเลือกทั้งหมด</Text>
          <Text style={styles.statSep}>·</Text>
          <Text style={styles.statValue}>{ranking.length}</Text>
          <Text style={styles.statLabel}>VTuber ที่ถูกเลือก</Text>
        </View>
      </View>

      {/* Body */}
      {isWide ? (
        // Wide: side by side
        <View style={styles.bodyWide}>
          <RankingPanel />
          <LogPanel />
        </View>
      ) : (
        // Narrow: stacked, ranking on top as horizontal scroll
        <ScrollView style={{ flex: 1 }}>
          <RankingPanel />
          <LogPanel />
        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <Pressable
            style={({ pressed }) => [
              styles.endRoundBtn,
              isClearing && styles.btnDisabled,
              pressed && { opacity: 0.8 },
            ]}
            onPress={handleClearRound}
            disabled={isClearing}
          >
            <Trash2 color="#fff" size={18} />
            <Text style={styles.endRoundText}>
              {isClearing ? 'กำลังล้าง...' : 'จบรอบ & ล้างทั้งหมด'}
            </Text>
          </Pressable>
        </View>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#242424',
    minWidth: 70,
  },
  backText: { color: Colors.text, fontSize: 13 },
  navCenter: { alignItems: 'center', gap: 6 },
  navTitle: { color: Colors.text, fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1DB95420',
    borderWidth: 1,
    borderColor: '#1DB95460',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1DB954' },
  liveText: { color: '#1DB954', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#242424',
    justifyContent: 'center', alignItems: 'center',
  },

  statsBar: {
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  statsInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 10,
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  statValue: { color: Colors.accent, fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 13 },
  statSep: { color: '#444', fontSize: 16, marginHorizontal: 4 },

  // Body
  bodyWide: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },

  panel: {
    padding: 16,
  },
  rankingPanel: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: '#2A2A2A',
  },
  logPanel: {
    flex: 1,
  },
  panelTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  panelSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
  },

  // Ranking rows
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  rankNum: {
    width: 22,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
  },
  rankAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.cardBg,
  },
  rankName: {
    flex: 1,
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  countBarWrap: {
    width: 50,
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  countBar: {
    height: '100%',
    borderRadius: 2,
  },
  countNum: {
    width: 24,
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  // Locked characters
  lockedCharRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#FF6B6B',
  },
  lockedCharName: {
    flex: 1,
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#C0392B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#C0392B',
    borderRadius: 6,
    marginTop: 4,
  },
  removeAllBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockedCharAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.cardBg,
  },

  // Log table
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    marginBottom: 4,
  },
  logHeaderCell: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 3,
    backgroundColor: '#1A1A1A',
  },
  logIndex: {
    width: 28,
    color: Colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  personCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.cardBg,
  },
  personName: {
    flex: 1,
    color: Colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  logArrow: {
    width: 24,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  timeText: {
    width: 80,
    color: Colors.textSecondary,
    fontSize: 10,
    textAlign: 'right',
  },

  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 8 },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    backgroundColor: '#141414',
  },
  footerInner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  endRoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C0392B',
    paddingVertical: 13,
    borderRadius: 10,
  },
  endRoundText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.5 },
  previewBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
});
