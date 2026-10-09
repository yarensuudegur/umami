import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Category, Unit } from '@/features/pantry/types';
import { normalizeName } from '@/features/recipes/matching';

import { loadShopping, saveShopping } from './storage';
import type { ShoppingEntry } from './types';

export type AutoCandidate = { name: string; unit: Unit; category: Category; reason: 'out' | 'low' };
export type MissingIngredient = { name: string; amount: number; unit: Unit };

type ShoppingContextValue = {
  entries: ShoppingEntry[];
  addManual: (name: string, kind: 'item' | 'note') => void;
  /** Adds pantry items that ran out or are running low (skips ones already on the list). */
  addAuto: (candidates: AutoCandidate[]) => void;
  /** Drops the not-yet-bought automatic entry for an item that is stocked again. */
  removeAuto: (name: string) => void;
  addMissing: (ingredients: MissingIngredient[], recipeName: string) => void;
  /** True when every ingredient already has an unchecked entry on the list. */
  isOnList: (names: string[]) => boolean;
  setChecked: (id: string, checked: boolean) => void;
  remove: (id: string) => void;
  clearChecked: () => void;
};

const ShoppingContext = createContext<ShoppingContextValue | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const keyOf = (e: Pick<ShoppingEntry, 'name'>) => normalizeName(e.name);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function ShoppingProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ShoppingEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadShopping().then((stored) => {
      // Entries may already have been added (e.g. low-stock check on pantry load) before storage answered.
      setEntries((current) => [...current, ...stored.filter((s) => !current.some((c) => c.id === s.id))]);
      setLoaded(true);
    });
  }, []);

  // Only persist after the initial load so we never overwrite stored data.
  useEffect(() => {
    if (loaded) saveShopping(entries);
  }, [entries, loaded]);

  const addManual = useCallback((name: string, kind: 'item' | 'note') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setEntries((prev) => {
      if (kind === 'item' && prev.some((e) => !e.checked && e.kind === 'item' && keyOf(e) === normalizeName(trimmed))) {
        return prev;
      }
      return [{ id: newId(), kind, name: trimmed, checked: false, source: 'manual', createdAt: Date.now() }, ...prev];
    });
  }, []);

  const addAuto = useCallback((candidates: AutoCandidate[]) => {
    if (candidates.length === 0) return;
    setEntries((prev) => {
      const next = [...prev];
      for (const c of candidates) {
        const key = normalizeName(c.name);
        if (next.some((e) => !e.checked && e.kind === 'item' && keyOf(e) === key)) continue;
        next.unshift({
          id: newId(),
          kind: 'item',
          name: c.name,
          checked: false,
          source: 'auto',
          reason: c.reason,
          unit: c.unit,
          category: c.category,
          createdAt: Date.now(),
        });
      }
      return next;
    });
  }, []);

  const removeAuto = useCallback((name: string) => {
    const key = normalizeName(name);
    setEntries((prev) => prev.filter((e) => !(e.source === 'auto' && !e.checked && keyOf(e) === key)));
  }, []);

  const addMissing = useCallback((ingredients: MissingIngredient[], recipeName: string) => {
    setEntries((prev) => {
      const next = [...prev];
      for (const ing of ingredients) {
        const key = normalizeName(ing.name);
        const existing = next.findIndex((e) => !e.checked && e.kind === 'item' && keyOf(e) === key);
        if (existing >= 0) {
          const e = next[existing];
          if (!(e.forRecipes ?? []).includes(recipeName) && e.source === 'recipe') {
            next[existing] = { ...e, forRecipes: [...(e.forRecipes ?? []), recipeName] };
          }
          continue;
        }
        next.unshift({
          id: newId(),
          kind: 'item',
          name: capitalize(ing.name),
          checked: false,
          source: 'recipe',
          quantity: round1(ing.amount),
          unit: ing.unit,
          forRecipes: [recipeName],
          createdAt: Date.now(),
        });
      }
      return next;
    });
  }, []);

  const isOnList = useCallback(
    (names: string[]) =>
      names.length > 0 &&
      names.every((n) => entries.some((e) => !e.checked && e.kind === 'item' && keyOf(e) === normalizeName(n))),
    [entries],
  );

  const setChecked = useCallback((id: string, checked: boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, checked } : e)));
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearChecked = useCallback(() => {
    setEntries((prev) => prev.filter((e) => !e.checked));
  }, []);

  const value = useMemo(
    () => ({ entries, addManual, addAuto, removeAuto, addMissing, isOnList, setChecked, remove, clearChecked }),
    [entries, addManual, addAuto, removeAuto, addMissing, isOnList, setChecked, remove, clearChecked],
  );

  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping(): ShoppingContextValue {
  const ctx = useContext(ShoppingContext);
  if (!ctx) throw new Error('useShopping must be used inside <ShoppingProvider>');
  return ctx;
}
