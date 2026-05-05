import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, StyleSheet,
} from 'react-native';
import { Plus, Trash2, Check } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

export default function ChannelTabs({
  channels, activeChannelId, onSelect, onAdd, onRename, onDelete,
}) {
  const [renamingId, setRenamingId] = useState(null);
  const [renameText, setRenameText] = useState('');

  function startRename(ch) {
    setRenamingId(ch.id);
    setRenameText(ch.name);
  }

  async function commitRename(ch) {
    if (renameText.trim() && renameText.trim() !== ch.name) {
      await onRename(ch.id, renameText.trim());
    }
    setRenamingId(null);
  }

  function handleBlur(ch) {
    // delay เพื่อให้ปุ่ม Trash/Check มีเวลา trigger ก่อน onBlur ปิด rename mode
    setTimeout(() => commitRename(ch), 200);
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {channels.map((ch) => {
          const isActive = ch.id === activeChannelId;
          const isRenaming = renamingId === ch.id;

          return (
            <Pressable
              key={ch.id}
              onPress={() => { if (!isRenaming) onSelect(ch.id); }}
              onLongPress={() => startRename(ch)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              {isRenaming ? (
                <View style={styles.renameRow}>
                  <TextInput
                    style={styles.renameInput}
                    value={renameText}
                    onChangeText={setRenameText}
                    autoFocus
                    onSubmitEditing={() => commitRename(ch)}
                    onBlur={() => handleBlur(ch)}
                    selectTextOnFocus
                  />
                  <Pressable onPress={() => commitRename(ch)} style={styles.iconBtn}>
                    <Check size={14} color={Colors.accent} />
                  </Pressable>
                  <Pressable
                    onPress={() => { onDelete(ch.id); setRenamingId(null); }}
                    style={styles.iconBtn}
                  >
                    <Trash2 size={14} color="#F44336" />
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.tabText, isActive && styles.tabTextActive]} numberOfLines={1}>
                  {ch.name}
                </Text>
              )}
            </Pressable>
          );
        })}

        <Pressable onPress={onAdd} style={styles.addBtn}>
          <Plus size={18} color={Colors.accent} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  scroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    minWidth: 80,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    color: '#999',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#121212',
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  renameInput: {
    color: '#121212',
    fontSize: 13,
    fontWeight: '600',
    minWidth: 60,
    maxWidth: 120,
    padding: 0,
  },
  iconBtn: {
    padding: 2,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
    borderStyle: 'dashed',
  },
});
