import type { Category, Unit } from '@/features/pantry/types';

export type ShoppingEntry = {
  id: string;
  /** "item" can be bought into the pantry; "note" is free text that is simply ticked off. */
  kind: 'item' | 'note';
  name: string;
  checked: boolean;
  source: 'auto' | 'manual' | 'recipe';
  /** For auto entries: the pantry item ran out entirely or fell to its threshold. */
  reason?: 'out' | 'low';
  quantity?: number;
  unit?: Unit;
  category?: Category;
  forRecipes?: string[];
  createdAt: number;
};
