import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  ActivityIndicator, Alert, Modal, SafeAreaView,
} from 'react-native';
import { ChevronLeft, X, Check } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { fetchVtubersFromDatabase, saveUserSelection, fetchUserSelections, removeCharacterInUse, subscribeToVtubersInUse } from '../services/vtuberDatabaseService';

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

let cachedVtubers = null;

export default function SelectVTuberScreen({ route, navigation }) {
  const responsive = useResponsive();
  const { gameId, character } = route.params || {};
  const [selectedVTuber, setSelectedVTuber] = useState(null);
  const [vtubers, setVtubers] = useState(cachedVtubers || []);
  const [isLoading, setIsLoading] = useState(!cachedVtubers);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedVTuberIds, setSelectedVTuberIds] = useState(new Set());
  const [vtubersInUse, setVtubersInUse] = useState([]);

  const numColumns = responsive.width >= 1200 ? 6
    : responsive.width >= 900 ? 5
      : responsive.width >= 600 ? 4
        : 3;

  useEffect(() => {
    // Check if vtubersInUse collection is empty and if character is locked
    const unsubscribe = subscribeToVtubersInUse((inUseIds) => {
      setVtubersInUse(inUseIds);
      console.log('👁️ VTubersInUse:', inUseIds);

      // If vtubersInUse is empty/null, redirect to SelectGame
      if (!inUseIds || inUseIds.length === 0) {
        console.log('⚠️ vtubersInUse is empty, redirecting to SelectGame');
        navigation.navigate('SelectGame');
        return;
      }

      // If character is not in vtubersInUse, redirect to SelectGame
      if (character?.id && !inUseIds.includes(character.id)) {
        console.log('❌ Character not found in vtubersInUse:', character.id, 'redirecting to SelectGame');
        navigation.navigate('SelectGame');
        return;
      }
    });

    checkExistingSelection();
    const needsShuffle = !cachedVtubers;
    Promise.all([
      needsShuffle ? fetchVtubersFromDatabase() : Promise.resolve(cachedVtubers),
      fetchUserSelections(),
    ])
      .then(([vtubersData, selections]) => {
        const data = needsShuffle ? shuffleArray(vtubersData) : vtubersData;
        cachedVtubers = data;
        setVtubers(data);
        const takenIds = new Set(
          selections
            .filter((s) => s.gameId === gameId && s.character?.id === character?.id)
            .map((s) => s.selectedVTuber?.id)
            .filter(Boolean)
        );
        setSelectedVTuberIds(takenIds);
      })
      .catch(() => setVtubers([]))
      .finally(() => setIsLoading(false));

    return () => unsubscribe();
  }, [navigation]);

  const checkExistingSelection = async () => {
    try {
      const selections = await fetchUserSelections();
      const existing = selections.find(
        (s) => s.gameId === gameId && s.character?.id === character?.id
      );
      if (existing) {
        navigation.replace('ResultSelection', {
          gameId, character,
          selectedVTuber: existing.selectedVTuber,
          selectionId: existing.selectionId,
          alreadySelected: true,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectVTuber = (vtuber) => {
    if (selectedVTuberIds.has(vtuber.id)) return;
    setSelectedVTuber(vtuber);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedVTuber) return;
    setIsSaving(true);
    try {
      const result = await saveUserSelection({
        gameId: gameId || 'unknown',
        character: { id: character?.id, name: character?.name, imageUrl: character?.imageUrl },
        selectedVTuber: { id: selectedVTuber.id, name: selectedVTuber.name, imageUrl: selectedVTuber.imageUrl },
      });
      if (result.success) {
        setSelectedVTuberIds(prev => new Set([...prev, selectedVTuber.id]));
        setShowModal(false);
        navigation.navigate('ResultSelection', { gameId, character, selectedVTuber, selectionId: result.selectionId });
      } else {
        Alert.alert('Error', 'Failed to save selection');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderVTuber = ({ item }) => {
    const isAlreadySelected = selectedVTuberIds.has(item.id);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          isAlreadySelected && styles.cardDisabled,
          !isAlreadySelected && pressed && styles.cardPressed,
        ]}
        onPress={() => handleSelectVTuber(item)}
        disabled={isAlreadySelected}
      >
        <View style={[styles.avatarWrapper, isAlreadySelected && styles.avatarDisabled]}>
          <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
        </View>
        <Text style={[styles.nameText, isAlreadySelected && styles.nameDisabled]} numberOfLines={1}>
          {item.name}
        </Text>
        {isAlreadySelected && (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>เลือกแล้ว</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Pressable
            style={styles.backBtn}
            onPress={async () => {
              // Remove character from vtubersInUse and navigate back
              if (character?.id) {
                console.log('🗑️ Removing character from vtubersInUse:', character.id);
                await removeCharacterInUse(character.id);
              }
              navigation.navigate('SelectGame');
            }}
          >
            <ChevronLeft color={Colors.text} size={20} />
            <Text style={styles.backText}>หน้าหลัก</Text>
          </Pressable>
          <Text style={styles.navTitle}>SELECT VTUBER</Text>
          <View style={{ width: 70 }} />
        </View>
      </View>

      {/* Playing As Banner */}
      <View style={styles.playingAsBanner}>
        <View style={styles.bannerInner}>
          <Text style={styles.bannerLabel}>PLAYING AS</Text>
          <View style={styles.bannerCharacter}>
            <Image source={{ uri: character?.imageUrl }} style={styles.bannerAvatar} />
            <Text style={styles.bannerName}>{character?.name}</Text>
          </View>
        </View>
      </View>

      {/* Page Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>เลือก VTuber ที่คุณเชียร์</Text>
        <Text style={styles.pageSubtitle}>คุณคิดว่าใครจะชนะ?</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      ) : (
        <FlatList
          data={vtubers}
          renderItem={renderVTuber}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={<Text style={styles.emptyText}>ไม่พบ VTuber</Text>}
        />
      )}

      {/* Confirm Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Pressable style={styles.closeBtn} onPress={() => setShowModal(false)}>
              <X color={Colors.text} size={20} />
            </Pressable>

            <Text style={styles.modalTitle}>ยืนยันการเลือก</Text>

            {/* Character */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>PLAYING AS</Text>
              <View style={styles.modalCard}>
                <Image source={{ uri: character?.imageUrl }} style={styles.modalAvatar} />
                <Text style={styles.modalName}>{character?.name}</Text>
              </View>
            </View>

            <Text style={styles.arrow}>↓</Text>

            {/* VTuber */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>SELECTED</Text>
              <View style={styles.modalCard}>
                <Image source={{ uri: selectedVTuber?.imageUrl }} style={styles.modalAvatar} />
                <Text style={styles.modalName}>{selectedVTuber?.name}</Text>
              </View>
            </View>

            <View style={styles.modalBtns}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnCancel, pressed && { opacity: 0.7 }, isSaving && styles.btnDisabled]}
                onPress={() => setShowModal(false)}
                disabled={isSaving}
              >
                <X color="#fff" size={18} />
                <Text style={styles.modalBtnText}>ยกเลิก</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnConfirm, pressed && { opacity: 0.8 }, isSaving && styles.btnDisabled]}
                onPress={handleConfirm}
                disabled={isSaving}
              >
                <Check color="#fff" size={18} />
                <Text style={styles.modalBtnText}>{isSaving ? 'กำลังบันทึก...' : 'ยืนยัน'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 1400,
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
  navTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // Playing As Banner
  playingAsBanner: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  bannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  bannerLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bannerCharacter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  bannerName: { color: Colors.text, fontSize: 14, fontWeight: 'bold' },

  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  pageTitle: { color: Colors.text, fontSize: 22, fontWeight: 'bold' },
  pageSubtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },

  grid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  row: { gap: 12, marginBottom: 12 },

  card: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardPressed: { backgroundColor: '#242424', borderColor: Colors.accent },
  avatarWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: Colors.cardBg,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#333',
  },
  avatar: { width: '100%', height: '100%' },
  nameText: { color: Colors.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalSection: { marginBottom: 8 },
  modalLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalCard: {
    backgroundColor: '#141414',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalAvatar: { width: 52, height: 52, borderRadius: 26 },
  modalName: { color: Colors.text, fontSize: 15, fontWeight: 'bold', flex: 1 },
  arrow: { color: Colors.textSecondary, fontSize: 22, textAlign: 'center', marginVertical: 8 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 24 },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalBtnCancel: {
    backgroundColor: '#C0392B',
    borderWidth: 1,
    borderColor: '#8B2E24',
  },
  modalBtnConfirm: {
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: '#FF8C42',
  },
  modalBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  btnCancel: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnConfirm: {
    flex: 1,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: Colors.background, fontSize: 14, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.5 },

  cardDisabled: {
    opacity: 0.5,
    borderColor: '#333',
  },
  avatarDisabled: {
    borderColor: '#555',
  },
  nameDisabled: {
    color: Colors.textSecondary,
  },
  selectedBadge: {
    marginTop: 6,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
