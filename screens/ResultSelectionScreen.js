import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, ScrollView, Pressable,
} from 'react-native';
import { BarChart2, Users, Trophy, ArrowRight } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUserSelections } from '../services/vtuberDatabaseService';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

function AvatarCircle({ imageUrl, name, size = 88, style }) {
  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2,
      overflow: 'hidden', backgroundColor: Colors.bg3,
      justifyContent: 'center', alignItems: 'center',
    }, style]}>
      {imageUrl
        ? <Image source={{ uri: imageUrl }} style={{ width: size, height: size }} />
        : <Text style={{ color: Colors.fg1, fontSize: size * 0.35, fontWeight: '700' }}>
          {(name || '?')[0].toUpperCase()}
        </Text>
      }
    </View>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ResultSelectionScreen({ route, navigation }) {
  const { user, isAdmin, role } = useAuth();
  const { gameId, character, selectedVTuber, alreadySelected } = route.params || {};
  const [currentSelection, setCurrentSelection] = useState(selectedVTuber);

  useEffect(() => {
    const unsubscribe = subscribeToUserSelections((selections) => {
      const mine = selections.find(
        (s) => s.gameId === gameId && s.character?.id === character?.id
      );
      if (mine) {
        setCurrentSelection(mine.selectedVTuber);
      } else {
        setTimeout(() => {
          navigation.replace('SelectVTuber', { gameId, character });
        }, 500);
      }
    });
    return unsubscribe;
  }, [gameId, character?.id]);

  return (
    <SafeAreaView style={styles.root}>
      {/* Sidebar */}
      <Sidebar navigation={navigation} active="games" user={user} isAdmin={isAdmin} role={role} />

      {/* Main */}
      <View style={styles.main}>
        <TopBar crumbs={['Games', 'VTuber Draft', 'Result']} navigation={navigation} />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.centerColumn}>

            {/* Top confirmed tag */}
            <View style={styles.confirmedTag}>
              <Text style={styles.confirmedTagText}>PICK CONFIRMED ✓</Text>
            </View>

            {/* H1 */}
            {/* <Text style={styles.headline}>
              You're rolling with {currentSelection?.name || '…'}
            </Text> */}

            {/* Subtitle */}
            {/* <Text style={styles.headlineSub}>
              {alreadySelected
                ? 'You already locked this pick in earlier.'
                : `Slot ${route.params?.selectionId ? '#' + route.params.selectionId?.slice(-4) : ''} · Just now`
              }
            </Text> */}

            {/* Result Card */}
            <View style={styles.resultCard}>
              {/* Avatars row */}
              <View style={styles.avatarsRow}>
                {/* Player */}
                <View style={styles.avatarCol}>
                  <AvatarCircle
                    imageUrl={character?.imageUrl}
                    name={character?.name}
                    size={88}
                    style={styles.playerAvatarRing}
                  />
                  <Text style={styles.avatarRoleLabel}>YOU</Text>
                  <Text style={styles.avatarName}>{character?.name}</Text>
                </View>

                {/* Arrow */}
                <View style={styles.arrowWrap}>
                  <Text style={styles.arrowGold}>→</Text>
                </View>

                {/* VTuber */}
                <View style={styles.avatarCol}>
                  <AvatarCircle
                    imageUrl={currentSelection?.imageUrl}
                    name={currentSelection?.name}
                    size={120}
                    style={styles.vtuberAvatarRing}
                  />
                  <View style={styles.backingTag}>
                    <Text style={styles.backingTagText}>BACKING</Text>
                  </View>
                  <Text style={styles.avatarName}>{currentSelection?.name}</Text>
                  {/* <Text style={styles.avatarId}>#{currentSelection?.id?.slice(-8) || '--------'}</Text> */}
                </View>
              </View>

              {/* Divider */}
              {/* <View style={styles.divider} /> */}

              {/* Stats row */}
              {/* <View style={styles.statsRow}>
                <StatCard
                  icon={<BarChart2 size={16} color={Colors.fg2} strokeWidth={2} />}
                  label="Win rate"
                  value="—"
                />
                <View style={styles.statDivider} />
                <StatCard
                  icon={<Users size={16} color={Colors.fg2} strokeWidth={2} />}
                  label="Backers"
                  value="—"
                />
                <View style={styles.statDivider} />
                <StatCard
                  icon={<Trophy size={16} color={Colors.fg2} strokeWidth={2} />}
                  label="Rank"
                  value="—"
                />
              </View> */}
            </View>

            {/* Action buttons */}
            {/* <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && { opacity: 0.7 }]}
                onPress={() => navigation.navigate('SelectionLog')}
              >
                <Text style={styles.actionBtnSecondaryText}>View log</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.actionBtnSecondaryText}>Push to overlay</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.85 }]}
                onPress={() => navigation.navigate('SelectGame')}
              >
                <Text style={styles.actionBtnPrimaryText}>Back to games</Text>
              </Pressable>
            </View> */}

          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  centerColumn: {
    width: '100%',
    maxWidth: 760,
    alignItems: 'center',
    gap: 16,
  },

  // Confirmed tag
  confirmedTag: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  confirmedTagText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Headline
  headline: {
    color: Colors.fg0,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
  },
  headlineSub: {
    color: Colors.fg2,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },

  // Result card
  resultCard: {
    width: '100%',
    backgroundColor: Colors.bg1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 28,
    alignItems: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  avatarCol: {
    alignItems: 'center',
    gap: 6,
  },
  playerAvatarRing: {
    borderWidth: 2,
    borderColor: Colors.borderDefault,
  },
  vtuberAvatarRing: {
    borderWidth: 2,
    borderColor: Colors.accent + '80',
  },
  arrowWrap: {
    paddingBottom: 16,
  },
  arrowGold: {
    color: Colors.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  avatarRoleLabel: {
    color: Colors.fg3,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  avatarName: {
    color: Colors.fg0,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: 140,
  },
  backingTag: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  backingTagText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  avatarId: {
    color: Colors.fg3,
    fontSize: 10,
    fontFamily: 'monospace',
  },

  // Divider
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginBottom: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {},
  statValue: {
    color: Colors.fg0,
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.fg3,
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderSubtle,
    marginHorizontal: 8,
  },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondary: {
    backgroundColor: Colors.bg2,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  actionBtnSecondaryText: {
    color: Colors.fg1,
    fontSize: 14,
    fontWeight: '500',
  },
  actionBtnPrimary: {
    backgroundColor: Colors.accent,
  },
  actionBtnPrimaryText: {
    color: Colors.accentFg,
    fontSize: 14,
    fontWeight: '700',
  },
});
