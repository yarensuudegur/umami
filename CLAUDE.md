# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Follow `AGENTS.md` first (Expo docs-first rule, always `npx expo install` for packages, run lint + typecheck before finishing). This file only adds project-specific context.

## Commands

```bash
npx expo start        # dev server; add -c to clear the Metro cache (needed after changing dependencies)
npx tsc --noEmit      # typecheck
npx expo lint         # lint
npx expo install --check
```

There is no test runner configured. `expo lint` has one known pre-existing error in the template file `src/hooks/use-color-scheme.web.ts` (`react-hooks/set-state-in-effect`).

## Project constraints

The app is called **Umami**: a kitchen pantry, recipe and workout assistant (Expo SDK 57, RN 0.86, React Compiler enabled).

- It must work in Expo Go on iPhone and on Expo Snack.
- Only use Expo SDK packages (install with `npx expo install`); no custom native modules or other third-party native libraries.
- The whole UI is in English.
- All data lives on the device in AsyncStorage. There is no server.
- The `react-hooks/set-state-in-effect` lint rule is enforced. Don't call setState inside effects; reset form state by remounting with `key` instead.

## Architecture

- **Routes** (`src/app/`): flat expo-router files. `_layout.tsx` defines the JS `<Tabs>` (Today = `index`, Pantry, Recipes, Shopping, Workout) and wraps them in `SettingsProvider` and `PantryProvider`. Today, Shopping and Workout still render `components/coming-soon.tsx`.
- **Shared state**: pantry and settings live in context providers (`features/pantry/pantry-provider.tsx`, `features/settings/settings-provider.tsx`) so every tab sees the same data. Never keep a second copy of pantry state in a screen. Providers persist only after the initial load finishes so they can never overwrite stored data with `[]`.
- **Features** (`src/features/<name>/`: `pantry`, `recipes`, `settings`) follow a layered layout, and new features should copy it:
  `types.ts` (model) → storage (AsyncStorage, versioned keys `umami.pantry.v1`, `umami.settings.v1`; use `umami.<feature>.vN` for new ones) → provider/hook → pure logic (`status.ts`, `matching.ts`, `cook.ts`) → UI.
- **Recipes** (`features/recipes/`): `data.ts` is a static list of 45 recipes (nutrition values are per serving and estimated). `matching.ts` matches recipe ingredients to free-text pantry items (normalized names, recipe `aliases`, g/kg and ml/l conversion; staples like salt, oil and common spices are never counted missing) and returns per-ingredient `have | short | missing | staple`. Recipes with 0 problems go under "You have everything", 1–2 under "Missing 1–2 items". `cook.ts` (`planCooking`) computes pantry deductions for "I cooked this", taking soonest-expiring items first; items that reach 0 are removed.
- **Pantry rules** (`status.ts`): expiry dates are stored as local `yyyy-mm-dd` strings (no timezone shifts); "expiring soon" = 0–3 days left, "expired" = negative, "running low" = `quantity <= lowThreshold` (threshold 0 disables it). The list is sorted by `urgency()`.
- **Theming**: `constants/theme.ts` holds `Colors` (light/dark, including badge tone colors), `Spacing` and `Radius`, consumed through `hooks/use-theme.ts`, `ThemedText` and `ThemedView`. Don't hardcode colors in screens.

## Gotchas

- Import icons as `import Ionicons from '@expo/vector-icons/Ionicons'`. The package root bundles every icon set and caused a Metro "Unable to resolve module ...FontAwesome6_Regular.ttf" crash.
- The pantry item form is mounted fresh for each open (`{formOpen && <ItemForm key={...} />}`) so its state initializes from the item being edited.
- Path alias `@/*` maps to `src/*`.
