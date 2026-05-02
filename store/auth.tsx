import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  directusLogin,
  directusLogout,
  loadStoredTokens,
  hasSession,
  getValidToken,
  clearTokens,
  apiGetMe,
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
  isOfflineAuth: boolean;   // true = logged-in from local cache, server unreachable
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

// ─── Fallback accounts (used when Directus is unreachable) ───────────────────
//
// These mirror the test accounts created in Directus.
// Remove or empty this array once the server is reliably online.

const FALLBACK_ACCOUNTS: Array<User & { password: string }> = [
  {
    id: 'local-1',
    name: 'Admin MrLutin',
    email: 'admin@mrlutin.dev',
    password: 'admin123',
    role: 'admin',
    initials: 'AM',
  },
  {
    id: 'local-2',
    name: 'Utilisateur Test',
    email: 'user@mrlutin.dev',
    password: 'user123',
    role: 'user',
    initials: 'UT',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY      = '@inventory_user';
const STORAGE_OFFLINE  = '@inventory_offline_auth';

function buildInitials(name: string): string {
  return name.split(' ').map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase();
}

function detectRole(roleName: string): Role {
  return roleName.toLowerCase().includes('admin') ? 'admin' : 'user';
}

function buildUser(du: import('@/lib/directusClient').DirectusUser): User {
  // Safely handle null first_name / last_name from Directus
  const name = [du.first_name, du.last_name].filter(Boolean).join(' ') || du.email;
  return {
    id:       du.id,
    name,
    email:    du.email,
    role:     detectRole(du.role?.name ?? ''),
    initials: buildInitials(name),
  };
}

function isNetworkError(message: string): boolean {
  return (
    message.includes('Network request failed') ||
    message.includes('Failed to fetch') ||
    message.includes('fetch') ||
    message.includes('ECONNREFUSED') ||
    message.includes('Network') ||
    message.includes('connect')
  );
}

async function persistUser(user: User, offline: boolean) {
  await AsyncStorage.setItem(STORAGE_KEY,     JSON.stringify(user));
  await AsyncStorage.setItem(STORAGE_OFFLINE, JSON.stringify(offline));
}

// ─── Context ─────────────────────────────────────────────────────────────────

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,          setUser]          = useState<User | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [isOfflineAuth, setIsOfflineAuth] = useState(false);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        await loadStoredTokens();

        // Try to get a valid Directus token and refresh profile
        if (hasSession()) {
          const token = await getValidToken();
          if (token) {
            try {
              // Always re-fetch profile from Directus to get latest info
              const du      = await apiGetMe();
              const appUser = buildUser(du);
              await persistUser(appUser, false);
              setUser(appUser);
              setIsOfflineAuth(false);
              setLoading(false);
              return;
            } catch {
              // Server reachable but profile fetch failed — fall through to cache
            }
          }
        }

        // Directus unreachable — restore from cached user (offline mode)
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setUser(JSON.parse(raw));
          setIsOfflineAuth(true);
        }
      } catch {
        // Silently fail — user stays logged out
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Try Directus first
    try {
      const { user: du } = await directusLogin(trimmedEmail, password);

      const appUser: User = buildUser(du);

      await persistUser(appUser, false);
      setIsOfflineAuth(false);
      setUser(appUser);
      return { success: true };

    } catch (err: any) {
      const message = String(err?.message ?? '');

      // Wrong credentials (Directus is reachable but rejected the password)
      if (!isNetworkError(message)) {
        return {
          success: false,
          error: 'Email ou mot de passe incorrect.',
        };
      }

      // 2. Server unreachable — try fallback accounts
      const fallback = FALLBACK_ACCOUNTS.find(
        a => a.email.toLowerCase() === trimmedEmail && a.password === password
      );

      if (fallback) {
        const { password: _, ...appUser } = fallback;
        await clearTokens();
        await persistUser(appUser, true);
        setIsOfflineAuth(true);
        setUser(appUser);
        return { success: true };
      }

      // Fallback accounts also didn't match
      return {
        success: false,
        error: 'Serveur Directus injoignable. Vérifiez que votre VPS est démarré.',
      };
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await directusLogout().catch(() => {}); // ignore if offline
    await AsyncStorage.multiRemove([STORAGE_KEY, STORAGE_OFFLINE]);
    setIsOfflineAuth(false);
    setUser(null);
  };

  return (
    <Ctx.Provider value={{
      user, loading, isOfflineAuth,
      login, logout,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
