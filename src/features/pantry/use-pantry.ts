import { useCallback, useEffect, useState } from 'react';

import { loadPantry, savePantry } from './storage';
import type { PantryItem } from './types';

export function usePantry() {
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

  return { items, loaded, addItem, updateItem, removeItem };
}
