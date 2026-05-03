import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Pressable,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, LogIn, X, AlertCircle } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { loginWithEmail, loginWithGoogle } from '../services/authService';

const DEFAULT_DOMAIN = '@tuber-tools.com';
const toEmail = (input) => input.includes('@') ? input : input + DEFAULT_DOMAIN;

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

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorPopup, setErrorPopup] = useState({ visible: false, title: '', message: '' });

  const showError = (title, message) => {
    setErrorPopup({ visible: true, title, message });
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        showError('เข้าสู่ระบบไม่สำเร็จ', 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email.trim()) { showError('กรุณากรอกข้อมูล', 'โปรดใส่ Email หรือ Username'); return; }
    if (!password) { showError('กรุณากรอกข้อมูล', 'โปรดใส่ Password ของคุณ'); return; }
    setLoading(true);
    try {
      await loginWithEmail(toEmail(email.trim()), password);
    } catch (error) {
      showError('เข้าสู่ระบบไม่สำเร็จ', getErrorMessage(error.code));
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoWrap}>
              <LogIn size={32} color={Colors.accent} />
            </View>
            <Text style={styles.title}>tuber-tools</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
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
                placeholder="Password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.loginBtnText}>เข้าสู่ระบบ</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>หรือ</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Login */}
            <TouchableOpacity
              style={[styles.googleBtn, googleLoading && styles.loginBtnDisabled]}
              onPress={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.googleBtnText}>เข้าสู่ระบบด้วย Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Register */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>ยังไม่มีบัญชี? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>สมัครสมาชิก</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email': return 'รูปแบบ Email ไม่ถูกต้อง';
    case 'auth/user-disabled': return 'บัญชีนี้ถูกระงับการใช้งาน';
    case 'auth/user-not-found': return 'ไม่พบบัญชีที่ใช้ Email นี้';
    case 'auth/wrong-password': return 'รหัสผ่านไม่ถูกต้อง';
    case 'auth/invalid-credential': return 'Email หรือรหัสผ่านไม่ถูกต้อง';
    case 'auth/too-many-requests': return 'ลองหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่';
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

  headerContainer: { alignItems: 'center', marginBottom: 36 },
  logoWrap: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1, borderColor: '#2A2A2A',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.accent, letterSpacing: 1 },
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

  loginBtn: {
    backgroundColor: Colors.accent,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: '#000', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },

  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  registerText: { color: Colors.textSecondary, fontSize: 14 },
  registerLink: { color: Colors.accent, fontSize: 14, fontWeight: 'bold' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A2A' },
  dividerText: { color: Colors.textSecondary, fontSize: 12 },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  googleIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  googleBtnText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
});

const popup = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 24, left: 16, right: 16,
    zIndex: 999,
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FF444440',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FF444415',
    justifyContent: 'center', alignItems: 'center',
  },
  body: { flex: 1 },
  title: { color: '#FF6666', fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  message: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#252525',
    justifyContent: 'center', alignItems: 'center',
  },
});
