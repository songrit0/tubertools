import { ref, set, get, remove, onValue, update } from 'firebase/database';
import { realtimeDb } from './firebaseConfig';

export const saveUserToDatabase = async (user) => {
  const provider = user.providerData?.[0]?.providerId || 'password';
  const userRef = ref(realtimeDb, `users/${user.uid}`);
  const snapshot = await get(userRef);

  const updates = {
    displayName: user.displayName || user.email?.split('@')[0] || '',
    email: user.email || '',
    photoURL: user.photoURL || null,
    provider,
    lastLoginAt: Date.now(),
  };

  if (snapshot.exists()) {
    await update(userRef, updates);
  } else {
    await set(userRef, { ...updates, createdAt: Date.now(), isAdmin: false });
  }
};

export const subscribeToUsers = (callback) => {
  const usersRef = ref(realtimeDb, 'users');
  return onValue(usersRef, (snapshot) => {
    const data = snapshot.val() || {};
    const users = Object.entries(data).map(([uid, u]) => ({ uid, ...u }));
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    callback(users);
  });
};

export const checkIsAdmin = async (uid) => {
  const snapshot = await get(ref(realtimeDb, `users/${uid}/isAdmin`));
  return snapshot.val() === true;
};

export const getUserRole = async (uid) => {
  const snapshot = await get(ref(realtimeDb, `users/${uid}`));
  if (!snapshot.exists()) return 'user';
  const data = snapshot.val();
  if (data.role) return data.role;
  if (data.isAdmin === true) return 'admin';
  return 'user';
};

export const setUserRole = async (uid, role) => {
  await update(ref(realtimeDb, `users/${uid}`), {
    role,
    isAdmin: role === 'admin',
  });
};

export const setAdminStatus = async (uid, isAdmin) => {
  await update(ref(realtimeDb, `users/${uid}`), { isAdmin });
};

export const updateUserData = async (uid, data) => {
  await update(ref(realtimeDb, `users/${uid}`), data);
};
