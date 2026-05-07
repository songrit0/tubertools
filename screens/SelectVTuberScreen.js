import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  ActivityIndicator, Alert, Modal, SafeAreaView, TextInput, ScrollView,
  useWindowDimensions,
} from 'react-native';
import { X, Check, Search, SlidersHorizontal, CheckCircle2 } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { shuffleArray } from '../utils/arrayUtils';
import {
  fetchVtubersFromDatabase, saveUserSelection, fetchUserSelections,
  removeCharacterInUse, subscribeToVtubersInUse,
  subscribeToDraftControl,
} from '../services/vtuberDatabaseService';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

let cachedVtubers = null;

const SLOT_COLORS = [
  '#FFD66B', '#4ADE80', '#60A5FA', '#F472B6',
  '#A78BFA', '#FB923C', '#34D399', '#F87171',
  '#38BDF8', '#FBBF24', '#C084FC', '#86EFAC',
];

function SlotDot({ index, currentSlot, takenCount }) {
  const isTaken = index < takenCount;
  const isCurrent = index === currentSlot;
  return (
    <View style={[
      sdot.dot,
      isTaken && sdot.dotTaken,
      isCurrent && sdot.dotCurrent,
    ]} />
  );
}

const sdot = StyleSheet.create({
  dot: {
    width: 18, height: 24, borderRadius: 5,
    backgroundColor: Colors.bg2,
  },
  dotTaken: {
    backgroundColor: Colors.accent,
  },
  dotCurrent: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
});

export default function SelectVTuberScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const responsive = useResponsive();
  const { user, isAdmin, role } = useAuth();
  const { gameId, character } = route.params || {};

  const [selectedVTuber, setSelectedVTuber] = useState(null);
  const [vtubers, setVtubers] = useState(cachedVtubers || []);
  const [isLoading, setIsLoading] = useState(!cachedVtubers);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedVTuberIds, setSelectedVTuberIds] = useState(new Set());
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draftControl, setDraftControl] = useState({ isOpen: false, allowedIds: [] });

  // Responsive grid columns: wide=6, medium=3, mobile=2
  const numColumns = width >= 1024 ? 6 : width >= 640 ? 3 : 2;

  // Slot index derived from character id position in vtubersInUse
  const slotIndex = vtubersInUse.indexOf(character?.id);
  const currentSlot = slotIndex >= 0 ? slotIndex : 0;
  const takenCount = selectedVTuberIds.size;

  useEffect(() => {
    const unsubscribe = subscribeToVtubersInUse((inUseIds) => {
      setVtubersInUse(inUseIds);
      if (!inUseIds || inUseIds.length === 0) {
        navigation.navigate('SelectGame');
        return;
      }
      if (character?.id && !inUseIds.includes(character.id)) {
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

    const unsubscribeDraft = subscribeToDraftControl((data) => setDraftControl(data));

    return () => { unsubscribe(); unsubscribeDraft(); };
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

  const isDraftBlocked = (id) => {
    if (!draftControl.isOpen) return true;
    if (!draftControl.allowedIds.includes(id)) return true;
    return false;
  };

  const handleSelectVTuber = (vtuber) => {
    if (selectedVTuberIds.has(vtuber.id)) return;
    if (isDraftBlocked(vtuber.id)) return;
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

  const filteredVtubers = searchQuery.trim()
    ? vtubers.filter(v => v.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : vtubers;

  const renderVTuber = ({ item }) => {
    const isTaken = selectedVTuberIds.has(item.id);
    const isChosen = selectedVTuber?.id === item.id;
    const blocked = isDraftBlocked(item.id);
    const notAllowed = draftControl.isOpen && !draftControl.allowedIds.includes(item.id);
    const disabled = isTaken || blocked;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          disabled && styles.cardTaken,
          isChosen && !blocked && styles.cardSelected,
          !disabled && pressed && styles.cardPressed,
          notAllowed && styles.cardNotAllowed,
        ]}
        onPress={() => handleSelectVTuber(item)}
        disabled={disabled}
      >
        {isChosen && !disabled && (
          <View style={styles.checkBadge}>
            <CheckCircle2 size={16} color={Colors.accentFg} fill={Colors.accent} />
          </View>
        )}

        <View style={[styles.avatarWrapper, disabled && { opacity: 0.4 }]}>
          {item.imageUrl
            ? <Image source={{ uri: item.imageUrl }} style={styles.avatarImg} />
            : (
              <View style={[styles.avatarImg, styles.avatarFallback]}>
                <Text style={styles.avatarFallbackText}>{(item.name || '?')[0]}</Text>
              </View>
            )
          }
        </View>

        <Text style={[styles.cardName, disabled && { color: Colors.fg3 }]} numberOfLines={2}>
          {item.name}
        </Text>

        {isTaken && (
          <View style={styles.takenTag}>
            <Text style={styles.takenTagText}>Taken</Text>
          </View>
        )}
        {notAllowed && !isTaken && (
          <View style={styles.notAllowedTag}>
            <Text style={styles.notAllowedTagText}>ยังไม่พร้อม</Text>
          </View>
        )}
      </Pressable>
    );
  };

  const TOTAL_SLOTS = 12;

  return (
    <SafeAreaView style={styles.root}>
      {/* Sidebar */}
      <Sidebar navigation={navigation} active="games" user={user} isAdmin={isAdmin} role={role} />

      {/* Main */}
      <View style={styles.main}>
        <TopBar crumbs={['Games', 'VTuber Draft']} live navigation={navigation} />

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

          {/* Playing As Banner */}
          <View style={styles.playingBanner}>
            <View style={styles.playingLeft}>
              <Text style={styles.playingLabel}>PLAYING AS</Text>
              <View style={styles.playingPlayer}>
                <View style={[styles.playerAvatar, { backgroundColor: SLOT_COLORS[currentSlot % SLOT_COLORS.length] }]}>
                  {character?.imageUrl
                    ? <Image source={{ uri: character.imageUrl }} style={styles.playerAvatarImg} />
                    : <Text style={styles.playerAvatarInitial}>{(character?.name || '?')[0]}</Text>
                  }
                </View>
                <View>
                  <Text style={styles.playerName}>{character?.name || 'Player'}</Text>
                  {/* <Text style={styles.playerSlot}>Slot {currentSlot + 1} of {TOTAL_SLOTS}</Text> */}
                </View>
              </View>
            </View>

            <View style={styles.slotsSpacer} />

            {/* Slot indicators */}
            {/* <View style={styles.slotsRow}>
              {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
                <SlotDot key={i} index={i} currentSlot={currentSlot} takenCount={takenCount} />
              ))}
            </View> */}
            {/* <Text style={styles.slotCounter}>{takenCount} / {TOTAL_SLOTS}</Text> */}
          </View>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            {/* <View style={styles.pageHeaderLeft}>
              <Text style={styles.pageTitle}>Pick the VTuber you back</Text>
              <Text style={styles.pageSubtitle}>Who do you think will win? Select one to lock in your pick.</Text>
            </View> */}
            <View style={styles.pageHeaderRight}>
              {/* Search */}
              <View style={styles.searchBox}>
                <Search size={14} color={Colors.fg2} strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search VTubers…"
                  placeholderTextColor={Colors.fg3}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
              {/* Sort button */}
              {/* <Pressable style={styles.sortBtn}>
                <SlidersHorizontal size={14} color={Colors.fg2} strokeWidth={2} />
                <Text style={styles.sortBtnText}>Sort</Text>
              </Pressable> */}
            </View>
          </View>

          {/* Draft closed banner */}
          {/* {!draftControl.isOpen && (
            <View style={styles.draftClosedBanner}>
              <Text style={styles.draftClosedIcon}>🔒</Text>
              <View>
                <Text style={styles.draftClosedTitle}>ยังไม่เปิดรับการเลือก</Text>
                <Text style={styles.draftClosedSub}>รอให้ผู้ดูแลเปิด Draft ก่อน</Text>
              </View>
            </View>
          )} */}

          {/* Grid */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingText}>Loading VTubers…</Text>
            </View>
          ) : (
            <FlatList
              data={filteredVtubers}
              renderItem={renderVTuber}
              keyExtractor={(item) => item.id}
              numColumns={numColumns}
              key={numColumns}
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No VTubers found</Text>}
            />
          )}
        </ScrollView>

        {/* Sticky Confirm Bar */}
        {selectedVTuber && !showModal && (
          <View style={styles.confirmBar}>
            <View style={styles.confirmBarAvatars}>
              <View style={[styles.confirmAvatar, { backgroundColor: SLOT_COLORS[currentSlot % SLOT_COLORS.length] }]}>
                {character?.imageUrl
                  ? <Image source={{ uri: character.imageUrl }} style={styles.confirmAvatarImg} />
                  : <Text style={styles.confirmAvatarInitial}>{(character?.name || '?')[0]}</Text>
                }
              </View>
              <Text style={styles.confirmArrow}>→</Text>
              <View style={styles.confirmAvatar}>
                {selectedVTuber.imageUrl
                  ? <Image source={{ uri: selectedVTuber.imageUrl }} style={styles.confirmAvatarImg} />
                  : <Text style={styles.confirmAvatarInitial}>{(selectedVTuber.name || '?')[0]}</Text>
                }
              </View>
            </View>
            <View style={styles.confirmBarInfo}>
              <Text style={styles.confirmBarLabel}>{character?.name} → {selectedVTuber.name}</Text>
              <Text style={styles.confirmBarSub}>Confirm to lock in your pick</Text>
            </View>
            <View style={styles.confirmBarActions}>
              <Pressable style={styles.confirmCancelBtn} onPress={() => setSelectedVTuber(null)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={() => setShowModal(true)}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Confirm Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Pressable style={styles.closeBtn} onPress={() => setShowModal(false)}>
              <X color={Colors.fg1} size={18} />
            </Pressable>

            <Text style={styles.modalTitle}>Confirm Pick</Text>
            <Text style={styles.modalSubtitle}>This action cannot be undone.</Text>

            {/* Selection flow */}
            <View style={styles.selectionFlow}>
              <View style={styles.flowCard}>
                <View style={[styles.flowAvatar, { backgroundColor: SLOT_COLORS[currentSlot % SLOT_COLORS.length] }]}>
                  {character?.imageUrl
                    ? <Image source={{ uri: character.imageUrl }} style={styles.flowAvatarImg} />
                    : <Text style={styles.flowAvatarInitial}>{(character?.name || '?')[0]}</Text>
                  }
                </View>
                <Text style={styles.flowLabel}>PLAYING AS</Text>
                <Text style={styles.flowName}>{character?.name}</Text>
              </View>

              <Text style={styles.flowArrow}>→</Text>

              <View style={styles.flowCard}>
                <View style={styles.flowAvatarVT}>
                  {selectedVTuber?.imageUrl
                    ? <Image source={{ uri: selectedVTuber.imageUrl }} style={styles.flowAvatarImg} />
                    : <Text style={styles.flowAvatarInitial}>{(selectedVTuber?.name || '?')[0]}</Text>
                  }
                </View>
                <Text style={styles.flowLabel}>BACKING</Text>
                <Text style={styles.flowName}>{selectedVTuber?.name}</Text>
              </View>
            </View>

            <View style={styles.modalBtns}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel, isSaving && styles.btnDisabled]}
                onPress={() => setShowModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm, isSaving && styles.btnDisabled]}
                onPress={handleConfirm}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color={Colors.accentFg} />
                  : <Text style={styles.modalBtnConfirmText}>Lock it in</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bg0,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollContent: {
    paddingBottom: 80,
  },

  // Playing As Banner
  playingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    margin: 20,
    marginBottom: 0,
  },
  playingLeft: {
    gap: 4,
  },
  playingLabel: {
    fontSize: 11,
    color: Colors.fg3,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  playingPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  playerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  playerAvatarInitial: {
    color: Colors.accentFg,
    fontWeight: '700',
    fontSize: 14,
  },
  playerName: {
    color: Colors.fg0,
    fontSize: 14,
    fontWeight: '600',
  },
  playerSlot: {
    color: Colors.fg3,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  slotsSpacer: {
    flex: 1,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  slotCounter: {
    color: Colors.fg2,
    fontSize: 13,
    fontFamily: 'monospace',
    minWidth: 44,
    textAlign: 'right',
  },

  // Page Header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    flexWrap: 'wrap',
  },
  pageHeaderLeft: {
    flex: 1,
    gap: 4,
    minWidth: 200,
  },
  pageTitle: {
    color: Colors.fg0,
    fontSize: 20,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: Colors.fg2,
    fontSize: 13,
  },
  pageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    minWidth: 200,
  },
  searchInput: {
    flex: 1,
    color: Colors.fg0,
    fontSize: 13,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  sortBtnText: {
    color: Colors.fg1,
    fontSize: 13,
    fontWeight: '500',
  },

  // Grid
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gridRow: {
    gap: 10,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    position: 'relative',
    minHeight: 130,
  },
  cardSelected: {
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  cardPressed: {
    backgroundColor: Colors.bg2,
  },
  cardTaken: {
    opacity: 0.4,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: Colors.bg3,
    marginBottom: 8,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg3,
  },
  avatarFallbackText: {
    color: Colors.fg1,
    fontSize: 22,
    fontWeight: '700',
  },
  cardName: {
    color: Colors.fg0,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  cardId: {
    color: Colors.fg3,
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  takenTag: {
    marginTop: 6,
    backgroundColor: Colors.redSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.red + '40',
  },
  takenTagText: {
    color: Colors.red,
    fontSize: 9,
    fontWeight: '700',
  },

  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: Colors.fg2,
    fontSize: 14,
  },
  emptyText: {
    color: Colors.fg2,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },

  // Sticky Confirm Bar
  confirmBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.bg1 + 'F0',
    borderTopWidth: 1,
    borderTopColor: Colors.borderDefault,
  },
  confirmBarAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bg3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  confirmAvatarInitial: {
    color: Colors.fg0,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmArrow: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmBarInfo: {
    flex: 1,
    gap: 2,
  },
  confirmBarLabel: {
    color: Colors.fg0,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmBarSub: {
    color: Colors.fg3,
    fontSize: 11,
  },
  confirmBarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  confirmCancelText: {
    color: Colors.fg1,
    fontSize: 13,
    fontWeight: '500',
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  confirmBtnText: {
    color: Colors.accentFg,
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.bg1,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalTitle: {
    color: Colors.fg0,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: Colors.fg3,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  selectionFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  flowCard: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  flowAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowAvatarVT: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: Colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowAvatarImg: {
    width: 56,
    height: 56,
  },
  flowAvatarInitial: {
    color: Colors.fg0,
    fontWeight: '700',
    fontSize: 20,
  },
  flowLabel: {
    color: Colors.fg3,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  flowName: {
    color: Colors.fg0,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  flowArrow: {
    color: Colors.accent,
    fontSize: 22,
    fontWeight: '700',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  modalBtnConfirm: {
    backgroundColor: Colors.accent,
  },
  modalBtnCancelText: {
    color: Colors.fg1,
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnConfirmText: {
    color: Colors.accentFg,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: { opacity: 0.5 },

  cardNotAllowed: { opacity: 0.35 },
  notAllowedTag: {
    marginTop: 6,
    backgroundColor: Colors.bg3,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  notAllowedTagText: {
    color: Colors.fg3,
    fontSize: 9,
    fontWeight: '600',
  },
  draftClosedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  draftClosedIcon: { fontSize: 22 },
  draftClosedTitle: { fontSize: 14, fontWeight: '700', color: Colors.fg1 },
  draftClosedSub: { fontSize: 12, color: Colors.fg3, marginTop: 2 },
});
