import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Pressable,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { LogOut, Users } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../contexts/AuthContext';

const AVATAR_COLORS = [
  '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71',
  '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63',
];

function getAvatarColor(email) {
  let hash = 0;
  for (let i = 0; i < (email || '').length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const GAMES = [
  {
    id: '12vtuber',
    title: '12VTuber',
    description: 'ศึก 12 VTuber',
    emoji: '🗿',
    screen: 'VTuberSelection',
    tag: 'LIVE',
    isUse: true,
  },
  {
    id: 'domino',
    title: 'โดมิโน่',
    description: 'เกมโดมิโน่ออนไลน์ แบบบอร์ดเกม',
    emoji: '🁣',
    tag: 'NEW',
    isUse: true,
    isExternal: true,
  },
  {
    id: 'soundboard',
    title: 'Soundboard',
    description: 'ปุ่มเสียงสำหรับ Stream ส่งไปเล่นที่ OBS',
    emoji: '🔊',
    screen: 'SoundBoard',
    tag: 'NEW',
    isUse: true,
  },
];

export default function SelectGameScreen({ navigation }) {
  const responsive = useResponsive();
  const isWide = responsive.width >= 768;
  const { signOut, user, isAdmin } = useAuth();

  const email = user?.email || '';
  const initial = (user?.displayName || email || '?')[0].toUpperCase();
  const avatarColor = getAvatarColor(email);

  const renderGame = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.gameCard,
        isWide && styles.gameCardWide,
        !item.isUse && styles.gameCardDisabled,
        item.isUse && pressed && styles.gameCardPressed,
      ]}
      onPress={() => {
        if (!item.isUse) return;
        if (item.isExternal) {
          const baseUrl = Platform.OS === 'web'
            ? `${window.location.origin}/${item.id}.html`
            : `https://tuber-tools-266cb.web.app/${item.id}.html`;
          if (Platform.OS === 'web') {
            window.open(baseUrl, '_blank');
          } else {
            Linking.openURL(baseUrl);
          }
        } else {
          navigation.navigate(item.screen, { gameId: item.id });
        }
      }}
      disabled={!item.isUse}
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
        {!item.isUse && (
          <Text style={styles.disabledText}>ระบบกำลังปิดใช้งาน</Text>
        )}
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Text style={styles.navLogo}>tuber-tools</Text>
          <View style={styles.navActions}>
            {isAdmin && (
              <TouchableOpacity style={styles.navBtn} onPress={() => navigation.navigate('AdminUsers')}>
                <Users color={Colors.textSecondary} size={18} />
                {isWide && <Text style={styles.navBtnText}>Users</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
              {user?.photoURL ? (
                <Image source={{ uri: user.photoURL }} style={styles.profileAvatar} />
              ) : (
                <View style={[styles.profileAvatar, styles.profileAvatarFallback, { backgroundColor: avatarColor }]}>
                  <Text style={styles.profileInitial}>{initial}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, styles.logoutBtn]} onPress={signOut}>
              <LogOut color="#FF4444" size={18} />
              {isWide && <Text style={styles.logoutBtnText}>Logout</Text>}
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
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#FF444440',
    backgroundColor: '#FF444415',
  },
  logoutBtnText: {
    color: '#FF4444',
    fontSize: 13,
  },
  profileBtn: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.accent + '60',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileAvatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
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
  gameCardDisabled: {
    opacity: 0.4,
  },
  disabledText: {
    color: '#FF4444',
    fontSize: 11,
    marginTop: 4,
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
