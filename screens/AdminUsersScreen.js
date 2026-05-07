import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Pressable, TextInput, Image, ActivityIndicator, Modal,
} from 'react-native';
import {
  Search, Shield, Users, Activity,
  CalendarDays, Edit2, UserPlus, Download, Lock, Eye, EyeOff, User, Camera, X, CheckCircle, AlertCircle,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUsers, setUserRole, updateUserData } from '../services/userService';
import { adminSetUserPassword } from '../services/authService';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

const AVATAR_COLORS = [
  '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71',
  '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63',
];

function getAvatarColor(email = '') {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatRelative(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function UserAvatar({ user, size = 28 }) {
  const color = getAvatarColor(user.email);
  const initial = (user.displayName || user.email || '?')[0].toUpperCase();
  if (user.photoURL) {
    return <Image source={{ uri: user.photoURL }} style={[styles.userAvatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.userAvatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.userAvatarInitial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

// Simple "online/idle/offline" status derived from lastSeen
function getUserStatus(user) {
  if (!user.lastSeen) return 'offline';
  const diff = Date.now() - user.lastSeen;
  if (diff < 5 * 60 * 1000) return 'online';
  if (diff < 30 * 60 * 1000) return 'idle';
  return 'offline';
}

const STATUS_COLOR = {
  online: Colors.green,
  idle: Colors.accent,
  offline: Colors.fg4,
};

function TableHeaderRow() {
  return (
    <View style={[styles.tableRow, styles.tableHeaderRow]}>
      <View style={styles.colUser}>
        <Text style={styles.headerCell}>User</Text>
      </View>
      <View style={styles.colEmail}>
        <Text style={styles.headerCell}>Email</Text>
      </View>
      <View style={styles.colRole}>
        <Text style={styles.headerCell}>Role</Text>
      </View>
      <View style={styles.colStatus}>
        <Text style={styles.headerCell}>Status</Text>
      </View>
      <View style={styles.colLastActive}>
        <Text style={styles.headerCell}>Last active</Text>
      </View>
      <View style={styles.colActions}>
        <Text style={styles.headerCell}>Actions</Text>
      </View>
    </View>
  );
}

const ROLE_OPTIONS = ['user', 'mod', 'admin'];
const ROLE_LABEL = { admin: 'Admin', mod: 'Mod', user: 'User' };
const ROLE_COLOR = { admin: Colors.accent, mod: '#60A5FA', user: Colors.fg3 };

function EditUserModal({ user, userRole, visible, onClose, onSaved }) {
  const currentRole = userRole || (user?.isAdmin ? 'admin' : 'user');
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok, msg }

  useEffect(() => {
    if (visible && user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      setSelectedRole(userRole || (user.isAdmin ? 'admin' : 'user'));
      setNewPassword('');
      setShowPassword(false);
      setFeedback(null);
    }
  }, [visible, user?.uid]);

  const showFeedback = (ok, msg) => {
    setFeedback({ ok, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserData(user.uid, {
        displayName: displayName.trim() || user.displayName || '',
        photoURL: photoURL.trim() || null,
      });
      await setUserRole(user.uid, selectedRole);
      showFeedback(true, 'บันทึกสำเร็จ');
      onSaved?.();
    } catch {
      showFeedback(false, 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showFeedback(false, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setSavingPassword(true);
    try {
      await adminSetUserPassword(user.uid, newPassword);
      setNewPassword('');
      showFeedback(true, 'เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (e) {
      showFeedback(false, e?.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.editModal} onPress={e => e.stopPropagation()}>

          {/* Header */}
          <View style={styles.editModalHeader}>
            <View style={styles.editModalHeaderLeft}>
              <UserAvatar user={{ ...user, displayName, photoURL }} size={36} />
              <View>
                <Text style={styles.editModalName} numberOfLines={1}>
                  {displayName || user.email?.split('@')[0]}
                </Text>
                <Text style={styles.editModalEmail} numberOfLines={1}>{user.email}</Text>
              </View>
            </View>
            <Pressable style={styles.editModalClose} onPress={onClose}>
              <X size={16} color={Colors.fg2} strokeWidth={2} />
            </Pressable>
          </View>

          {/* Feedback */}
          {feedback && (
            <View style={[styles.feedbackBar, { backgroundColor: feedback.ok ? Colors.greenSoft : Colors.redSoft, borderColor: feedback.ok ? Colors.green + '40' : Colors.red + '40' }]}>
              {feedback.ok
                ? <CheckCircle size={14} color={Colors.green} strokeWidth={2} />
                : <AlertCircle size={14} color={Colors.red} strokeWidth={2} />
              }
              <Text style={[styles.feedbackText, { color: feedback.ok ? Colors.green : Colors.red }]}>{feedback.msg}</Text>
            </View>
          )}

          <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>

            {/* Display name */}
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>Display name</Text>
              <View style={styles.editInputRow}>
                <User size={15} color={Colors.fg3} strokeWidth={2} />
                <TextInput
                  style={styles.editInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Display name"
                  placeholderTextColor={Colors.fg3}
                  autoCorrect={false}
                  maxLength={30}
                />
              </View>
            </View>

            {/* Photo URL */}
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>Photo URL</Text>
              <View style={styles.editInputRow}>
                <Camera size={15} color={Colors.fg3} strokeWidth={2} />
                <TextInput
                  style={styles.editInput}
                  value={photoURL}
                  onChangeText={setPhotoURL}
                  placeholder="https://..."
                  placeholderTextColor={Colors.fg3}
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>

            {/* Role */}
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>Role</Text>
              <View style={styles.roleChips}>
                {ROLE_OPTIONS.map(r => {
                  const active = selectedRole === r;
                  return (
                    <Pressable
                      key={r}
                      style={[styles.roleChip, active && { backgroundColor: ROLE_COLOR[r] + '22', borderColor: ROLE_COLOR[r] + '80' }]}
                      onPress={() => setSelectedRole(r)}
                    >
                      {r === 'admin' && <Shield size={11} color={active ? ROLE_COLOR[r] : Colors.fg3} strokeWidth={2} />}
                      <Text style={[styles.roleChipText, { color: active ? ROLE_COLOR[r] : Colors.fg3 }]}>
                        {ROLE_LABEL[r]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Password */}
            <View style={styles.editField}>
              <Text style={styles.editFieldLabel}>ตั้งรหัสผ่านใหม่</Text>
              <View style={styles.editInputRow}>
                <Lock size={15} color={Colors.fg3} strokeWidth={2} />
                <TextInput
                  style={styles.editInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                  placeholderTextColor={Colors.fg3}
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
                  {showPassword
                    ? <EyeOff size={15} color={Colors.fg3} strokeWidth={2} />
                    : <Eye size={15} color={Colors.fg3} strokeWidth={2} />
                  }
                </Pressable>
              </View>
              <Pressable
                style={({ pressed }) => [styles.setPasswordBtn, (!newPassword || newPassword.length < 6 || savingPassword) && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
                onPress={handleSetPassword}
                disabled={!newPassword || newPassword.length < 6 || savingPassword}
              >
                {savingPassword
                  ? <ActivityIndicator size="small" color={Colors.accentFg} />
                  : <Text style={styles.setPasswordBtnText}>บันทึกรหัสผ่าน</Text>
                }
              </Pressable>
            </View>

          </ScrollView>

          {/* Footer */}
          <View style={styles.editModalFooter}>
            <Pressable style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]} onPress={onClose}>
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={Colors.accentFg} />
                : <Text style={styles.saveBtnText}>บันทึก</Text>
              }
            </Pressable>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

function UserTableRow({ user, userRole, isSelf, onSetRole, onEdit, toggling }) {
  const status = getUserStatus(user);
  const currentRole = userRole || (user.isAdmin ? 'admin' : 'user');

  return (
    <View style={[styles.tableRow, styles.tableDataRow]}>
      <View style={styles.colUser}>
        <View style={styles.userCellInner}>
          <View style={styles.avatarWithDot}>
            <UserAvatar user={user} size={28} />
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[status] }]} />
          </View>
          <Text style={styles.cellUsername} numberOfLines={1}>
            {user.displayName || user.email?.split('@')[0] || '—'}
          </Text>
          {isSelf && (
            <View style={styles.selfTag}>
              <Text style={styles.selfTagText}>You</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.colEmail}>
        <Text style={styles.cellEmail} numberOfLines={1}>{user.email || '—'}</Text>
      </View>

      <View style={styles.colRole}>
        <View style={[styles.roleTag, { borderColor: (ROLE_COLOR[currentRole] ?? Colors.fg3) + '40', backgroundColor: (ROLE_COLOR[currentRole] ?? Colors.fg3) + '18' }]}>
          {currentRole === 'admin' && <Shield size={9} color={ROLE_COLOR[currentRole]} strokeWidth={2} />}
          <Text style={[styles.roleTagText, { color: ROLE_COLOR[currentRole] ?? Colors.fg3 }]}>
            {ROLE_LABEL[currentRole] ?? currentRole}
          </Text>
        </View>
      </View>

      <View style={styles.colStatus}>
        <Text style={[styles.cellStatus, { color: STATUS_COLOR[status] }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
      </View>

      <View style={styles.colLastActive}>
        <Text style={styles.cellLastActive}>{formatRelative(user.lastSeen)}</Text>
      </View>

      <View style={styles.colActions}>
        <View style={styles.actionBtns}>
          {!isSelf && (
            <Pressable
              style={({ pressed }) => [styles.iconActionBtn, pressed && { opacity: 0.6 }]}
              onPress={() => onEdit(user)}
              disabled={toggling === user.uid}
            >
              {toggling === user.uid
                ? <ActivityIndicator size="small" color={Colors.fg2} />
                : <Edit2 size={13} color={Colors.fg2} strokeWidth={2} />
              }
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const FILTER_ALL = 'all';
const FILTER_ADMIN = 'admin';
const FILTER_USER = 'user';

export default function AdminUsersScreen({ navigation }) {
  const { user: currentUser, isAdmin, role } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState(null);
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    return subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const handleSetRole = async (uid, newRole) => {
    setToggling(uid);
    try {
      await setUserRole(uid, newRole);
    } finally {
      setToggling(null);
    }
  };

  const handleEdit = (user) => setEditingUser(user);

  const getUserRoleField = (u) => u.role || (u.isAdmin ? 'admin' : 'user');

  const adminCount = users.filter(u => getUserRoleField(u) === 'admin').length;
  const modCount = users.filter(u => getUserRoleField(u) === 'mod').length;
  const userCount = users.length - adminCount - modCount;

  const filtered = users.filter(u => {
    const matchSearch = !search.trim()
      || u.displayName?.toLowerCase().includes(search.toLowerCase())
      || u.email?.toLowerCase().includes(search.toLowerCase());
    const userRoleField = getUserRoleField(u);
    const matchFilter =
      activeFilter === FILTER_ALL
        ? true
        : activeFilter === FILTER_ADMIN
          ? userRoleField === 'admin'
          : userRoleField === 'user' || userRoleField === 'mod';
    return matchSearch && matchFilter;
  });

  const filters = [
    { id: FILTER_ALL, label: `All (${users.length})` },
    { id: FILTER_ADMIN, label: `Admin (${adminCount})` },
    { id: FILTER_USER, label: `User/Mod (${userCount + modCount})` },
  ];

  return (
    <SafeAreaView style={styles.root}>
      <EditUserModal
        user={editingUser}
        userRole={editingUser ? getUserRoleField(editingUser) : 'user'}
        visible={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSaved={() => setEditingUser(null)}
      />

      {/* Sidebar */}
      <Sidebar navigation={navigation} active="admin" user={currentUser} isAdmin={isAdmin} role={role} />

      {/* Main */}
      <View style={styles.main}>
        <TopBar crumbs={['System', 'Admin', 'Users']} navigation={navigation} showSearch={false} />

        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Page header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderLeft}>
              <Text style={styles.pageTitle}>Users</Text>
              <Text style={styles.pageSubtitle}>{users.length} total members</Text>
            </View>
            <View style={styles.pageHeaderRight}>
              <Pressable style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.7 }]}>
                <Download size={14} color={Colors.fg1} strokeWidth={2} />
                <Text style={styles.headerBtnText}>Export</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [styles.headerBtnPrimary, pressed && { opacity: 0.85 }]}>
                <UserPlus size={14} color={Colors.accentFg} strokeWidth={2} />
                <Text style={styles.headerBtnPrimaryText}>Invite</Text>
              </Pressable>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Users size={15} color={Colors.fg2} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>{users.length}</Text>
              <Text style={styles.statLabel}>Total users</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Activity size={15} color={Colors.green} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: Colors.green }]}>
                {users.filter(u => getUserStatus(u) === 'online').length}
              </Text>
              <Text style={styles.statLabel}>Online now</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <Shield size={15} color={Colors.accent} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: Colors.accent }]}>{adminCount}</Text>
              <Text style={styles.statLabel}>Pro tier</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <CalendarDays size={15} color={Colors.fg2} strokeWidth={2} />
              </View>
              <Text style={styles.statValue}>—</Text>
              <Text style={styles.statLabel}>Sessions today</Text>
            </View>
          </View>

          {/* Filters row */}
          <View style={styles.filtersRow}>
            {/* Search */}
            <View style={styles.searchBox}>
              <Search size={14} color={Colors.fg2} strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users…"
                placeholderTextColor={Colors.fg3}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            {/* Filter tabs */}
            <View style={styles.filterTabs}>
              {filters.map(f => (
                <Pressable
                  key={f.id}
                  style={[styles.filterTab, activeFilter === f.id && styles.filterTabActive]}
                  onPress={() => setActiveFilter(f.id)}
                >
                  <Text style={[styles.filterTabText, activeFilter === f.id && styles.filterTabTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Users table */}
          <View style={styles.tableCard}>
            <TableHeaderRow />

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={Colors.accent} />
              </View>
            ) : filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : (
              filtered.map((item) => (
                <UserTableRow
                  key={item.uid}
                  user={item}
                  userRole={getUserRoleField(item)}
                  isSelf={item.uid === currentUser?.uid}
                  onSetRole={handleSetRole}
                  onEdit={handleEdit}
                  toggling={toggling}
                />
              ))
            )}
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
    padding: 24,
    gap: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },

  // Page header
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  pageHeaderLeft: {
    gap: 2,
  },
  pageTitle: {
    color: Colors.fg0,
    fontSize: 22,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: Colors.fg3,
    fontSize: 13,
  },
  pageHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  headerBtnText: {
    color: Colors.fg1,
    fontSize: 13,
    fontWeight: '500',
  },
  headerBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  headerBtnPrimaryText: {
    color: Colors.accentFg,
    fontSize: 13,
    fontWeight: '700',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: Colors.bg1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 16,
    gap: 6,
    flexDirection: 'column',
  },
  statIconWrap: {},
  statValue: {
    color: Colors.fg0,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.fg3,
    fontSize: 11,
  },

  // Filters
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bg2,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    width: 260,
  },
  searchInput: {
    flex: 1,
    color: Colors.fg0,
    fontSize: 13,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 4,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: Colors.bg2,
    borderColor: Colors.borderDefault,
  },
  filterTabText: {
    color: Colors.fg3,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: Colors.fg0,
  },

  // Table
  tableCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  tableHeaderRow: {
    backgroundColor: Colors.bg2,
    paddingVertical: 10,
  },
  tableDataRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  headerCell: {
    color: Colors.fg3,
    fontSize: 10.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Column widths
  colUser: { flex: 2.5, minWidth: 120 },
  colEmail: { flex: 2.5, minWidth: 120 },
  colRole: { flex: 1, minWidth: 70 },
  colStatus: { flex: 1, minWidth: 70 },
  colLastActive: { flex: 1.2, minWidth: 80 },
  colActions: { width: 70, alignItems: 'flex-end' },

  // User cell
  userCellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  userAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatarInitial: {
    color: '#fff',
    fontWeight: '700',
  },
  avatarWithDot: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.bg1,
  },
  cellUsername: {
    color: Colors.fg0,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  selfTag: {
    backgroundColor: Colors.accentSoft,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  selfTagText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },

  // Email cell
  cellEmail: {
    color: Colors.fg2,
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // Role tags
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  roleTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rolePickerModal: {
    backgroundColor: Colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    minWidth: 200,
    overflow: 'hidden',
    padding: 4,
  },
  rolePickerTitle: {
    color: Colors.fg3,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: 2,
  },
  rolePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rolePickerItemActive: {
    backgroundColor: Colors.bg3,
  },
  rolePickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rolePickerItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  rolePickerCheck: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Status
  cellStatus: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Last active
  cellLastActive: {
    color: Colors.fg3,
    fontSize: 12,
  },

  // Action buttons
  actionBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  iconActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingWrap: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.fg3,
    fontSize: 14,
  },

  // Edit User Modal
  editModal: {
    backgroundColor: Colors.bg1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    width: 420,
    maxWidth: '92%',
    overflow: 'hidden',
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    gap: 12,
  },
  editModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  editModalName: {
    color: Colors.fg0,
    fontSize: 14,
    fontWeight: '700',
  },
  editModalEmail: {
    color: Colors.fg3,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  editModalClose: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  editField: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  editFieldLabel: {
    color: Colors.fg3,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  editInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  editInput: {
    flex: 1,
    color: Colors.fg0,
    fontSize: 13,
  },
  roleChips: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bg2,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  setPasswordBtn: {
    backgroundColor: Colors.bg3,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    marginTop: 2,
  },
  setPasswordBtnText: {
    color: Colors.fg0,
    fontSize: 13,
    fontWeight: '600',
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  cancelBtnText: {
    color: Colors.fg1,
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.accentFg,
    fontSize: 13,
    fontWeight: '700',
  },
});
