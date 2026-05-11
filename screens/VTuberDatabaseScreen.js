import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, useWindowDimensions, ActivityIndicator, Modal, Image, Pressable, Switch,
} from 'react-native';
import {
  subscribeToVtubers, subscribeToVtubersInUse,
  addVtuber, updateVtuber, deleteVtuber,
} from '../services/vtuberDatabaseService';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Edit2, Trash2, X, Check, Filter } from 'lucide-react-native';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import { Colors } from '../theme/colors';

// ─── helpers ─────────────────────────────────────────────────────────────────

function nameToHue(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

// ─── VAvatar ─────────────────────────────────────────────────────────────────

function VAvatar({ name = '', imageUrl = '', size = 28 }) {
  const hue = nameToHue(name);
  const initial = name[0]?.toUpperCase() ?? '?';
  return (
    <View style={[
      avatarStyles.circle,
      {
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: `hsl(${hue},55%,32%)`,
        borderColor: `hsl(${hue},55%,44%)`,
      },
    ]}>
      {imageUrl
        ? <Image source={{ uri: imageUrl }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        : <Text style={[avatarStyles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      }
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  initial: { color: '#fff', fontWeight: '700' },
});

// ─── StatusTag ───────────────────────────────────────────────────────────────

function StatusTag({ inUse }) {
  return (
    <View style={[tagStyles.tag, inUse ? tagStyles.tagGold : tagStyles.tagDefault]}>
      <View style={[tagStyles.dot, inUse ? tagStyles.dotGold : tagStyles.dotDefault]} />
      <Text style={[tagStyles.label, inUse ? tagStyles.labelGold : tagStyles.labelDefault]}>
        {inUse ? 'in use' : 'available'}
      </Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    borderWidth: 1, alignSelf: 'flex-start',
  },
  tagGold: { backgroundColor: Colors.accentSoft, borderColor: 'rgba(255,214,107,0.3)' },
  tagDefault: { backgroundColor: Colors.bg3, borderColor: Colors.borderSubtle },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotGold: { backgroundColor: Colors.accent },
  dotDefault: { backgroundColor: Colors.fg3 },
  label: { fontSize: 11, fontWeight: '600' },
  labelGold: { color: Colors.accent },
  labelDefault: { color: Colors.fg2 },
});

// ─── Filter button ────────────────────────────────────────────────────────────

function FilterBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[filterStyles.btn, active && filterStyles.btnActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[filterStyles.label, active && filterStyles.labelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const filterStyles = StyleSheet.create({
  btn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  btnActive: { backgroundColor: Colors.accentSoft, borderColor: 'rgba(255,214,107,0.4)' },
  label: { fontSize: 12, fontWeight: '500', color: Colors.fg2 },
  labelActive: { color: Colors.accent },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function VTuberDatabaseScreen({ navigation }) {
  const { user, isAdmin, role } = useAuth();
  const { width } = useWindowDimensions();

  const [vtubers, setVtubers] = useState([]);
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', imageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Realtime DB subscriptions ────────────────────────────────────────────
  useEffect(() => {
    const unsubVtubers = subscribeToVtubers((data) => {
      const sorted = [...data].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setVtubers(sorted);
      setLoading(false);
    });
    const unsubInUse = subscribeToVtubersInUse((ids) => setVtubersInUse(ids));
    return () => { unsubVtubers(); unsubInUse(); };
  }, []);

  // ── Derived counts ───────────────────────────────────────────────────────
  const inUseCount = vtubers.filter((v) => vtubersInUse.includes(v.id)).length;
  const availableCount = vtubers.length - inUseCount;

  // ── Filtered list ────────────────────────────────────────────────────────
  const displayed = vtubers.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || v.name?.toLowerCase().includes(q) || v.id?.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all' ||
      (filter === 'inUse' && v.isInUse) ||
      (filter === 'available' && !v.isInUse);
    return matchSearch && matchFilter;
  });

  // ── Toast ────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Modal helpers ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setFormData({ id: Date.now().toString(), name: '', imageUrl: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setFormData({ id: item.id, name: item.name || '', imageUrl: item.imageUrl || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.imageUrl.trim()) {
      showToast('กรุณากรอกชื่อและ URL รูปภาพ', 'error');
      return;
    }
    setSaving(true);
    try {
      const result = editingId
        ? await updateVtuber(formData.id, { name: formData.name, imageUrl: formData.imageUrl })
        : await addVtuber(formData);
      if (result.success) {
        setShowModal(false);
        showToast(editingId ? 'อัปเดตสำเร็จ ✓' : 'เพิ่มข้อมูลสำเร็จ ✓');
      } else {
        showToast('เกิดข้อผิดพลาด', 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`ลบ "${item.name}"?\nการกระทำนี้ไม่สามารถยกเลิกได้`);
    if (!confirmed) return;
    try {
      const result = await deleteVtuber(item.id);
      if (result.success) showToast('ลบสำเร็จ ✓');
      else showToast('ลบล้มเหลว', 'error');
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <View style={styles.root}>
      <Sidebar navigation={navigation} active="db" user={user} isAdmin={isAdmin} role={role} />

      <View style={styles.main}>
        <TopBar crumbs={['Library', 'VTuber Database']} navigation={navigation} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Page header ── */}
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLeft}>
              <Text style={styles.pageTitle}>VTuber database</Text>
              <Text style={styles.pageSubtitle}>
                {loading ? 'Loading…' : `${vtubers.length} VTubers · sync'd to Firebase`}
              </Text>
            </View>
            <View style={styles.pageHeaderRight}>
              {isAdmin && (
                <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.8} onPress={openAdd}>
                  <Plus size={14} color={Colors.accentFg} strokeWidth={2.5} />
                  <Text style={styles.btnPrimaryText}>Add VTuber</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── Filters row ── */}
          <View style={styles.filtersRow}>
            <View style={styles.searchBox}>
              <Search size={14} color={Colors.fg3} strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or ID…"
                placeholderTextColor={Colors.fg3}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.filterBtns}>
              <FilterBtn
                label={`All (${vtubers.length})`}
                active={filter === 'all'}
                onPress={() => setFilter('all')}
              />
              <FilterBtn
                label={`In use (${inUseCount})`}
                active={filter === 'inUse'}
                onPress={() => setFilter('inUse')}
              />
              <FilterBtn
                label={`Available (${availableCount})`}
                active={filter === 'available'}
                onPress={() => setFilter('available')}
              />
            </View>

            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Filter size={15} color={Colors.fg2} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* ── Table card ── */}
          <View style={styles.tableCard}>
            {/* Table header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.colName]}>VTuber</Text>
              <Text style={[styles.headerCell, styles.colId]}>ID</Text>
              <Text style={[styles.headerCell, styles.colEnabled]}>Enabled</Text>
              <View style={styles.colActions} />
            </View>

            {/* Loading state */}
            {loading && (
              <View style={styles.emptyRow}>
                <ActivityIndicator size="small" color={Colors.accent} />
                <Text style={styles.emptyText}>Loading VTubers…</Text>
              </View>
            )}

            {/* Empty state */}
            {!loading && displayed.length === 0 && (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No VTubers match your search.</Text>
              </View>
            )}

            {/* Data rows */}
            {!loading && displayed.map((vtuber, idx) => (
              <View
                key={vtuber.id}
                style={[styles.tableRow, idx === displayed.length - 1 && styles.tableRowLast]}
              >
                {/* Name + avatar */}
                <View style={[styles.colName, styles.nameCell]}>
                  <VAvatar name={vtuber.name} imageUrl={vtuber.imageUrl} size={36} />
                  <View style={styles.nameMeta}>
                    <Text style={styles.nameText} numberOfLines={1}>{vtuber.name}</Text>
                    {vtuber.channel ? (
                      <Text style={styles.nameSubtext} numberOfLines={1}>{vtuber.channel}</Text>
                    ) : null}
                  </View>
                </View>

                {/* ID */}
                <Text style={[styles.colId, styles.idText]} numberOfLines={1}>{vtuber.id}</Text>

                {/* Enabled toggle (default ON if field missing) */}
                <View style={[styles.colEnabled, styles.enabledCell]}>
                  <Switch
                    value={vtuber.enabled !== false}
                    onValueChange={(val) => updateVtuber(vtuber.id, { enabled: val })}
                    disabled={!isAdmin}
                    trackColor={{ false: Colors.bg3, true: Colors.accent }}
                    thumbColor={vtuber.enabled !== false ? Colors.accentFg : Colors.fg3}
                  />
                </View>

                {/* Actions */}
                <View style={[styles.colActions, styles.actionsCell]}>
                  {isAdmin && (
                    <>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openEdit(vtuber)}
                        activeOpacity={0.7}
                      >
                        <Edit2 size={13} color={Colors.fg2} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                        onPress={() => handleDelete(vtuber)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={13} color={Colors.red} strokeWidth={2} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          {toast.type === 'success'
            ? <Check size={14} color="#fff" strokeWidth={2.5} />
            : <X size={14} color="#fff" strokeWidth={2.5} />}
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'แก้ไข VTuber' : 'เพิ่ม VTuber ใหม่'}</Text>
              <Pressable style={styles.modalCloseBtn} onPress={() => setShowModal(false)}>
                <X size={16} color={Colors.fg2} strokeWidth={2} />
              </Pressable>
            </View>

            {/* Avatar preview */}
            <View style={styles.modalPreviewWrap}>
              {formData.imageUrl ? (
                <Image source={{ uri: formData.imageUrl }} style={styles.modalPreviewImg} />
              ) : (
                <View style={styles.modalPreviewEmpty}>
                  <Text style={styles.modalPreviewEmptyText}>No image</Text>
                </View>
              )}
            </View>

            <Text style={styles.fieldLabel}>ชื่อ</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="ชื่อ VTuber"
              placeholderTextColor={Colors.fg4}
              value={formData.name}
              onChangeText={(t) => setFormData((p) => ({ ...p, name: t }))}
            />

            <Text style={styles.fieldLabel}>URL รูปภาพ</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="https://..."
              placeholderTextColor={Colors.fg4}
              value={formData.imageUrl}
              onChangeText={(t) => setFormData((p) => ({ ...p, imageUrl: t }))}
              autoCapitalize="none"
            />

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>ยกเลิก</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveBtn, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.modalSaveText}>{saving ? 'กำลังบันทึก…' : 'บันทึก'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const COL_ID = 130;
const COL_ACTIONS = 72;

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: Colors.bg0 },
  main: { flex: 1, flexDirection: 'column' },

  scroll: { flex: 1 },
  scrollContent: {
    padding: 28,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  pageHeaderLeft: { gap: 4 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: Colors.fg0 },
  pageSubtitle: { fontSize: 13, color: Colors.fg2 },
  pageHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: 8,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '500', color: Colors.fg1 },

  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.accent, borderRadius: 8,
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '600', color: Colors.accentFg },

  // Filters
  filtersRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 16, flexWrap: 'wrap',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    width: 280, height: 36,
    backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: 8, paddingHorizontal: 10,
  },
  searchInput: { flex: 1, color: Colors.fg0, fontSize: 13, outlineWidth: 0 },
  filterBtns: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.borderSubtle,
    alignItems: 'center', justifyContent: 'center',
  },

  // Table
  tableCard: {
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  headerCell: {
    fontSize: 10.5,
    fontWeight: '600',
    color: Colors.fg3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  tableRowLast: {},

  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  emptyText: { fontSize: 13, color: Colors.fg3 },

  // Columns
  colName: { flex: 1 },
  colId: { width: COL_ID },
  colEnabled: { width: 90, alignItems: 'flex-start' },
  enabledCell: { flexDirection: 'row', alignItems: 'center' },
  colActions: { width: COL_ACTIONS },

  nameCell: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingRight: 8 },
  nameMeta: { flex: 1 },
  nameText: { fontSize: 14, fontWeight: '600', color: Colors.fg0 },
  nameSubtext: { fontSize: 11.5, color: Colors.fg3, marginTop: 1 },

  idText: { fontSize: 12, color: Colors.fg2, fontFamily: 'monospace' },

  picksText: {
    fontSize: 12, fontWeight: '600', color: Colors.fg1,
    fontFamily: 'monospace', textAlign: 'right',
  },


  actionsCell: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
  actionBtn: {
    width: 28, height: 28, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg3,
  },
  actionBtnDanger: { backgroundColor: Colors.redSoft },

  // Toast
  toast: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 10, maxWidth: 400,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8,
  },
  toastSuccess: { backgroundColor: '#1A3A1A', borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  toastError: { backgroundColor: '#3A1A1A', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)' },
  toastText: { color: Colors.fg0, fontSize: 13, flex: 1 },

  // Modal
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modal: {
    backgroundColor: Colors.bg2, borderRadius: 16, padding: 24,
    width: '100%', maxWidth: 420,
    borderWidth: 1, borderColor: Colors.borderDefault,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 18,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.fg0 },
  modalCloseBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: Colors.bg3, alignItems: 'center', justifyContent: 'center',
  },
  modalPreviewWrap: {
    width: 76, height: 76, borderRadius: 38,
    overflow: 'hidden', alignSelf: 'center', marginBottom: 18,
    backgroundColor: Colors.bg3, borderWidth: 2, borderColor: Colors.borderDefault,
  },
  modalPreviewImg: { width: '100%', height: '100%' },
  modalPreviewEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalPreviewEmptyText: { fontSize: 10, color: Colors.fg4 },
  fieldLabel: {
    fontSize: 11, fontWeight: '600', color: Colors.fg3,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 6, marginTop: 12,
  },
  fieldInput: {
    backgroundColor: Colors.bg1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.fg0, fontSize: 14,
    borderWidth: 1, borderColor: Colors.borderDefault,
    outlineWidth: 0,
  },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 22 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 8,
    backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.borderDefault,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '500', color: Colors.fg2 },
  modalSaveBtn: {
    flex: 2, paddingVertical: 11, borderRadius: 8,
    backgroundColor: Colors.accent, alignItems: 'center',
  },
  modalSaveText: { fontSize: 14, fontWeight: '700', color: Colors.accentFg },
  btnDisabled: { opacity: 0.5 },
});
