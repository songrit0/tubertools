import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import {
  loginWithEmail,
  loginWithGoogle,
  loginAnonymously,
  sendEmailLink,
} from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    setLoadingType('email');
    try {
      await loginWithEmail(email, password);
    } catch (error) {
      Alert.alert('Login Failed', getErrorMessage(error.code));
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleEmailLinkLogin = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    setLoadingType('emailLink');
    try {
      await sendEmailLink(email);
      Alert.alert(
        'Email Sent',
        `A sign-in link has been sent to ${email}. Please check your inbox.`
      );
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error.code));
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setLoadingType('google');
    try {
      await loginWithGoogle();
    } catch (error) {
      if (error.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Google Login Failed', getErrorMessage(error.code));
      }
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setLoadingType('anonymous');
    try {
      await loginAnonymously();
    } catch (error) {
      Alert.alert('Anonymous Login Failed', getErrorMessage(error.code));
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <LogIn size={48} color={Colors.accent} />
            <Text style={styles.title}>VTuber Tools</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Email/Password Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Mail size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Email/Password Login Button */}
            <TouchableOpacity
              style={[styles.button, styles.emailButton]}
              onPress={handleEmailLogin}
              disabled={loading}
            >
              {loadingType === 'email' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Mail size={20} color="#fff" />
                  <Text style={styles.buttonText}>Sign in with Email</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Email Link (Passwordless) Button */}
            {/* <TouchableOpacity
              style={[styles.button, styles.emailLinkButton]}
              onPress={handleEmailLinkLogin}
              disabled={loading}
            >
              {loadingType === 'emailLink' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Mail size={20} color="#fff" />
                  <Text style={styles.buttonText}>Sign in with Email Link</Text>
                </>
              )}
            </TouchableOpacity> */}
          </View>

          {/* Divider */}
          {/* <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View> */}

          {/* Social Login Buttons */}
          {/* <View style={styles.socialContainer}>
            <TouchableOpacity
              style={[styles.button, styles.googleButton]}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              {loadingType === 'google' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={styles.buttonText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.anonymousButton]}
              onPress={handleAnonymousLogin}
              disabled={loading}
            >
              {loadingType === 'anonymous' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue as Guest</Text>
              )}
            </TouchableOpacity>
          </View> */}

          {/* Register Link */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
    maxWidth: 450,
    width: '100%',
    alignSelf: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  formContainer: {
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 10,
  },
  emailButton: {
    backgroundColor: '#2196F3',
  },
  emailLinkButton: {
    backgroundColor: '#7C4DFF',
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  anonymousButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleIcon: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.textSecondary,
    opacity: 0.3,
  },
  dividerText: {
    color: Colors.textSecondary,
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    gap: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
