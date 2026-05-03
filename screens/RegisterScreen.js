import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Pressable,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, UserPlus, User, X, AlertCircle } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { registerWithEmail, updateUserDisplayName } from '../services/authService';

const DEFAULT_DOMAIN = '@tuber-tools.com';
const toEmail = (input) => input.includes('@') ? input : input + DEFAULT_DOMAIN;

const STORAGE_KEY = 'tuber_saved_profiles';

function saveProfile(email, displayName) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      const existing = raw ? JSON.parse(raw).filter(p => p.email !== email) : [];
      const updated = [{ email, displayName: displayName || email.split('@')[0] }, ...existing].slice(0, 3);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch { }
}

function ErrorPopup({ visible, title, message, onClose }) {
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

  return (
    <View style={popup.overlay}>
      <Animated.View style={[popup.box, { opacity, transform: [{ translateY }] }]}>
        <View style={popup.iconWrap}>
          <AlertCircle size={28} color="#FF4444" />
        </View>
        <View style={popup.body}>
          <Text style={popup.title}>{title}</Text>
          <Text style={popup.message}>{message}</Text>
        </View>
        <Pressable style={popup.closeBtn} onPress={onClose}>
          <X size={18} color={Colors.textSecondary} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function RegisterScreen({ navigation }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ visible: false, title: '', message: '' });

  const showError = (title, message) => setErrorPopup({ visible: true, title, message });

  const handleRegister = async () => {
    if (!displayName.trim()) { showError('กรุณากรอกข้อมูล', 'โปรดใส่ชื่อที่ต้องการแสดง'); return; }
    if (!email.trim()) { showError('กรุณากรอกข้อมูล', 'โปรดใส่ Email หรือ Username'); return; }
    if (!password) { showError('กรุณากรอกข้อมูล', 'โปรดใส่รหัสผ่าน'); return; }
    if (password.length < 6) { showError('รหัสผ่านสั้นเกินไป', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (password !== confirmPassword) { showError('รหัสผ่านไม่ตรงกัน', 'กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง'); return; }

    const finalEmail = toEmail(email.trim());
    setLoading(true);
    try {
      await registerWithEmail(finalEmail, password);
      await updateUserDisplayName(displayName.trim());
      saveProfile(finalEmail, displayName.trim());
    } catch (error) {
      showError('สมัครสมาชิกไม่สำเร็จ', getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ErrorPopup
        visible={errorPopup.visible}
        title={errorPopup.title}
        message={errorPopup.message}
        onClose={() => setErrorPopup(p => ({ ...p, visible: false }))}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoWrap}>
              <UserPlus size={32} color={Colors.accent} />
            </View>
            <Text style={styles.title}>สมัครสมาชิก</Text>
            <Text style={styles.subtitle}>สร้างบัญชีใหม่เพื่อเริ่มใช้งาน</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={[styles.inputContainer, displayName ? styles.inputActive : null]}>
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

            <View style={[styles.inputContainer, email ? styles.inputActive : null]}>
              <Mail size={18} color={email ? Colors.accent : Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email หรือ Username"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, password ? styles.inputActive : null]}>
              <Lock size={18} color={password ? Colors.accent : Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, confirmPassword ? styles.inputActive : null]}>
              <Lock size={18} color={confirmPassword ? Colors.accent : Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ยืนยันรหัสผ่าน"
                placeholderTextColor={Colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.registerBtnText}>สมัครสมาชิก</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>มีบัญชีอยู่แล้ว? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use': return 'Email นี้ถูกใช้งานแล้ว';
    case 'auth/invalid-email': return 'รูปแบบ Email ไม่ถูกต้อง';
    case 'auth/weak-password': return 'รหัสผ่านอ่อนแอเกินไป ใช้อย่างน้อย 6 ตัวอักษร';
    case 'auth/network-request-failed': return 'ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ กรุณาตรวจสอบการเชื่อมต่อ';
    default: return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  headerContainer: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#2A2A2A',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 6 },

  formContainer: { gap: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
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

  registerBtn: {
    backgroundColor: Colors.accent,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { color: '#000', fontSize: 15, fontWeight: 'bold' },

  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  loginText: { color: Colors.textSecondary, fontSize: 14 },
  loginLink: { color: Colors.accent, fontSize: 14, fontWeight: 'bold' },
});

const popup = StyleSheet.create({
  overlay: { position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 999 },
  box: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A1A', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#FF444440', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FF444415', justifyContent: 'center', alignItems: 'center',
  },
  body: { flex: 1 },
  title: { color: '#FF6666', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  message: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#252525', justifyContent: 'center', alignItems: 'center',
  },
});
