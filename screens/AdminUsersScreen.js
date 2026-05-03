import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  Pressable, TextInput, Image, ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Search, Shield, ShieldOff, User } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUsers, setAdminStatus } from '../services/userService';

const AVATAR_COLORS = [
  '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71',
  '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63',
];

function getAvatarColor(email = '') {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Avatar({ user }) {
  const color = getAvatarColor(user.email);
  const initial = (user.displayName || user.email || '?')[0].toUpperCase();
  if (user.photoURL) {
    return <Image source={{ uri: user.photoURL }} style={styles.avatar} />;
  }
  return (
    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: color }]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

function UserRow({ user, isAdmin, isSelf, onToggleAdmin, toggling }) {
  return (
    <View style={styles.row}>
      <Avatar user={user} />
      <View style={styles.rowInfo}>
        <View style={styles.rowNameLine}>
          <Text style={styles.rowName} numberOfLines={1}>{user.displayName || '-'}</Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Shield size={10} color="#F1C40F" />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          {user.provider === 'google.com' && (
            <View style={styles.providerBadge}>
              <Text style={styles.providerBadgeText}>G</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowEmail} numberOfLines={1}>{user.email}</Text>
        <Text style={styles.rowDate}>สมัคร {formatDate(user.createdAt)}</Text>
      </View>
      {!isSelf && (
        <Pressable
          style={({ pressed }) => [styles.toggleBtn, isAdmin && styles.toggleBtnAdmin, pressed && { opacity: 0.7 }]}
          onPress={() => onToggleAdmin(user.uid, !isAdmin)}
          disabled={toggling === user.uid}
        >
          {toggling === user.uid
            ? <ActivityIndicator size="small" color={isAdmin ? '#F1C40F' : Colors.textSecondary} />
            : isAdmin
              ? <ShieldOff size={16} color="#F1C40F" />
              : <Shield size={16} color={Colors.textSecondary} />
          }
        </Pressable>
      )}
      {isSelf && <View style={styles.selfTag}><Text style={styles.selfTagText}>คุณ</Text></View>}
    </View>
  );
}

export default function AdminUsersScreen({ navigation }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    return subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const handleToggleAdmin = async (uid, makeAdmin) => {
    setToggling(uid);
    try {
      await setAdminStatus(uid, makeAdmin);
    } finally {
      setToggling(null);
    }
  };

  const filtered = search.trim()
    ? users.filter(u =>
        u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  return (
    <SafeAreaView style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={Colors.text} size={20} />
            <Text style={styles.backText}>กลับ</Text>
          </Pressable>
          <Text style={styles.navTitle}>จัดการ Users</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{users.length}</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหา ชื่อ หรือ Email"
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <User size={14} color={Colors.textSecondary} />
          <Text style={styles.statValue}>{users.length}</Text>
          <Text style={styles.statLabel}>Users ทั้งหมด</Text>
        </View>
        <View style={styles.statCard}>
          <Shield size={14} color="#F1C40F" />
          <Text style={[styles.statValue, { color: '#F1C40F' }]}>{users.filter(u => u.isAdmin).length}</Text>
          <Text style={styles.statLabel}>Admins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.googleG}>G</Text>
          <Text style={styles.statValue}>{users.filter(u => u.provider === 'google.com').length}</Text>
          <Text style={styles.statLabel}>Google</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              isAdmin={item.isAdmin === true}
              isSelf={item.uid === currentUser?.uid}
              onToggleAdmin={handleToggleAdmin}
              toggling={toggling}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>ไม่พบ User</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  navbar: { borderBottomWidth: 1, borderBottomColor: '#2A2A2A', backgroundColor: '#181818' },
  navInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    maxWidth: 900, alignSelf: 'center', width: '100%',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, backgroundColor: '#242424', minWidth: 70,
  },
  backText: { color: Colors.text, fontSize: 13 },
  navTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  countBadge: {
    backgroundColor: Colors.accent + '20', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.accent + '40',
  },
  countText: { color: Colors.accent, fontSize: 13, fontWeight: 'bold' },

  searchWrap: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    maxWidth: 900, alignSelf: 'center', width: '100%',
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1A1A1A', borderRadius: 12,
    paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 14 },

  statsRow: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 20, paddingBottom: 16,
    maxWidth: 900, alignSelf: 'center', width: '100%',
  },
  statCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1A1A1A', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  statValue: { color: Colors.text, fontSize: 15, fontWeight: 'bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 10, flex: 1 },
  googleG: { color: '#4285F4', fontSize: 14, fontWeight: 'bold' },

  list: { paddingHorizontal: 20, paddingBottom: 40, maxWidth: 900, alignSelf: 'center', width: '100%' },
  separator: { height: 1, backgroundColor: '#1E1E1E' },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  rowInfo: { flex: 1, gap: 2 },
  rowNameLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rowName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  rowEmail: { color: Colors.textSecondary, fontSize: 12 },
  rowDate: { color: '#444', fontSize: 11 },

  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F1C40F20', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: '#F1C40F40',
  },
  adminBadgeText: { color: '#F1C40F', fontSize: 10, fontWeight: 'bold' },

  providerBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#4285F420', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#4285F440',
  },
  providerBadgeText: { color: '#4285F4', fontSize: 10, fontWeight: 'bold' },

  toggleBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#242424', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#333',
  },
  toggleBtnAdmin: { backgroundColor: '#F1C40F15', borderColor: '#F1C40F40' },

  selfTag: {
    backgroundColor: Colors.accent + '20', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.accent + '40',
  },
  selfTagText: { color: Colors.accent, fontSize: 11, fontWeight: 'bold' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40 },
});
