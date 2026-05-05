import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, SafeAreaView,
  StyleSheet, Alert, Platform, TextInput, Modal,
} from 'react-native';
import { ChevronLeft, StopCircle, Monitor, Music2, Smartphone } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import ChannelTabs from '../components/soundboard/ChannelTabs';
import SoundButton from '../components/soundboard/SoundButton';
import AddSoundModal from '../components/soundboard/AddSoundModal';
import {
  subscribeToChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  subscribeToChannelButtons,
  createButton,
  updateButton,
  deleteButton,
  moveButton,
  triggerPlay,
  triggerStopAll,
} from '../services/soundboardService';

const GRID_ROWS = 6;
const GRID_COLS = 8;

const DISPLAY_URL = 'https://tuber-tools-266cb.web.app/soundboard-display';
const MUSIC_CONFIG_URL = 'https://tuber-tools-266cb.web.app/music-player-config';
const CONTROLLER_URL = 'https://tuber-tools-266cb.web.app/soundboard-controller';

function getGridSize(width, isMobile, isTablet) {
  if (isMobile) return { cols: 4, cellSize: 80 };
  if (isTablet) return { cols: 6, cellSize: 90 };
  return { cols: GRID_COLS, cellSize: 100 };
}

export default function SoundBoardScreen({ navigation }) {
  const { width, isMobile, isTablet } = useResponsive();
  const { cols, cellSize } = getGridSize(width, isMobile, isTablet);

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [buttons, setButtons] = useState([]);
  const [isPlaying, setIsPlaying] = useState({});

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [prefillPos, setPrefillPos] = useState({ row: 0, col: 0 });

  const [newChannelVisible, setNewChannelVisible] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  // Subscribe channels
  useEffect(() => {
    const unsub = subscribeToChannels((data) => {
      setChannels(data);
      if (data.length > 0 && !activeChannelId) {
        setActiveChannelId(data[0].id);
      }
    });
    return unsub;
  }, []);

  // Subscribe buttons for active channel
  useEffect(() => {
    if (!activeChannelId) return;
    setButtons([]);
    const unsub = subscribeToChannelButtons(activeChannelId, setButtons);
    return unsub;
  }, [activeChannelId]);

  // Build occupancy map: "row,col" -> button
  const occupancyMap = {};
  buttons.forEach((b) => { occupancyMap[`${b.row},${b.col}`] = b; });

  async function handleAddChannel() {
    const name = newChannelName.trim();
    if (!name) return;
    setNewChannelVisible(false);
    setNewChannelName('');
    const result = await createChannel(name);
    if (result.success) setActiveChannelId(result.channelId);
  }

  async function handleRenameChannel(channelId, name) {
    await updateChannel(channelId, { name });
  }

  async function handleDeleteChannel(channelId) {
    const confirm = Platform.OS === 'web'
      ? window.confirm('ลบ channel นี้จะลบปุ่มทั้งหมดในนั้นด้วย ยืนยัน?')
      : await new Promise((res) => Alert.alert('ลบ Channel', 'จะลบปุ่มทั้งหมดในนั้นด้วย', [
          { text: 'ยกเลิก', onPress: () => res(false) },
          { text: 'ลบ', style: 'destructive', onPress: () => res(true) },
        ]));
    if (!confirm) return;
    await deleteChannel(channelId);
    if (activeChannelId === channelId) {
      const remaining = channels.filter((c) => c.id !== channelId);
      setActiveChannelId(remaining[0]?.id || null);
    }
  }

  function openAddModal(row, col) {
    setPrefillPos({ row, col });
    setEditTarget(null);
    setAddModalVisible(true);
  }

  function openEditModal(button) {
    setEditTarget(button);
    setPrefillPos({ row: button.row, col: button.col });
    setAddModalVisible(true);
  }

  async function handleSaveButton(data) {
    setAddModalVisible(false);
    if (!activeChannelId) return;
    if (editTarget) {
      await updateButton(activeChannelId, editTarget.id, data);
    } else {
      await createButton(activeChannelId, data);
    }
  }

  async function handleDeleteButton(button) {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`ลบปุ่ม "${button.name}"?`)
      : await new Promise((res) => Alert.alert('ลบปุ่ม', `ลบ "${button.name}"?`, [
          { text: 'ยกเลิก', onPress: () => res(false) },
          { text: 'ลบ', style: 'destructive', onPress: () => res(true) },
        ]));
    if (!confirm) return;
    await deleteButton(activeChannelId, button.id);
  }

  async function handlePressButton(button) {
    setIsPlaying((prev) => ({ ...prev, [button.id]: true }));
    const ch = channels.find((c) => c.id === button.channelId);
    await triggerPlay(button, ch?.name || '');
    if (!button.loop) {
      setTimeout(() => {
        setIsPlaying((prev) => ({ ...prev, [button.id]: false }));
      }, 3000);
    }
  }

  async function handleStopAll() {
    await triggerStopAll();
    setIsPlaying({});
  }

  // Drag-and-drop (web only)
  function handleDrop(e, row, col) {
    if (Platform.OS !== 'web') return;
    e.preventDefault();
    const buttonId = e.dataTransfer.getData('buttonId');
    if (!buttonId || !activeChannelId) return;
    const existing = occupancyMap[`${row},${col}`];
    if (existing && existing.id !== buttonId) return; // cell occupied
    moveButton(activeChannelId, buttonId, row, col);
  }

  function handleDragOver(e) {
    if (Platform.OS === 'web') e.preventDefault();
  }

  function openDisplay() {
    if (Platform.OS === 'web') {
      window.open(DISPLAY_URL, '_blank');
    } else {
      Alert.alert('Display URL', DISPLAY_URL);
    }
  }

  function openMusicConfig() {
    if (Platform.OS === 'web') {
      window.open(MUSIC_CONFIG_URL, '_blank');
    } else {
      Alert.alert('Music Player Config', MUSIC_CONFIG_URL);
    }
  }

  function openController() {
    if (Platform.OS === 'web') {
      window.open(CONTROLLER_URL, '_blank');
    } else {
      Alert.alert('Soundboard Controller', CONTROLLER_URL);
    }
  }

  // Render grid
  const rows = GRID_ROWS;
  const gridCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const button = occupancyMap[key];
      gridCells.push({ r, c, button });
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Soundboard</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={openController} style={styles.headerBtn}>
            <Smartphone size={20} color="#34d399" />
          </Pressable>
          <Pressable onPress={openMusicConfig} style={styles.headerBtn}>
            <Music2 size={20} color="#a78bfa" />
          </Pressable>
          <Pressable onPress={openDisplay} style={styles.headerBtn}>
            <Monitor size={20} color={Colors.accent} />
          </Pressable>
          <Pressable onPress={handleStopAll} style={styles.headerBtn}>
            <StopCircle size={20} color="#F44336" />
          </Pressable>
        </View>
      </View>

      {/* Channel Tabs */}
      <ChannelTabs
        channels={channels}
        activeChannelId={activeChannelId}
        onSelect={setActiveChannelId}
        onAdd={() => { setNewChannelName(''); setNewChannelVisible(true); }}
        onRename={handleRenameChannel}
        onDelete={handleDeleteChannel}
      />

      {/* Grid */}
      {channels.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>ยังไม่มี Channel</Text>
          <Text style={styles.emptyHint}>กด + เพื่อสร้าง Channel แรก</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.gridScroll}>
          <View style={[styles.grid, { gap: 8 }]}>
            {gridCells.map(({ r, c, button }) => {
              const key = `${r},${c}`;
              const cellStyle = { width: cellSize, height: cellSize };

              if (button) {
                const webDrop = Platform.OS === 'web' ? {
                  onDrop: (e) => handleDrop(e, r, c),
                  onDragOver: handleDragOver,
                } : {};
                return (
                  <View key={key} style={cellStyle} {...webDrop}>
                    <SoundButton
                      button={button}
                      isPlaying={!!isPlaying[button.id]}
                      onPress={() => handlePressButton(button)}
                      onLongPress={() => {
                        if (Platform.OS === 'web') {
                          // context handled via right-click shim below
                          openEditModal(button);
                        } else {
                          Alert.alert(button.name, '', [
                            { text: 'แก้ไข', onPress: () => openEditModal(button) },
                            { text: 'ลบ', style: 'destructive', onPress: () => handleDeleteButton(button) },
                            { text: 'ยกเลิก', style: 'cancel' },
                          ]);
                        }
                      }}
                    />
                  </View>
                );
              }

              const webDropEmpty = Platform.OS === 'web' ? {
                onDrop: (e) => handleDrop(e, r, c),
                onDragOver: handleDragOver,
              } : {};

              return (
                <Pressable
                  key={key}
                  style={[styles.emptyCell, cellStyle]}
                  onPress={() => openAddModal(r, c)}
                  {...webDropEmpty}
                >
                  <Text style={styles.emptyCellPlus}>+</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Add Sound Modal */}
      <AddSoundModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSave={handleSaveButton}
        buttons={buttons}
        prefillRow={prefillPos.row}
        prefillCol={prefillPos.col}
        editButton={editTarget}
      />

      {/* New Channel Modal */}
      <Modal visible={newChannelVisible} transparent animationType="fade" onRequestClose={() => setNewChannelVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.channelSheet}>
            <Text style={styles.channelTitle}>สร้าง Channel ใหม่</Text>
            <TextInput
              style={styles.channelInput}
              value={newChannelName}
              onChangeText={setNewChannelName}
              placeholder="ชื่อ Channel..."
              placeholderTextColor="#555"
              autoFocus
              onSubmitEditing={handleAddChannel}
            />
            <View style={styles.channelBtns}>
              <Pressable onPress={() => setNewChannelVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </Pressable>
              <Pressable onPress={handleAddChannel} style={styles.saveBtn}>
                <Text style={styles.saveText}>สร้าง</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  gridScroll: { padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  emptyCell: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#181818',
  },
  emptyCellPlus: { color: '#333', fontSize: 22, fontWeight: '300' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyHint: { color: '#666', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  channelSheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  channelTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  channelInput: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 15,
  },
  channelBtns: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelBtn: {
    flex: 1, padding: 11, borderRadius: 8, backgroundColor: '#2A2A2A', alignItems: 'center',
  },
  cancelText: { color: '#999', fontSize: 14 },
  saveBtn: {
    flex: 2, padding: 11, borderRadius: 8, backgroundColor: Colors.accent, alignItems: 'center',
  },
  saveText: { color: '#121212', fontSize: 14, fontWeight: '700' },
});
