import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Animated, Pressable, Image,
  ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { ChevronLeft, User, Mail, Lock, Eye, EyeOff, Camera, CheckCircle, AlertCircle, X, Shield } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { updateUserDisplayName, updateUserPhoto, changePassword } from '../services/authService';

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

  const borderColor = success ? '#1DB95440' : '#FF444440';
  const iconColor = success ? '#1DB954' : '#FF4444';
  const iconBg = success ? '#1DB95415' : '#FF444415';

  return (
    <View style={toast.overlay}>
      <Animated.View style={[toast.box, { opacity, transform: [{ translateY }], borderColor }]}>
        <View style={[toast.iconWrap, { backgroundColor: iconBg }]}>
          {success
            ? <CheckCircle size={24} color={iconColor} />
            : <AlertCircle size={24} color={iconColor} />
          }
        </View>
        <Text style={[toast.message, { color: success ? '#4ADE80' : '#FF6666' }]}>{message}</Text>
        <Pressable style={toast.closeBtn} onPress={onClose}>
          <X size={16} color={Colors.textSecondary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, isAdmin } = useAuth();

  const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com') ?? false;

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
    if (!displayName.trim()) { showToast(false, 'กรุณากรอกชื่อที่ต้องการแสดง'); return; }
    setSavingProfile(true);
    try {
      await updateUserDisplayName(displayName.trim());
      await updateUserPhoto(photoURL.trim());
      showToast(true, 'บันทึกโปรไฟล์สำเร็จ');
    } catch {
      showToast(false, 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { showToast(false, 'กรุณากรอกรหัสผ่านปัจจุบัน'); return; }
    if (!newPassword) { showToast(false, 'กรุณากรอกรหัสผ่านใหม่'); return; }
    if (newPassword.length < 6) { showToast(false, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (newPassword !== confirmNewPassword) { showToast(false, 'รหัสผ่านใหม่ไม่ตรงกัน'); return; }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showToast(true, 'เปลี่ยนรหัสผ่านสำเร็จ');
    } catch (e) {
      const msg = (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential')
        ? 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
        : 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่';
      showToast(false, msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const email = user?.email || '';
  const initial = (user?.displayName || email || '?')[0].toUpperCase();
  const avatarColor = getAvatarColor(email);
  const previewPhoto = photoURL.trim();

  return (
    <SafeAreaView style={styles.container}>
      <Toast
        visible={toastState.visible}
        success={toastState.success}
        message={toastState.message}
        onClose={() => setToastState(t => ({ ...t, visible: false }))}
      />

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navInner}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ChevronLeft color={Colors.text} size={20} />
            <Text style={styles.backText}>กลับ</Text>
          </Pressable>
          <Text style={styles.navTitle}>โปรไฟล์</Text>
          <View style={{ width: 70 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Avatar preview */}
          <View style={styles.avatarSection}>
            {previewPhoto ? (
              <Image source={{ uri: previewPhoto }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
            <Text style={styles.avatarName}>{user?.displayName || email.split('@')[0]}</Text>
            <Text style={styles.avatarEmail}>{email}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Shield size={13} color="#F1C40F" />
                <Text style={styles.adminBadgeText}>Admin</Text>
              </View>
            )}
          </View>

          {/* Profile Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ข้อมูลโปรไฟล์</Text>

            <View style={[styles.inputContainer, displayName && styles.inputActive]}>
              <User size={18} color={displayName ? Colors.accent : Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ชื่อที่ต้องการแสดง"
                placeholderTextColor={Colors.textSecondary}
                value={displayName}
                onChangeText={setDisplayName}
                autoCorrect={false}
                maxLength={20}
              />
            </View>

            <View style={[styles.inputContainer, previewPhoto && styles.inputActive]}>
              <Camera size={18} color={previewPhoto ? Colors.accent : Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="URL รูปโปรไฟล์ (ไม่บังคับ)"
                placeholderTextColor={Colors.textSecondary}
                value={photoURL}
                onChangeText={setPhotoURL}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View style={styles.readonlyRow}>
              <Mail size={16} color={Colors.textSecondary} style={styles.inputIcon} />
              <Text style={styles.readonlyText}>{email}</Text>
              <View style={styles.readonlyBadge}><Text style={styles.readonlyBadgeText}>อีเมล</Text></View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, savingProfile && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.saveBtnText}>บันทึกโปรไฟล์</Text>
              }
            </TouchableOpacity>
          </View>

          {!isGoogleUser && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>เปลี่ยนรหัสผ่าน</Text>

              <View style={[styles.inputContainer, currentPassword && styles.inputActive]}>
                <Lock size={18} color={currentPassword ? Colors.accent : Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="รหัสผ่านปัจจุบัน"
                  placeholderTextColor={Colors.textSecondary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPw}
                />
                <TouchableOpacity onPress={() => setShowCurrentPw(v => !v)} style={styles.eyeIcon}>
                  {showCurrentPw
                    ? <EyeOff size={18} color={Colors.textSecondary} />
                    : <Eye size={18} color={Colors.textSecondary} />
                  }
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, newPassword && styles.inputActive]}>
                <Lock size={18} color={newPassword ? Colors.accent : Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
                  placeholderTextColor={Colors.textSecondary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPw}
                />
                <TouchableOpacity onPress={() => setShowNewPw(v => !v)} style={styles.eyeIcon}>
                  {showNewPw
                    ? <EyeOff size={18} color={Colors.textSecondary} />
                    : <Eye size={18} color={Colors.textSecondary} />
                  }
                </TouchableOpacity>
              </View>

              <View style={[styles.inputContainer, confirmNewPassword && styles.inputActive]}>
                <Lock size={18} color={confirmNewPassword ? Colors.accent : Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ยืนยันรหัสผ่านใหม่"
                  placeholderTextColor={Colors.textSecondary}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry={!showNewPw}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, savingPassword && styles.btnDisabled]}
                onPress={handleChangePassword}
                disabled={savingPassword}
              >
                {savingPassword
                  ? <ActivityIndicator color="#000" />
                  : <Text style={styles.saveBtnText}>เปลี่ยนรหัสผ่าน</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  navbar: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    backgroundColor: '#181818',
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#242424',
    minWidth: 70,
  },
  backText: { color: Colors.text, fontSize: 13 },
  navTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },

  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },

  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarImg: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, borderColor: Colors.accent + '60',
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarInitial: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  avatarName: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginTop: 12 },
  avatarEmail: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, backgroundColor: '#F1C40F15',
    borderWidth: 1, borderColor: '#F1C40F40',
  },
  adminBadgeText: { color: '#F1C40F', fontSize: 13, fontWeight: 'bold' },

  section: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  inputActive: { borderColor: Colors.accent + '60' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.text, fontSize: 15, height: '100%' },
  eyeIcon: { padding: 4 },

  readonlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#222',
    gap: 10,
  },
  readonlyText: { flex: 1, color: Colors.textSecondary, fontSize: 14 },
  readonlyBadge: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readonlyBadgeText: { color: Colors.textSecondary, fontSize: 10 },

  saveBtn: {
    backgroundColor: Colors.accent,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#000', fontSize: 15, fontWeight: 'bold' },
});

const toast = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 999 },
  box: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 14, padding: 14,
    borderWidth: 1.5, gap: 12,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  message: { flex: 1, fontSize: 13, fontWeight: '600' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#252525', justifyContent: 'center', alignItems: 'center',
  },
});
