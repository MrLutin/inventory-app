import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

// ─── Test accounts ────────────────────────────────────────────────────────────

const ACCOUNTS: Array<User & { password: string }> = [
  {
    id: '1',
    name: 'Admin MrLutin',
    email: 'admin@mrlutin.dev',
    password: 'admin123',
    role: 'admin',
    initials: 'AM',
  },
  {
    id: '2',
    name: 'Utilisateur Test',
    email: 'user@mrlutin.dev',
    password: 'user123',
    role: 'user',
    initials: 'UT',
  },
];

const STORAGE_KEY = '@inventory_user';

// ─── Context ──────────────────────────────────────────────────────────────────

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) setUser(JSON.parse(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const account = ACCOUNTS.find(
      a => a.email.toLowerCase() === email.toLowerCase().trim() && a.password === password
    );
    if (!account) {
      return { success: false, error: 'Email ou mot de passe incorrect.' };
    }
    const { password: _, ...userData } = account;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    return { success: true };
  };

  const logout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
