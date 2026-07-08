# Candy Break

A match-3 puzzle game built with React Native and Expo. Swap adjacent candies on a **12×8** board, chain cascades, and clear each stage's goal before your moves run out.

## Gameplay

- **12×8 grid** — every stage uses the full board; variety comes from play-style rules, not board shape
- **Match 3+** candies horizontally or vertically to clear them
- **Special tiles** (most modes):
  - 4-match → Striped (clears a row or column)
  - 5+ match → Rainbow (clears all candies of one color)
- **Cascade system** — cleared candies drop and refill, triggering chain combos
- **Bomb power-up** — appears at ~60% of remaining moves in most limited-move modes; tap to skip the stage for +50 bonus points
- **Star rating** — earn 1–3 stars based on moves (or time) remaining when you win
- **5 levels** × **10 stages** per level — each level cycles through all play styles once, then difficulty scales

Progress is saved automatically mid-run. Resume from the instruction screen when you return.

## Play Styles

| # | Mode | Goal | Notes |
|---|------|------|-------|
| 1 | **Classic** | Clear N candies | Standard rules; bomb at 60% moves left |
| 2 | **Color Target** | Clear N of one color | Only the chosen color counts toward Goal |
| 3 | **Locked Tiles** | Thaw all frozen cells | Match next to ice; 2 hits to thaw each cell |
| 4 | **Multiplier Rush** | Reach score threshold | Combos double your multiplier (max 8×) |
| 5 | **Bomb Storm** | Clear N candies | Bomb spawns earlier (30% moves); respawns once |
| 6 | **Timer Attack** | Clear N candies | No move limit; 90-second countdown |
| 7 | **Order Collect** | Clear colors in sequence | Shuffled Red/Blue/Gold queue; only the active color counts |
| 8 | **Combo Goal** | Reach N cascade steps | Only chain matches count (not your first match) |
| 9 | **Move Saver** | Clear N candies | 2+ cascades refund 1 move (max 3 refunds per stage) |
| 10 | **Pure Match** | Clear N candies | No striped or rainbow candies |

Candy colors: **Red**, **Blue**, **Gold**, **Mint**.

## Scoring

| Event | Points |
|-------|--------|
| Base (per tile cleared) | 15 pts |
| Extra tiles beyond 3 | +5 pts each |
| Combo multiplier | +10 pts per combo level |
| Bomb clear bonus | +50 pts |

## Level Progression

| Level | Moves | Goal multiplier |
|-------|-------|-----------------|
| 1 | 20 | ×1.0 |
| 2 | 19 | ×1.15 |
| 3 | 18 | ×1.3 |
| 4 | 17 | ×1.5 |
| 5 | 16 | ×1.7 |

Base goals per play style (level 1): `[40, 55, 65, 45, 55, 50, 36, 12, 48, 42]` — indices match `GAME_SHAPES` order in `src/constants/game.ts`. Locked Tiles and Order Collect compute goals differently (frozen-cell ratio and per-color counts).

## Project Structure

| Layer | Path | Responsibility |
|-------|------|----------------|
| Types | `src/types/index.ts` | `PlayStyle`, board/cell interfaces |
| Constants | `src/constants/game.ts` | Grid size, scoring, `GAME_SHAPES` |
| Engine | `src/utils/gameEngine.ts` | Swaps, matches, cascades, specials, scoring |
| State | `src/hooks/useCandyBreak.ts` | Stage progression, mode rules, persistence |
| UI | `App.tsx`, `src/components/` | Rendering, HUD, overlays, sounds |

Game rules live in the hook and engine — not in UI components.

## Getting Started

### Prerequisites

- Node.js 18+
- For Android: Android Studio + emulator or a physical device
- For iOS: Xcode + simulator (macOS only)

### Install & Run

```bash
npm install
npm start          # Expo dev server
npm run android
npm run ios
npm run web
npm run typecheck
```

## EAS (Expo Application Services)

This project uses **EAS Build** for cloud builds and **EAS Update** for over-the-air (OTA) JS updates.

### Setup

```bash
npm install -g eas-cli
eas login
eas init   # first time only
```

### Build

```bash
eas build --platform android --profile production
eas build --platform ios --profile production
eas build --platform all --profile production
```

### OTA Update (JS-only changes)

```bash
eas update --channel production --message "Fix bug / update description"
```

OTA updates only reach devices whose `runtimeVersion` matches. A new binary build is required when native code changes.

### Channels

| Profile | Channel | Purpose |
|---------|---------|---------|
| `development` | `development` | Dev client builds |
| `production` | `production` | App Store / Play Store |

## Persistence

| Key | Purpose |
|-----|---------|
| `bestScore` | All-time high score |
| `savedGame` | Mid-run board, level, stage, mode state |
| `stars_L{level}_S{shapeIndex}` | Best star rating per stage |
