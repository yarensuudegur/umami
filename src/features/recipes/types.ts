import type { Unit } from '@/features/pantry/types';

export type Ingredient = {
  name: string;
  amount: number;
  unit: Unit;
  /** Extra names a pantry item may use for this ingredient (e.g. "chicken" for "chicken breast"). */
  aliases?: string[];
};

export type Recipe = {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  timeMinutes: number;
  /** Servings the ingredient amounts are written for. */
  servings: number;
  caloriesPerServing: number;
  proteinPerServing: number;
  ingredients: Ingredient[];
  steps: string[];
};
