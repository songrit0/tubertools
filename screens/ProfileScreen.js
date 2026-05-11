import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Animated, Pressable, Image,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import {
  User, Mail, Lock, Eye, EyeOff, Camera,
  CheckCircle, AlertCircle, X, Shield, LogOut, UserX, Info,
} from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { updateUserDisplayName, updateUserPhoto, changePassword } from '../services/authService';
import { saveUserToDatabase } from '../services/userService';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';

const AVATAR_COLORS = [
  '#E74C3C', '#E67E22', '#F1C40F', '#2ECC71',
  '#1ABC9C', '#3498DB', '#9B59B6', '#E91E63',
];

function getAvatarColor(email) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Toast({ visible, success, message, onClose }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const borderColor = success ? Colors.green + '40' : Colors.red + '40';
  const iconColor = success ? Colors.green : Colors.red;
  const iconBg = success ? Colors.greenSoft : Colors.redSoft;

  return (
    <View style={toast.overlay}>
      <Animated.View style={[toast.box, { opacity, transform: [{ translateY }], borderColor }]}>
        <View style={[toast.iconWrap, { backgroundColor: iconBg }]}>
          {success
            ? <CheckCircle size={24} color={iconColor} />
            : <AlertCircle size={24} color={iconColor} />
          }
        </View>
        <Text style={[toast.message, { color: success ? Colors.green : Colors.red }]}>{message}</Text>
        <Pressable style={toast.closeBtn} onPress={onClose}>
          <X size={16} color={Colors.fg2} />
        </Pressable>
      </Animated.View>
    </View>
  );
}


function authMethodLabel(user) {
  if (!user) return { label: 'ยังไม่ได้เข้าสู่ระบบ', detail: '' };
  if (user.isAnonymous) {
    return {
      label: 'เข้าสู่ระบบโดยไม่ระบุตัวตน',
      detail: 'บัญชี Guest · ไม่มีการบันทึกข้อมูลโปรไฟล์',
    };
  }
  const provider = user.providerData?.[0]?.providerId;
  if (provider === 'google.com') {
    return { label: 'เข้าสู่ระบบด้วย Google', detail: user.email || '' };
  }
  if (provider === 'password') {
    return { label: 'เข้าสู่ระบบด้วย Email + Password', detail: user.email || '' };
  }
  return { label: 'เข้าสู่ระบบ', detail: user.email || '' };
}

export default function ProfileScreen({ navigation }) {
  const { user, isAdmin, role, signOut, refreshUser } = useAuth();

  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com') ?? false;
  const isAnonymous = !!user?.isAnonymous;

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [toastState, setToastState] = useState({ visible: false, success: true, message: '' });

  const showToast = (success, message) => {
    setToastState({ visible: true, success, message });
    setTimeout(() => setToastState(t => ({ ...t, visible: false })), 3000);
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) { showToast(false, 'Please enter a display name'); return; }
    setSavingProfile(true);
    try {
      await updateUserDisplayName(displayName.trim());
      await updateUserPhoto(photoURL.trim());
      if (user) await saveUserToDatabase({ ...user, displayName: displayName.trim(), photoURL: photoURL.trim() });
      await refreshUser();
      showToast(true, 'Profile saved successfully');
    } catch {
      showToast(false, 'Failed to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { showToast(false, 'Enter your current password'); return; }
    if (!newPassword) { showToast(false, 'Enter a new password'); return; }
    if (newPassword.length < 6) { showToast(false, 'New password must be at least 6 characters'); return; }
    if (newPassword !== confirmNewPassword) { showToast(false, 'New passwords do not match'); return; }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast(true, 'Password changed successfully');
    } catch (e) {
      const msg = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')
        ? 'Current password is incorrect'
        : 'Failed to change password. Please try again.';
      showToast(false, msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const email = user?.email || '';
  const initial = (user?.displayName || email || '?')[0].toUpperCase();
  const avatarColor = getAvatarColor(email);
  const previewPhoto = photoURL.trim();

  const joinedDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  // Anonymous users get a stripped-down screen — no profile editor, no
  // password change. Just a notice telling them what they're signed in as.
  if (isAnonymous) {
    const method = authMethodLabel(user);
    return (
      <SafeAreaView style={styles.root}>
        <Sidebar navigation={navigation} active="profile" user={user} isAdmin={isAdmin} role={role} />
        <View style={styles.main}>
          <TopBar crumbs={['System', 'Profile']} navigation={navigation} showSearch={false} />
          <View style={styles.anonWrap}>
            <View style={styles.anonCard}>
              <View style={styles.anonIcon}>
                <UserX size={32} color={Colors.accent} />
              </View>
              <Text style={styles.anonTitle}>{method.label}</Text>
              <Text style={styles.anonDetail}>{method.detail}</Text>
              <View style={styles.anonNotice}>
                <Info size={14} color={Colors.fg2} />
                <Text style={styles.anonNoticeText}>
                  โปรไฟล์จะไม่ถูกแสดงสำหรับการเข้าสู่ระบบประเภทนี้
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.75 }, { marginTop: 18 }]}
                onPress={signOut}
              >
                <LogOut size={15} color={Colors.red} strokeWidth={2} />
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <Toast
        visible={toastState.visible}
        success={toastState.success}
        message={toastState.message}
        onClose={() => setToastState(t => ({ ...t, visible: false }))}
      />

      {/* Sidebar */}
      <Sidebar navigation={navigation} active="profile" user={user} isAdmin={isAdmin} role={role} />

      {/* Main */}
      <View style={styles.main}>
        <TopBar
          crumbs={['System', 'Profile']}
          navigation={navigation}
          showSearch={false}
          rightSlot={
            <Pressable
              style={[styles.saveHeaderBtn, savingProfile && { opacity: 0.6 }]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile
                ? <ActivityIndicator size="small" color={Colors.accentFg} />
                : <Text style={styles.saveHeaderBtnText}>Save changes</Text>
              }
            </Pressable>
          }
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

            {/* Hero Card */}
            <View style={styles.heroCard}>
              {/* Banner */}
              <View style={styles.heroBanner}>
                <View style={styles.heroBannerOverlay} />
              </View>

              {/* Avatar + info row */}
              <View style={styles.heroBody}>
                <View style={styles.heroAvatarRow}>
                  {previewPhoto
                    ? <Image source={{ uri: previewPhoto }} style={styles.heroAvatar} />
                    : (
                      <View style={[styles.heroAvatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.heroAvatarInitial}>{initial}</Text>
                      </View>
                    )
                  }
                  <View style={styles.heroNameBlock}>
                    <View style={styles.heroNameRow}>
                      <Text style={styles.heroUsername}>{user?.displayName || email.split('@')[0]}</Text>
                      {isAdmin && (
                        <View style={styles.adminBadge}>
                          <Shield size={11} color={Colors.accent} />
                          <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.heroEmail}>{email}</Text>
                    {joinedDate && (
                      <Text style={styles.heroJoined}>Joined {joinedDate}</Text>
                    )}
                  </View>
                </View>

                {/* Change avatar button */}
                <Pressable style={styles.changeAvatarBtn}>
                  <Camera size={14} color={Colors.fg2} strokeWidth={2} />
                  <Text style={styles.changeAvatarText}>Change</Text>
                </Pressable>
              </View>
            </View>

            {/* Settings */}
            <View style={styles.settingsGrid}>
              {/* Account card */}
              <View style={styles.settingsCard}>
                <Text style={styles.cardTitle}>Account</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Display name</Text>
                  <View style={[styles.inputContainer, displayName && styles.inputActive]}>
                    <User size={16} color={displayName ? Colors.accent : Colors.fg3} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Your display name"
                      placeholderTextColor={Colors.fg3}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCorrect={false}
                      maxLength={20}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <View style={[styles.inputContainer, styles.inputReadonly]}>
                    <Mail size={16} color={Colors.fg3} style={styles.inputIcon} />
                    <Text style={styles.readonlyText} numberOfLines={1}>{email}</Text>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Avatar URL</Text>
                  <View style={[styles.inputContainer, previewPhoto && styles.inputActive]}>
                    <Camera size={16} color={previewPhoto ? Colors.accent : Colors.fg3} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="https://example.com/avatar.png"
                      placeholderTextColor={Colors.fg3}
                      value={photoURL}
                      onChangeText={setPhotoURL}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.saveProfileBtn, savingProfile && styles.btnDisabled]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile
                    ? <ActivityIndicator color={Colors.accentFg} />
                    : <Text style={styles.saveProfileBtnText}>บันทึก</Text>
                  }
                </TouchableOpacity>

                {!isGoogleUser && (
                  <>
                    <View style={styles.sectionDivider} />
                    <Text style={styles.cardTitle}>Change password</Text>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Current password</Text>
                      <View style={[styles.inputContainer, currentPassword && styles.inputActive]}>
                        <Lock size={16} color={currentPassword ? Colors.accent : Colors.fg3} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Current password"
                          placeholderTextColor={Colors.fg3}
                          value={currentPassword}
                          onChangeText={setCurrentPassword}
                          secureTextEntry={!showCurrentPw}
                        />
                        <Pressable onPress={() => setShowCurrentPw(v => !v)} style={styles.eyeIcon}>
                          {showCurrentPw
                            ? <EyeOff size={16} color={Colors.fg3} />
                            : <Eye size={16} color={Colors.fg3} />
                          }
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>New password</Text>
                      <View style={[styles.inputContainer, newPassword && styles.inputActive]}>
                        <Lock size={16} color={newPassword ? Colors.accent : Colors.fg3} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Min. 6 characters"
                          placeholderTextColor={Colors.fg3}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showNewPw}
                        />
                        <Pressable onPress={() => setShowNewPw(v => !v)} style={styles.eyeIcon}>
                          {showNewPw
                            ? <EyeOff size={16} color={Colors.fg3} />
                            : <Eye size={16} color={Colors.fg3} />
                          }
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>Confirm new password</Text>
                      <View style={[styles.inputContainer, confirmNewPassword && styles.inputActive]}>
                        <Lock size={16} color={confirmNewPassword ? Colors.accent : Colors.fg3} style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Repeat new password"
                          placeholderTextColor={Colors.fg3}
                          value={confirmNewPassword}
                          onChangeText={setConfirmNewPassword}
                          secureTextEntry={!showNewPw}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.savePwBtn, savingPassword && styles.btnDisabled]}
                      onPress={handleChangePassword}
                      disabled={savingPassword}
                    >
                      {savingPassword
                        ? <ActivityIndicator color={Colors.accentFg} />
                        : <Text style={styles.savePwBtnText}>Update password</Text>
                      }
                    </TouchableOpacity>
                  </>
                )}

                <View style={styles.sectionDivider} />

                <Pressable
                  style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.75 }]}
                  onPress={signOut}
                >
                  <LogOut size={15} color={Colors.red} strokeWidth={2} />
                  <Text style={styles.signOutText}>Sign out</Text>
                </Pressable>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
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
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },

  // Save button in TopBar header area (rendered via custom approach)
  saveHeaderBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    height: 32,
  },
  saveHeaderBtnText: {
    color: Colors.accentFg,
    fontSize: 13,
    fontWeight: '700',
  },

  // Hero Card
  heroCard: {
    backgroundColor: Colors.bg1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
  heroBanner: {
    height: 120,
    backgroundColor: '#3D2800',
    backgroundGradient: true,
    position: 'relative',
  },
  heroBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,8,0,0.35)',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -32,
    flexWrap: 'wrap',
    gap: 12,
  },
  heroAvatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.bg0,
    overflow: 'hidden',
  },
  heroAvatarInitial: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  heroNameBlock: {
    paddingBottom: 4,
    gap: 2,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  heroUsername: {
    color: Colors.fg0,
    fontSize: 18,
    fontWeight: '700',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentSoft,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  adminBadgeText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroEmail: {
    color: Colors.fg2,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  heroJoined: {
    color: Colors.fg3,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    alignSelf: 'flex-end',
  },
  changeAvatarText: {
    color: Colors.fg2,
    fontSize: 12,
    fontWeight: '500',
  },

  // Settings grid
  settingsGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  settingsCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: Colors.bg1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    color: Colors.fg3,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: Colors.borderSubtle,
    marginVertical: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: Colors.fg2,
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
    gap: 10,
  },
  inputActive: {
    borderColor: Colors.accent + '60',
  },
  inputReadonly: {
    backgroundColor: Colors.bg1,
    borderColor: Colors.borderSubtle,
  },
  inputIcon: {},
  input: {
    flex: 1,
    color: Colors.fg0,
    fontSize: 14,
  },
  readonlyText: {
    flex: 1,
    color: Colors.fg3,
    fontSize: 14,
  },
  eyeIcon: {
    padding: 4,
  },
  saveProfileBtn: {
    backgroundColor: Colors.accent,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveProfileBtnText: {
    color: Colors.accentFg,
    fontSize: 14,
    fontWeight: '700',
  },
  savePwBtn: {
    backgroundColor: Colors.bg3,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  savePwBtnText: {
    color: Colors.fg0,
    fontSize: 14,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.5 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.redSoft,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.red + '30',
    alignSelf: 'flex-start',
  },
  signOutText: {
    color: Colors.red,
    fontSize: 13,
    fontWeight: '600',
  },

  // Anonymous / unsupported-profile screen
  anonWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  anonCard: {
    width: '100%', maxWidth: 460,
    backgroundColor: Colors.bg1,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.borderSubtle,
    padding: 28, alignItems: 'center', gap: 8,
  },
  anonIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  anonTitle: { color: Colors.fg0, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  anonDetail: { color: Colors.fg2, fontSize: 13, textAlign: 'center' },
  anonNotice: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.bg2,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.borderSubtle,
    marginTop: 16,
  },
  anonNoticeText: { color: Colors.fg2, fontSize: 12, flexShrink: 1 },
});

const toast = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
