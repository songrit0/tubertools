import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { CornerDownLeft } from 'lucide-react-native';
import { TOKENS, FONT_MONO, Pill } from '../components/syncvote/Primitives';

const TOTAL_MS = 6000;

export default function SyncVoteThankYouScreen({ navigation }) {
  const [elapsed, setElapsed] = useState(0);
  const start = useRef(Date.now());

  useEffect(() => {
    const tick = setInterval(() => {
      const e = Date.now() - start.current;
      setElapsed(Math.min(e, TOTAL_MS));
      if (e >= TOTAL_MS) {
        clearInterval(tick);
        navigation.replace('SelectGame');
      }
    }, 100);
    return () => clearInterval(tick);
  }, [navigation]);

  const remaining = Math.max(0, Math.ceil((TOTAL_MS - elapsed) / 1000));
  const progress = elapsed / TOTAL_MS;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Pill tone="gold">PROTOCOL CLOSED</Pill>
        <Text style={styles.heroThai}>ขอบคุณที่ร่วมเล่น</Text>
        <Text style={styles.heroSub}>Thanks for syncing</Text>

        <View style={styles.cta}>
          <TouchableOpacity
            onPress={() => navigation.replace('SelectGame')}
            activeOpacity={0.85}
            style={styles.primary}
          >
            <View style={styles.primaryRow}>
              <CornerDownLeft size={16} color={TOKENS.goldInk} />
              <Text style={styles.primaryTxt}>Return to lobby</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.countdown}>
            <Text style={styles.countdownLabel}>Auto-return in</Text>
            <Text style={styles.countdownNum}>{String(remaining).padStart(2, '0')}s</Text>
          </View>

          <View style={styles.progressBg}>
            <View style={[styles.progressFg, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18, maxWidth: 460, alignSelf: 'center', width: '100%' },
  heroThai: { color: TOKENS.gold, fontSize: 34, fontWeight: '800', textAlign: 'center', lineHeight: 38, marginTop: 4 },
  heroSub: { color: TOKENS.ink3, fontSize: 14 },
  cta: { width: '100%', marginTop: 12, gap: 10 },
  primary: { backgroundColor: TOKENS.gold, height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryTxt: { color: TOKENS.goldInk, fontSize: 14, fontWeight: '700' },
  countdown: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  countdownLabel: { color: TOKENS.ink4, fontSize: 12 },
  countdownNum: { color: TOKENS.gold, fontSize: 12, fontWeight: '700', fontFamily: FONT_MONO },
  progressBg: { height: 3, backgroundColor: TOKENS.bg2, borderRadius: 999, overflow: 'hidden' },
  progressFg: { height: '100%', backgroundColor: TOKENS.gold },
});
