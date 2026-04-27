import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { MOCK_ITEMS, InventoryItem } from '@/constants/data';

// ─── Types ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD'; item: InventoryItem }
  | { type: 'UPDATE'; item: InventoryItem }
  | { type: 'DELETE'; id: string };

interface InventoryCtx {
  items: InventoryItem[];
  addItem: (item: InventoryItem) => void;
  updateItem: (item: InventoryItem) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => InventoryItem | undefined;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: InventoryItem[], action: Action): InventoryItem[] {
  switch (action.type) {
    case 'ADD':
      return [action.item, ...state];
    case 'UPDATE':
      return state.map(i => (i.id === action.item.id ? action.item : i));
    case 'DELETE':
      return state.filter(i => i.id !== action.id);
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const Ctx = createContext<InventoryCtx | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, MOCK_ITEMS);

  const addItem    = (item: InventoryItem) => dispatch({ type: 'ADD', item });
  const updateItem = (item: InventoryItem) => dispatch({ type: 'UPDATE', item });
  const deleteItem = (id: string)          => dispatch({ type: 'DELETE', id });
  const getItem    = (id: string)          => items.find(i => i.id === id);

  return (
    <Ctx.Provider value={{ items, addItem, updateItem, deleteItem, getItem }}>
      {children}
    </Ctx.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useInventory must be used inside InventoryProvider');
  return ctx;
}
