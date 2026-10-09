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

- **Routes** (`src/app/`): flat expo-router files. `_layout.tsx` defines the JS `<Tabs>` (Today = `index`, Pantry, Recipes, Shopping, Workout) and wraps them in `DataRoot` > `SettingsProvider` > `ShoppingProvider` > `WorkoutProvider` > `PantryProvider` (order matters: the pantry provider calls the shopping one), plus `<NotificationSync />`.- **Today** (`app/index.tsx`, `features/today/`): the home dashboard. Cards are tinted with the five taste colors (`taste-card.tsx`): workout or `RestBanner` (umami), expiring soon (sour), running low (salty), recipe suggestion (sweet). `suggest.ts` ranks recipes: cookable now, uses expiring items, protein near goal ÷ 3.
- **Brand**: Umami = the fifth taste, balance. The mark is five petals (sweet, sour, salty, bitter, umami) around a deep-green core: `components/umami-mark.tsx` draws it, and the icon, splash and Android icons in `assets/images/` were rendered from the same geometry. Theme tokens `sweet/sour/salty/bitter/umami` (+ `*Soft`) live in `constants/theme.ts`. Expo Go always shows its own icon and splash; ours only appear in development or release builds.
- **Notifications** (`features/notifications/`): local only. `schedule.ts` is pure (`buildSchedule`) and stays well under iOS's 64 pending limit: expiry digests (14 days), restock reminders (3 days), workout reminders (this and next week). `NotificationSync` re-cancels and reschedules everything whenever pantry, shopping, workout or the preferences change, and when the app returns to the foreground. Preferences live in `settings-model.ts` (`umami.settings.v1`). Not available on web.
- **Web demo** (https://yarensuudegur.github.io/umami): `app.json` has `experiments.baseUrl: "/umami"` and `web.output: "single"` (a single-page app; `static` output caused a hydration mismatch). `.github/workflows/deploy-web.yml` runs `npx expo export -p web` on every push to `main` and deploys `dist/` to GitHub Pages (it copies `index.html` to `404.html` so deep links work). Web rules: use `showAlert` from `src/lib/dialog.ts` instead of `Alert.alert` (React Native Web's Alert does nothing); keep native-only modules behind `Platform.OS` checks or a `.web.ts` file (`notifications.web.ts` is a stub); the expiry date is a typed `YYYY-MM-DD` field on web, and backup export/import use a browser download and file picker. Test locally with `npx expo export -p web`, serve the output under a `/umami/` folder and drive it with a headless browser.
- **Backup** (`features/settings/backup*.ts`): export writes one JSON (`{app:'umami', version:1, data:{pantry, shopping, workout, settings}}`) to the cache and shares it; import validates strictly with `validateBackup`, writes all four storage keys, then `DataRoot.reloadAll()` remounts every provider so they reload. Any new persisted key must be added to `BACKUP_KEYS` and the validator.
- **Shared state**: pantry, shopping list and settings live in context providers (`features/pantry/pantry-provider.tsx`, `features/shopping/shopping-provider.tsx`, `features/settings/settings-provider.tsx`) so every tab sees the same data. Never keep a second copy of pantry state in a screen. Providers persist only after the initial load finishes so they can never overwrite stored data with `[]`.
- **Features** (`src/features/<name>/`: `pantry`, `recipes`, `settings`) follow a layered layout, and new features should copy it:
  `types.ts` (model) → storage (AsyncStorage, versioned keys `umami.pantry.v1`, `umami.settings.v1`; use `umami.<feature>.vN` for new ones) → provider/hook → pure logic (`status.ts`, `matching.ts`, `cook.ts`) → UI.
- **Recipes** (`features/recipes/`): `data.ts` is a static list of 45 recipes (nutrition values are per serving and estimated). `matching.ts` matches recipe ingredients to free-text pantry items (normalized names, recipe `aliases`, g/kg and ml/l conversion; staples like salt, oil and common spices are never counted missing) and returns per-ingredient `have | short | missing | staple`. Recipes with 0 problems go under "You have everything", 1–2 under "Missing 1–2 items". `cook.ts` (`planCooking`) computes pantry deductions for "I cooked this", taking soonest-expiring items first; items that reach 0 are removed.
- **Pantry rules** (`status.ts`): expiry dates are stored as local `yyyy-mm-dd` strings (no timezone shifts); "expiring soon" = 0–3 days left, "expired" = negative, "running low" = `quantity <= lowThreshold` (threshold 0 disables it). The list is sorted by `urgency()`.
- **Shopping** (`features/shopping/`, key `umami.shopping.v1`): the list is persisted (not derived) because pantry items that reach 0 are deleted. `PantryProvider`'s event handlers (`addItem`, `updateItem`, `applyQuantities`, and the load callback) add `auto` entries when an item runs out or becomes low, and remove them when it is stocked again; manual `removeItem` adds nothing. Do this in handlers, never in effects. Ticking an item entry opens `ItemForm` (with `initial` and `title` props) and `restock()` merges the purchase into a pantry item with the same normalized name and unit type, or creates one. Recipes add missing ingredients through `missingToShop()` + `addMissing()`; entries are de-duplicated by `normalizeName`.
- **Workout** (`features/workout/`, key `umami.workout.v1`, `WorkoutProvider`): `exercises.ts` is a fixed library of 48 exercises whose ids match yuhonas/free-exercise-db (The Unlicense, public domain); their start-position photos are bundled in `assets/exercises/<id>.jpg` and mapped in `images.ts`. Keep the library at 50 exercises or fewer, and add an image only for an exercise that is actually used. `plan.ts` is pure: `buildWeek()` places training days (Mon = 0) and fills sessions from per-focus muscle-group slots; `rebalance()` handles "I want to train X today" (past and finished days untouched, remaining sessions re-placed so consecutive days never share a muscle group). The provider derives the current week and rebuilds it when the stored `weekStart` is stale. Finished workouts go into `history`; ticks live in `progress` until finished. Exercise descriptions are our own text, not copied from the dataset.
- **Theming**: `constants/theme.ts` holds `Colors` (light/dark, including badge tone colors), `Spacing` and `Radius`, consumed through `hooks/use-theme.ts`, `ThemedText` and `ThemedView`. Don't hardcode colors in screens. The light-mode text and tint colors were tuned so every text-on-background pair reaches WCAG AA (4.5:1); keep new colors at that level. `ThemedText` caps Dynamic Type at 1.3×, and any style with `fontSize` above 24 needs an explicit `lineHeight` (the default 24 clips it).

## Gotchas

- Import icons as `import Ionicons from '@expo/vector-icons/Ionicons'`. The package root bundles every icon set and caused a Metro "Unable to resolve module ...FontAwesome6_Regular.ttf" crash.
- The pantry item form is mounted fresh for each open (`{formOpen && <ItemForm key={...} />}`) so its state initializes from the item being edited.
- Path alias `@/*` maps to `src/*`.
- Source files are UTF-8 with real emoji and symbols. Never rewrite files with Windows PowerShell 5.1 `Get-Content`/`Set-Content`: on this machine they use the Windows-1254 code page and turn every emoji and accented letter into garbled text. Use the Edit/Write tools or Node (`fs.readFileSync(..., 'utf8')`) instead.
