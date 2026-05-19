import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Platform, Linking,
} from 'react-native';
import { Bell, Send, Volume2, VolumeX, Tv, Copy, Check } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import { sendNotification } from '../services/streamNotifyService';

const QUICK = ['เดี๋ยวกลับมา ขอตัวสักครู่ 🙏', 'ขอบคุณที่ติดตามนะครับ ❤️', 'ฝากกดติดตามด้วยน้า 🔔', 'เริ่มไลฟ์แล้วครับ!'];

export default function StreamNotifyScreen({ navigation }) {
  const { user, isAdmin, role } = useAuth();
  const [text, setText] = useState('');
  const [sound, setSound] = useState(true);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');

  // OBS Browser Source URL options
  const [scale, setScale] = useState(1.4);
  const [pos, setPos] = useState('top');
  const [label, setLabel] = useState('');

  const obsBase = Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/notify-display.html`
    : 'https://tuber-tools-266cb.web.app/notify-display.html';

  const obsUrl = (() => {
    const q = [];
    if (scale !== 1.4) q.push(`scale=${scale}`);
    if (pos === 'center') q.push('pos=center');
    if (label.trim()) q.push(`label=${encodeURIComponent(label.trim())}`);
    return q.length ? `${obsBase}?${q.join('&')}` : obsBase;
  })();

  const SCALES = [
    { v: 1, label: 'เล็ก' },
    { v: 1.4, label: 'ปกติ' },
    { v: 2, label: 'ใหญ่' },
    { v: 2.8, label: 'ใหญ่มาก' },
  ];

  async function push(message) {
    const msg = (message ?? text).trim();
    if (!msg) return;
    if (!user) {
      setError('ยังไม่ได้ล็อกอิน — Firebase ต้องการบัญชีที่ล็อกอินก่อนถึงจะส่งได้');
      return;
    }
    setError('');
    try {
      await sendNotification(msg, { sound });
      setHistory((h) => [{ text: msg, at: Date.now() }, ...h].slice(0, 8));
      setText('');
      setSent(true);
      setTimeout(() => setSent(false), 1800);
    } catch (err) {
      console.error('sendNotification failed:', err);
      setError(`ส่งไม่สำเร็จ: ${err?.code || ''} ${err?.message || err}`);
    }
  }

  async function copyUrl() {
    try {
      if (Platform.OS === 'web' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(obsUrl);
      } else {
        require('react-native').Clipboard?.setString?.(obsUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) { console.warn('clipboard failed', err); }
  }

  function openObs() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(obsUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(obsUrl).catch(() => {});
    }
  }

  return (
    <View style={styles.root}>
      <Sidebar navigation={navigation} active="notify" user={user} isAdmin={isAdmin} role={role} />
      <View style={styles.main}>
        <TopBar crumbs={['Stream Tools', 'Notification']} navigation={navigation} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.headIcon}><Bell size={20} color={Colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>OBS Notification</Text>
              <Text style={styles.sub}>พิมพ์ข้อความแล้วส่งขึ้นจอ OBS พร้อมเสียงแจ้งเตือน</Text>
            </View>
            {sent ? (
              <View style={styles.sentPill}>
                <Check size={13} color={Colors.green} />
                <Text style={styles.sentPillTxt}>ส่งแล้ว</Text>
              </View>
            ) : null}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>ข้อความแจ้งเตือน</Text>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder="พิมพ์ข้อความที่จะให้ขึ้นจอ OBS…"
              placeholderTextColor={Colors.fg3}
              maxLength={200}
              multiline
              onSubmitEditing={() => push()}
              blurOnSubmit
            />
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.soundToggle, sound && styles.soundToggleOn]}
                onPress={() => setSound((s) => !s)}
                activeOpacity={0.8}
              >
                {sound ? <Volume2 size={15} color={Colors.accent} /> : <VolumeX size={15} color={Colors.fg2} />}
                <Text style={[styles.soundTxt, sound && { color: Colors.accent }]}>
                  {sound ? 'มีเสียง' : 'ปิดเสียง'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.counter}>{text.length}/200</Text>
              <TouchableOpacity
                style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}
                onPress={() => push()}
                disabled={!text.trim()}
                activeOpacity={0.85}
              >
                <Send size={15} color={Colors.accentFg} />
                <Text style={styles.sendTxt}>ส่งขึ้นจอ OBS</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>ข้อความด่วน</Text>
            <View style={styles.quickWrap}>
              {QUICK.map((q) => (
                <TouchableOpacity key={q} style={styles.quickChip} onPress={() => push(q)} activeOpacity={0.8}>
                  <Text style={styles.quickTxt}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>ตั้งค่าการแสดงผลบนจอ OBS</Text>

            <Text style={styles.optLabel}>ขนาดป้าย</Text>
            <View style={styles.optRow}>
              {SCALES.map((s) => (
                <TouchableOpacity
                  key={s.v}
                  style={[styles.optChip, scale === s.v && styles.optChipOn]}
                  onPress={() => setScale(s.v)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optChipTxt, scale === s.v && styles.optChipTxtOn]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.optLabel}>ตำแหน่ง</Text>
            <View style={styles.optRow}>
              {[{ v: 'top', label: 'ด้านบน' }, { v: 'center', label: 'กลางจอ' }].map((p) => (
                <TouchableOpacity
                  key={p.v}
                  style={[styles.optChip, pos === p.v && styles.optChipOn]}
                  onPress={() => setPos(p.v)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optChipTxt, pos === p.v && styles.optChipTxtOn]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.optLabel}>หัวข้อป้าย (เว้นว่าง = "ประกาศ")</Text>
            <TextInput
              style={styles.optInput}
              value={label}
              onChangeText={setLabel}
              placeholder="เช่น แจ้งเตือน, ประกาศสำคัญ"
              placeholderTextColor={Colors.fg3}
              maxLength={40}
            />

            <Text style={[styles.label, { marginTop: 4 }]}>OBS Browser Source URL</Text>
            <Text style={styles.urlBox} numberOfLines={2}>{obsUrl}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.ghostBtn} onPress={copyUrl} activeOpacity={0.8}>
                {copied ? <Check size={14} color={Colors.green} /> : <Copy size={14} color={Colors.fg1} />}
                <Text style={styles.ghostTxt}>{copied ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ghostBtn} onPress={openObs} activeOpacity={0.8}>
                <Tv size={14} color={Colors.fg1} />
                <Text style={styles.ghostTxt}>เปิดดูตัวอย่าง</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>
              ใน OBS: Sources → + → Browser → วาง URL · ขนาด 1920×1080 · ติ๊ก "Control audio via OBS" ให้เสียงออกผ่าน OBS
            </Text>
          </View>

          {history.length > 0 ? (
            <View style={styles.card}>
              <Text style={styles.label}>ส่งล่าสุด</Text>
              {history.map((h, i) => (
                <View key={`${h.at}-${i}`} style={styles.histRow}>
                  <Text style={styles.histDot}>·</Text>
                  <Text style={styles.histTxt} numberOfLines={1}>{h.text}</Text>
                  <Text style={styles.histTime}>
                    {new Date(h.at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: Colors.bg0 },
  main: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, gap: 16, maxWidth: 820, width: '100%' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: Colors.fg0, fontSize: 20, fontWeight: '700' },
  sub: { color: Colors.fg2, fontSize: 13, marginTop: 3 },
  sentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.greenSoft, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 7, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)',
  },
  sentPillTxt: { color: Colors.green, fontSize: 12, fontWeight: '600' },

  errorBox: {
    backgroundColor: Colors.redSoft, borderWidth: 1, borderColor: 'rgba(248,113,113,0.4)',
    borderRadius: 10, padding: 12,
  },
  errorTxt: { color: Colors.red, fontSize: 12, lineHeight: 18 },
  card: {
    backgroundColor: Colors.bg1, borderWidth: 1, borderColor: Colors.borderSubtle,
    borderRadius: 12, padding: 16, gap: 12,
  },
  label: { color: Colors.fg1, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bg0, borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: 9, color: Colors.fg0, fontSize: 14, padding: 12,
    minHeight: 80, textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },

  soundToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.borderDefault,
  },
  soundToggleOn: { borderColor: 'rgba(255,214,107,0.4)', backgroundColor: Colors.accentSoft },
  soundTxt: { color: Colors.fg2, fontSize: 12, fontWeight: '600' },
  counter: { color: Colors.fg3, fontSize: 12, marginLeft: 'auto' },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  sendTxt: { color: Colors.accentFg, fontSize: 13, fontWeight: '700' },

  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.borderDefault,
  },
  quickTxt: { color: Colors.fg1, fontSize: 12 },

  optLabel: { color: Colors.fg2, fontSize: 12, fontWeight: '600', marginTop: 4 },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.borderDefault,
  },
  optChipOn: { borderColor: 'rgba(255,214,107,0.45)', backgroundColor: Colors.accentSoft },
  optChipTxt: { color: Colors.fg2, fontSize: 12, fontWeight: '600' },
  optChipTxtOn: { color: Colors.accent },
  optInput: {
    backgroundColor: Colors.bg0, borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: 8, color: Colors.fg0, fontSize: 13, padding: 10,
  },
  urlBox: {
    backgroundColor: Colors.bg0, borderWidth: 1, borderColor: Colors.borderDefault,
    borderRadius: 8, color: Colors.accent, fontSize: 12, padding: 10,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  ghostBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.bg2, borderWidth: 1, borderColor: Colors.borderDefault,
  },
  ghostTxt: { color: Colors.fg1, fontSize: 12, fontWeight: '600' },
  hint: { color: Colors.fg3, fontSize: 11, lineHeight: 17 },

  histRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  histDot: { color: Colors.fg3, fontSize: 13 },
  histTxt: { color: Colors.fg2, fontSize: 12, flex: 1 },
  histTime: { color: Colors.fg3, fontSize: 11 },
});
