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
- **5 levels** — each level draws stages from a growing pool of play styles; stage count and available modes scale with level
- Progress is saved automatically mid-run. Resume from the instruction screen when you return.

## Play Styles

All 12 modes use the full **12×8** board. Candy colors: **Red**, **Blue**, **Gold**, **Mint**.

### Run structure

| Level | Stages | Available modes |
|-------|--------|-----------------|
| 1–2 | 5 | Core (4 modes) |
| 3 | 7 | Core + Mid (7 modes) |
| 4 | 7 | Core + Mid + Jelly/Stone (9 modes) |
| 5 | 8–10 | All 12 modes |

**Core:** Classic, Color Target, Locked Tiles, Bomb Storm  
**Mid:** Timer Attack, Move Saver, Pure Match  
**Advanced:** Multiplier Rush, Order Collect, Combo Goal  
**Extra:** Jelly Tiles, Stone Blocks

### Mode reference

| # | Mode | Goal | Moves | Notes |
|---|------|------|-------|-------|
| 1 | **Classic** 🍬 | Clear N candies | Limited | Standard rules; bomb appears at 60% moves left |
| 2 | **Color Target** 🎯 | Clear N of one color | Limited | Random target color; only that color counts toward Goal |
| 3 | **Locked Tiles** ❄️ | Thaw all frozen cells | Limited | 20% of cells frozen; match adjacent to ice; 2 hits to thaw each |
| 4 | **Multiplier Rush** ✨ | Clear N candies | Limited | Cascade combos double score multiplier (max 8×) |
| 5 | **Bomb Storm** 💣 | Clear N candies | Limited | Bomb spawns at 30% moves; respawns once (2 bombs total) |
| 6 | **Timer Attack** ⏱️ | Clear N candies | Unlimited | 90-second countdown; stars based on time remaining |
| 7 | **Order Collect** 📋 | Clear colors in sequence | Limited | Shuffled Red/Blue/Gold queue; only the active color counts |
| 8 | **Combo Goal** 🔗 | Reach N cascade steps | Limited | Only chain matches count (not the first match of a swap) |
| 9 | **Move Saver** 💾 | Clear N candies | Limited | 2+ cascades refund 1 move (max 3 refunds per stage) |
| 10 | **Pure Match** 🧩 | Clear N candies | Limited | No striped or rainbow candies spawn or activate |
| 11 | **Jelly Tiles** 🟢 | Clear all jelly cells | Limited | 15% of cells have jelly; match on a jelly cell to remove it |
| 12 | **Stone Blocks** 🪨 | Break all stone blocks | Limited | 12% of cells have stone; match adjacent to break (1 hit each) |

### Mode details

**Classic** — The baseline mode. Clear the target number of candies within limited moves. When remaining moves reach 60%, a bomb appears on the board. Tapping it awards +50 points and advances to the next stage.

**Color Target** — A random candy color is chosen at stage start. Only candies of that color reduce the Goal counter. Clearing other colors still scores points but does not progress the objective.

**Locked Tiles** — About 20% of cells are covered in ice (❄️). Frozen cells cannot be swapped. Matching candies in an adjacent cell deals 1 hit to the ice; each cell requires 2 hits to fully thaw. Goal = number of cells still frozen.

**Multiplier Rush** — Clear candies while building a score multiplier. When a swap triggers 2+ cascade steps, the multiplier doubles (1× → 2× → 4× → 8×, capped at 8×). The multiplier resets after each move. Goal tracks candy clears, but the HUD shows score progress.

**Bomb Storm** — Similar to Classic, but the bomb appears earlier (at 30% moves remaining) and respawns once after the first tap, giving two bomb opportunities per stage before advancing.

**Timer Attack** — No move limit; instead a 90-second timer counts down. Clear the candy goal before time runs out. Star rating is based on remaining time (≥50% → 3 stars).

**Order Collect** — Collect candies in a shuffled sequence of Red, Blue, and Gold. Each color requires ~12 clears (scaled by level). Only the currently active color counts; completing one color advances to the next. All three must be finished to clear the stage.

**Combo Goal** — Goal is measured in cascade steps, not candies cleared. The first match from a swap does not count — only subsequent chain reactions within the same move increment the Goal. Base target: 12 cascades (scaled by level).

**Move Saver** — Clear candies within limited moves, but cascades reward efficiency. If a single swap produces 2+ cascade steps, 1 move is refunded. Up to 3 refunds per stage.

**Pure Match** — Striped and rainbow special candies never spawn or activate, even on 4- or 5-match clears. All matching is basic 3+ clears only.

**Jelly Tiles** — About 15% of cells have a jelly layer underneath. Matching on a jelly cell removes the jelly from that cell. Goal = number of jelly cells remaining.

**Stone Blocks** — About 12% of cells contain stone blocks (🪨). Stones cannot be swapped. Matching in an adjacent cell deals 1 hit, destroying the stone. Goal = number of stones remaining.

### Bomb power-up

In most limited-move modes, a bomb tile appears when remaining moves reach a threshold (~60% for most modes, 30% for Bomb Storm). Tapping the bomb awards +50 points. In Bomb Storm, the bomb respawns once before advancing; in other modes, tapping it skips directly to the next stage.

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

Base goals per play style (level 1): `[40, 55, 65, 45, 55, 50, 36, 12, 48, 42, 50, 45]` — indices match `GAME_SHAPES` order in `src/constants/game.ts`. Locked Tiles, Jelly Tiles, Stone Blocks, and Order Collect compute goals differently (cell ratios and per-color counts).

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
