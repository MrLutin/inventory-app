import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { MOCK_ITEMS, InventoryItem } from '@/constants/data';
import {
  fetchItems,
  createDirectusItem,
  updateDirectusItem,
  deleteDirectusItem,
} from '@/lib/directusClient';

// ─── Types ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET';    items: InventoryItem[] }
  | { type: 'ADD';    item: InventoryItem }
  | { type: 'UPDATE'; item: InventoryItem }
  | { type: 'DELETE'; id: string };

interface InventoryCtx {
  items:     InventoryItem[];
  loading:   boolean;
  error:     string | null;
  isOffline: boolean;
  refresh:   () => Promise<void>;
  addItem:    (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItem:    (id: string) => InventoryItem | undefined;
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
  const [items,     dispatch]   = useReducer(reducer, MOCK_ITEMS);
  const [loading,   setLoading] = useState(true);
  const [error,     setError]   = useState<string | null>(null);
  const [isOffline, setOffline] = useState(false);

  // ── Fetch from Directus on mount ──
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchItems();
      dispatch({ type: 'SET', items: data });
      setOffline(false);
    } catch (err: any) {
      const msg = err?.message ?? '';
      const offline =
        msg.includes('fetch') ||
        msg.includes('Network') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('NOT_AUTHENTICATED') ||
        msg === 'Failed to fetch';

      if (offline) {
        // Server unreachable — keep mock/local data and flag offline mode
        setOffline(true);
        setError(null); // silent fallback
      } else {
        setError(`Erreur de chargement : ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
  const updateItem = async (item: InventoryItem) => {
    // Optimistic update
    dispatch({ type: 'UPDATE', item });
    if (isOffline) return;
    try {
      const updated = await updateDirectusItem(item.id, item);
      dispatch({ type: 'UPDATE', item: updated });
    } catch {
      // Keep local optimistic state on error
    }
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
      items, loading, error, isOffline,
      refresh: load, addItem, updateItem, deleteItem, getItem,
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
