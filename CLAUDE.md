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

- **Routes** (`src/app/`): flat expo-router files. `_layout.tsx` defines the JS `<Tabs>` (Today = `index`, Pantry, Recipes, Shopping, Workout). Tabs other than Pantry render `components/coming-soon.tsx`.
- **Features** (`src/features/<name>/`, currently only `pantry`) follow one layered layout, and new features should copy it:
  `types.ts` (model, units, categories) → `storage.ts` (AsyncStorage, versioned key `umami.pantry.v1`; use `umami.<feature>.vN` for new ones) → `use-pantry.ts` (state hook; persists only after the initial load finishes so it can never overwrite stored data with `[]`) → `status.ts` (pure logic) → UI (`item-card.tsx`, `item-form.tsx`).
- **Pantry rules** (`status.ts`): expiry dates are stored as local `yyyy-mm-dd` strings (no timezone shifts); "expiring soon" = 0–3 days left, "expired" = negative, "running low" = `quantity <= lowThreshold` (threshold 0 disables it). The list is sorted by `urgency()`.
- **Theming**: `constants/theme.ts` holds `Colors` (light/dark, including badge tone colors), `Spacing` and `Radius`, consumed through `hooks/use-theme.ts`, `ThemedText` and `ThemedView`. Don't hardcode colors in screens.

## Gotchas

- Import icons as `import Ionicons from '@expo/vector-icons/Ionicons'`. The package root bundles every icon set and caused a Metro "Unable to resolve module ...FontAwesome6_Regular.ttf" crash.
- The pantry item form is mounted fresh for each open (`{formOpen && <ItemForm key={...} />}`) so its state initializes from the item being edited.
- Path alias `@/*` maps to `src/*`.
