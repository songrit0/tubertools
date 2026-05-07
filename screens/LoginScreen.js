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
  useWindowDimensions,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, ArrowRight, X, AlertCircle } from 'lucide-react-native';
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
          <X size={18} color={Colors.fg2} />
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

  const { width } = useWindowDimensions();
  const isWide = width >= 920;

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

  const formContent = (
    <View style={styles.formPanel}>
      <View style={styles.formInner}>
        <Text style={styles.signInTag}>SIGN IN</Text>
        <Text style={styles.welcomeH2}>Welcome back</Text>
        <Text style={styles.welcomeSub}>Continue to your studio.</Text>

        <View style={styles.fieldsWrap}>
          {/* Email field */}
          <View style={[styles.inputContainer, email ? styles.inputActive : null]}>
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

          {/* Password field */}
          <View style={[styles.inputContainer, password ? styles.inputActive : null]}>
            <Lock size={16} color={password ? Colors.accent : Colors.fg3} style={styles.inputIconLeft} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.fg3}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIconRight}>
              {showPassword
                ? <EyeOff size={16} color={Colors.fg3} />
                : <Eye size={16} color={Colors.fg3} />
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.forgotLink}>
              <Text style={styles.forgotText}>Forgot?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleEmailLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.accentFg} />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.primaryBtnText}>Sign in</Text>
                <ArrowRight size={16} color={Colors.accentFg} />
              </View>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google button */}
          <TouchableOpacity
            style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={Colors.fg1} />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.googleIconText}>G</Text>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>New here? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isWide) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorPopup
          visible={errorPopup.visible}
          title={errorPopup.title}
          message={errorPopup.message}
          onClose={() => setErrorPopup(p => ({ ...p, visible: false }))}
        />
        {/* Ambient glows */}
        <View style={styles.glowTopLeft} pointerEvents="none" />
        <View style={styles.glowBottomRight} pointerEvents="none" />

        <View style={styles.wideLayout}>
          {/* Left brand panel */}
          <View style={styles.brandPanel}>
            <View style={styles.brandPanelInner}>
              <View style={styles.brandLogoRow}>
                <View style={styles.logoMark}>
                  <Text style={styles.logoMarkText}>T</Text>
                </View>
                <Text style={styles.brandName}>tubertools.app</Text>
              </View>
              <Text style={styles.brandTagline}>Creator Suite · For YouTubers</Text>
              <Text style={styles.brandH1}>{"Stream tools\nfor YouTubers."}</Text>
              {/* <Text style={styles.brandSubtext}>
                Soundboards, draft picks, lower-thirds, and game tools — one console for your channel and your team to run live, together.
              </Text> */}
            </View>
          </View>

          {/* Right form panel */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.formPanelWide}
          >
            <ScrollView
              contentContainerStyle={styles.formPanelWideScroll}
              keyboardShouldPersistTaps="handled"
            >
              {formContent}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ErrorPopup
        visible={errorPopup.visible}
        title={errorPopup.title}
        message={errorPopup.message}
        onClose={() => setErrorPopup(p => ({ ...p, visible: false }))}
      />
      <View style={styles.glowTopLeft} pointerEvents="none" />
      <View style={styles.glowBottomRight} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.mobileScroll}
          keyboardShouldPersistTaps="handled"
        >
          {formContent}
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
  container: {
    flex: 1,
    backgroundColor: Colors.bg0,
    overflow: 'hidden',
  },

  // Ambient glows
  glowTopLeft: {
    position: 'absolute',
    top: '-10%',
    left: '5%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(255,214,107,0.06)',
    pointerEvents: 'none',
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: '-10%',
    right: '5%',
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(96,165,250,0.05)',
    pointerEvents: 'none',
  },

  // Wide layout
  wideLayout: {
    flex: 1,
    flexDirection: 'row',
  },

  // Brand panel (left)
  brandPanel: {
    flex: 1,
    backgroundColor: '#0F0F12',
    borderRightWidth: 1,
    borderRightColor: Colors.borderSubtle,
    justifyContent: 'center',
  },
  brandPanelInner: {
    paddingHorizontal: 56,
    paddingVertical: 48,
    maxWidth: 520,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
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
  brandName: {
    color: Colors.fg1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  brandTagline: {
    color: Colors.fg3,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 24,
  },
  brandH1: {
    color: Colors.fg0,
    fontSize: 38,
    fontWeight: 'bold',
    letterSpacing: -1.2,
    lineHeight: 46,
    marginBottom: 18,
  },
  brandSubtext: {
    color: Colors.fg2,
    fontSize: 14,
    lineHeight: 22,
  },

  // Form panel (right, wide)
  formPanelWide: {
    width: 420,
    backgroundColor: Colors.bg1,
  },
  formPanelWideScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  // Form panel (shared)
  formPanel: {
    flex: 1,
  },
  formInner: {
    padding: 40,
  },

  // Mobile scroll
  mobileScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },

  signInTag: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  welcomeH2: {
    color: Colors.fg0,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  welcomeSub: {
    color: Colors.fg2,
    fontSize: 13,
    marginBottom: 28,
  },

  fieldsWrap: {
    gap: 12,
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
  inputIconRight: {
    padding: 4,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    color: Colors.fg0,
    fontSize: 14,
    height: '100%',
  },
  forgotLink: {
    marginLeft: 8,
    paddingHorizontal: 2,
  },
  forgotText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },

  primaryBtn: {
    backgroundColor: Colors.accent,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  dividerText: {
    color: Colors.fg3,
    fontSize: 12,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bg3,
  },
  googleIconText: {
    color: Colors.fg0,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  googleBtnText: {
    color: Colors.fg1,
    fontSize: 14,
    fontWeight: '600',
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  registerText: {
    color: Colors.fg2,
    fontSize: 13,
  },
  registerLink: {
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
