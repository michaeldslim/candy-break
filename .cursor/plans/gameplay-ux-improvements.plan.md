# Gameplay UX Improvements Plan

## Overview

| # | Item | Status |
|---|------|--------|
| 1 | Fix lightning (bomb) icon flash before stage transition | **implemented** |
| 2 | Update goal counter immediately when a move is accepted | **implemented** |
| 3 | Random mode order per level (shuffle once) | pending |
| ~~4~~ | ~~Diamond Board (`shape-classic`)~~ | **reverted** — board shape changes are out of scope |

**Design direction (confirmed):** All stages keep the **12×8 full grid** (`FULL_MASK`). Mode variety comes from **rules and goals**, not from masking cells into different shapes.

---

## 1. Bomb / lightning icon flash (bug fix) — done

### Root cause

On bomb tap, `bombPosition` was cleared before the 220ms animation. The cell still had candy in `board`, so `App.tsx` briefly rendered the candy image instead of ⚡.

### Fix

`bombActivating: IPosition | null` — UI treats a cell as bomb if `bombPosition` **or** `bombActivating` matches. Cleared before `applyStageInit`.

**Files:** `useCandyBreak.ts`, `App.tsx`

---

## 2. Immediate goal update — done

`goalRemaining` (and frozen cells for `locked-tiles`) update per cascade step via `computeGoalAfterSteps` / `applyStepProgress`, not only in `finalizeMove`.

**Files:** `useCandyBreak.ts`

---

## 3. Random mode order per level (shuffle once)

### Target behavior

At the **start of each level**, shuffle all `GAME_SHAPES` indices once. Play each mode exactly once in that random order. Reshuffle when entering the next level.

### Implementation sketch

- New state: `stageOrder: number[]`, `stageSlot: number`
- Derived: `shapeIndex = stageOrder[stageSlot]`
- Persist in `ISavedGame`; migrate old saves best-effort
- Stars key unchanged: `stars_L${level}_S${shapeIndex}`

**Files:** `useCandyBreak.ts`, optionally `.cursor/rules/candy-break.mdc`

---

## 4. New game modes (12×8 only)

### Current modes (6)

| Style | Goal | Moves | What varies |
|-------|------|-------|-------------|
| `classic` | Clear N candies | Limited | Bomb at 60% moves left |
| `color-target` | Clear N of one color | Limited | Random target color |
| `locked-tiles` | Thaw all frozen cells | Limited | 2-hit ice overlay |
| `multiplier-rush` | Score threshold | Limited | Combo doubles multiplier (max 8×) |
| `bomb-storm` | Clear N candies | Limited | Early bomb spawn + respawn |
| `timer-attack` | Clear N candies | Unlimited | 90s countdown |

All use `mask: FULL_MASK` — same 12×8 board.

### Candidate modes (recommended order)

#### Tier A — hook-only, reuses existing engine

| ID | Label | Goal | Rules | Why |
|----|-------|------|-------|-----|
| `order-collect` | Order Collect | Clear colors in sequence | Goal queue: e.g. Red 15 → Blue 15 → Gold 15; only active color counts | Distinct from `color-target`; teaches color planning |
| `combo-goal` | Combo Goal | Reach N cascades of 2+ | Only combo steps (step index ≥ 1) count toward goal | Rewards setup moves; different feel from `multiplier-rush` |
| `move-refund` | Move Saver | Clear N candies | Each cascade of 2+ refunds 1 move (cap e.g. +3/stage) | Tension between speed and efficiency |
| `no-specials` | Pure Match | Clear N candies | Disable striped/rainbow spawn in engine flag | Harder, more tactical; good contrast to `classic` |

**Touch:** `types`, `game.ts`, `useCandyBreak.ts` (`initializeStage`, goal tracking), `App.tsx` banner, `InstructionPage.tsx`. `no-specials` also needs a small `gameEngine.ts` flag.

#### Tier B — light engine extension, still full 12×8

| ID | Label | Goal | Rules | Engine change |
|----|-------|------|-------|---------------|
| `jelly-tiles` | Jelly Tiles | Clear all jelly | ~15% of cells marked jelly; each needs 1 match on that cell to clear | Jelly layer on playable cells (similar data model to `frozenCells`) |
| `stone-blocks` | Stone Blocks | Clear N candies | ~10% cells are immovable stones; candies match around them | Blocker layer; swaps skip stone cells |
| `special-hunt` | Special Hunt | Create N specials | Goal = count of striped/rainbow created (not candies cleared) | Track `specialCreated` in cascade steps |

#### Tier C — larger scope (defer unless strongly wanted)

| ID | Label | Notes |
|----|-------|-------|
| `color-flood` | Color Flood | 3 colors only (`maxKinds: 3`); higher clear goal |
| `ice-spread` | Ice Spread | Ice spreads every N moves unless adjacent cleared — defensive pressure |
| `mystery` | Mystery | Hidden color until first adjacent match |

### Not pursuing

- **Board shape masks** (diamond, cross, etc.) — user preference is fixed 12×8
- **Gravity direction change** — large engine/UI change for marginal gain
- **Practice / mode-select screen** — out of scope for this plan

### Suggested next mode to implement

**`order-collect`** — clearest differentiation, no engine changes, strong HUD story (show current target color + queue).

---

## Implementation order

1. ~~Bomb flash fix~~ ✓
2. ~~Immediate goal~~ ✓
3. **Random shuffle** — progression + save/load
4. **First new 12×8 mode** — pick from Tier A (recommend `order-collect`)

---

## Testing checklist

### Shipped (1–2)

- [x] Tap ⚡ — lightning stays visible until next stage; no candy flash
- [x] Single match — goal decrements on swap, not after cascade ends
- [x] 3+ combo — goal shows full cleared count immediately
- [x] `locked-tiles` — frozen count updates immediately
- [x] `color-target` — only target color reduces goal immediately

### Shuffle (3)

- [ ] New game Level 1 — random stage order (run twice, orders differ)
- [ ] Complete all stages in level — advances to next level with new shuffle
- [ ] Resume saved game — same `stageOrder` / `stageSlot` restored
- [ ] Bomb skip to next stage — respects shuffled order

### Revert verification

- [ ] No `shape-classic` / diamond references in code
- [ ] All 6 stages render full 12×8 grid
- [ ] `npm run typecheck` passes

---

## Out of scope

- Board shape / mask variety
- Mode-select / practice screen
- Goal progress bar animation
- Changing number of stages per level (still = `GAME_SHAPES.length`)
