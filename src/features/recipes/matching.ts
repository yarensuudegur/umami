import { isExpiringSoon } from '@/features/pantry/status';
import type { PantryItem, Unit } from '@/features/pantry/types';

import type { Ingredient, Recipe } from './types';

/** Pantry basics assumed to be at home: never counted as missing and never deducted. */
const STAPLES = new Set([
  'salt', 'pepper', 'black pepper', 'water', 'sugar', 'olive oil', 'vegetable oil', 'cooking oil',
  'sesame oil', 'cumin', 'paprika', 'smoked paprika', 'oregano', 'thyme', 'chili flakes',
  'curry powder', 'turmeric', 'cinnamon', 'garam masala', 'coriander', 'dried herbs',
]);

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singular)
    .join(' ');
}

function singular(word: string): string {
  if (word.length <= 3 || /(ss|us|is)$/.test(word)) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (/(oes|ches|shes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

export function isStaple(ingredient: Ingredient): boolean {
  return STAPLES.has(normalizeName(ingredient.name));
}

/** True when a pantry item can be used for the recipe ingredient. */
export function ingredientMatches(ingredient: Ingredient, item: PantryItem): boolean {
  const pantryName = normalizeName(item.name);
  const pantryWords = pantryName.split(' ');
  const candidates = [ingredient.name, ...(ingredient.aliases ?? [])].map(normalizeName);
  return candidates.some((name) => {
    if (name === pantryName) return true;
    // A more specific pantry item ("basmati rice") satisfies a generic ingredient ("rice").
    return name.split(' ').every((w) => pantryWords.includes(w));
  });
}

export type Dimension = 'mass' | 'volume' | 'count';

export function dimensionOf(unit: Unit): Dimension {
  if (unit === 'g' || unit === 'kg') return 'mass';
  if (unit === 'ml' || unit === 'l') return 'volume';
  return 'count';
}

/** Multiplier from the unit to its base unit (g, ml or pcs). */
export function toBase(unit: Unit): number {
  return unit === 'kg' || unit === 'l' ? 1000 : 1;
}

export type IngredientStatus = {
  ingredient: Ingredient;
  /** Amount needed for the chosen servings, in the ingredient's own unit. */
  needed: number;
  status: 'have' | 'short' | 'missing' | 'staple';
  shortBy?: number;
  matches: PantryItem[];
};

export type RecipeAnalysis = {
  recipe: Recipe;
  statuses: IngredientStatus[];
  /** Ingredients that are missing or not available in sufficient quantity. */
  problems: IngredientStatus[];
  /** Names of pantry items that match this recipe and expire within the "soon" window. */
  expiringItems: string[];
};

export function scaleAmount(ingredient: Ingredient, recipe: Recipe, servings: number): number {
  return (ingredient.amount * servings) / recipe.servings;
}

export function analyzeRecipe(recipe: Recipe, pantry: PantryItem[], servings = recipe.servings): RecipeAnalysis {
  const expiring = new Set<string>();

  const statuses = recipe.ingredients.map<IngredientStatus>((ingredient) => {
    const needed = scaleAmount(ingredient, recipe, servings);
    if (isStaple(ingredient)) return { ingredient, needed, status: 'staple', matches: [] };

    const matches = pantry.filter((it) => ingredientMatches(ingredient, it));
    for (const it of matches) if (isExpiringSoon(it)) expiring.add(it.name);
    if (matches.length === 0) return { ingredient, needed, status: 'missing', matches };

    // Only items measured in a comparable unit can be summed; otherwise trust the name match.
    const comparable = matches.filter((it) => dimensionOf(it.unit) === dimensionOf(ingredient.unit));
    if (comparable.length === 0) return { ingredient, needed, status: 'have', matches };

    const available = comparable.reduce((sum, it) => sum + it.quantity * toBase(it.unit), 0);
    const need = needed * toBase(ingredient.unit);
    if (available + 1e-9 >= need) return { ingredient, needed, status: 'have', matches };
    return {
      ingredient,
      needed,
      status: 'short',
      shortBy: (need - available) / toBase(ingredient.unit),
      matches,
    };
  });

  return {
    recipe,
    statuses,
    problems: statuses.filter((s) => s.status === 'missing' || s.status === 'short'),
    expiringItems: [...expiring],
  };
}

export function usesPantryItem(recipe: Recipe, item: PantryItem): boolean {
  return recipe.ingredients.some((ing) => !isStaple(ing) && ingredientMatches(ing, item));
}

export function formatAmount(amount: number, unit: Unit): string {
  const rounded = Math.round(amount * 10) / 10;
  return `${rounded} ${unit}`;
}
