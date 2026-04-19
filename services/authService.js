import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebaseConfig';

// Email/Password Sign In
export const loginWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Email/Password Register
export const registerWithEmail = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Email Link (Passwordless) Sign In
const actionCodeSettings = {
  url: 'https://tuber-tools-266cb.firebaseapp.com/finishSignUp',
  handleCodeInApp: true,
};

export const sendEmailLink = async (email) => {
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  // Save email locally for completing sign-in
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('emailForSignIn', email);
  }
};

export const completeEmailLinkSignIn = (email, emailLink) => {
  if (isSignInWithEmailLink(auth, emailLink)) {
    return signInWithEmailLink(auth, email, emailLink);
  }
  throw new Error('Invalid email link');
};

export const checkIsSignInWithEmailLink = (link) => {
  return isSignInWithEmailLink(auth, link);
};

// Google Sign In (Web)
export const loginWithGoogle = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// Google Sign In with credential (for React Native)
export const loginWithGoogleCredential = (idToken) => {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
};

// Anonymous Sign In
export const loginAnonymously = () => {
  return signInAnonymously(auth);
};

// Sign Out
export const logout = () => {
  return signOut(auth);
};

// Auth State Observer
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};
