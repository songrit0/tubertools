import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { ChevronLeft, Trash2, RefreshCw, Monitor } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { fetchUserSelections, deleteAllUserSelections, subscribeToUserSelections, subscribeToVtubersInUse, removeCharacterInUse, subscribeToVtubers, setActivePreview } from '../services/vtuberDatabaseService';
import RankingPanel from '../components/selectionlog/RankingPanel';
import LogPanel from '../components/selectionlog/LogPanel';
import TextBoxManager from '../components/selectionlog/TextBoxManager';

export default function SelectionLogScreen({ navigation }) {
  const responsive = useResponsive();
  const [selections, setSelections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [vtubers, setVtubers] = useState([]);

  const isWide = responsive.width >= 768;

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
    try {
      await setActivePreview(item);
    } catch (e) {
      console.error('Failed to sync preview to remote:', e);
    }
  };

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
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            onPress={loadSelections}
            disabled={isLoading}
          >
            <RefreshCw color={Colors.textSecondary} size={18} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.iconBtn, { marginLeft: 10 }, pressed && { opacity: 0.6 }]}
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
        <View style={styles.bodyWide}>
          <ScrollView style={{ width: 280, borderRightWidth: 1, borderRightColor: '#2A2A2A' }}>
            <RankingPanel
              isLoading={isLoading}
              ranking={ranking}
              vtubersInUse={vtubersInUse}
              vtubers={vtubers}
              isRemovingAll={isRemovingAll}
              onRemoveCharacter={handleRemoveCharacter}
              onRemoveAllInUse={handleRemoveAllInUse}
            />
            <TextBoxManager />
          </ScrollView>
          <LogPanel
            isLoading={isLoading}
            selections={selections}
            onShowPreview={handleShowPreview}
          />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          <RankingPanel
            isLoading={isLoading}
            ranking={ranking}
            vtubersInUse={vtubersInUse}
            vtubers={vtubers}
            isRemovingAll={isRemovingAll}
            onRemoveCharacter={handleRemoveCharacter}
            onRemoveAllInUse={handleRemoveAllInUse}
          />
          <TextBoxManager />
          <LogPanel
            isLoading={isLoading}
            selections={selections}
            onShowPreview={handleShowPreview}
          />
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

  navbar: { borderBottomWidth: 1, borderBottomColor: '#2A2A2A', backgroundColor: '#181818' },
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
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: '#242424', minWidth: 70,
  },
  backText: { color: Colors.text, fontSize: 13 },
  navCenter: { alignItems: 'center', gap: 6 },
  navTitle: { color: Colors.text, fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1DB95420', borderWidth: 1, borderColor: '#1DB95460',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1DB954' },
  liveText: { color: '#1DB954', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#242424', justifyContent: 'center', alignItems: 'center',
  },

  statsBar: { backgroundColor: '#141414', borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  statsInner: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6,
    paddingHorizontal: 24, paddingVertical: 10,
    maxWidth: 1600, alignSelf: 'center', width: '100%',
  },
  statValue: { color: Colors.accent, fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 13 },
  statSep: { color: '#444', fontSize: 16, marginHorizontal: 4 },

  bodyWide: {
    flex: 1, flexDirection: 'row',
    maxWidth: 1600, alignSelf: 'center', width: '100%',
  },

  footer: { borderTopWidth: 1, borderTopColor: '#2A2A2A', backgroundColor: '#141414' },
  footerInner: {
    paddingHorizontal: 20, paddingVertical: 12,
    maxWidth: 1600, alignSelf: 'center', width: '100%',
  },
  endRoundBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#C0392B', paddingVertical: 13, borderRadius: 10,
  },
  endRoundText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.5 },
});
