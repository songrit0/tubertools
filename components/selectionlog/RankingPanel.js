import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { Trash2, X } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export default function RankingPanel({ isLoading, ranking, vtubersInUse, vtubers, isRemovingAll, onRemoveCharacter, onRemoveAllInUse }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>อันดับ VTuber</Text>
      <Text style={styles.panelSubtitle}>เรียงจากที่ถูกเลือกมากที่สุด</Text>

      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: 24 }} />
      ) : ranking.length === 0 ? (
        <Text style={styles.emptySubtitle}>ยังไม่มีข้อมูล</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
          {ranking.map((item, index) => (
            <View key={item.id} style={styles.rankRow}>
              <Text style={[styles.rankNum, index < 3 && { color: MEDAL_COLORS[index], fontWeight: 'bold' }]}>
                {index + 1}
              </Text>
              <Image source={{ uri: item.imageUrl }} style={styles.rankAvatar} />
              <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.countBarWrap}>
                <View style={[
                  styles.countBar,
                  {
                    width: `${Math.round((item.count / (ranking[0]?.count || 1)) * 100)}%`,
                    backgroundColor: index < 3 ? MEDAL_COLORS[index] : '#333',
                  }
                ]} />
              </View>
              <Text style={[styles.countNum, index < 3 && { color: MEDAL_COLORS[index] }]}>
                {item.count}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A' }}>
        <Text style={styles.panelTitle}>VTuber ที่ถูกlogin</Text>
        <Text style={styles.panelSubtitle}>{vtubersInUse.length} ตัวละคร</Text>

        {vtubersInUse.length === 0 ? (
          <Text style={styles.emptySubtitle}>ไม่มีตัวละครที่ถูกlogin</Text>
        ) : (
          <View style={{ marginTop: 8, gap: 6 }}>
            {vtubersInUse.map((charId) => {
              const character = vtubers.find(c => c.id === charId);
              return (
                <View key={charId} style={styles.lockedCharRow}>
                  {character?.imageUrl && (
                    <Image source={{ uri: character.imageUrl }} style={styles.lockedCharAvatar} />
                  )}
                  <Text style={styles.lockedCharName} numberOfLines={1}>
                    {character?.name || charId}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                    onPress={() => onRemoveCharacter(charId)}
                  >
                    <X size={14} color="#fff" />
                  </Pressable>
                </View>
              );
            })}
            <Pressable
              style={({ pressed }) => [
                styles.removeAllBtn,
                isRemovingAll && { opacity: 0.5 },
                pressed && { opacity: 0.7 },
              ]}
              onPress={onRemoveAllInUse}
              disabled={isRemovingAll}
            >
              <Trash2 size={14} color="#fff" />
              <Text style={styles.removeAllBtnText}>
                {isRemovingAll ? 'กำลังลบ...' : 'ลบทั้งหมด'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16 },
  panelTitle: { color: '#fff', fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  panelSubtitle: { color: Colors.textSecondary, fontSize: 12 },
  emptySubtitle: { color: Colors.textSecondary, fontSize: 13, marginTop: 8 },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  rankNum: { width: 22, textAlign: 'center', color: Colors.textSecondary, fontSize: 12 },
  rankAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.cardBg },
  rankName: { flex: 1, color: Colors.text, fontSize: 13, fontWeight: '600' },
  countBarWrap: { width: 50, height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, overflow: 'hidden' },
  countBar: { height: '100%', borderRadius: 2 },
  countNum: { width: 24, color: Colors.textSecondary, fontSize: 13, fontWeight: 'bold', textAlign: 'right' },

  lockedCharRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#FF6B6B',
  },
  lockedCharAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.cardBg },
  lockedCharName: { flex: 1, color: Colors.text, fontSize: 12, fontWeight: '600' },
  removeBtn: {
    width: 24, height: 24, borderRadius: 4,
    backgroundColor: '#C0392B', justifyContent: 'center', alignItems: 'center',
  },
  removeAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, backgroundColor: '#C0392B', borderRadius: 6, marginTop: 4,
  },
  removeAllBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
