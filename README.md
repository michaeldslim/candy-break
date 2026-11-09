# Candy Break

A match-3 puzzle game built with React Native and Expo. Swap adjacent candies on a **12×8** board, chain cascades, and clear each stage's goal before your moves or stage time run out.

## Gameplay

- **12×8 grid** — every stage uses the full board; variety comes from play-style rules, not board shape
- **Match 3+** candies horizontally or vertically to clear them
- **Special tiles** (most modes):
  - 4-match → Striped (clears a row or column)
  - 5+ match → Rainbow (clears all candies of one color)
- **Cascade system** — cleared candies drop and refill, triggering chain combos (`+combo xN!` when a swap chains 2+ match rounds)
- **Stage timer** — every stage has a countdown (HUD time bar + seconds). **Timer Attack** has no move limit; its timer is the main win/lose clock. Other modes use limited moves **and** a stage timer.
- **Bomb power-up** — appears at ~60% of remaining moves in most limited-move modes (30% in Bomb Storm); tap for +50 bonus points (Bomb Storm respawns once)
- **Run save** — progress is saved after moves and when pausing, leaving the game screen, or backgrounding the app. **Resume Last Game** on the home screen restores the saved board, stage, and mode.
- **Pause** — ⏸ / ▶ next to the title during play (stops the stage timer and input)
- **Continue on game over** — once per run, continue on the same board with extra time and (non–Timer Attack) restored moves. Optional **banked stars** (see below) change the button label when you have 3.
- **5 levels** — each level draws stages from a growing pool of play styles; stage count and available modes scale with level

### Banked stars & continue

| Rule | Detail |
|------|--------|
| Earn stars | One swap with combo **x7+** banks **1 star** (max **3** stars per run) |
| HUD | Saved stars shown as ★/☆; ♥ badge only when 3 stars are banked |
| Continue | **Once per run** on loss — same board; if you have **3 stars**, they are spent when you continue |
| Timer Attack continue | **+45 seconds** on the stage timer |
| Other modes continue | **+45 seconds** on the stage timer **and** moves set to **50%** of that level's starting moves (minimum **3**) |
| New game / give up | Banked stars and continue availability reset |

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
| 1 | **Classic** 🍬 | Clear N candies | Limited | Standard rules; bomb at ~60% moves left |
| 2 | **Color Target** 🎯 | Clear N of one color | Limited | Random target color; only that color counts toward Goal |
| 3 | **Locked Tiles** ❄️ | Thaw all frozen cells | Limited | ~20% frozen; 2 hits per cell |
| 4 | **Multiplier Rush** ✨ | Clear N candies | Limited | Cascade combos double score multiplier (max 8×) |
| 5 | **Bomb Storm** 💣 | Clear N candies | Limited | Bomb at ~30% moves; respawns once |
| 6 | **Timer Attack** ⏱️ | Clear N candies | Unlimited | 90-second mode timer (no move limit) |
| 7 | **Order Collect** 📋 | Clear colors in sequence | Limited | Red / Blue / Gold queue; active color only |
| 8 | **Combo Goal** 🔗 | Reach N cascade steps | Limited | Only chain steps after the first match in a swap |
| 9 | **Move Saver** 💾 | Clear N candies | Limited | 2+ cascades refund 1 move (max 3 per stage) |
| 10 | **Pure Match** 🧩 | Clear N candies | Limited | No striped or rainbow spawn or activation |
| 11 | **Jelly Tiles** 🟢 | Clear all jelly cells | Limited | ~15% jelly cells |
| 12 | **Stone Blocks** 🪨 | Break all stone blocks | Limited | ~12% stone cells |

Stage time limits use per-mode base seconds × level multipliers (minimum 45s). See `STAGE_TIME_BASE_SECONDS` and `LEVEL_TIME_MULTIPLIERS` in `src/constants/game.ts`.

### Mode details

**Classic** — Clear the candy goal within limited moves and the stage timer. Bomb at ~60% moves remaining awards +50 points and advances the stage when tapped (except Bomb Storm rules).

**Color Target** — A random color is chosen at stage start; only that color reduces Goal.

**Locked Tiles** — Frozen cells cannot be swapped; adjacent matches thaw ice (2 hits per cell).

**Multiplier Rush** — Goal tracks candy clears; HUD shows score. Multiplier doubles on 2+ cascade steps per swap (cap 8×), resets after each move.

**Bomb Storm** — Bomb spawns at ~30% moves; respawns once (two bombs per stage).

**Timer Attack** — No move limit; clear the candy goal before the 90-second countdown ends.

**Order Collect** — Complete shuffled Red → Blue → Gold steps in order.

**Combo Goal** — Goal counts cascade match rounds only (not the first match of the swap).

**Move Saver** — Up to 3 move refunds per stage when a swap produces 2+ cascades.

**Pure Match** — No special candy creation or activation.

**Jelly Tiles** / **Stone Blocks** — Clear jelly on-cell or break adjacent stones.

### Bomb power-up

In most limited-move modes, a bomb appears when remaining moves hit a threshold (~60%, or ~30% in Bomb Storm). Tap for +50 points. In Bomb Storm the bomb respawns once; in other modes, tapping typically skips to the next stage after the bonus.

## Scoring

| Event | Points |
|-------|--------|
| Base (per tile cleared) | 15 pts |
| Extra tiles beyond 3 | +5 pts each |
| Combo multiplier | +10 pts per combo level |
| Bomb clear bonus | +50 pts |

## Level Progression

| Level | Starting moves | Goal multiplier |
|-------|----------------|-----------------|
| 1 | 20 | ×1.0 |
| 2 | 19 | ×1.15 |
| 3 | 18 | ×1.3 |
| 4 | 17 | ×1.5 |
| 5 | 16 | ×1.7 |

Base goals per play style (level 1): indices match `GAME_SHAPES` in `src/constants/game.ts`. Locked Tiles, Jelly, Stone, and Order Collect derive goals from board setup.

## App features

- **Settings** ⚙ — language, avatar, career (from home or in-game; back returns to where you opened it)
- **Career** — rank progression from run results (wins and completed levels)
- **Leaderboard** — top 10 scores from the home screen modal

## Project Structure

| Layer | Path | Responsibility |
|-------|------|----------------|
| Types | `src/types/index.ts` | `PlayStyle`, board/cell interfaces |
| Constants | `src/constants/game.ts` | Grid size, scoring, timers, `GAME_SHAPES` |
| Engine | `src/utils/gameEngine.ts` | Swaps, matches, cascades, specials, scoring |
| State | `src/hooks/useCandyBreak.ts` | Stage progression, mode rules, persistence |
| UI | `App.tsx`, `src/components/` | Rendering, HUD, overlays, sounds |
| i18n | `src/i18n/` | Korean / English UI copy (including in-app instructions) |

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
| `savedGame` | Mid-run board, level, stage order/slot, mode state, banked stars, continue-used flag, timers |
| `leaderboard` / `playerInitials` | Local top-10 leaderboard |
| `appLanguage` | UI language (ko / en) |

Career and settings use additional keys under `src/career/` and `src/settings/`.
