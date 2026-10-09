import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { loadPantry, savePantry } from './storage';
import type { PantryItem } from './types';

type PantryContextValue = {
  items: PantryItem[];
  loaded: boolean;
  addItem: (data: Omit<PantryItem, 'id'>) => void;
  updateItem: (id: string, data: Omit<PantryItem, 'id'>) => void;
  removeItem: (id: string) => void;
  /** Sets new quantities by item id; items that reach 0 or less are removed. */
  applyQuantities: (quantities: Record<string, number>) => void;
};

const PantryContext = createContext<PantryContextValue | null>(null);

/** Single source of truth for pantry state so every tab sees the same items. */
export function PantryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPantry().then((stored) => {
      setItems(stored);
      setLoaded(true);
    });
  }, []);

  // Only persist after the initial load so we never overwrite stored data with [].
  useEffect(() => {
    if (loaded) savePantry(items);
  }, [items, loaded]);

  const addItem = useCallback((data: Omit<PantryItem, 'id'>) => {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    setItems((prev) => [{ ...data, id }, ...prev]);
  }, []);

  const updateItem = useCallback((id: string, data: Omit<PantryItem, 'id'>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...data, id } : it)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const applyQuantities = useCallback((quantities: Record<string, number>) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id in quantities ? { ...it, quantity: quantities[it.id] } : it))
        .filter((it) => it.quantity > 0),
    );
  }, []);

  const value = useMemo(
    () => ({ items, loaded, addItem, updateItem, removeItem, applyQuantities }),
    [items, loaded, addItem, updateItem, removeItem, applyQuantities],
  );

  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}

export function usePantry(): PantryContextValue {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error('usePantry must be used inside <PantryProvider>');
  return ctx;
}
