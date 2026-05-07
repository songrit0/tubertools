import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToAuthState, logout, reloadUser } from '../services/authService';
import { saveUserToDatabase, getUserRole } from '../services/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('user');

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        saveUserToDatabase(firebaseUser);
        const r = await getUserRole(firebaseUser.uid);
        setRole(r);
      } else {
        setRole('user');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await logout();
  };

  const refreshUser = async () => {
    const fresh = await reloadUser();
    if (fresh) setUser({ ...fresh });
  };

  const isAdmin = role === 'admin';
  const isMod = role === 'mod' || role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, role, isAdmin, isMod, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
