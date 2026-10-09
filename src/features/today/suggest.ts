import type { PantryItem } from '@/features/pantry/types';
import { RECIPES } from '@/features/recipes/data';
import { analyzeRecipe, type RecipeAnalysis } from '@/features/recipes/matching';
import type { Recipe } from '@/features/recipes/types';

/** How well a recipe fits "dinner tonight": cookable now, rescues expiring food, and covers a good share of the protein goal. */
export function scoreRecipe(analysis: RecipeAnalysis, proteinGoal: number, trainingDay: boolean): number {
  const missing = analysis.problems.length;
  let score = missing === 0 ? 1000 : missing === 1 ? 600 : missing === 2 ? 300 : -50 * missing;

  score += 120 * Math.min(analysis.expiringItems.length, 3);

  // A main meal should deliver roughly a third of the daily goal, a bit more after training.
  const target = (proteinGoal / 3) * (trainingDay ? 1.15 : 1);
  const protein = analysis.recipe.proteinPerServing;
  score += Math.max(0, 1 - Math.abs(protein - target) / target) * 100;
  if (protein >= target * 0.9) score += 20;
  return score;
}

/** All recipes, best suggestion first. Deterministic, so "Show another" walks down the same list. */
export function rankRecipes(
  pantry: PantryItem[],
  proteinGoal: number,
  trainingDay: boolean,
  recipes: Recipe[] = RECIPES,
): RecipeAnalysis[] {
  return recipes
    .map((r) => {
      const analysis = analyzeRecipe(r, pantry);
      return { analysis, score: scoreRecipe(analysis, proteinGoal, trainingDay) };
    })
    .sort((a, b) => b.score - a.score || a.analysis.recipe.id.localeCompare(b.analysis.recipe.id))
    .map((x) => x.analysis);
}
