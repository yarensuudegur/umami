export const UNITS = ['g', 'kg', 'ml', 'l', 'pcs'] as const;
export type Unit = (typeof UNITS)[number];

export const CATEGORIES = [
  { name: 'Produce', emoji: '🥬' },
  { name: 'Dairy', emoji: '🧀' },
  { name: 'Meat & Fish', emoji: '🥩' },
  { name: 'Grains & Pasta', emoji: '🍝' },
  { name: 'Canned', emoji: '🥫' },
  { name: 'Spices', emoji: '🧂' },
  { name: 'Drinks', emoji: '🥤' },
  { name: 'Frozen', emoji: '🧊' },
  { name: 'Other', emoji: '📦' },
] as const;
export type Category = (typeof CATEGORIES)[number]['name'];

export type PantryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  category: Category;
  /** ISO date, yyyy-mm-dd. */
  expiryDate?: string;
  /** Item is "running low" when quantity <= this value. 0 disables the warning. */
  lowThreshold: number;
};

export function categoryEmoji(name: Category): string {
  return CATEGORIES.find((c) => c.name === name)?.emoji ?? '📦';
}
