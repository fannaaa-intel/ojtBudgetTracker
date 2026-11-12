#!/usr/bin/env bash
# One-time setup. Run after `npm install` (which installs Expo itself).
# `npx expo install` picks versions that match the installed Expo SDK.
set -euo pipefail

echo "→ Expo-managed packages (SDK-matched versions)"
npx expo install \
  react react-dom react-native \
  expo-router expo-sqlite expo-status-bar expo-constants expo-linking \
  react-native-safe-area-context react-native-screens \
  @expo/vector-icons

echo "→ Plain npm packages"
npm install drizzle-orm zustand

echo "→ Dev tools"
npm install --save-dev drizzle-kit babel-plugin-inline-import typescript @types/react
npx expo install jest-expo jest @types/jest -- --save-dev

echo "→ Align every version with the SDK"
npx expo install --fix

echo "→ Generate the first database migration from src/db/schema.ts"
npx drizzle-kit generate

echo "✓ Done. Start the app with: npm start"
