import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Image,
  Platform, Linking,
} from 'react-native';
import {
  Download, Monitor, Trophy, RefreshCw, Trash2,
  CheckCircle2, ExternalLink,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import TextBoxManager from '../components/selectionlog/TextBoxManager';
import {
  fetchUserSelections,
  deleteAllUserSelections,
  subscribeToUserSelections,
  subscribeToVtubersInUse,
  removeCharacterInUse,
  subscribeToVtubers,
  setActivePreview,
  subscribeToDraftControl,
  setDraftOpen,
  setDraftAllowedIds,
} from '../services/vtuberDatabaseService';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return '—';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function Avatar({ uri, name, size = 28 }) {
  const initials = (name || '?')[0]?.toUpperCase() ?? '?';
  return (
    <View style={[styles.avatarWrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.avatarText, { fontSize: size * 0.42 }]}>{initials}</Text>
      )}
    </View>
  );
}

function StatCard({ value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── main screen ─────────────────────────────────────────────────────────────

export default function SelectionLogScreen({ navigation }) {
  const { user, isAdmin, role } = useAuth();

  const [selections, setSelections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [vtubersInUse, setVtubersInUse] = useState([]);
  const [isRemovingAll, setIsRemovingAll] = useState(false);
  const [vtubers, setVtubers] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [previewHeight, setPreviewHeight] = useState(200);
  const [activeSelectionId, setActiveSelectionId] = useState(null);
  const [showLockPanel, setShowLockPanel] = useState(false);
  const [selectedLockIds, setSelectedLockIds] = useState([]);
  const [draftControl, setDraftControl] = useState({ isOpen: false, allowedIds: [] });
  const [draftAllowed, setDraftAllowed] = useState([]);
  const [isDraftAnimating, setIsDraftAnimating] = useState(false);
  const draftAnimRef = useRef(null);

  const ranking = useMemo(() => {
    const countMap = {};
    selections.forEach((s) => {
      const v = s.selectedVTuber;
      if (!v?.id) return;
      if (!countMap[v.id]) {
        countMap[v.id] = { id: v.id, name: v.name, imageUrl: v.imageUrl, count: 0, lockedBy: [] };
      }
      countMap[v.id].count += 1;
      const charName = s.character?.name;
      if (charName && !countMap[v.id].lockedBy.includes(charName)) {
        countMap[v.id].lockedBy.push(charName);
      }
    });
    // Include locked VTubers that haven't been picked yet (count = 0)
    vtubersInUse.forEach((id) => {
      if (countMap[id]) return;
      const info = vtubers.find((v) => v.id === id);
      countMap[id] = {
        id,
        name: info?.name || id,
        imageUrl: info?.imageUrl || null,
        count: 0,
        lockedBy: [],
      };
    });
    return Object.values(countMap).sort((a, b) => b.count - a.count);
  }, [selections, vtubersInUse, vtubers]);

  useEffect(() => {
    const unsubscribeSelections = subscribeToUserSelections((data) => {
      setSelections(data);
      setIsLoading(false);
    });
    const unsubscribeInUse = subscribeToVtubersInUse((data) => setVtubersInUse(data));
    const unsubscribeVtubers = subscribeToVtubers((data) => setVtubers(data));
    const unsubscribeDraft = subscribeToDraftControl((data) => {
      setDraftControl(data);
      setDraftAllowed(data.allowedIds);
    });
    loadSelections();
    return () => {
      unsubscribeSelections();
      unsubscribeInUse();
      unsubscribeVtubers();
      unsubscribeDraft();
    };
  }, []);

  const loadSelections = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUserSelections();
      setSelections(data);
    } catch {
      setSelections([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearRound = async () => {
    const confirmed = window.confirm(
      `จบรอบ?\n\nจะลบการเลือกทั้งหมด ${selections.length} รายการ และเริ่มรอบใหม่`
    );
    if (!confirmed) return;
    setIsClearing(true);
    try {
      const result = await deleteAllUserSelections();
      if (result.success) {
        setSelections([]);
        window.alert('จบรอบเรียบร้อย ✓\nผู้เล่นสามารถเลือกใหม่ได้แล้ว');
        await loadSelections();
      } else {
        window.alert(`เกิดข้อผิดพลาด: ${result.error}`);
      }
    } catch (e) {
      window.alert(`Error: ${e.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const handleRemoveCharacter = async (characterId) => {
    try {
      await removeCharacterInUse(characterId);
    } catch (e) {
      window.alert(`Error: ${e.message}`);
    }
  };

  const openLockPanel = () => {
    setSelectedLockIds([...vtubersInUse]);
    setShowLockPanel(true);
  };

  const toggleLockId = (id) => {
    setSelectedLockIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRemoveSelectedLocks = async () => {
    if (selectedLockIds.length === 0) return;
    setIsRemovingAll(true);
    try {
      await Promise.all(selectedLockIds.map((id) => removeCharacterInUse(id)));
      setShowLockPanel(false);
      setSelectedLockIds([]);
    } catch (e) {
      window.alert(`Error: ${e.message}`);
    } finally {
      setIsRemovingAll(false);
    }
  };

  const handleShowPreview = async (item) => {
    try {
      await setActivePreview(item);
      setActiveSelectionId(item.selectionId ?? item.id ?? null);
    } catch { }
  };

  const handleToggleDraft = async () => {
    await setDraftOpen(!draftControl.isOpen);
  };

  const toggleDraftAllowed = (id) => {
    setDraftAllowed((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setDraftAllowedIds(next);
      return next;
    });
  };

  const clearDraftAllowed = () => {
    if (draftAnimRef.current) clearTimeout(draftAnimRef.current);
    setIsDraftAnimating(false);
    setDraftAllowed([]);
    setDraftAllowedIds([]);
  };

  const animateDraftAll = (openAll) => {
    if (draftAnimRef.current) clearTimeout(draftAnimRef.current);
    const allIds = vtubers.map((v) => v.id);
    const shuffled = [...allIds].sort(() => Math.random() - 0.5);
    setIsDraftAnimating(true);

    const step = (i, current) => {
      if (i >= shuffled.length) {
        setIsDraftAnimating(false);
        return;
      }
      const next = openAll
        ? [...new Set([...current, shuffled[i]])]
        : current.filter((x) => x !== shuffled[i]);
      setDraftAllowed(next);
      setDraftAllowedIds(next);
      draftAnimRef.current = setTimeout(() => step(i + 1, next), 60);
    };

    const start = openAll ? [] : [...allIds];
    setDraftAllowed(start);
    step(0, start);
  };

  const handleExportCSV = () => {
    if (typeof window === 'undefined') return;
    const header = 'Player,VTuber,Time\n';
    const rows = selections.map((s) =>
      `"${s.user?.displayName || ''}","${s.selectedVTuber?.name || ''}","${formatTime(s.createdAt)}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'selection-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const maxCount = ranking[0]?.count || 1;
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    { label: 'Live picks · Ranking' },
    { label: 'Draft Control · กล่องข้อความ' },
    { label: 'OBS overlay' },
  ];

  return (
    <View style={styles.root}>
      <Sidebar navigation={navigation} active="log" user={user} isAdmin={isAdmin} role={role} />

      <View style={styles.main}>
        <TopBar crumbs={['Stream Tools', 'Selection Log']} live={isLive} navigation={navigation} />

        {/* Stats row */}
        <View style={styles.statsBar}>
          <StatCard value={selections.length} label="Total picks" />
          <StatCard value={ranking.length} label="VTubers selected" />
          <StatCard value={vtubersInUse.length} label="In use" />
          <View style={{ flex: 1 }} />
          <Pressable style={styles.btnSecondary} onPress={handleExportCSV}>
            <Download size={13} color={Colors.fg1} strokeWidth={2} />
            <Text style={styles.btnSecondaryText}>Export CSV</Text>
          </Pressable>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab, i) => (
            <Pressable
              key={i}
              style={[styles.tabItem, activeTab === i && styles.tabItemActive]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.tabLabel, activeTab === i && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {activeTab === i && <View style={styles.tabUnderline} />}
            </Pressable>
          ))}
        </View>

        {/* Tab content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>

          {/* ── Tab 1: Live picks + Ranking ── */}
          {activeTab === 0 && (
            <View style={styles.twoCol}>
              {/* LEFT – Live picks */}
              <View style={styles.livePicksCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>Live picks</Text>
                    <Text style={styles.cardSub}>Updating in real-time</Text>
                  </View>
                  <View style={styles.syncTag}>
                    <View style={styles.syncDot} />
                    <Text style={styles.syncText}>synced</Text>
                  </View>
                  <Pressable style={styles.iconBtn} onPress={loadSelections} disabled={isLoading}>
                    <RefreshCw size={14} color={Colors.fg2} strokeWidth={2} />
                  </Pressable>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.thCell, { width: 32 }]}>#</Text>
                  <Text style={[styles.thCell, { flex: 1 }]}>Player</Text>
                  <Text style={[styles.thCell, { flex: 1 }]}>VTuber</Text>
                  <Text style={[styles.thCell, { width: 70 }]}>Time</Text>
                  <Text style={[styles.thCell, { width: 50 }]}></Text>
                </View>

                {isLoading ? (
                  <View style={styles.loadingRow}><Text style={styles.loadingText}>Loading…</Text></View>
                ) : selections.length === 0 ? (
                  <View style={styles.emptyRow}><Text style={styles.emptyText}>No picks yet</Text></View>
                ) : (
                  selections.map((item, idx) => {
                    const itemId = item.selectionId ?? item.id ?? idx;
                    const isActive = activeSelectionId !== null ? activeSelectionId === itemId : idx === 0;
                    return (
                      <View key={itemId} style={[styles.tableRow, isActive && styles.tableRowLatest]}>
                        <Text style={[styles.tdCell, styles.tdIndex, { width: 32 }]}>{idx + 1}</Text>
                        <View style={[styles.tdCell, styles.tdPerson, { flex: 1 }]}>
                          <Avatar uri={item.character?.imageUrl} name={item.character?.name} size={24} />
                          <Text style={styles.personName} numberOfLines={1}>{item.character?.name || '—'}</Text>
                        </View>
                        <View style={[styles.tdCell, styles.tdPerson, { flex: 1 }]}>
                          <Avatar uri={item.selectedVTuber?.imageUrl} name={item.selectedVTuber?.name} size={24} />
                          <Text style={styles.personName} numberOfLines={1}>{item.selectedVTuber?.name || '—'}</Text>
                        </View>
                        <Text style={[styles.tdCell, styles.tdTime, { width: 70 }]}>{formatTime(item.timestamp)}</Text>
                        <View style={[styles.tdCell, { width: 50, alignItems: 'flex-end' }]}>
                          <Pressable style={styles.previewBtn} onPress={() => handleShowPreview(item)}>
                            <Monitor size={11} color={Colors.accent} strokeWidth={2} />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                )}

                {selections.length > 0 && (
                  <View style={styles.cardFooter}>
                    <Pressable style={[styles.endRoundBtn, isClearing && styles.btnDisabled]} onPress={handleClearRound} disabled={isClearing}>
                      <Trash2 size={13} color="#fff" strokeWidth={2} />
                      <Text style={styles.endRoundText}>{isClearing ? 'Clearing…' : 'End round & clear all'}</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* RIGHT – Ranking */}
              <View style={styles.rightCol}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}><Text style={styles.cardTitle}>Ranking</Text></View>
                    <View style={styles.byVotesTag}>
                      <Trophy size={10} color={Colors.accent} strokeWidth={2} />
                      <Text style={styles.byVotesText}>by votes</Text>
                    </View>
                    {vtubersInUse.length > 0 && (
                      <Pressable
                        style={[styles.btnSecondaryXS, showLockPanel && styles.btnSecondaryXSActive]}
                        onPress={() => showLockPanel ? setShowLockPanel(false) : openLockPanel()}
                      >
                        <Text style={[styles.btnSecondaryXSText, showLockPanel && styles.btnSecondaryXSTextActive]}>
                          🔒 Clear locks ({vtubersInUse.length})
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {showLockPanel && (
                    <View style={styles.lockPanel}>
                      <View style={styles.lockPanelHeader}>
                        <Text style={styles.lockPanelTitle}>เลือกล็อกที่ต้องการลบ</Text>
                        <View style={styles.lockPanelActions}>
                          <Pressable onPress={() => setSelectedLockIds([...vtubersInUse])}>
                            <Text style={styles.lockSelectAll}>Select all</Text>
                          </Pressable>
                          <Text style={styles.lockDivider}>·</Text>
                          <Pressable onPress={() => setSelectedLockIds([])}>
                            <Text style={styles.lockSelectAll}>None</Text>
                          </Pressable>
                        </View>
                      </View>
                      {vtubersInUse.map((id) => {
                        const info = ranking.find((r) => r.id === id) || vtubers.find((v) => v.id === id) || { id, name: id, imageUrl: null };
                        const checked = selectedLockIds.includes(id);
                        return (
                          <Pressable key={id} style={[styles.lockItem, checked && styles.lockItemChecked]} onPress={() => toggleLockId(id)}>
                            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                              {checked && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Avatar uri={info.imageUrl} name={info.name} size={24} />
                            <Text style={styles.lockItemName} numberOfLines={1}>{info.name}</Text>
                            {info.lockedBy?.length > 0 && (
                              <Text style={styles.lockItemBy} numberOfLines={1}>by {info.lockedBy.join(', ')}</Text>
                            )}
                          </Pressable>
                        );
                      })}
                      <View style={styles.lockPanelFooter}>
                        <Pressable style={styles.lockCancelBtn} onPress={() => setShowLockPanel(false)}>
                          <Text style={styles.lockCancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          style={[styles.lockRemoveBtn, (selectedLockIds.length === 0 || isRemovingAll) && styles.btnDisabled]}
                          onPress={handleRemoveSelectedLocks}
                          disabled={selectedLockIds.length === 0 || isRemovingAll}
                        >
                          <Text style={styles.lockRemoveText}>{isRemovingAll ? 'Removing…' : `Remove (${selectedLockIds.length})`}</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {ranking.length === 0 ? (
                    <View style={styles.emptyRow}><Text style={styles.emptyText}>No data yet</Text></View>
                  ) : (
                    ranking.slice(0, 12).map((item, idx) => {
                      const barWidth = Math.round((item.count / maxCount) * 100);
                      const isInUse = vtubersInUse.includes(item.id);
                      return (
                        <View key={item.id} style={styles.rankRow}>
                          <Text style={[styles.rankNum, idx === 0 && styles.rankNumGold]}>{idx + 1}</Text>
                          <Avatar uri={item.imageUrl} name={item.name} size={26} />
                          <View style={{ flex: 1, gap: 3 }}>
                            <View style={styles.rankNameRow}>
                              <Text style={styles.rankName} numberOfLines={1}>{item.name}</Text>
                              {isInUse && (
                                <View style={styles.inUseTag}>
                                  <CheckCircle2 size={9} color={Colors.green} />
                                  <Text style={styles.inUseText}>in use</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.rankBarTrack}>
                              <View style={[styles.rankBarFill, { width: `${barWidth}%` }]} />
                            </View>
                            {item.lockedBy.length > 0 && (
                              <Text style={styles.lockedByText} numberOfLines={1}>🔒 {item.lockedBy.join(', ')}</Text>
                            )}
                          </View>
                          <Text style={styles.rankCount}>{item.count}</Text>
                        </View>
                      );
                    })
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ── Tab 2: Draft Control + กล่องข้อความ ── */}
          {activeTab === 1 && (
            <View style={styles.twoCol}>
              {/* Draft Control */}
              <View style={[styles.card, { flex: 1.2 }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Draft Control</Text>
                  <View style={[styles.draftStatusBadge, draftControl.isOpen && styles.draftStatusOpen]}>
                    <View style={[styles.draftStatusDot, draftControl.isOpen && styles.draftStatusDotOpen]} />
                    <Text style={[styles.draftStatusText, draftControl.isOpen && styles.draftStatusTextOpen]}>
                      {draftControl.isOpen ? 'เปิดแล้ว' : 'ปิดอยู่'}
                    </Text>
                  </View>
                </View>

                <View style={{ padding: 16, gap: 14 }}>
                  <Pressable style={[styles.draftToggleRow, draftControl.isOpen && styles.draftToggleOpen]} onPress={handleToggleDraft}>
                    <View style={[styles.draftKnobTrack, draftControl.isOpen && styles.draftKnobTrackOn]}>
                      <View style={[styles.draftKnob, draftControl.isOpen && styles.draftKnobOn]} />
                    </View>
                    <Text style={[styles.draftToggleLabel, draftControl.isOpen && styles.draftToggleLabelOn]}>
                      {draftControl.isOpen ? 'เปิดรับการเลือก' : 'ปิดรับการเลือก'}
                    </Text>
                  </Pressable>

                  <View style={styles.draftAllowedHeader}>
                    <Text style={styles.draftSectionLabel}>
                      เปิด: {draftAllowed.length === 0 ? 'ไม่มี' : `${draftAllowed.length} ตัว`}
                    </Text>
                    <View style={styles.draftAllowedActions}>
                      <Pressable style={[styles.draftAnimBtn, styles.draftAnimBtnOpen, isDraftAnimating && styles.btnDisabled]} onPress={() => animateDraftAll(true)} disabled={isDraftAnimating}>
                        <Text style={styles.draftAnimBtnOpenText}>เปิดทั้งหมด</Text>
                      </Pressable>
                      <Pressable style={[styles.draftAnimBtn, styles.draftAnimBtnClose, isDraftAnimating && styles.btnDisabled]} onPress={() => animateDraftAll(false)} disabled={isDraftAnimating}>
                        <Text style={styles.draftAnimBtnCloseText}>ปิดทั้งหมด</Text>
                      </Pressable>
                      <Pressable onPress={clearDraftAllowed} disabled={isDraftAnimating}>
                        <Text style={[styles.draftLinkBtn, isDraftAnimating && { opacity: 0.4 }]}>ล้าง</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.draftGrid}>
                    {vtubers.map((v) => {
                      const checked = draftAllowed.includes(v.id);
                      return (
                        <Pressable
                          key={v.id}
                          style={[styles.draftChip, checked && styles.draftChipActive, isDraftAnimating && { opacity: 0.7 }]}
                          onPress={() => !isDraftAnimating && toggleDraftAllowed(v.id)}
                        >
                          <Avatar uri={v.imageUrl} name={v.name} size={18} />
                          <Text style={[styles.draftChipText, checked && styles.draftChipTextActive]} numberOfLines={1}>{v.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* กล่องข้อความ */}
              <View style={[styles.card, { flex: 1 }]}>
                <View style={[styles.cardHeader, { paddingBottom: 12 }]}>
                  <Text style={styles.cardTitle}>กล่องข้อความ</Text>
                  <View style={styles.cardHeaderRight}>
                    <Pressable
                      style={styles.openUrlBtn}
                      onPress={() => {
                        const url = Platform.OS === 'web'
                          ? `${window.location.origin}/textbox-preview`
                          : 'https://tuber-tools-266cb.web.app/textbox-preview';
                        if (Platform.OS === 'web') window.open(url, '_blank');
                        else Linking.openURL(url);
                      }}
                    >
                      <ExternalLink size={12} color={Colors.fg2} strokeWidth={2} />
                      <Text style={styles.openUrlText}>Open URL</Text>
                    </Pressable>
                  </View>
                </View>
                <TextBoxManager />
              </View>
            </View>
          )}

          {/* ── Tab 3: OBS overlay preview ── */}
          {activeTab === 2 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>OBS overlay preview</Text>
                <View style={styles.cardHeaderRight}>
                  <View style={styles.pushingTag}>
                    <View style={styles.pushingDot} />
                    <Text style={styles.pushingText}>pushing</Text>
                  </View>
                  <Pressable
                    style={styles.openUrlBtn}
                    onPress={() => {
                      const url = Platform.OS === 'web'
                        ? `${window.location.origin}/selection-preview.html`
                        : 'https://tuber-tools-266cb.web.app/selection-preview.html';
                      if (Platform.OS === 'web') window.open(url, '_blank');
                      else Linking.openURL(url);
                    }}
                  >
                    <ExternalLink size={12} color={Colors.fg2} strokeWidth={2} />
                    <Text style={styles.openUrlText}>Open URL</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.sizeRow}>
                {[{ label: 'XS', h: 120 }, { label: 'S', h: 200 }, { label: 'M', h: 320 }, { label: 'L', h: 480 }, { label: 'XL', h: 640 }].map(({ label, h }) => (
                  <Pressable key={label} style={[styles.sizeBtn, previewHeight === h && styles.sizeBtnActive]} onPress={() => setPreviewHeight(h)}>
                    <Text style={[styles.sizeBtnText, previewHeight === h && styles.sizeBtnTextActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={[styles.previewArea, { height: previewHeight }]}>
                {Platform.OS === 'web'
                  ? React.createElement('iframe', {
                      src: '/selection-preview.html',
                      style: { width: '100%', height: '100%', border: 'none', borderRadius: 8, display: 'block' },
                      title: 'OBS overlay preview',
                    })
                  : <View style={styles.overlayEmpty}><Text style={styles.overlayEmptyText}>Open on web to preview</Text></View>
                }
              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.bg0,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Stats bar (inline above tabs)
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.bg1,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingHorizontal: 20,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.fg3,
  },
  tabLabelActive: {
    color: Colors.fg0,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },

  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bg2,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.fg1,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.accent,
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentFg,
  },
  btnSecondaryXS: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  btnSecondaryXSActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  btnSecondaryXSText: {
    fontSize: 11,
    color: Colors.fg2,
  },
  btnSecondaryXSTextActive: {
    color: Colors.accent,
  },
  btnDisabled: { opacity: 0.5 },

  // Draft Control
  draftStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.borderSubtle,
  },
  draftStatusOpen: {
    backgroundColor: 'rgba(74,222,128,0.10)', borderColor: '#4ADE8055',
  },
  draftStatusDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.fg3,
  },
  draftStatusDotOpen: { backgroundColor: Colors.green },
  draftStatusText: { fontSize: 11, fontWeight: '600', color: Colors.fg3 },
  draftStatusTextOpen: { color: Colors.green },

  draftToggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bg2, marginTop: 8,
  },
  draftToggleOpen: {
    borderColor: '#4ADE8055', backgroundColor: 'rgba(74,222,128,0.07)',
  },
  draftKnobTrack: {
    width: 34, height: 20, borderRadius: 10,
    backgroundColor: Colors.bg3, borderWidth: 1, borderColor: Colors.borderDefault,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  draftKnobTrackOn: { backgroundColor: Colors.green, borderColor: Colors.green },
  draftKnob: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.fg3,
  },
  draftKnobOn: { backgroundColor: '#fff', alignSelf: 'flex-end' },
  draftToggleLabel: { flex: 1, fontSize: 13, color: Colors.fg2, fontWeight: '500' },
  draftToggleLabelOn: { color: Colors.green },

  draftAllowedHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, marginBottom: 8, flexWrap: 'wrap', gap: 6,
  },
  draftSectionLabel: { fontSize: 12, fontWeight: '600', color: Colors.fg2 },
  draftAllowedActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  draftAnimBtn: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1,
  },
  draftAnimBtnOpen: { backgroundColor: 'rgba(74,222,128,0.10)', borderColor: '#4ADE8055' },
  draftAnimBtnOpenText: { fontSize: 11, fontWeight: '600', color: Colors.green },
  draftAnimBtnClose: { backgroundColor: Colors.redSoft, borderColor: Colors.red + '40' },
  draftAnimBtnCloseText: { fontSize: 11, fontWeight: '600', color: Colors.red },
  draftLinkBtn: { fontSize: 12, color: Colors.fg3, fontWeight: '500' },

  draftGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
  },
  draftChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 8, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1,
    borderColor: Colors.borderSubtle, backgroundColor: Colors.bg2,
  },
  draftChipActive: {
    borderColor: Colors.accent + '88', backgroundColor: Colors.accentSoft,
  },
  draftChipText: { fontSize: 11, fontWeight: '500', color: Colors.fg2, maxWidth: 90 },
  draftChipTextActive: { color: Colors.accent },

  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: Colors.bg1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.fg0,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.fg3,
  },

  // Two-column
  twoCol: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  livePicksCard: {
    flex: 1.4,
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  rightCol: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    overflow: 'hidden',
  },

  // Card header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.fg0,
  },
  cardSub: {
    fontSize: 11,
    color: Colors.fg3,
    marginTop: 1,
  },
  syncTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,214,107,0.25)',
  },
  syncDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  syncText: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '600',
  },
  byVotesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: Colors.accentSoft,
  },
  byVotesText: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '600',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  openUrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bg2,
  },
  openUrlText: {
    fontSize: 11,
    color: Colors.fg2,
    fontWeight: '500',
  },
  pushingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: Colors.greenSoft,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.25)',
  },
  pushingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  pushingText: {
    fontSize: 10,
    color: Colors.green,
    fontWeight: '600',
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: Colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.bg2,
  },
  thCell: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.fg3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  tableRowLatest: {
    backgroundColor: Colors.accentSoft,
  },
  tdCell: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tdIndex: {
    fontSize: 12,
    color: Colors.fg3,
    fontFamily: 'monospace',
  },
  tdPerson: {
    gap: 7,
  },
  tdTime: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.fg3,
  },
  personName: {
    fontSize: 12,
    color: Colors.fg0,
    fontWeight: '500',
    flex: 1,
  },
  previewBtn: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  endRoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.red,
  },
  endRoundText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingRow: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.fg3,
    fontSize: 13,
  },
  emptyRow: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.fg3,
    fontSize: 13,
  },

  // Ranking
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  rankNum: {
    width: 20,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.fg3,
    textAlign: 'center',
  },
  rankNumGold: {
    color: Colors.accent,
  },
  rankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rankName: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.fg0,
    flex: 1,
  },
  rankBarTrack: {
    height: 3,
    backgroundColor: Colors.bg4,
    borderRadius: 2,
  },
  rankBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  rankCount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.fg1,
    width: 22,
    textAlign: 'right',
  },
  lockPanel: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    backgroundColor: Colors.bg2,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  lockPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lockPanelTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.fg2,
  },
  lockPanelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockSelectAll: {
    fontSize: 10,
    color: Colors.accent,
    fontWeight: '600',
  },
  lockDivider: {
    fontSize: 10,
    color: Colors.fg4,
  },
  lockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 2,
  },
  lockItemChecked: {
    backgroundColor: Colors.bg3,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  checkmark: {
    fontSize: 10,
    color: Colors.accentFg,
    fontWeight: '800',
    lineHeight: 12,
  },
  lockItemName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.fg0,
  },
  lockItemBy: {
    fontSize: 10,
    color: Colors.fg3,
    fontStyle: 'italic',
  },
  lockPanelFooter: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: 4,
  },
  lockCancelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    alignItems: 'center',
  },
  lockCancelText: {
    fontSize: 12,
    color: Colors.fg2,
    fontWeight: '500',
  },
  lockRemoveBtn: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.red,
    alignItems: 'center',
  },
  lockRemoveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  lockedByText: {
    fontSize: 9,
    color: Colors.fg3,
    fontStyle: 'italic',
  },
  inUseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.greenSoft,
  },
  inUseText: {
    fontSize: 9,
    color: Colors.green,
    fontWeight: '600',
  },

  // Preview area
  previewArea: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
  },
  sizeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bg2,
  },
  sizeBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  sizeBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.fg3,
  },
  sizeBtnTextActive: {
    color: Colors.accent,
  },
  overlayEmpty: {
    padding: 16,
    alignItems: 'center',
  },
  overlayEmptyText: {
    fontSize: 12,
    color: Colors.fg3,
  },

  // Avatar
  avatarWrap: {
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
});
