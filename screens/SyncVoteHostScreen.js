import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ActivityIndicator, ScrollView, Platform,
} from 'react-native';
import { RotateCcw, LogOut, Check, AlertTriangle } from 'lucide-react-native';
import { useResponsive } from '../hooks/useResponsive';
import {
  subscribeRoom, setThemeColor, setPilots,
  resetProtocol, deleteRoom, MAX_SLOTS, THEME_COLORS,
} from '../services/syncVoteService';
import { subscribeToVtubers } from '../services/vtuberDatabaseService';
import { computeAllMatch, allFinal } from '../utils/syncVoteConsensus';
import {
  TOKENS, FONT_MONO, PROTOCOL_META,
  Pill, RoomChip, Stat, ConsensusBanner, SlotTile, VAvatar, Panel,
} from '../components/syncvote/Primitives';

function distribution(slots) {
  const counts = { A: 0, B: 0, C: 0 };
  slots.forEach((s) => { if (s.choice) counts[s.choice] = (counts[s.choice] || 0) + 1; });
  return counts;
}

export default function SyncVoteHostScreen({ navigation, route }) {
  const { code } = route.params || {};
  const responsive = useResponsive();
  const [room, setRoom] = useState(null);
  const [vtubers, setVtubers] = useState([]);

  useEffect(() => { if (code) return subscribeRoom(code, setRoom); }, [code]);
  useEffect(() => subscribeToVtubers(setVtubers), []);

  const availableVtubers = useMemo(
    () => [...vtubers]
      .filter((v) => v.enabled !== false)
      .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [vtubers]
  );

  const selectedIds = useMemo(() => {
    if (!room) return [];
    const ids = [];
    const n = room.activePlayers || 0;
    for (let i = 1; i <= n; i++) {
      const id = room[`player${i}`]?.vtuberId;
      if (id) ids.push(id);
    }
    return ids;
  }, [room]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  if (!room) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color={TOKENS.gold} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const theme = room.themeColor || 'yellow';
  const meta = PROTOCOL_META[theme];
  const synced = computeAllMatch(room);
  const finalized = allFinal(room);
  const bannerState = finalized ? 'terminal' : synced ? 'achieved' : 'awaiting';
  const accent = bannerState === 'terminal' ? TOKENS.pCyan : meta.color;

  // Build the configured slot list (only slots with a persona).
  const n = room.activePlayers || 0;
  const slots = [];
  for (let i = 1; i <= n; i++) {
    const slot = room[`player${i}`];
    if (slot?.vtuberId) {
      slots.push({
        idx: i,
        name: slot.name || `ผู้เล่น ${i}`,
        imageUrl: slot.imageUrl,
        choice: slot.choice,
        state: slot.isFinal ? 'final' : (slot.uid || slot.choice) ? 'live' : 'empty',
      });
    }
  }
  const dist = distribution(slots);

  async function toggleVtuber(v) {
    const isSelected = selectedSet.has(v.id);
    let nextIds;
    if (isSelected) nextIds = selectedIds.filter((id) => id !== v.id);
    else {
      if (selectedIds.length >= MAX_SLOTS) return;
      nextIds = [...selectedIds, v.id];
    }
    const map = new Map(availableVtubers.map((x) => [x.id, x]));
    vtubers.forEach((x) => { if (!map.has(x.id)) map.set(x.id, x); });
    const list = nextIds
      .map((id) => map.get(id)).filter(Boolean)
      .map((x) => ({ id: x.id, name: x.name, imageUrl: x.imageUrl }));
    await setPilots(code, list);
  }

  async function disconnect() {
    await deleteRoom(code);
    navigation.replace('SelectGame');
  }

  // Responsive: stack columns on tablet / mobile.
  const wide = responsive.width >= 1100;
  const med = responsive.width >= 820;

  // Tile height adapts to persona count: 1-3 personas get one tall row,
  // 4+ tiles get a smaller height since they wrap onto multiple rows.
  const tileHeight = slots.length >= 5 ? 140 : slots.length >= 3 ? 150 : 200;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll}>
        {/* Page header */}
        <View style={styles.pageH}>
          <View style={{ flex: 1, minWidth: 240 }}>
            <Text style={styles.title}>Crew console</Text>
            <Text style={styles.sub}>Pick personas, set protocol, watch signals in real time.</Text>
          </View>
          <View style={styles.headActions}>
            <RoomChip code={code} size="lg" />
            <TouchableOpacity style={styles.btnSecondary} onPress={() => resetProtocol(code)}>
              <RotateCcw size={14} color={TOKENS.ink} />
              <Text style={styles.btnSecondaryText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDestructive} onPress={disconnect}>
              <LogOut size={14} color={TOKENS.pRed} />
              <Text style={styles.btnDestructiveText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Take-over alert banner */}
        {room.takeOverBy ? (
          <View style={styles.takeBanner}>
            <View style={styles.takeBannerLeft}>
              <View style={styles.takeIconWrap}>
                <AlertTriangle size={16} color={TOKENS.pRed} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.takeBannerTitle}>Force sync triggered</Text>
                <Text style={styles.takeBannerSub} numberOfLines={1}>
                  <Text style={styles.takeBannerName}>{room.takeOverName || 'Unknown'}</Text>
                  {room.takeOverSlot ? ` · Slot ${String(room.takeOverSlot).padStart(2, '0')}` : ''}
                  {room.takeOverChoice ? ` · locked everyone to ${room.takeOverChoice}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.takeChip}>
              <Text style={styles.takeChipTxt}>{room.takeOverChoice || '—'}</Text>
            </View>
          </View>
        ) : null}

        {/* Stat row */}
        <View style={styles.statRow}>
          <Stat n={`${selectedIds.length}/${MAX_SLOTS}`} l="Personas selected" />
          <Stat n={slots.filter((s) => !!s.choice).length} l="Signals received" />
          <Stat n={slots.filter((s) => s.state === 'final').length} l="Locked" tint={accent} />
          <Stat n={meta.label} l="Protocol" tint={accent} />
        </View>

        {/* Body grid */}
        <View style={[styles.body, { flexDirection: wide ? 'row' : 'column', gap: 18 }]}>
          {/* LEFT — pickers */}
          <View style={{ width: wide ? 280 : '100%', gap: 14 }}>
            <Panel padding={14}>
              <View style={styles.panelHead}>
                <Text style={styles.panelTitle}>Personas</Text>
                <Pill tone="neutral">{selectedIds.length}/{MAX_SLOTS}</Pill>
              </View>
              {availableVtubers.length === 0 ? (
                <Text style={styles.empty}>No enabled VTubers. Toggle some on in VTuber Database.</Text>
              ) : (
                <View style={{ gap: 2 }}>
                  {availableVtubers.map((v) => {
                    const on = selectedSet.has(v.id);
                    const dis = !on && selectedIds.length >= MAX_SLOTS;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        disabled={dis}
                        onPress={() => toggleVtuber(v)}
                        activeOpacity={0.7}
                        style={[
                          styles.personaRow,
                          on && { backgroundColor: TOKENS.surface2 },
                          dis && { opacity: 0.4 },
                        ]}
                      >
                        <View style={[styles.cb, on && { backgroundColor: TOKENS.gold, borderColor: TOKENS.gold }]}>
                          {on ? <Check size={11} color={TOKENS.goldInk} strokeWidth={3} /> : null}
                        </View>
                        <VAvatar name={v.name} imageUrl={v.imageUrl} size={22} />
                        <Text style={styles.personaName} numberOfLines={1}>{v.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Panel>

            <Panel padding={14}>
              <Text style={[styles.panelTitle, { marginBottom: 10 }]}>Protocol mood</Text>
              <View style={styles.moodGrid}>
                {THEME_COLORS.map((c) => {
                  const p = PROTOCOL_META[c];
                  const active = c === theme;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setThemeColor(code, c)}
                      activeOpacity={0.85}
                      style={[
                        styles.moodCell,
                        active && { borderColor: p.color, backgroundColor: tint(p.color, 0.10) },
                      ]}
                    >
                      <View style={[styles.moodDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.moodLabel, { color: active ? p.color : TOKENS.ink }]}>{p.label}</Text>
                      <Text style={styles.moodDesc}>{p.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Panel>
          </View>

          {/* CENTER — multiview + banner */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.stageHead}>
              <Text style={styles.panelTitle}>Stage · multiview</Text>
              <Text style={[styles.stageStatus, { color: accent }]}>
                {bannerState === 'terminal' ? '◼ Terminal' : bannerState === 'achieved' ? '● Consensus' : '○ Awaiting'}
              </Text>
            </View>

            {slots.length === 0 ? (
              <View style={styles.stageEmpty}>
                <Pill tone="gold">STANDBY</Pill>
                <Text style={styles.stageEmptyTitle}>No personas configured</Text>
                <Text style={styles.stageEmptySub}>Pick VTubers on the left to open slots.</Text>
              </View>
            ) : (
              <View style={[styles.stageGrid, { gap: 10 }]}>
                {slots.map((s) => (
                  <View key={s.idx} style={[
                    styles.stageCell,
                    { width: stageColWidth(slots.length, med) },
                  ]}>
                    <SlotTile
                      idx={s.idx}
                      name={s.name}
                      imageUrl={s.imageUrl}
                      choice={s.choice}
                      state={s.state}
                      accent={accent}
                      height={tileHeight}
                    />
                  </View>
                ))}
              </View>
            )}

            <View style={{ marginTop: 14 }}>
              <ConsensusBanner state={bannerState} />
            </View>
          </View>

          {/* RIGHT — distribution + event log */}
          <View style={{ width: wide ? 240 : '100%', gap: 12 }}>
            <Panel padding={14}>
              <Text style={[styles.panelTitle, { marginBottom: 10 }]}>Distribution</Text>
              {['A', 'B', 'C'].map((L) => {
                const v = dist[L] || 0;
                const total = Math.max(1, slots.length);
                const col = L === 'A' ? TOKENS.pCyan : L === 'B' ? TOKENS.pGreen : TOKENS.gold;
                const muted = v === 0;
                return (
                  <View key={L} style={styles.distRow}>
                    <Text style={[styles.distLetter, { color: muted ? TOKENS.ink3 : col }]}>{L}</Text>
                    <View style={styles.distBarBg}>
                      <View style={[styles.distBarFg, { width: `${(v / total) * 100}%`, backgroundColor: muted ? TOKENS.ink4 : col }]} />
                    </View>
                    <Text style={styles.distCount}>{v}/{slots.length}</Text>
                  </View>
                );
              })}
            </Panel>

            <Panel padding={14}>
              <Text style={[styles.panelTitle, { marginBottom: 8 }]}>Event log</Text>
              <View style={{ gap: 4 }}>
                <Text style={styles.logLine}>· room opened <Text style={styles.logMono}>{code}</Text></Text>
                <Text style={styles.logLine}>· {selectedIds.length} persona{selectedIds.length === 1 ? '' : 's'} configured</Text>
                <Text style={[styles.logLine, { color: TOKENS.gold }]}>· protocol → {meta.label}</Text>
                {bannerState !== 'awaiting' ? (
                  <Text style={[styles.logLine, { color: TOKENS.pGreen }]}>· consensus reached</Text>
                ) : null}
                {room.takeOverBy ? (
                  <Text style={[styles.logLine, { color: TOKENS.pRed }]}>
                    · ⚠ take over by <Text style={styles.logMono}>{room.takeOverName || 'pilot'}</Text>
                    {room.takeOverChoice ? ` → ${room.takeOverChoice}` : ''}
                  </Text>
                ) : null}
                {bannerState === 'terminal' ? (
                  <Text style={[styles.logLine, { color: TOKENS.pCyan }]}>· terminal · locked</Text>
                ) : null}
              </View>
            </Panel>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function stageColWidth(count, med) {
  // Two columns by default, three when 4+ personas so we get 2×2 / 2×3 grids
  // without giant tiles on a wide viewport.
  if (!med) return '100%';
  if (count >= 5) return '32.5%';
  if (count >= 4) return '48.5%';
  if (count >= 3) return '32.5%';
  return count === 2 ? '48.5%' : '100%';
}

function tint(hex, alpha) {
  const m = hex.match(/^#([\da-f]{6})$/i);
  if (!m) return TOKENS.surface;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: TOKENS.bg },
  scroll: { padding: 20, gap: 16, maxWidth: 1400, width: '100%', alignSelf: 'center' },

  pageH: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  title: { color: TOKENS.ink, fontSize: 22, fontWeight: '700', letterSpacing: -0.2 },
  sub: { color: TOKENS.ink3, fontSize: 13, marginTop: 4 },
  headActions: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },

  btnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: TOKENS.surface2, borderWidth: 1, borderColor: TOKENS.line2, borderRadius: 8 },
  btnSecondaryText: { color: TOKENS.ink, fontSize: 12, fontWeight: '500' },
  btnDestructive: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: 'rgba(239,87,87,0.08)', borderWidth: 1, borderColor: 'rgba(239,87,87,0.30)' },
  btnDestructiveText: { color: TOKENS.pRed, fontSize: 12, fontWeight: '600' },

  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  body: { gap: 18 },

  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { color: TOKENS.ink, fontSize: 13, fontWeight: '600' },
  empty: { color: TOKENS.ink4, fontSize: 12 },

  personaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  cb: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: TOKENS.line3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  personaName: { color: TOKENS.ink, fontSize: 12, fontWeight: '500', flex: 1 },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  moodCell: { width: '48%', padding: 10, backgroundColor: TOKENS.bg2, borderWidth: 1, borderColor: TOKENS.line2, borderRadius: 8, gap: 4 },
  moodDot: { width: 10, height: 10, borderRadius: 5 },
  moodLabel: { fontSize: 12, fontWeight: '600' },
  moodDesc: { fontSize: 10, color: TOKENS.ink4 },

  stageHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stageStatus: { fontSize: 12, fontWeight: '500' },
  stageGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  stageCell: { padding: 0 },

  stageEmpty: { alignItems: 'center', gap: 10, paddingVertical: 60, backgroundColor: TOKENS.surface, borderWidth: 1, borderColor: TOKENS.line2, borderRadius: 10 },
  stageEmptyTitle: { color: TOKENS.ink, fontSize: 15, fontWeight: '700', marginTop: 4 },
  stageEmptySub: { color: TOKENS.ink3, fontSize: 12 },

  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  distLetter: { fontSize: 12, fontWeight: '700', width: 14 },
  distBarBg: { flex: 1, height: 6, backgroundColor: TOKENS.bg2, borderRadius: 3, overflow: 'hidden' },
  distBarFg: { height: '100%', borderRadius: 3 },
  distCount: { fontFamily: FONT_MONO, fontSize: 11, color: TOKENS.ink3, width: 40, textAlign: 'right' },

  logLine: { color: TOKENS.ink3, fontSize: 11, fontFamily: FONT_MONO, lineHeight: 18 },
  logMono: { color: TOKENS.ink2 },

  takeBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 12, borderRadius: 10,
    backgroundColor: 'rgba(239,87,87,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,87,87,0.30)',
    gap: 12,
  },
  takeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  takeIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(239,87,87,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  takeBannerTitle: { color: TOKENS.pRed, fontSize: 13, fontWeight: '700' },
  takeBannerSub: { color: TOKENS.ink2, fontSize: 12, marginTop: 2 },
  takeBannerName: { color: TOKENS.ink, fontWeight: '600' },
  takeChip: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: TOKENS.pRed,
    alignItems: 'center', justifyContent: 'center',
  },
  takeChipTxt: { color: '#1a0202', fontSize: 18, fontWeight: '800' },
});
