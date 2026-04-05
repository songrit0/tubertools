import React, { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, Text,
  TextInput, Modal, FlatList, Image, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Plus, RefreshCw, Upload, Pencil, Trash2, X, Check } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { vtuberData, vtuberDataselect } from '../data/vtuberData';
import {
  syncVtubersToDatabase, fetchVtubersFromDatabase,
  addVtuber, updateVtuber, deleteVtuber,
  syncVtuberSelectionsToDatabase,
} from '../services/vtuberDatabaseService';

export default function AdminDataScreen({ navigation }) {
  const responsive = useResponsive();
  const [vtubers, setVtubers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', imageUrl: '' });
  const [toast, setToast] = useState(null); // { message, type: 'success'|'error' }

  const isWide = responsive.width >= 768;

  useEffect(() => { load(); }, []);

  const load = async () => {
    setIsLoading(true);
    const data = await fetchVtubersFromDatabase();
    setVtubers(data.length > 0 ? data : vtuberData);
    setIsLoading(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const r1 = await syncVtubersToDatabase(vtuberData);
      const r2 = await syncVtuberSelectionsToDatabase(vtuberDataselect);
      if (r1.success && r2.success) {
        await load();
        showToast('ซิงค์ข้อมูลเริ่มต้นสำเร็จ ✓');
      } else {
        showToast('ซิงค์ล้มเหลว', 'error');
      }
    } catch (e) {
      showToast('เกิดข้อผิดพลาด: ' + e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({ id: Date.now().toString(), name: '', imageUrl: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.imageUrl) {
      showToast('กรุณากรอกชื่อและ URL รูปภาพ', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const result = editingId
        ? await updateVtuber(formData.id, { name: formData.name, imageUrl: formData.imageUrl })
        : await addVtuber(formData);

      if (result.success) {
        await load();
        setShowModal(false);
        showToast(editingId ? 'อัปเดตสำเร็จ ✓' : 'เพิ่มข้อมูลสำเร็จ ✓');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (item) => {
    const confirmed = window.confirm(`ลบ "${item.name}" ?\nการกระทำนี้ไม่สามารถยกเลิกได้`);
    if (!confirmed) return;
    setIsLoading(true);
    deleteVtuber(item.id)
      .then(async (r) => {
        if (r.success) { await load(); showToast('ลบสำเร็จ ✓'); }
        else showToast('ลบล้มเหลว', 'error');
      })
      .catch((e) => showToast(e.message, 'error'))
      .finally(() => setIsLoading(false));
  };

  const numColumns = responsive.width >= 1200 ? 6
    : responsive.width >= 900 ? 5
    : responsive.width >= 600 ? 4
    : 3;

  const renderCard = ({ item }) => (
    <View style={styles.card}>
      {/* Avatar */}
      <View style={styles.cardAvatarWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.cardAvatar} />
      </View>
      {/* Name */}
      <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.cardId} numberOfLines={1}>ID: {item.id}</Text>
      {/* Actions */}
      <View style={styles.cardActions}>
        <Pressable
          style={({ pressed }) => [styles.cardBtn, styles.editBtn, pressed && { opacity: 0.7 }]}
          onPress={() => openEdit(item)}
        >
          <Pencil size={13} color="#fff" />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cardBtn, styles.deleteBtn, pressed && { opacity: 0.7 }]}
          onPress={() => handleDelete(item)}
        >
          <Trash2 size={13} color="#fff" />
        </Pressable>
      </View>
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
          <Text style={styles.navTitle}>จัดการข้อมูล VTuber</Text>
          <Pressable
            style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.6 }]}
            onPress={load} disabled={isLoading}
          >
            <RefreshCw color={Colors.textSecondary} size={18} />
          </Pressable>
        </View>
      </View>

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          {toast.type === 'success' ? <Check size={16} color="#fff" /> : <X size={16} color="#fff" />}
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarInner}>
          <View style={styles.toolbarLeft}>
            <Text style={styles.countText}>{vtubers.length} VTuber</Text>
          </View>
          <View style={styles.toolbarRight}>
            <Pressable
              style={({ pressed }) => [styles.toolBtn, styles.toolBtnSecondary, pressed && { opacity: 0.7 }, isLoading && styles.btnDisabled]}
              onPress={handleSync} disabled={isLoading}
            >
              <Upload size={15} color={Colors.textSecondary} />
              {isWide && <Text style={styles.toolBtnSecText}>ซิงค์ข้อมูลเริ่มต้น</Text>}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.toolBtn, styles.toolBtnPrimary, pressed && { opacity: 0.7 }]}
              onPress={openAdd}
            >
              <Plus size={15} color={Colors.background} />
              <Text style={styles.toolBtnPrimText}>เพิ่ม VTuber</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Grid */}
      {isLoading && vtubers.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      ) : (
        <FlatList
          data={vtubers}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>ยังไม่มี VTuber</Text>
              <Text style={styles.emptySubtitle}>กด "เพิ่ม VTuber" หรือ "ซิงค์ข้อมูลเริ่มต้น"</Text>
            </View>
          }
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'แก้ไข VTuber' : 'เพิ่ม VTuber ใหม่'}</Text>
              <Pressable style={styles.closeBtn} onPress={() => setShowModal(false)}>
                <X color={Colors.text} size={18} />
              </Pressable>
            </View>

            {/* Preview */}
            {formData.imageUrl ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: formData.imageUrl }} style={styles.previewImg} />
              </View>
            ) : (
              <View style={[styles.previewWrap, styles.previewEmpty]}>
                <Text style={styles.previewEmptyText}>ยังไม่มีรูป</Text>
              </View>
            )}

            {/* Fields */}
            <Text style={styles.label}>ชื่อ</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อ VTuber"
              placeholderTextColor="#555"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
            />

            <Text style={styles.label}>URL รูปภาพ</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="https://..."
              placeholderTextColor="#555"
              value={formData.imageUrl}
              onChangeText={(t) => setFormData({ ...formData, imageUrl: t })}
              multiline
            />

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnCancel, pressed && { opacity: 0.7 }]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>ยกเลิก</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalBtn, styles.modalBtnSave, isLoading && styles.btnDisabled, pressed && { opacity: 0.8 }]}
                onPress={handleSave} disabled={isLoading}
              >
                <Text style={styles.modalBtnSaveText}>{isLoading ? 'กำลังบันทึก...' : 'บันทึก'}</Text>
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
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, backgroundColor: '#242424', minWidth: 70,
  },
  backText: { color: Colors.text, fontSize: 13 },
  navTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#242424', justifyContent: 'center', alignItems: 'center',
  },

  // Toast
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    marginHorizontal: 20, marginTop: 12,
    borderRadius: 10, maxWidth: 500, alignSelf: 'center', width: '90%',
  },
  toastSuccess: { backgroundColor: '#1A3A1A', borderWidth: 1, borderColor: '#1DB95460' },
  toastError: { backgroundColor: '#3A1A1A', borderWidth: 1, borderColor: '#FF444460' },
  toastText: { color: Colors.text, fontSize: 13, flex: 1 },

  // Toolbar
  toolbar: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#141414',
  },
  toolbarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  toolbarLeft: {},
  countText: { color: Colors.textSecondary, fontSize: 13 },
  toolbarRight: { flexDirection: 'row', gap: 8 },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
  },
  toolBtnSecondary: { backgroundColor: '#242424', borderWidth: 1, borderColor: '#333' },
  toolBtnSecText: { color: Colors.textSecondary, fontSize: 13 },
  toolBtnPrimary: { backgroundColor: Colors.accent },
  toolBtnPrimText: { color: Colors.background, fontSize: 13, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.5 },

  // Grid
  grid: {
    padding: 16,
    maxWidth: 1600,
    alignSelf: 'center',
    width: '100%',
  },
  gridRow: { gap: 12, marginBottom: 12 },

  // Card
  card: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  cardAvatarWrap: {
    width: 64, height: 64, borderRadius: 32,
    overflow: 'hidden', backgroundColor: Colors.cardBg,
    borderWidth: 2, borderColor: '#333',
  },
  cardAvatar: { width: '100%', height: '100%' },
  cardName: { color: Colors.text, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  cardId: { color: Colors.textSecondary, fontSize: 10, textAlign: 'center' },
  cardActions: { flexDirection: 'row', gap: 6, marginTop: 4 },
  cardBtn: {
    width: 32, height: 32, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  editBtn: { backgroundColor: '#1565C0' },
  deleteBtn: { backgroundColor: '#C0392B' },

  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 13 },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modal: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20, padding: 24,
    width: '100%', maxWidth: 440,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  modalTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center',
  },
  previewWrap: {
    width: 80, height: 80, borderRadius: 40,
    overflow: 'hidden', alignSelf: 'center',
    marginBottom: 16, backgroundColor: Colors.cardBg,
    borderWidth: 2, borderColor: '#333',
  },
  previewImg: { width: '100%', height: '100%' },
  previewEmpty: { justifyContent: 'center', alignItems: 'center' },
  previewEmptyText: { color: '#555', fontSize: 11 },
  label: { color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#141414',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    color: Colors.text, fontSize: 14,
    borderWidth: 1, borderColor: '#333',
  },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: 10, alignItems: 'center',
  },
  modalBtnCancel: { backgroundColor: '#242424', borderWidth: 1, borderColor: '#333' },
  modalBtnCancelText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  modalBtnSave: { backgroundColor: Colors.accent },
  modalBtnSaveText: { color: Colors.background, fontSize: 14, fontWeight: 'bold' },
});
