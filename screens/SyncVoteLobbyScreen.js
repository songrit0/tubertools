import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { loginWithGoogle, loginAnonymously } from '../services/authService';
import { createRoom, subscribeActiveRoom } from '../services/syncVoteService';
import { TOKENS, FONT_MONO, Pill, Panel } from '../components/syncvote/Primitives';

function notify(title, msg) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export default function SyncVoteLobbyScreen({ navigation, route }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const mode = route?.params?.mode;
  const showHost = mode !== 'join';
  const showJoin = mode !== 'host';

  useEffect(() => subscribeActiveRoom(setActiveRoom), []);

  // Auto-enter player flow.
  useEffect(() => {
    if (!showJoin || !activeRoom?.code) return;
    let cancelled = false;
    (async () => {
      if (!user) {
        try { await loginAnonymously(); }
        catch (e) { notify('Auth failed', e.message || 'Could not sign in.'); return; }
      }
      if (cancelled) return;
      navigation.replace('SyncVoteJoin', { code: activeRoom.code });
    })();
    return () => { cancelled = true; };
  }, [showJoin, activeRoom, user, navigation]);

  // Auto-resume host into an existing room.
  useEffect(() => {
    if (!showHost || showJoin) return;
    if (activeRoom?.code) navigation.replace('SyncVoteHost', { code: activeRoom.code });
  }, [showHost, showJoin, activeRoom, navigation]);

  async function handleCreate() {
    setBusy(true);
    let u = user;
    if (!u || u.isAnonymous) {
      try { const cred = await loginWithGoogle(); u = cred.user; }
      catch { setBusy(false); notify('Sign-in required', 'Crew mode needs a Google account.'); return; }
    }
    const r = await createRoom(u.uid);
    setBusy(false);
    if (!r.success) { notify('Create failed', r.error || 'Unknown error'); return; }
    navigation.replace('SyncVoteHost', { code: r.code });
  }

  // Player standby view.
  if (showJoin && !showHost) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topbar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <ArrowLeft size={16} color={TOKENS.ink3} />
            <Text style={styles.backTxt}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.standbyWrap}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandMarkTxt}>S</Text></View>
            <Text style={styles.brandName}>Sync-Vote</Text>
          </View>

          <Panel padding={20} style={{ width: '100%', maxWidth: 360, alignItems: 'center', gap: 14 }}>
            <View style={styles.bullseye}>
              <View style={[styles.ring, { width: 72, height: 72, borderRadius: 36, opacity: 0.12 }]} />
              <View style={[styles.ring, { width: 52, height: 52, borderRadius: 26, opacity: 0.25 }]} />
              <View style={[styles.ring, { width: 30, height: 30, borderRadius: 15, opacity: 0.5 }]} />
              <View style={styles.bullseyeDot} />
            </View>
            <Pill tone="gold">
              {activeRoom?.code ? 'CONNECTING…' : 'WAITING FOR CREW'}
            </Pill>
            <Text style={styles.standbyHero}>ทีมงานกำลังทำบ้าอะไรอยู่ไม่รู้</Text>
            <Text style={styles.standbySub}>
              Listening for a control terminal to open a session.
            </Text>
          </Panel>

          {user ? (
            <Text style={styles.anonId}>
              {user.isAnonymous ? 'ANON' : 'AUTH'} · ID {(user.uid || '').slice(0, 5).toUpperCase()}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTxt}>Sync-Vote Pro</Text>
          <Text style={styles.footerTxt}>Network OK</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Crew create view (only renders momentarily — auto-resume kicks in if a room exists).
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft size={16} color={TOKENS.ink3} />
          <Text style={styles.backTxt}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.crewCenter}>
        <Text style={styles.crewKicker}>STEP 01 OF 03</Text>
        <Text style={styles.crewTitle}>Open a session</Text>
        <Text style={styles.crewSub}>
          Creates a fresh room. Players watching the lobby will be pulled in automatically.
        </Text>

        <TouchableOpacity
          disabled={busy}
          onPress={handleCreate}
          activeOpacity={0.85}
          style={[styles.primary, busy && { opacity: 0.6 }]}
        >
          {busy ? (
            <ActivityIndicator color={TOKENS.goldInk} />
          ) : (
            <View style={styles.primaryRow}>
              <Plus size={16} color={TOKENS.goldInk} />
              <Text style={styles.primaryTxt}>Create room</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.crewHint}>Signs you in with Google.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.bg },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: TOKENS.line },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backTxt: { color: TOKENS.ink3, fontSize: 13 },

  // Player standby
  standbyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 22, maxWidth: 480, alignSelf: 'center', width: '100%' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 28, height: 28, borderRadius: 8, backgroundColor: TOKENS.gold, alignItems: 'center', justifyContent: 'center' },
  brandMarkTxt: { color: TOKENS.goldInk, fontWeight: '800' },
  brandName: { color: TOKENS.ink, fontSize: 20, fontWeight: '700' },

  bullseye: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1.5, borderColor: TOKENS.gold },
  bullseyeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: TOKENS.gold },

  standbyHero: { color: TOKENS.ink, fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 26 },
  standbySub: { color: TOKENS.ink3, fontSize: 12, textAlign: 'center' },

  anonId: { color: TOKENS.ink4, fontSize: 11, fontFamily: FONT_MONO },

  footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, borderTopColor: TOKENS.line },
  footerTxt: { color: TOKENS.ink3, fontSize: 11 },

  // Crew create
  crewCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10, maxWidth: 480, alignSelf: 'center', width: '100%' },
  crewKicker: { color: TOKENS.ink3, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' },
  crewTitle: { color: TOKENS.ink, fontSize: 26, fontWeight: '700', marginTop: 4 },
  crewSub: { color: TOKENS.ink3, fontSize: 13, textAlign: 'center', marginBottom: 18 },
  primary: { backgroundColor: TOKENS.gold, paddingHorizontal: 22, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minWidth: 220 },
  primaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryTxt: { color: TOKENS.goldInk, fontWeight: '700', fontSize: 14 },
  crewHint: { color: TOKENS.ink4, fontSize: 11, marginTop: 6 },
});
