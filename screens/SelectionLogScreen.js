import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { ChevronLeft, Trash2, RefreshCw, Monitor, Trophy, ClipboardList, Type } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { fetchUserSelections, deleteAllUserSelections, subscribeToUserSelections, subscribeToVtubersInUse, removeCharacterInUse, subscribeToVtubers, setActivePreview } from '../services/vtuberDatabaseService';
import RankingPanel from '../components/selectionlog/RankingPanel';
import LogPanel from '../components/selectionlog/LogPanel';
import TextBoxManager from '../components/selectionlog/TextBoxManager';

const TABS = [
  { key: 'log',     label: 'Log',      Icon: ClipboardList },
  { key: 'ranking', label: 'Ranking',  Icon: Trophy },
  { key: 'textbox', label: 'Text Box', Icon: Type },
];

export default function SelectionLogScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('log');
  const [selections, setSelections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [vtubers, setVtubers] = useState([]);

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
    const unsubscribeInUse = subscribeToVtubersInUse((data) => setVtubersInUse(data));
    const unsubscribeVtubers = subscribeToVtubers((data) => setVtubers(data));
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
    if (vtubersInUse.length === 0) { window.alert('ไม่มีตัวละครที่ถูกล็อกอยู่'); return; }
    const confirmed = window.confirm(`ลบการล็อกตัวละครทั้งหมด ${vtubersInUse.length} ตัว?`);
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
    try { await setActivePreview(item); } catch { }
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

          <View style={styles.navActions}>
            <Pressable style={styles.iconBtn} onPress={loadSelections} disabled={isLoading}>
              <RefreshCw color={Colors.textSecondary} size={18} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('SelectionLowerThird')}>
              <Monitor color={Colors.accent} size={18} />
            </Pressable>
          </View>
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
          <Text style={styles.statSep}>·</Text>
          <Text style={styles.statValue}>{vtubersInUse.length}</Text>
          <Text style={styles.statLabel}>กำลังใช้งาน</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key;
          return (
            <Pressable
              key={key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(key)}
            >
              <Icon size={16} color={active ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
              {active && <View style={styles.tabIndicator} />}
            </Pressable>
          );
        })}
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {activeTab === 'log' && (
          <LogPanel
            isLoading={isLoading}
            selections={selections}
            onShowPreview={handleShowPreview}
          />
        )}
        {activeTab === 'ranking' && (
          <RankingPanel
            isLoading={isLoading}
            ranking={ranking}
            vtubersInUse={vtubersInUse}
            vtubers={vtubers}
            isRemovingAll={isRemovingAll}
            onRemoveCharacter={handleRemoveCharacter}
            onRemoveAllInUse={handleRemoveAllInUse}
          />
        )}
        {activeTab === 'textbox' && (
          <TextBoxManager />
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerInner}>
          <Pressable
            style={({ pressed }) => [styles.endRoundBtn, isClearing && styles.btnDisabled, pressed && { opacity: 0.8 }]}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    maxWidth: 1600, alignSelf: 'center', width: '100%',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: '#242424', minWidth: 70,
  },
  backText: { color: Colors.text, fontSize: 13 },
  navCenter: { alignItems: 'center', gap: 4 },
  navTitle: { color: Colors.text, fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1DB95420', borderWidth: 1, borderColor: '#1DB95460',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1DB954' },
  liveText: { color: '#1DB954', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  navActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#242424', justifyContent: 'center', alignItems: 'center',
  },

  statsBar: { backgroundColor: '#141414', borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  statsInner: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap',
    paddingHorizontal: 24, paddingVertical: 10,
    maxWidth: 1600, alignSelf: 'center', width: '100%',
  },
  statValue: { color: Colors.accent, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 12 },
  statSep: { color: '#444', fontSize: 14, marginHorizontal: 2 },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 13, position: 'relative',
  },
  tabActive: { },
  tabLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  tabLabelActive: { color: Colors.accent, fontWeight: '700' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2, borderRadius: 2, backgroundColor: Colors.accent,
  },

  content: { flex: 1 },
  contentInner: {
    maxWidth: 1600, alignSelf: 'center', width: '100%',
    paddingBottom: 20,
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
