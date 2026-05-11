import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { ArrowLeft, AlertTriangle } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeRoom, setChoice, submitFinal, takeOver, leaveSlot,
} from '../services/syncVoteService';
import { computeAllMatch } from '../utils/syncVoteConsensus';
import {
  TOKENS, FONT_MONO, PROTOCOL_META,
  Pill, RoomChip, VAvatar,
} from '../components/syncvote/Primitives';

const CHOICES = ['A', 'B', 'C'];

function notify(title, msg) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

function tint(hex, alpha) {
  const m = (hex || '').match(/^#([\da-f]{6})$/i);
  if (!m) return TOKENS.surface;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export default function SyncVotePlayerScreen({ navigation, route }) {
  const { code, slot } = route.params || {};
  const { user } = useAuth();
  const [room, setRoom] = useState(undefined);

  useEffect(() => {
    if (!code) return;
    return subscribeRoom(code, (r) => setRoom(r || null));
  }, [code]);

  // Bounce on room close or persona re-assignment.
  useEffect(() => {
    if (room === null) {
      navigation.replace('SyncVoteThankYou');
      return;
    }
    if (!room || !user) return;
    const mySlot = room[`player${slot}`];
    if (!mySlot || mySlot.uid !== user.uid) navigation.replace('SyncVoteThankYou');
  }, [room, user, slot, navigation]);

  if (room === undefined || room === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={TOKENS.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const me = room[`player${slot}`] || {};
  const theme = room.themeColor || 'yellow';
  const meta = PROTOCOL_META[theme];
  const locked = !!room.locked || !!me.isFinal;
  const synced = computeAllMatch(room);
  const accent = (me.isFinal || room.locked) ? TOKENS.pCyan : meta.color;

  // Round number isn't a tracked concept yet — keep static placeholder.
  async function pick(letter) {
    if (locked) return;
    await setChoice(code, slot, me.choice === letter ? null : letter);
  }
  async function handleSubmit() {
    if (!synced || locked) return;
    await submitFinal(code, slot);
  }
  async function handleTakeOver() {
    if (locked) return;
    if (!me.choice) { notify('Select first', 'Choose A, B, or C before forcing sync.'); return; }
    await takeOver(code, me.choice);
  }
  async function disconnect() {
    if (user) await leaveSlot(code, slot, user.uid);
    navigation.replace('SyncVoteThankYou');
  }

  const submitText = me.isFinal ? '◼ Signal locked' : synced ? '▸ Submit consensus' : '○ Submit consensus';
  const submitReady = synced && !locked;

  // Footer status text.
  let statusText;
  if (me.isFinal) statusText = 'Your signal locked';
  else if (room.locked) statusText = 'Terminal state';
  else if (synced) statusText = 'Systems synchronized';
  else if (me.choice) statusText = 'Awaiting sync';
  else statusText = 'Waiting for input';

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={disconnect} style={styles.backBtn}>
          <ArrowLeft size={16} color={TOKENS.ink3} />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>
        <RoomChip code={code} size="md" />
      </View>

      {/* Persona row */}
      <View style={styles.personaRow}>
        <VAvatar name={me.name} imageUrl={me.imageUrl} size={52} ring={!!me.choice} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.slotLine}>Slot {String(slot).padStart(2, '0')} · You</Text>
          <Text style={styles.persona} numberOfLines={1}>{me.name || `ผู้เล่น ${slot}`}</Text>
        </View>
        <Pill
          tone={me.isFinal || room.locked ? 'cyan' : synced ? 'green' : me.choice ? 'gold' : 'neutral'}
          dot
        >
          {meta.label}
        </Pill>
      </View>

      <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
        <Text style={styles.hint}>Tap a signal. Lock when everyone matches.</Text>
      </View>

      {/* Three buttons */}
      <View style={styles.choices}>
        {CHOICES.map((L) => {
          const picked = me.choice === L;
          const lockedHere = picked && (me.isFinal || room.locked);
          const bg = lockedHere
            ? tint(accent, 0.18)
            : picked
              ? tint(accent, 0.12)
              : TOKENS.surface;
          return (
            <TouchableOpacity
              key={L}
              disabled={locked}
              onPress={() => pick(L)}
              activeOpacity={0.85}
              style={[
                styles.choiceCell,
                { backgroundColor: bg, borderColor: picked ? accent : TOKENS.line2 },
                locked && !picked && { opacity: 0.5 },
              ]}
            >
              <Text style={[styles.choiceCorner, { color: picked ? accent : TOKENS.ink4 }]}>{L}</Text>
              <Text style={[styles.choiceLetter, { color: picked ? accent : TOKENS.ink3 }]}>{L}</Text>
              {lockedHere ? (
                <View style={[styles.choiceLock, { borderColor: accent }]}>
                  <Text style={[styles.choiceLockTxt, { color: accent }]}>LOCK</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      {/* CTAs */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          disabled={!submitReady && !me.isFinal}
          onPress={handleSubmit}
          activeOpacity={0.85}
          style={[
            styles.submit,
            me.isFinal && { backgroundColor: TOKENS.pCyan },
            submitReady && !me.isFinal && { backgroundColor: TOKENS.gold },
            !submitReady && !me.isFinal && { backgroundColor: TOKENS.surface, borderWidth: 1, borderColor: TOKENS.line2 },
          ]}
        >
          <Text style={[
            styles.submitTxt,
            { color: me.isFinal ? '#031318' : submitReady ? TOKENS.goldInk : TOKENS.ink4 },
          ]}>
            {submitText}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={locked}
          onPress={handleTakeOver}
          activeOpacity={0.85}
          style={[styles.forceBtn, locked && { opacity: 0.4 }]}
        >
          <AlertTriangle size={14} color={TOKENS.pRed} />
          <Text style={styles.forceTxt}>Force sync · Take over</Text>
        </TouchableOpacity>
      </View>

      {/* Footer status */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.footerDot, { backgroundColor: me.choice ? accent : TOKENS.ink4 }]} />
          <Text style={styles.footerTxt}>{statusText}</Text>
        </View>
        <Text style={styles.footerMono}>{room.activePlayers} pilots</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: TOKENS.line },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backTxt: { color: TOKENS.ink3, fontSize: 13 },

  personaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 12 },
  slotLine: { color: TOKENS.ink3, fontSize: 11 },
  persona: { color: TOKENS.ink, fontSize: 18, fontWeight: '700', marginTop: 2 },

  hint: { color: TOKENS.ink3, fontSize: 13 },

  choices: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingTop: 6 },
  choiceCell: { flex: 1, aspectRatio: 1 / 1.15, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  choiceCorner: { position: 'absolute', top: 8, left: 12, fontFamily: FONT_MONO, fontSize: 10, fontWeight: '500' },
  choiceLetter: { fontSize: 70, lineHeight: 74, fontWeight: '800' },
  choiceLock: { position: 'absolute', bottom: 8, right: 10, borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  choiceLockTxt: { fontFamily: FONT_MONO, fontSize: 9, fontWeight: '600' },

  ctaWrap: { paddingHorizontal: 18, paddingBottom: 14, gap: 8 },
  submit: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  submitTxt: { fontSize: 14, fontWeight: '700' },
  forceBtn: { height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(239,87,87,0.08)', borderWidth: 1, borderColor: 'rgba(239,87,87,0.30)' },
  forceTxt: { color: TOKENS.pRed, fontSize: 13, fontWeight: '600' },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, borderTopColor: TOKENS.line },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerDot: { width: 6, height: 6, borderRadius: 3 },
  footerTxt: { color: TOKENS.ink3, fontSize: 11 },
  footerMono: { color: TOKENS.ink4, fontSize: 10, fontFamily: FONT_MONO },
});
