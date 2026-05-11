import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Platform, Alert, ScrollView,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { subscribeRoom, joinSlot } from '../services/syncVoteService';
import { findSlotForUid } from '../utils/syncVoteConsensus';
import {
  TOKENS, FONT_MONO, Pill, RoomChip, VAvatar,
} from '../components/syncvote/Primitives';

function notify(title, msg) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export default function SyncVoteJoinScreen({ navigation, route }) {
  const { code } = route.params || {};
  const { user } = useAuth();
  const [room, setRoom] = useState(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!code) return;
    return subscribeRoom(code, (r) => setRoom(r || null));
  }, [code]);

  useEffect(() => {
    if (room === null) navigation.replace('SyncVoteThankYou');
  }, [room, navigation]);

  useEffect(() => {
    if (!room || !user) return;
    const mine = findSlotForUid(room, user.uid);
    if (mine) navigation.replace('SyncVotePlayer', { code, slot: mine });
  }, [room, user, code, navigation]);

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={TOKENS.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const n = room.activePlayers || 0;
  const slots = Array.from({ length: n }, (_, i) => i + 1)
    .filter((i) => !!room[`player${i}`]?.vtuberId);

  async function pickSlot(i) {
    if (!user) return;
    setBusy(true);
    const r = await joinSlot(code, i, user.uid);
    setBusy(false);
    if (!r.success) { notify('Slot unavailable', r.error || 'Try another slot.'); return; }
    navigation.replace('SyncVotePlayer', { code, slot: i });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={16} color={TOKENS.ink3} />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>
        <RoomChip code={code} size="md" />
      </View>

      <View style={styles.headerBlock}>
        <Text style={styles.kicker}>STEP 02 OF 03</Text>
        <Text style={styles.title}>Pick your slot</Text>
        <Text style={styles.sub}>เลือกตัวที่ทีมงานกำหนดให้คุณ — ที่เหลือคือสล็อตของเพื่อน</Text>
      </View>

      {slots.length === 0 ? (
        <View style={styles.waiting}>
          <View style={styles.spinnerRing}>
            <ActivityIndicator color={TOKENS.gold} />
          </View>
          <Pill tone="gold">STANDBY</Pill>
          <Text style={styles.waitTitle}>ทีมงานกำลังทำบ้าอะไรอยู่ไม่รู้</Text>
          <Text style={styles.waitSub}>รอทีมงานเลือกผู้เล่นสักครู่…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, gap: 10 }}>
          {slots.map((i) => {
            const s = room[`player${i}`] || {};
            const taken = !!s.uid;
            const isMine = s.uid === user?.uid;
            const tone = isMine ? 'gold' : taken ? 'neutral' : 'green';
            const label = isMine ? 'YOU' : taken ? 'TAKEN' : 'READY';
            return (
              <TouchableOpacity
                key={i}
                disabled={busy || (taken && !isMine)}
                onPress={() => pickSlot(i)}
                activeOpacity={0.85}
                style={[
                  styles.slotRow,
                  isMine && { borderColor: TOKENS.gold, backgroundColor: 'rgba(255,214,107,0.08)' },
                  taken && !isMine && { opacity: 0.5 },
                ]}
              >
                <VAvatar name={s.name} imageUrl={s.imageUrl} size={44} ring={isMine} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.slotKicker}>SLOT {String(i).padStart(2, '0')}</Text>
                  <Text style={styles.slotName} numberOfLines={1}>{s.name || `ผู้เล่น ${i}`}</Text>
                </View>
                <Pill tone={tone}>{label}</Pill>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerTxt}>
          {slots.length === 0 ? 'Awaiting roster' : `${slots.length} slot${slots.length === 1 ? '' : 's'} configured`}
        </Text>
        <Text style={styles.footerMono}>{code}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: TOKENS.line },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backTxt: { color: TOKENS.ink3, fontSize: 13 },

  headerBlock: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 14 },
  kicker: { color: TOKENS.ink3, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  title: { color: TOKENS.ink, fontSize: 24, fontWeight: '700', marginTop: 6 },
  sub: { color: TOKENS.ink3, fontSize: 13, marginTop: 6 },

  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  spinnerRing: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,214,107,0.4)' },
  waitTitle: { color: TOKENS.ink, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  waitSub: { color: TOKENS.ink3, fontSize: 13 },

  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: TOKENS.surface, borderWidth: 1, borderColor: TOKENS.line2, borderRadius: 10 },
  slotKicker: { color: TOKENS.ink3, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  slotName: { color: TOKENS.ink, fontSize: 16, fontWeight: '700', marginTop: 2 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, borderTopColor: TOKENS.line },
  footerTxt: { color: TOKENS.ink3, fontSize: 11 },
  footerMono: { color: TOKENS.ink3, fontSize: 11, fontFamily: FONT_MONO, letterSpacing: 2 },
});
