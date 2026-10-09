import type { PantryItem } from '@/features/pantry/types';

import { dimensionOf, formatAmount, ingredientMatches, isStaple, scaleAmount, toBase } from './matching';
import type { Recipe } from './types';

export type CookPlan = {
  /** New quantity per pantry item id (only items that change). */
  quantities: Record<string, number>;
  /** Human-readable lines like "Chicken breast: -200 g". */
  lines: string[];
  /** Ingredients that could not be (fully) taken from the pantry. */
  skipped: string[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Works out what cooking `servings` portions removes from the pantry.
 * Uses the soonest-expiring matching items first, converts g/kg and ml/l,
 * and skips staples and ingredients with no comparable pantry unit.
 */
export function planCooking(recipe: Recipe, servings: number, pantry: PantryItem[]): CookPlan {
  const quantities: Record<string, number> = {};
  const lines: string[] = [];
  const skipped: string[] = [];
  const remainingQty = (it: PantryItem) => quantities[it.id] ?? it.quantity;

  for (const ing of recipe.ingredients) {
    if (isStaple(ing)) continue;
    let left = scaleAmount(ing, recipe, servings) * toBase(ing.unit); // in base unit

    const candidates = pantry
      .filter((it) => ingredientMatches(ing, it) && dimensionOf(it.unit) === dimensionOf(ing.unit))
      .sort((a, b) => (a.expiryDate ?? '9999-12-31').localeCompare(b.expiryDate ?? '9999-12-31'));

    if (candidates.length === 0) {
      skipped.push(ing.name);
      continue;
    }

    let removed = 0;
    for (const it of candidates) {
      if (left <= 1e-9) break;
      const base = toBase(it.unit);
      const take = Math.min(left, remainingQty(it) * base);
      if (take <= 0) continue;
      quantities[it.id] = round2(remainingQty(it) - take / base);
      left -= take;
      removed += take;
    }

    if (removed > 0) lines.push(`${ing.name}: -${formatAmount(removed / toBase(ing.unit), ing.unit)}`);
    if (left > 1e-9) skipped.push(ing.name);
  }

  return { quantities, lines, skipped };
}
