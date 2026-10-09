# Umami

A kitchen pantry, recipe, shopping and workout assistant. *Umami* is the fifth taste: the one that balances the others, and the idea behind the app and its icon (five petals in balance).

Built with Expo (SDK 57) and Expo Router. All data stays on your device (AsyncStorage). It runs in Expo Go and on Expo Snack.

```bash
npm install
npx expo start      # scan the QR code with Expo Go
npx tsc --noEmit    # typecheck
npx expo lint       # lint
```

Notes:
- Exercise photos come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (The Unlicense, public domain).
- Expo Go always shows its own icon and splash screen. The Umami icon and splash only appear in a development or release build.
