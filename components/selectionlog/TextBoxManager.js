import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { MessageSquare, Plus, ChevronUp, ChevronDown, Eye, Check, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { useTextBoxes, TEXT_BOX_GROUPS, TEXT_BOX_COLORS } from '../../hooks/useTextBoxes';

export default function TextBoxManager() {
  const {
    textBoxes, newBoxText, setNewBoxText,
    newBoxColor, setNewBoxColor, newBoxSelectedColor, setNewBoxSelectedColor,
    newBoxGroup, setNewBoxGroup, activeGroup,
    handleAddTextBox, handleMoveTextBox, handleShowGroup, handleApplyColors,
    handleToggleTextBox, handleRemoveTextBox, handleShowAllTextBoxes, handleSelectTextBox,
  } = useTextBoxes();

  return (
    <View style={[styles.panel, { borderTopWidth: 1, borderTopColor: '#2A2A2A' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={16} color={Colors.accent} />
          <Text style={styles.panelTitle}>กล่องข้อความ</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Pressable
            style={({ pressed }) => [styles.showAllBtn, { backgroundColor: '#27AE60' }, pressed && { opacity: 0.7 }]}
            onPress={() => handleShowAllTextBoxes(true)}
          >
            <Text style={styles.showAllBtnText}>แสดงทั้งหมด</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.showAllBtn, { backgroundColor: '#555' }, pressed && { opacity: 0.7 }]}
            onPress={() => handleShowAllTextBoxes(false)}
          >
            <Text style={styles.showAllBtnText}>ซ่อนทั้งหมด</Text>
          </Pressable>
        </View>
      </View>

      {/* Color settings */}
      <View style={styles.settingsBox}>
        <View style={styles.colorRow}>
          <Text style={styles.colorLabel}>สีปกติ</Text>
          <View style={styles.colorPicker}>
            {TEXT_BOX_COLORS.map(c => (
              <Pressable
                key={c.value}
                style={[styles.colorDot, { backgroundColor: c.value }, newBoxColor === c.value && styles.colorDotActive]}
                onPress={() => setNewBoxColor(c.value)}
              />
            ))}
          </View>
        </View>
        <View style={styles.colorRow}>
          <Text style={styles.colorLabel}>สีเลือก</Text>
          <View style={styles.colorPicker}>
            {TEXT_BOX_COLORS.map(c => (
              <Pressable
                key={c.value}
                style={[styles.colorDot, { backgroundColor: c.value }, newBoxSelectedColor === c.value && styles.colorDotActive]}
                onPress={() => setNewBoxSelectedColor(c.value)}
              />
            ))}
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.7 }]}
          onPress={handleApplyColors}
        >
          <Text style={styles.applyBtnText}>ใช้สีกับทุกกล่อง</Text>
        </Pressable>
      </View>

      {/* Group tabs */}
      <View style={styles.groupSection}>
        <Text style={styles.colorLabel}>กลุ่ม</Text>
        <View style={styles.groupTabs}>
          {TEXT_BOX_GROUPS.map(g => (
            <Pressable
              key={g}
              style={[styles.groupTab, activeGroup === g && styles.groupTabActive]}
              onPress={() => handleShowGroup(g)}
            >
              <Text style={[styles.groupTabText, activeGroup === g && styles.groupTabTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Add new text box */}
      <View style={[styles.addRow, { marginTop: 8 }]}>
        <Pressable
          style={[styles.groupBadge, { backgroundColor: '#333' }]}
          onPress={() => {
            const i = TEXT_BOX_GROUPS.indexOf(newBoxGroup);
            setNewBoxGroup(TEXT_BOX_GROUPS[(i + 1) % TEXT_BOX_GROUPS.length]);
          }}
        >
          <Text style={styles.groupBadgeText}>{newBoxGroup}</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          value={newBoxText}
          onChangeText={setNewBoxText}
          placeholder="พิมพ์ข้อความ..."
          placeholderTextColor="#666"
          onSubmitEditing={handleAddTextBox}
        />
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
          onPress={handleAddTextBox}
        >
          <Plus size={16} color="#fff" />
        </Pressable>
      </View>

      {/* Text box list */}
      {textBoxes.length === 0 ? (
        <Text style={[styles.emptyText, { marginTop: 12 }]}>ยังไม่มีกล่องข้อความ</Text>
      ) : (
        <View style={{ marginTop: 8, gap: 4 }}>
          {textBoxes.map((box, index) => (
            <View
              key={box.id}
              style={[styles.item, { borderLeftColor: box.selected ? (box.selectedColor || newBoxSelectedColor) : (box.color || newBoxColor) }]}
            >
              <View style={styles.moveCol}>
                <Pressable
                  style={({ pressed }) => [styles.moveBtn, pressed && { opacity: 0.5 }, index === 0 && { opacity: 0.2 }]}
                  onPress={() => handleMoveTextBox(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp size={10} color="#fff" />
                </Pressable>
                <Text style={styles.itemIndex}>{index + 1}</Text>
                <Pressable
                  style={({ pressed }) => [styles.moveBtn, pressed && { opacity: 0.5 }, index === textBoxes.length - 1 && { opacity: 0.2 }]}
                  onPress={() => handleMoveTextBox(index, 'down')}
                  disabled={index === textBoxes.length - 1}
                >
                  <ChevronDown size={10} color="#fff" />
                </Pressable>
              </View>
              <Text style={[styles.groupBadgeSmall, { backgroundColor: '#333' }]}>{box.group || 'A'}</Text>
              <View style={[styles.previewBox, { backgroundColor: box.selected ? (box.selectedColor || newBoxSelectedColor) : (box.color || newBoxColor) }]}>
                <Text style={styles.previewText}>{box.text}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.selectBtn,
                  box.selected ? { backgroundColor: box.selectedColor || newBoxSelectedColor } : styles.selectOff,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => handleSelectTextBox(box.id)}
              >
                <Check size={12} color="#fff" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.toggleBtn,
                  box.visible ? styles.toggleOn : styles.toggleOff,
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
}

const styles = StyleSheet.create({
  panel: { padding: 16 },
  panelTitle: { color: Colors.text, fontSize: 15, fontWeight: 'bold' },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },

  showAllBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  showAllBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  settingsBox: { backgroundColor: '#1A1A1A', borderRadius: 6, padding: 8, gap: 6 },
  colorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorLabel: { color: Colors.textSecondary, fontSize: 10, fontWeight: 'bold', width: 40 },
  colorPicker: { flexDirection: 'row', gap: 4 },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff' },
  applyBtn: { backgroundColor: Colors.accent, borderRadius: 4, paddingVertical: 6, alignItems: 'center', marginTop: 2 },
  applyBtnText: { color: '#000', fontSize: 11, fontWeight: 'bold' },

  groupSection: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  groupTabs: { flexDirection: 'row', gap: 4, flex: 1 },
  groupTab: { flex: 1, paddingVertical: 6, borderRadius: 4, backgroundColor: '#252525', alignItems: 'center' },
  groupTabActive: { backgroundColor: Colors.accent },
  groupTabText: { color: Colors.textSecondary, fontSize: 11, fontWeight: 'bold' },
  groupTabTextActive: { color: '#000' },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    flex: 1, backgroundColor: '#1A1A1A', color: '#fff', fontSize: 13,
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#333',
  },
  addBtn: { width: 32, height: 32, borderRadius: 6, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center' },

  groupBadge: { width: 28, height: 32, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  groupBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  groupBadgeSmall: { color: '#aaa', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 3, textAlign: 'center', overflow: 'hidden' },

  item: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1A1A1A', borderRadius: 6, padding: 6, borderLeftWidth: 3 },
  moveCol: { alignItems: 'center', gap: 1 },
  moveBtn: { padding: 2 },
  itemIndex: { color: Colors.textSecondary, fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  previewBox: { flex: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  previewText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  selectBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 },
  selectOff: { backgroundColor: '#333' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 },
  toggleOn: { backgroundColor: '#27AE60' },
  toggleOff: { backgroundColor: '#555' },
  removeBtn: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#C0392B', justifyContent: 'center', alignItems: 'center' },
});
