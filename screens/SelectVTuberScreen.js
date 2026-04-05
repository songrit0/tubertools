import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  ActivityIndicator, Alert, Modal, SafeAreaView,
} from 'react-native';
import { ChevronLeft, X } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { fetchVtubersFromDatabase, saveUserSelection, fetchUserSelections } from '../services/vtuberDatabaseService';

export default function SelectVTuberScreen({ route, navigation }) {
  const responsive = useResponsive();
  const { gameId, character } = route.params || {};
  const [selectedVTuber, setSelectedVTuber] = useState(null);
  const [vtubers, setVtubers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const numColumns = responsive.width >= 1200 ? 6
    : responsive.width >= 900 ? 5
    : responsive.width >= 600 ? 4
    : 3;

  useEffect(() => {
    checkExistingSelection();
    fetchVtubersFromDatabase()
      .then(setVtubers)
      .catch(() => setVtubers([]))
      .finally(() => setIsLoading(false));
  }, []);

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

  const renderVTuber = ({ item }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => handleSelectVTuber(item)}
    >
      <View style={styles.avatarWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
      </View>
      <Text style={styles.nameText} numberOfLines={1}>{item.name}</Text>
    </Pressable>
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
                style={[styles.btnCancel, isSaving && styles.btnDisabled]}
                onPress={() => setShowModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.btnText}>ยกเลิก</Text>
              </Pressable>
              <Pressable
                style={[styles.btnConfirm, isSaving && styles.btnDisabled]}
                onPress={handleConfirm}
                disabled={isSaving}
              >
                <Text style={styles.btnText}>{isSaving ? 'กำลังบันทึก...' : 'ยืนยัน'}</Text>
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
});
