import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  directusLogin,
  directusLogout,
  loadStoredTokens,
  hasSession,
  getValidToken,
} from '@/lib/directusClient';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function detectRole(roleName: string): Role {
  return roleName.toLowerCase().includes('admin') ? 'admin' : 'user';
}

// ─── Storage key (for persisting User object) ────────────────────────────────

const STORAGE_KEY = '@inventory_user';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Context ─────────────────────────────────────────────────────────────────

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ──
  useEffect(() => {
    (async () => {
      try {
        // Load tokens into memory first
        await loadStoredTokens();

        if (hasSession()) {
          // Try to get a valid token (will refresh if needed)
          const token = await getValidToken();
          if (token) {
            // Restore cached user profile
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) setUser(JSON.parse(raw));
          }
        }
      } catch {
        // Session expired or server unreachable — stay logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Login ──
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { user: directusUser } = await directusLogin(email, password);

      const appUser: User = {
        id:       directusUser.id,
        name:     `${directusUser.first_name} ${directusUser.last_name}`.trim(),
        email:    directusUser.email,
        role:     detectRole(directusUser.role?.name ?? ''),
        initials: initials(`${directusUser.first_name} ${directusUser.last_name}`.trim()),
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(appUser));
      setUser(appUser);
      return { success: true };

    } catch (err: any) {
      const message = err?.message ?? '';

      if (message === 'NOT_AUTHENTICATED' || message.includes('Invalid user credentials')) {
        return { success: false, error: 'Email ou mot de passe incorrect.' };
      }
      if (message.includes('fetch') || message.includes('Network') || message.includes('ECONNREFUSED')) {
        return { success: false, error: 'Impossible de joindre le serveur. Vérifiez votre connexion.' };
      }
      return { success: false, error: 'Une erreur est survenue. Réessayez.' };
    }
  };

  // ── Logout ──
  const logout = async () => {
    await directusLogout();
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
