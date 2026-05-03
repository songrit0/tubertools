import { View, Text, StyleSheet, FlatList, Image, Pressable, ActivityIndicator } from 'react-native';
import { Eye } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

function formatTime(timestamp) {
  try {
    return new Date(timestamp).toLocaleString('th-TH', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

export default function LogPanel({ isLoading, selections, onShowPreview }) {
  return (
    <View style={styles.panel}>
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
                onPress={() => onShowPreview(item)}
              >
                <Eye size={16} color={Colors.accent} />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, padding: 16 },

  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    marginBottom: 4,
  },
  logHeaderCell: { color: Colors.textSecondary, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },

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
  logIndex: { width: 28, color: Colors.textSecondary, fontSize: 11, textAlign: 'center' },
  personCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  logAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.cardBg },
  personName: { flex: 1, color: Colors.text, fontSize: 12, fontWeight: '600' },
  logArrow: { width: 24, color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
  timeText: { width: 80, color: Colors.textSecondary, fontSize: 10, textAlign: 'right' },
  previewBtn: {
    width: 32, height: 32, borderRadius: 6,
    backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },

  loadingBox: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  loadingText: { color: Colors.textSecondary, fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 8 },
});
