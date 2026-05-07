import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Pressable, useWindowDimensions,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, User, X, AlertCircle, ArrowRight } from 'lucide-react-native';
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
          <X size={18} color={Colors.fg2} />
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

  const { width } = useWindowDimensions();
  const isWide = width >= 640;

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

      {/* Ambient glow */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isWide && styles.cardWide]}>
            {/* Logo row */}
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoMarkText}>T</Text>
              </View>
              <Text style={styles.logoName}>tubertools.app</Text>
            </View>

            {/* Labels */}
            <Text style={styles.createTag}>CREATE ACCOUNT</Text>
            <Text style={styles.cardH2}>Join your studio</Text>
            <Text style={styles.cardSub}>Sign up to manage your stream.</Text>

            {/* Fields */}
            <View style={[styles.fieldsWrap, isWide && styles.fieldsGrid]}>
              {/* Display Name */}
              <View style={[styles.inputContainer, displayName ? styles.inputActive : null, isWide && styles.fieldHalf]}>
                <User size={16} color={displayName ? Colors.accent : Colors.fg3} style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="Display name"
                  placeholderTextColor={Colors.fg3}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCorrect={false}
                  maxLength={20}
                />
              </View>

              {/* Email */}
              <View style={[styles.inputContainer, email ? styles.inputActive : null, isWide && styles.fieldHalf]}>
                <Mail size={16} color={email ? Colors.accent : Colors.fg3} style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="Email or username"
                  placeholderTextColor={Colors.fg3}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={[styles.inputContainer, password ? styles.inputActive : null, isWide && styles.fieldHalf]}>
                <Lock size={16} color={password ? Colors.accent : Colors.fg3} style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 chars)"
                  placeholderTextColor={Colors.fg3}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword
                    ? <EyeOff size={16} color={Colors.fg3} />
                    : <Eye size={16} color={Colors.fg3} />
                  }
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={[styles.inputContainer, confirmPassword ? styles.inputActive : null, isWide && styles.fieldHalf]}>
                <Lock size={16} color={confirmPassword ? Colors.accent : Colors.fg3} style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.fg3}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.accentFg} />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.primaryBtnText}>Create account</Text>
                  <ArrowRight size={16} color={Colors.accentFg} />
                </View>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
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
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
    overflow: 'hidden',
  },

  glowTop: {
    position: 'absolute',
    top: '-15%',
    left: '20%',
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: 'rgba(255,214,107,0.05)',
    pointerEvents: 'none',
  },
  glowBottom: {
    position: 'absolute',
    bottom: '-15%',
    right: '10%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(96,165,250,0.04)',
    pointerEvents: 'none',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  card: {
    width: '100%',
    backgroundColor: Colors.bg1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 14,
    padding: 28,
  },
  cardWide: {
    width: 460,
    padding: 32,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  logoMark: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoMarkText: {
    color: Colors.accentFg,
    fontSize: 15,
    fontWeight: 'bold',
  },
  logoName: {
    color: Colors.fg1,
    fontSize: 14,
    fontWeight: '600',
  },

  createTag: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardH2: {
    color: Colors.fg0,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardSub: {
    color: Colors.fg2,
    fontSize: 13,
    marginBottom: 24,
  },

  fieldsWrap: {
    gap: 12,
    marginBottom: 16,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldHalf: {
    width: '47%',
    flexShrink: 1,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg2,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  inputActive: {
    borderColor: Colors.accent + '55',
  },
  inputIconLeft: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: Colors.fg0,
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },

  primaryBtn: {
    backgroundColor: Colors.accent,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  btnDisabled: { opacity: 0.55 },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: Colors.accentFg,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: Colors.fg2,
    fontSize: 13,
  },
  loginLink: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
});

const popup = StyleSheet.create({
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
    backgroundColor: Colors.bg3,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#F8717140',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8717115',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { flex: 1 },
  title: { color: '#F87171', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  message: { color: Colors.fg2, fontSize: 12, lineHeight: 17 },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.bg4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
