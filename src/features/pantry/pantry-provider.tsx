import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { dimensionOf, normalizeName, toBase } from '@/features/recipes/matching';
import { useShopping, type AutoCandidate } from '@/features/shopping/shopping-provider';

import { isLow } from './status';
import { loadPantry, savePantry } from './storage';
import type { PantryItem } from './types';

type PantryContextValue = {
  items: PantryItem[];
  loaded: boolean;
  addItem: (data: Omit<PantryItem, 'id'>) => void;
  updateItem: (id: string, data: Omit<PantryItem, 'id'>) => void;
  removeItem: (id: string) => void;
  /** Sets new quantities by item id; items that reach 0 or less are removed and queued for shopping. */
  applyQuantities: (quantities: Record<string, number>) => void;
  /** Adds a purchase to the pantry, merging into an existing item with the same name and unit type. */
  restock: (data: Omit<PantryItem, 'id'>) => void;
};

const PantryContext = createContext<PantryContextValue | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const candidate = (it: PantryItem, reason: AutoCandidate['reason']): AutoCandidate => ({
  name: it.name,
  unit: it.unit,
  category: it.category,
  reason,
});

/**
 * Single source of truth for pantry state so every tab sees the same items.
 * Also feeds the shopping list: items that run out or become low are added from here, in the
 * event handlers (never from effects), so manual deletions do not end up on the list.
 */
export function PantryProvider({ children }: { children: ReactNode }) {
  const { addAuto, removeAuto } = useShopping();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadPantry().then((stored) => {
      setItems(stored);
      setLoaded(true);
      addAuto(stored.filter(isLow).map((it) => candidate(it, 'low')));
    });
  }, [addAuto]);

  // Only persist after the initial load so we never overwrite stored data with [].
  useEffect(() => {
    if (loaded) savePantry(items);
  }, [items, loaded]);

  const addItem = useCallback(
    (data: Omit<PantryItem, 'id'>) => {
      const item = { ...data, id: newId() };
      setItems((prev) => [item, ...prev]);
      if (isLow(item)) addAuto([candidate(item, 'low')]);
    },
    [addAuto],
  );

  const updateItem = useCallback(
    (id: string, data: Omit<PantryItem, 'id'>) => {
      const before = items.find((it) => it.id === id);
      const after = { ...data, id };
      setItems((prev) => prev.map((it) => (it.id === id ? after : it)));
      if (isLow(after) && !(before && isLow(before))) addAuto([candidate(after, 'low')]);
      if (!isLow(after) && before && isLow(before)) removeAuto(before.name);
    },
    [items, addAuto, removeAuto],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const applyQuantities = useCallback(
    (quantities: Record<string, number>) => {
      const toAdd: AutoCandidate[] = [];
      for (const it of items) {
        if (!(it.id in quantities)) continue;
        const quantity = quantities[it.id];
        if (quantity <= 0) toAdd.push(candidate(it, 'out'));
        else if (isLow({ ...it, quantity }) && !isLow(it)) toAdd.push(candidate(it, 'low'));
      }
      setItems((prev) =>
        prev
          .map((it) => (it.id in quantities ? { ...it, quantity: quantities[it.id] } : it))
          .filter((it) => it.quantity > 0),
      );
      addAuto(toAdd);
    },
    [items, addAuto],
  );

  const restock = useCallback(
    (data: Omit<PantryItem, 'id'>) => {
      const key = normalizeName(data.name);
      const existing = items.find(
        (it) => normalizeName(it.name) === key && dimensionOf(it.unit) === dimensionOf(data.unit),
      );
      if (!existing) return addItem(data);

      const added = (data.quantity * toBase(data.unit)) / toBase(existing.unit);
      const updated: PantryItem = {
        ...existing,
        quantity: Math.round((existing.quantity + added) * 100) / 100,
        expiryDate: data.expiryDate ?? existing.expiryDate,
      };
      setItems((prev) => prev.map((it) => (it.id === existing.id ? updated : it)));
      if (!isLow(updated)) removeAuto(existing.name);
    },
    [items, addItem, removeAuto],
  );

  const value = useMemo(
    () => ({ items, loaded, addItem, updateItem, removeItem, applyQuantities, restock }),
    [items, loaded, addItem, updateItem, removeItem, applyQuantities, restock],
  );

  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}

export function usePantry(): PantryContextValue {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error('usePantry must be used inside <PantryProvider>');
  return ctx;
}
