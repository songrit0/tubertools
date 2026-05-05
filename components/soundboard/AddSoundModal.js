import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, Modal, ScrollView,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

const COLOR_PALETTE = [
  '#FFD700', '#4CAF50', '#2196F3', '#E91E63',
  '#FF5722', '#9C27B0', '#00BCD4', '#607D8B',
  '#F44336', '#FF9800', '#009688', '#3F51B5',
];

const VOLUME_PRESETS = [0.25, 0.5, 0.75, 1.0];

export default function AddSoundModal({
  visible, onClose, onSave, buttons,
  prefillRow = 0, prefillCol = 0, editButton = null,
}) {
  const [name, setName] = useState('');
  const [rawUrl, setRawUrl] = useState('');
  const [volume, setVolume] = useState(1);
  const [loop, setLoop] = useState(false);
  const [stopOnNew, setStopOnNew] = useState(false);
  const [color, setColor] = useState('#FFD700');
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (editButton) {
        setName(editButton.name || '');
        setRawUrl(editButton.soundSource?.url || '');
        setVolume(editButton.volume ?? 1);
        setLoop(editButton.loop ?? false);
        setStopOnNew(editButton.stopOnNew ?? false);
        setColor(editButton.color || '#FFD700');
        setRow(editButton.row ?? prefillRow);
        setCol(editButton.col ?? prefillCol);
      } else {
        setName('');
        setRawUrl('');
        setVolume(1);
        setLoop(false);
        setStopOnNew(false);
        setColor('#FFD700');
        setRow(prefillRow);
        setCol(prefillCol);
      }
      setError('');
    }
  }, [visible, editButton, prefillRow, prefillCol]);

  function validate() {
    if (!name.trim()) return 'กรุณาใส่ชื่อปุ่ม';
    if (!rawUrl.trim()) return 'กรุณาใส่ URL หรืออัพโหลดไฟล์';
    const r = parseInt(row, 10);
    const c = parseInt(col, 10);
    if (isNaN(r) || r < 0) return 'แถวต้องเป็นตัวเลข ≥ 0';
    if (isNaN(c) || c < 0) return 'คอลัมน์ต้องเป็นตัวเลข ≥ 0';
    const conflict = buttons.some(
      (b) => b.row === r && b.col === c && b.id !== editButton?.id,
    );
    if (conflict) return `ตำแหน่ง (${r},${c}) มีปุ่มอยู่แล้ว`;
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    onSave({
      name: name.trim(),
      soundSource: {
        type: 'url',
        url: rawUrl.trim(),
        originalName: null,
      },
      volume,
      loop,
      stopOnNew,
      color,
      row: parseInt(row, 10),
      col: parseInt(col, 10),
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{editButton ? 'แก้ไขปุ่มเสียง' : 'เพิ่มปุ่มเสียง'}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#999" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

            {/* Name */}
            <Text style={styles.label}>ชื่อปุ่ม</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="เช่น Fanfare, Applause..."
              placeholderTextColor="#555"
            />

            {/* URL Input */}
            <Text style={styles.label}>URL เสียง</Text>
            <TextInput
              style={styles.input}
              value={rawUrl}
              onChangeText={setRawUrl}
              placeholder="https://example.com/sound.mp3"
              placeholderTextColor="#555"
              autoCapitalize="none"
              keyboardType="url"
            />

            {/* Position */}
            <Text style={styles.label}>ตำแหน่ง (แถว / คอลัมน์)</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.inputHalf]}
                value={String(row)}
                onChangeText={setRow}
                keyboardType="numeric"
                placeholder="แถว"
                placeholderTextColor="#555"
              />
              <TextInput
                style={[styles.input, styles.inputHalf]}
                value={String(col)}
                onChangeText={setCol}
                keyboardType="numeric"
                placeholder="คอลัมน์"
                placeholderTextColor="#555"
              />
            </View>

            {/* Volume */}
            <Text style={styles.label}>ระดับเสียง ({Math.round(volume * 100)}%)</Text>
            <View style={styles.row}>
              {VOLUME_PRESETS.map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setVolume(v)}
                  style={[styles.radioBtn, volume === v && styles.radioBtnActive]}
                >
                  <Text style={[styles.radioText, volume === v && styles.radioTextActive]}>
                    {Math.round(v * 100)}%
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Toggles */}
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setLoop((v) => !v)}
                style={[styles.toggleBtn, loop && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, loop && styles.toggleTextActive]}>
                  🔁 วนซ้ำ
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setStopOnNew((v) => !v)}
                style={[styles.toggleBtn, stopOnNew && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, stopOnNew && styles.toggleTextActive]}>
                  ⏹ หยุดเสียงเดิม
                </Text>
              </Pressable>
            </View>

            {/* Color */}
            <Text style={styles.label}>สี</Text>
            <View style={styles.colorGrid}>
              {COLOR_PALETTE.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    color === c && styles.colorSwatchActive,
                  ]}
                />
              ))}
            </View>

            {/* Error */}
            {!!error && <Text style={styles.errorText}>{error}</Text>}

          </ScrollView>

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveText}>{editButton ? 'บันทึก' : 'เพิ่มปุ่ม'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  closeBtn: { padding: 4 },
  body: { padding: 16, gap: 8 },
  label: { color: '#aaa', fontSize: 12, fontWeight: '600', marginTop: 8 },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 14,
  },
  inputHalf: { flex: 1 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  radioBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  radioBtnActive: { backgroundColor: Colors.accent },
  radioText: { color: '#999', fontSize: 13 },
  radioTextActive: { color: '#121212', fontWeight: '700' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: '#333', borderWidth: 1, borderColor: Colors.accent },
  toggleText: { color: '#999', fontSize: 13 },
  toggleTextActive: { color: Colors.accent, fontWeight: '700' },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchActive: { borderColor: '#fff' },
  errorText: { color: '#F44336', fontSize: 13, marginTop: 4 },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  cancelBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  cancelText: { color: '#999', fontSize: 15 },
  saveBtn: {
    flex: 2,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  saveText: { color: '#121212', fontSize: 15, fontWeight: '700' },
});
