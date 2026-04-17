# Candy Break

A match-3 puzzle game built with React Native and Expo. Swap adjacent candies to create matches, chain combos, and clear the board before your moves run out.

## Gameplay

- **8×8 Grid** with 5 unique board shapes (Square, Diamond, Plus, Ring, Hourglass)
- **Match 3+** candies of the same color horizontally or vertically to clear them
- **Special Tiles** spawn from longer matches:
  - 4-match → Striped tile (clears an entire row or column)
  - 5+ match → Rainbow tile (clears all candies of a matching color)
- **Cascade System** — cleared candies drop and refill, triggering chain combos
- **Bomb Power-up** — appears at ~60% of remaining moves; tap to instantly clear the stage for bonus points
- **Hint System** — highlights a valid move when you're stuck
- **Star Rating** — earn 1–3 stars based on moves remaining at win
- **5 Levels** with increasing difficulty across different board shapes

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- For Android: Android Studio + emulator or a physical device
- For iOS: Xcode + simulator (macOS only)

### Install & Run

```bash
# Install dependencies
npm install

# Start the Expo dev server
npm start

# Run on a specific platform
npm run android
npm run ios
npm run web
```

### Type Checking

```bash
npm run typecheck
```
## EAS (Expo Application Services)

This project uses **EAS Build** for cloud builds and **EAS Update** for over-the-air (OTA) JS updates.

### Setup

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login

# Link this project to EAS (first time only)
eas init
```

### Build

```bash
# Build for production (Android AAB + iOS IPA)
eas build --platform android --profile production
eas build --platform ios --profile production

# Build both platforms at once
eas build --platform all --profile production
```

> Builds run on Expo's cloud servers. When complete, a download link for the `.aab` / `.ipa` is provided.

### OTA Update (JS-only changes)

Use this instead of a full store release when only JavaScript/assets changed.

```bash
# Push an OTA update to production
eas update --channel production --message "Fix bug / update description"
```

> OTA updates are only delivered to devices whose `runtimeVersion` matches. A new binary build is required when native code changes.

### Channels

| Profile | Channel | Purpose |
|---|---|---|
| `development` | `development` | Dev client builds |
| `production` | `production` | App Store / Play Store |

## Scoring

| Event | Points |
|-------|--------|
| Base (per tile cleared) | 15 pts |
| Extra tiles beyond 3 | +5 pts each |
| Combo multiplier | +10 pts per combo level |
| Bomb clear bonus | +50 pts |

## Level Progression

| Level | Moves | Goal Multiplier |
|-------|-------|----------------|
| 1 | 20 | ×1.0 |
| 2 | 19 | ×1.15 |
| 3 | 18 | ×1.3 |
| 4 | 17 | ×1.5 |
| 5 | 16 | ×1.7 |

Base goals per board shape: `[40, 55, 65, 45, 55]`.

## App Info

- **Bundle ID**: `com.mike008.candybreak`
- **Orientation**: Portrait only
- **Owner**: `mike008`
