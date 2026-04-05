import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import { Settings, Database } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';

const GAMES = [
  {
    id: '12vtuber',
    title: '12VTuber',
    description: 'ศึก 12 VTuber',
    emoji: '🗿',
    screen: 'VTuberSelection',
    tag: 'LIVE',
  },
  // เพิ่มเกมใหม่ที่นี่
];

export default function SelectGameScreen({ navigation }) {
  const responsive = useResponsive();
  const isWide = responsive.width >= 768;

  const renderGame = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.gameCard,
        isWide && styles.gameCardWide,
        pressed && styles.gameCardPressed,
      ]}
      onPress={() => navigation.navigate(item.screen, { gameId: item.id })}
    >
      <View style={styles.gameCardLeft}>
        <Text style={styles.gameEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.gameCardBody}>
        <View style={styles.gameTitleRow}>
          <Text style={styles.gameTitle}>{item.title}</Text>
          {item.tag && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          )}
        </View>
        <Text style={styles.gameDesc}>{item.description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Text style={styles.navLogo}>12VTuber</Text>
          <View style={styles.navActions}>
            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('AdminData')}>
              <Database color={Colors.textSecondary} size={18} />
              {isWide && <Text style={styles.navBtnText}>Admin</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('SelectionLog')}>
              <Settings color={Colors.textSecondary} size={18} />
              {isWide && <Text style={styles.navBtnText}>Log</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>SELECT GAME</Text>
          <Text style={styles.pageSubtitle}>เลือกเกมที่ต้องการเล่น</Text>
        </View>

        <FlatList
          data={GAMES}
          renderItem={renderGame}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Navbar
  navbar: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#181818',
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  navLogo: {
    color: Colors.accent,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#242424',
  },
  navBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
  },
  pageHeader: {
    marginBottom: 32,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  listContainer: {
    gap: 12,
  },
  // Game Card
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 16,
  },
  gameCardWide: {
    padding: 24,
  },
  gameCardPressed: {
    backgroundColor: '#222222',
    borderColor: Colors.accent,
  },
  gameCardLeft: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#242424',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameEmoji: {
    fontSize: 28,
  },
  gameCardBody: {
    flex: 1,
  },
  gameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  gameTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  tagBadge: {
    backgroundColor: '#1DB95420',
    borderWidth: 1,
    borderColor: '#1DB954',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    color: '#1DB954',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  gameDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    color: Colors.textSecondary,
    fontSize: 28,
    fontWeight: '300',
  },
});
