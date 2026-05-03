import React, { createContext, useContext, useReducer, useEffect, useRef, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { InventoryItem } from '@/constants/data';
import {
  fetchItems,
  createDirectusItem,
  updateDirectusItem,
  deleteDirectusItem,
} from '@/lib/directusClient';
import { useAuth } from '@/store/auth';

/** Intervalle de polling en millisecondes (30 secondes) */
const POLL_INTERVAL = 30_000;

// ─── Types ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET';    items: InventoryItem[] }
  | { type: 'ADD';    item: InventoryItem }
  | { type: 'UPDATE'; item: InventoryItem }
  | { type: 'DELETE'; id: string };

interface InventoryCtx {
  items:         InventoryItem[];
  loading:       boolean;
  error:         string | null;
  isOffline:     boolean;
  lastRefreshed: Date | null;
  refresh:       () => Promise<void>;
  addItem:       (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateItem:    (item: InventoryItem, locationsToDelete?: string[]) => Promise<void>;
  deleteItem:    (id: string) => Promise<void>;
  getItem:       (id: string) => InventoryItem | undefined;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: InventoryItem[], action: Action): InventoryItem[] {
  switch (action.type) {
    case 'SET':    return action.items;
    case 'ADD':    return [action.item, ...state];
    case 'UPDATE': return state.map(i => (i.id === action.item.id ? action.item : i));
    case 'DELETE': return state.filter(i => i.id !== action.id);
    default:       return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const Ctx = createContext<InventoryCtx | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [items,         dispatch]        = useReducer(reducer, []);
  const [loading,       setLoading]      = useState(true);
  const [error,         setError]        = useState<string | null>(null);
  const [isOffline,     setOffline]      = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const pollerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const userRef     = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const applyFetch = async (silent: boolean) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      const data = await fetchItems();
      dispatch({ type: 'SET', items: data });
      setOffline(false);
      setLastRefreshed(new Date());
    } catch (err: any) {
      const msg = err?.message ?? '';
      const offline =
        msg.includes('fetch') ||
        msg.includes('Network') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('NOT_AUTHENTICATED') ||
        msg === 'Failed to fetch';

      if (offline) {
        setOffline(true);
        setError(null);
      } else if (!silent) {
        setError(`Erreur de chargement : ${msg}`);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /** Chargement initial avec indicateur de chargement */
  const load = () => applyFetch(false);

  /** Rafraîchissement silencieux (pas de spinner) */
  const silentRefresh = () => {
    if (userRef.current) applyFetch(true);
  };

  // ── Polling ──────────────────────────────────────────────────────────────

  const startPoller = () => {
    if (pollerRef.current) return;
    pollerRef.current = setInterval(silentRefresh, POLL_INTERVAL);
  };

  const stopPoller = () => {
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
      pollerRef.current = null;
    }
  };

  // Démarre / arrête le polling selon l'état de l'app (foreground / background)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (next === 'active' && prev !== 'active') {
        // Retour au premier plan → refresh immédiat + relance le poller
        silentRefresh();
        startPoller();
      } else if (next !== 'active') {
        // Arrière-plan → pause le poller
        stopPoller();
      }
    });

    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Chargement initial + polling lié à l'authentification ────────────────

  // Load items once auth is resolved and user is logged in.
  // Re-fetch if the user changes (login / logout).
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      dispatch({ type: 'SET', items: [] });
      setLoading(false);
      stopPoller();
      return;
    }

    load().then(() => {
      // Lance le poller seulement si l'app est au premier plan
      if (AppState.currentState === 'active') startPoller();
    });

    return () => stopPoller();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  // ── Add ──
  const addItem = async (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    if (isOffline) {
      // Optimistic local-only add
      const local: InventoryItem = {
        ...item,
        id:          Date.now().toString(),
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
      dispatch({ type: 'ADD', item: local });
      return;
    }
    try {
      const created = await createDirectusItem(item);
      dispatch({ type: 'ADD', item: created });
    } catch (err: any) {
      // Fallback: add locally with temp id
      const local: InventoryItem = {
        ...item,
        id:          Date.now().toString(),
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
      dispatch({ type: 'ADD', item: local });
    }
  };

  // ── Update ──
  const updateItem = async (item: InventoryItem, locationsToDelete: string[] = []) => {
    // Optimistic update
    dispatch({ type: 'UPDATE', item });
    if (isOffline) return;
    const updated = await updateDirectusItem(item.id, item, locationsToDelete);
    dispatch({ type: 'UPDATE', item: updated });
  };

  // ── Delete ──
  const deleteItem = async (id: string) => {
    // Optimistic delete
    dispatch({ type: 'DELETE', id });
    if (isOffline) return;
    try {
      await deleteDirectusItem(id);
    } catch {
      // Item already removed from UI — no rollback for now
    }
  };

  const getItem = (id: string) => items.find(i => i.id === id);

  return (
    <Ctx.Provider value={{
      items, loading, error, isOffline, lastRefreshed,
      refresh: load, addItem, updateItem: (item, locationsToDelete) => updateItem(item, locationsToDelete), deleteItem, getItem,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useInventory must be used inside InventoryProvider');
  return ctx;
}
