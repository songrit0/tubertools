import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  ActivityIndicator, SafeAreaView, Image, ScrollView,
} from 'react-native';
import { ChevronLeft, Trash2, RefreshCw, X, Eye, Monitor, Plus, MessageSquare, Check, ChevronUp, ChevronDown } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { vtuberData } from '../data/vtuberData';
import { fetchUserSelections, deleteAllUserSelections, subscribeToUserSelections, subscribeToVtubersInUse, removeCharacterInUse, subscribeToVtubers, setActivePreview, saveTextBoxes, subscribeToTextBoxes } from '../services/vtuberDatabaseService';


export default function SelectionLogScreen({ navigation }) {
  const responsive = useResponsive();
  const [selections, setSelections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [vtubers, setVtubers] = useState([]);
  const [textBoxes, setTextBoxes] = useState([]);
  const [newBoxText, setNewBoxText] = useState('');
  const [newBoxColor, setNewBoxColor] = useState('#C0392B');
  const [newBoxSelectedColor, setNewBoxSelectedColor] = useState('#FFD700');
  const [newBoxGroup, setNewBoxGroup] = useState('A');
  const [activeGroup, setActiveGroup] = useState('A');

  const TEXT_BOX_GROUPS = ['A', 'B', 'C', 'D', 'E'];

  const TEXT_BOX_COLORS = [
    { label: 'แดง', value: '#C0392B' },
    { label: 'น้ำเงิน', value: '#2980B9' },
    { label: 'เขียว', value: '#27AE60' },
    { label: 'ม่วง', value: '#8E44AD' },
    { label: 'เทา', value: '#555555' },
    { label: 'ส้ม', value: '#E67E22' },
    { label: 'ทอง', value: '#FFD700' },
    { label: 'ชมพู', value: '#E91E63' },
  ];

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
    const unsubscribeTextBoxes = subscribeToTextBoxes((data) => {
      setTextBoxes(Array.isArray(data) ? data : []);
    });
    loadSelections();
    return () => {
      unsubscribeSelections();
      unsubscribeInUse();
      unsubscribeVtubers();
      unsubscribeTextBoxes();
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

  const handleAddTextBox = async () => {
    if (!newBoxText.trim()) return;
    const updated = [...textBoxes, {
      id: Date.now().toString(),
      text: newBoxText.trim(),
      group: newBoxGroup,
      visible: false,
      selected: false,
    }];
    await saveTextBoxes(updated);
    setNewBoxText('');
  };

  const handleMoveTextBox = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= textBoxes.length) return;
    const updated = [...textBoxes];
    [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
    await saveTextBoxes(updated);
  };

  const handleShowGroup = async (group) => {
    setActiveGroup(group);
    setNewBoxGroup(group);
    const updated = textBoxes.map(box => ({
      ...box,
      visible: box.group === group,
    }));
    await saveTextBoxes(updated);
  };

  const handleApplyColors = async () => {
    const updated = textBoxes.map(box => ({
      ...box,
      color: newBoxColor,
      selectedColor: newBoxSelectedColor,
    }));
    await saveTextBoxes(updated);
  };

  const handleToggleTextBox = async (id) => {
    const updated = textBoxes.map(box =>
      box.id === id ? { ...box, visible: !box.visible } : box
    );
    await saveTextBoxes(updated);
  };

  const handleRemoveTextBox = async (id) => {
    const updated = textBoxes.filter(box => box.id !== id);
    await saveTextBoxes(updated);
  };

  const handleShowAllTextBoxes = async (show) => {
    const updated = textBoxes.map(box => ({ ...box, visible: show }));
    await saveTextBoxes(updated);
  };

  const handleSelectTextBox = async (id) => {
    const updated = textBoxes.map(box =>
      box.id === id ? { ...box, selected: !box.selected } : box
    );
    await saveTextBoxes(updated);
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

  const rankingPanel = (
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

  const logPanel = (
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

  const textBoxPanel = (
    <View style={[styles.panel, { borderTopWidth: 1, borderTopColor: '#2A2A2A' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={16} color={Colors.accent} />
          <Text style={styles.panelTitle}>กล่องข้อความ</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            style={({ pressed }) => [styles.tbShowAllBtn, { backgroundColor: '#27AE60' }, pressed && { opacity: 0.7 }]}
            onPress={() => handleShowAllTextBoxes(true)}
          >
            <Text style={styles.tbShowAllBtnText}>แสดงทั้งหมด</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.tbShowAllBtn, { backgroundColor: '#555' }, pressed && { opacity: 0.7 }]}
            onPress={() => handleShowAllTextBoxes(false)}
          >
            <Text style={styles.tbShowAllBtnText}>ซ่อนทั้งหมด</Text>
          </Pressable>
        </View>
      </View>

      {/* Color settings */}
      <View style={styles.tbSettingsBox}>
        <View style={styles.tbColorRow}>
          <Text style={styles.tbColorLabel}>สีปกติ</Text>
          <View style={styles.tbColorPicker}>
            {TEXT_BOX_COLORS.map(c => (
              <Pressable
                key={c.value}
                style={[
                  styles.tbColorDot,
                  { backgroundColor: c.value },
                  newBoxColor === c.value && styles.tbColorDotActive,
                ]}
                onPress={() => setNewBoxColor(c.value)}
              />
            ))}
          </View>
        </View>
        <View style={styles.tbColorRow}>
          <Text style={styles.tbColorLabel}>สีเลือก</Text>
          <View style={styles.tbColorPicker}>
            {TEXT_BOX_COLORS.map(c => (
              <Pressable
                key={c.value}
                style={[
                  styles.tbColorDot,
                  { backgroundColor: c.value },
                  newBoxSelectedColor === c.value && styles.tbColorDotActive,
                ]}
                onPress={() => setNewBoxSelectedColor(c.value)}
              />
            ))}
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.tbApplyBtn, pressed && { opacity: 0.7 }]}
          onPress={handleApplyColors}
        >
          <Text style={styles.tbApplyBtnText}>ใช้สีกับทุกกล่อง</Text>
        </Pressable>
      </View>

      {/* Group tabs - แสดงกลุ่ม */}
      <View style={styles.tbGroupSection}>
        <Text style={styles.tbColorLabel}>กลุ่ม</Text>
        <View style={styles.tbGroupTabs}>
          {TEXT_BOX_GROUPS.map(g => (
            <Pressable
              key={g}
              style={[styles.tbGroupTab, activeGroup === g && styles.tbGroupTabActive]}
              onPress={() => handleShowGroup(g)}
            >
              <Text style={[styles.tbGroupTabText, activeGroup === g && styles.tbGroupTabTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Add new text box */}
      <View style={[styles.tbAddRow, { marginTop: 8 }]}>
        <Pressable
          style={[styles.tbGroupBadge, { backgroundColor: '#333' }]}
          onPress={() => {
            const i = TEXT_BOX_GROUPS.indexOf(newBoxGroup);
            setNewBoxGroup(TEXT_BOX_GROUPS[(i + 1) % TEXT_BOX_GROUPS.length]);
          }}
        >
          <Text style={styles.tbGroupBadgeText}>{newBoxGroup}</Text>
        </Pressable>
        <TextInput
          style={styles.tbInput}
          value={newBoxText}
          onChangeText={setNewBoxText}
          placeholder="พิมพ์ข้อความ..."
          placeholderTextColor="#666"
          onSubmitEditing={handleAddTextBox}
        />
        <Pressable
          style={({ pressed }) => [styles.tbAddBtn, pressed && { opacity: 0.7 }]}
          onPress={handleAddTextBox}
        >
          <Plus size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Text box list */}
      {textBoxes.length === 0 ? (
        <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>ยังไม่มีกล่องข้อความ</Text>
      ) : (
        <View style={{ marginTop: 8, gap: 4 }}>
          {textBoxes.map((box, index) => (
            <View key={box.id} style={[styles.tbItem, { borderLeftColor: box.selected ? (box.selectedColor || newBoxSelectedColor) : (box.color || newBoxColor) }]}>
              <View style={styles.tbMoveCol}>
                <Pressable
                  style={({ pressed }) => [styles.tbMoveBtn, pressed && { opacity: 0.5 }, index === 0 && { opacity: 0.2 }]}
                  onPress={() => handleMoveTextBox(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp size={10} color="#fff" />
                </Pressable>
                <Text style={styles.tbIndex}>{index + 1}</Text>
                <Pressable
                  style={({ pressed }) => [styles.tbMoveBtn, pressed && { opacity: 0.5 }, index === textBoxes.length - 1 && { opacity: 0.2 }]}
                  onPress={() => handleMoveTextBox(index, 'down')}
                  disabled={index === textBoxes.length - 1}
                >
                  <ChevronDown size={10} color="#fff" />
                </Pressable>
              </View>
              <Text style={[styles.tbGroupBadgeSmall, { backgroundColor: '#333' }]}>{box.group || 'A'}</Text>
              <View style={[styles.tbPreviewBox, { backgroundColor: box.selected ? (box.selectedColor || newBoxSelectedColor) : (box.color || newBoxColor) }]}>
                <Text style={styles.tbPreviewText}>{box.text}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.tbSelectBtn,
                  box.selected ? { backgroundColor: box.selectedColor || newBoxSelectedColor } : styles.tbSelectOff,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleSelectTextBox(box.id)}
              >
                <Check size={12} color="#fff" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.tbToggleBtn,
                  box.visible ? styles.tbToggleOn : styles.tbToggleOff,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleToggleTextBox(box.id)}
              >
                <Eye size={14} color="#fff" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                onPress={() => handleRemoveTextBox(box.id)}
              >
                <X size={14} color="#fff" />
              </Pressable>
            </View>
          ))}
        </View>
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
          <ScrollView style={{ width: 280, borderRightWidth: 1, borderRightColor: '#2A2A2A' }}>
            {rankingPanel}
            {textBoxPanel}
          </ScrollView>
          {logPanel}
        </View>
      ) : (
        // Narrow: stacked
        <ScrollView style={{ flex: 1 }}>
          {rankingPanel}
          {textBoxPanel}
          {logPanel}
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

  // Text box styles
  tbAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tbInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    color: '#fff',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  tbColorPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  tbColorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tbColorDotActive: {
    borderColor: '#fff',
  },
  tbAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    padding: 6,
    borderLeftWidth: 3,
  },
  tbPreviewBox: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tbPreviewText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tbToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tbToggleOn: {
    backgroundColor: '#27AE60',
  },
  tbToggleOff: {
    backgroundColor: '#555',
  },
  tbToggleBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tbShowAllBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tbShowAllBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tbMoveCol: {
    alignItems: 'center',
    gap: 1,
  },
  tbMoveBtn: {
    padding: 2,
  },
  tbIndex: {
    color: Colors.textSecondary,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tbSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  tbSelectOff: {
    backgroundColor: '#333',
  },
  tbSelectBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tbColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tbColorLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
    width: 40,
  },
  tbSettingsBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    padding: 8,
    gap: 6,
  },
  tbApplyBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 4,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 2,
  },
  tbApplyBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tbGroupSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  tbGroupTabs: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
  },
  tbGroupTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#252525',
    alignItems: 'center',
  },
  tbGroupTabActive: {
    backgroundColor: Colors.accent,
  },
  tbGroupTabText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  tbGroupTabTextActive: {
    color: '#000',
  },
  tbGroupBadge: {
    width: 28,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tbGroupBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tbGroupBadgeSmall: {
    color: '#aaa',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    textAlign: 'center',
    overflow: 'hidden',
  },
});
