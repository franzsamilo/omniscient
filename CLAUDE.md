# CLAUDE.md — OMNISCIENT · Smart Campus Energy Management System

> This file is the source of truth for Claude Code when scaffolding and extending this repo.
> Read it fully before writing any file. Do not deviate from the stack, tokens, or structure below unless explicitly asked.

---

## 0. Working Agreement (read this first)

1. **This is a demo, not production.** Every integration is faked with seeded mock data. No real backend, no real IoT, no real auth. The goal is a *jaw-dropping walkthrough* a capstone panel can watch in 3 minutes.
2. **Wow > correctness.** Optimize for motion, typography, density, and micro-interactions. Pixel-perfect beats feature-complete.
3. **No placeholder gray boxes.** Every "placeholder" must *look* finished — real-looking numbers, real-looking floorplans, real-looking charts. Use seeded random generators, never `lorem ipsum`.
4. **Do not install shadcn/ui verbatim.** We use its primitives' *approach* (Radix + CVA) but all components are custom-styled to this design language. If Claude Code reaches for `npx shadcn add`, stop and hand-roll instead.
5. **One route = one hero moment.** Each top-level route must have at least one "wow" animation that triggers on mount.
6. **Build in phases (Section 13).** Don't jump ahead. Ship Phase 1 working before touching Phase 2.

---

## 1. Project Context

**Problem.** A Philippine university pays **₱3,882,000/month** in energy costs. The admin has no single-pane visibility into which buildings, rooms, or devices are driving that bill, no automated controls, no seismic safety interlocks, and no AI-driven optimization.

**Product.** OMNISCIENT is a Smart Campus Energy Management System — a command-center web app that unifies:
- A live 2D top-down map of the 101-building campus with red-flag overlays
- Per-room telemetry (power, water, temperature, humidity, occupancy via CV)
- Automated + manual equipment control (lights, outlets, AC, fans, water valves)
- Hybrid power accounting (grid + solar roof, stored + consumed)
- Seismic cutoff and hazard management
- AI recommendations (insulation, scheduling, anomaly triage)
- Maintenance ticketing with RBAC and RFID time logs

**Audience for this demo.** A capstone defense panel. They will click through, not stress-test.

---

## 2. Non-Goals

- No real authentication (fake a logged-in Admin session).
- No backend, no database, no websockets. Use `setInterval` + Zustand store to simulate streaming.
- No real map tile provider. The campus is **replicated as a bespoke stylized scene** (2D SVG + optional 3D R3F) driven by a single `campus-layout.json` data file. The original photograph is used only as a tracing reference during authoring, never shipped as a user-facing asset. See Section 8.
- No mobile. Design for **1440×900 minimum**, scale up to 1920. Mobile falls back to a "best viewed on desktop" screen.
- No i18n, no a11y audit beyond sensible defaults (focus rings, alt text, `prefers-reduced-motion`).

---

## 3. Tech Stack (pin these)

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router, RSC off for interactive pages) | `app/` dir, `"use client"` on every leaf page |
| Language | **TypeScript 5.6+**, `strict: true` | No `any`. Use `unknown` + narrow. |
| Styling | **Tailwind CSS v4** (CSS-first config via `@theme`) | No `tailwind.config.ts` — use `globals.css` `@theme` block |
| Motion | **Motion (formerly Framer Motion) 11+** | Primary animation library |
| Advanced motion | **GSAP 3** + ScrollTrigger | Only for the landing/intro sequence and map reveal |
| 3D (optional accent) | **React Three Fiber + drei** | Used once, on the "Solar" card — a slow-rotating low-poly sun |
| Charts | **Recharts** for stat panels, **visx** for the custom load-curve | Custom-styled, no default Recharts look |
| Icons | **Lucide React** + custom SVG for domain icons | |
| Primitives | **Radix UI** (Dialog, Tooltip, DropdownMenu, Tabs, Slider, Switch, ScrollArea) | Styled from scratch |
| State | **Zustand** with `subscribeWithSelector` | One store per domain (telemetry, controls, alerts, user) |
| Mock data | **@faker-js/faker** + seedrandom for determinism | Seed = `"omniscient-2026"` |
| Forms | **react-hook-form + zod** | Only for the "send maintenance request" modal |
| Date | **date-fns** | |
| Utils | **clsx, tailwind-merge** (exported as `cn`) | |
| Dev | ESLint, Prettier, Biome (optional) | |

**Node:** 20 LTS. **Package manager:** `pnpm`.

---

## 4. Design System

### 4.1 Mood

"NASA mission control meets a Teenage Engineering product page." Dense, confident, technical, with moments of editorial calm. Dark-first.

The product name is **OMNISCIENT** — *all-seeing*. The design metaphor is **observation, not illumination**. The system doesn't light things up; it *sees* them. This inflects every interaction: hover states are "focus" moments, flagged buildings are "detected anomalies," the AI panel is "what OMNISCIENT noticed." Prefer verbs of perception (observed, detected, noted, tracked) over verbs of action (lit, highlighted, displayed) in all UI copy.

### 4.2 Color tokens (CSS vars, defined in `globals.css` `@theme`)

```css
@theme {
  /* Surfaces — near-black with a warm blue undertone */
  --color-bg:        oklch(14% 0.012 255);
  --color-surface-1: oklch(17% 0.014 255);
  --color-surface-2: oklch(21% 0.016 255);
  --color-surface-3: oklch(26% 0.018 255);
  --color-border:    oklch(30% 0.02 255 / 0.6);
  --color-border-strong: oklch(42% 0.025 255);

  /* Text */
  --color-fg:        oklch(96% 0.01 255);
  --color-fg-muted:  oklch(72% 0.015 255);
  --color-fg-subtle: oklch(55% 0.015 255);

  /* Brand — "signal" cyan. Primary accent. Named for detection, not illumination. */
  --color-signal:      oklch(82% 0.17 195);
  --color-signal-glow: oklch(82% 0.17 195 / 0.35);

  /* Semantic */
  --color-solar:     oklch(86% 0.16 85);   /* amber gold */
  --color-grid:      oklch(70% 0.14 255);  /* indigo-blue */
  --color-ok:        oklch(78% 0.17 155);  /* mint */
  --color-warn:      oklch(82% 0.16 65);   /* orange */
  --color-danger:    oklch(68% 0.22 27);   /* red */
  --color-seismic:   oklch(70% 0.23 340);  /* magenta */

  /* Typography scale (fluid) */
  --text-display: clamp(3rem, 6vw, 5.5rem);
  --text-h1: clamp(2rem, 3.2vw, 2.75rem);
  --text-h2: 1.5rem;
  --text-body: 0.9375rem;
  --text-meta: 0.75rem;
  --text-micro: 0.6875rem;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* Elevation — no soft blurs; we use *lines* as elevation */
  --ring-1: inset 0 0 0 1px var(--color-border);
  --ring-2: inset 0 0 0 1px var(--color-border-strong);
  --glow-signal: 0 0 0 1px var(--color-signal), 0 0 32px -4px var(--color-signal-glow);
}
```

### 4.3 Typography (custom pairing — this is the "wow")

Three families, loaded via `next/font/google` in `app/layout.tsx`:

| Role | Family | Weights | Usage |
|---|---|---|---|
| **Display** | **Instrument Serif** (italic variant used heavily) | 400 | Hero numbers, section openers, editorial callouts. Always paired with wide letter-spacing on caps-lock labels. |
| **UI / Body** | **Geist** | 400, 500, 600 | All interface text, buttons, labels |
| **Data / Mono** | **Geist Mono** | 400, 500 | Every number, timestamp, ID, coordinate, kWh value. **No number is ever rendered in a proportional font.** |

Typographic rules:
- Big numbers (dashboard KPIs) use **Instrument Serif Italic** at `--text-display`, with a Geist Mono "unit" subscript (`kWh`, `₱`, `°C`). This contrast is the signature.
- Section headers are **ALL CAPS, 11px, Geist Mono, tracking +0.18em**, prefixed with a 1px leading rule (`╌╌`) and a 2-char index (`01 — BASELINE`).
- Body copy never exceeds 64ch per line.
- No underlines on links — use a bottom-border that animates in on hover.

### 4.4 Spacing & grid

- 8pt base. Tailwind spacing as-is.
- Layout: **12-column CSS grid** on every page, `gap-6`, `px-8` outer gutter.
- Sidebar = 72px collapsed / 240px expanded. Top bar = 56px.
- Cards use `--ring-1` (1px inset border) — **no drop shadows** except for the floating alert toast and the active seismic banner.

### 4.5 Iconography

- Lucide at 16px (inline) or 20px (nav).
- Stroke width **1.5** globally (override via CSS).
- Custom domain SVGs in `components/icons/domain/` for: `Solar`, `Grid`, `Breaker`, `Seismic`, `WaterValve`, `RFID`, `BuildingFlag`. 20×20, 1.5 stroke, matching Lucide's optical weight.

### 4.6 Motion language

Every animation must obey these rules:

1. **Easing:** default to `[0.22, 1, 0.36, 1]` (a custom "expo-ish" curve). Never use `ease-in-out` on anything longer than 200ms.
2. **Durations:** micro (120ms), short (240ms), medium (420ms), long (720ms), cinematic (1400ms). No other values.
3. **Stagger:** 40ms for lists, 80ms for cards, 120ms for hero sequences.
4. **Numbers count up** from 0 to their real value on first mount (see `components/primitives/NumberFlow.tsx` — use the `@number-flow/react` package).
5. **Charts draw in** via `pathLength` from 0 to 1 over 720ms.
6. **Map red flags pulse** on a 2s loop with a 1.2→1.0 scale and opacity 1→0 halo.
7. **Route changes** use a horizontal shutter wipe (400ms) via `motion`'s `AnimatePresence` in `app/template.tsx`.
8. **Honor `prefers-reduced-motion`** — fall back to opacity-only transitions at 120ms.

### 4.7 Textures (subtle, signature)

- A **1px dot grid** (`--color-border` at 12% opacity, 24px pitch) fills the app background. Implemented as a CSS `background-image: radial-gradient(...)`.
- A **noise SVG** overlay at 3% opacity on the topmost layer (helps against banding in the dark gradients).
- All cards have a **faint horizontal scanline** (1px, `--color-border` at 8%, repeated every 4px) only on the "live data" cards to signal real-time.

### 4.8 Brand identity — wordmark & monogram

**Wordmark.** `OMNISCIENT` set in Instrument Serif, **all caps**, letter-spacing `+0.04em` at display sizes. Never mix with the subtitle in the same line at display size — subtitle goes on a second line in Geist Mono caps: `SMART CAMPUS ENERGY MANAGEMENT SYSTEM`, 10px, tracking `+0.22em`, `--color-fg-subtle`.

Usage:
- Landing intro: full wordmark, center of canvas
- Top bar: monogram only (see below) + a small `OMNISCIENT` wordmark at 13px Geist 500 caps, tracking `+0.18em`, never Instrument Serif at that size
- Error boundary: the full wordmark, with the glitch animation applied per character

**Monogram — "the Eye."** A minimalist mark in `components/icons/Omniscient.tsx`:
- 20×20 viewBox
- An outer ring (1.2px stroke, `currentColor`, full circle)
- An inner dot (radius 2.4, filled)
- Four tick marks at N/E/S/W (2px long, 1.2px stroke) outside the ring — the "reticle"
- Two opposed arc segments at ~40° and ~220° on an outer orbit ring (0.8px stroke) — the "scanning" trace
- The outer arcs rotate slowly (one full revolution every 8s) when the monogram is placed inside a class `.is-scanning` — use CSS `@keyframes` so it works without JS

This mark appears:
1. As the **favicon** (stroke version) and in the OG image (see Section 6.J)
2. In the **top-bar top-left**, always, in `--color-signal` at `currentColor`, `.is-scanning` on — it's a live "system online" indicator
3. In the **landing intro**, drawn stroke-by-stroke before the wordmark appears
4. As the **"AI thinking" indicator** on `/ai` — when generating, the whole page tints slightly and the monogram (positioned inline in the button) scans faster (1 rev / 1.5s)
5. As a **subtle watermark** (6% opacity, 160px) in the bottom-right of the `/map` canvas when idle

Rule: the monogram is never a decorative element. It always encodes a state — "I am watching," "I am thinking," "I am scanning this." If placing it doesn't communicate one of those, don't place it.

**Tagline.** `Nothing goes unmeasured.` Instrument Serif italic. Used:
- Landing intro (below the wordmark)
- README hero
- OG image
- Never inside the app UI itself (the UI should demonstrate the claim, not restate it)

---

## 5. Information Architecture

```
/                          → Landing / intro sequence (GSAP) → auto-redirects to /overview after 4s OR on click
/overview                  → Main dashboard: campus map + top-level KPIs + alert feed
/map                       → Full-screen interactive campus map
/building/[id]             → Drill-in for one of 101 buildings → rooms list + room detail
/power                     → Hybrid power tab (Solar + Grid, Stored/Consumed cards, load curve)
/controls                  → Automated equipment control console
/activity                  → CV personnel detection grid (mock CCTV tiles)
/safety                    → Seismic + hazard operations (has a "TRIGGER DRILL" button)
/ai                        → AI recommendations inbox
/maintenance               → Scheduled maintenance + request composer
/security                  → RBAC, users, RFID access logs
/settings                  → Theme toggle (dark default, light as an unfinished stub), seed reset
```

Global chrome:
- **Left rail** (collapsible): route icons + labels
- **Top bar**: live clock (PHT), campus status pill, active alerts count (animated badge), user chip (Admin)
- **Bottom "console"** (always visible, 32px tall): a terminal-style ticker streaming fake events (`[21:04:11] ROOM 3F-204 OCCUPANCY=0 → AC OFF`)

---

## 6. Screen-by-Screen Spec

### 6.1 `/` Landing / Intro (GSAP cinematic)

Black canvas. Cold open:
1. Dot grid fades in (400ms).
2. Text types out in Geist Mono: `INITIALIZING OMNISCIENT // SMART CAMPUS ENERGY MANAGEMENT`.
3. The **Eye monogram** (Section 4.8) draws in stroke-by-stroke at center, then its outer arcs begin rotating.
4. 101 small squares scatter in from the corners and assemble into the campus map silhouette (GSAP timeline, 2.2s) — using the actual polygons from `campus-layout.json` so the intro *is* the data.
5. Wordmark `OMNISCIENT` fades in above the assembled map, full-width Instrument Serif caps.
6. Instrument Serif italic line fades in beneath: *"Nothing goes unmeasured."*
7. Button `ENTER COMMAND CENTER →` pulses.

No skip button for first visit (use `sessionStorage` flag).

### 6.2 `/overview` Dashboard

12-col grid:
- **Row 1 (KPI strip, 4 cards):** Current Load (kW), Today's Cost (₱), Solar Contribution (%), Active Alerts (count). Each card: Instrument Serif italic number, Geist Mono unit, 7-day sparkline in the corner, delta arrow with color.
- **Row 2 (8 col):** Embedded campus map at ~60% size with live red flags. (8 col) + **Alert Feed** (4 col) — list of 8 most recent alerts, each with severity bar, building, timestamp, and a "acknowledge" action.
- **Row 3 (12 col):** Load curve for today, 5-min intervals, split into Grid (indigo) and Solar (amber) stacked area. Hover produces a crosshair tooltip.

On mount: KPIs count up, sparklines draw, map flags pop in with 80ms stagger, load curve draws L-to-R.

### 6.3 `/map` Full campus map

A bespoke stylized rendering of the campus, driven by `campus-layout.json` (see Section 8). Two view modes, toggled by a segmented control in the top-right:

**`PLAN` (default, 2D SVG)** — top-down axonometric view, design-system colors, streets as thick mono-labeled polylines, fields as soft-green filled polygons, buildings as flat polygons with subtle inset lighting. This is the legible, fast, primary view.

**`SPATIAL` (3D, R3F)** — same polygons extruded vertically (building height proportional to baseline kW), lit with a blue-tinted rim light, camera on a gentle auto-orbit + drag-to-rotate. Switching from PLAN → SPATIAL animates the camera from straight-down to a 35° isometric tilt over 1400ms while the buildings simultaneously extrude upward from flat. This is the keynote moment.

Shared behaviors (both modes):
- Zoom/pan (react-zoom-pan-pinch in 2D; orbit/dolly in 3D).
- Hover a building → highlights in `--color-signal`, lifts (1px in 2D, ~0.3 world units in 3D), shows a HUD card anchored to cursor (building number, name, kW, today's ₱, occupancy, status, `OPEN →`).
- Red-flagged buildings get a pulsing danger halo (2D: SVG circle; 3D: billboarded ring sprite).
- Layer toggles (top-right legend): `HEATMAP / OCCUPANCY / WATER / FLAGS ONLY / CLEAN`.
- Time-of-day scrubber (bottom) re-interpolates intensity across all buildings.
- Compass rose HUD (always top-right, does not rotate with the map).

### 6.4 `/building/[id]`

Split view:
- Left (4 col): list of rooms in this building. Virtualized. Each row shows room code, current kW, temp, humidity, occupancy dot.
- Right (8 col): selected room detail. Four mini-charts (power, temp, humidity, water flow) + device list with toggles (Lights, Outlets, AC, Fans, Valve). Toggles have a satisfying spring animation.

### 6.5 `/power` Hybrid Power

Hero section:
- Two side-by-side **oversized** cards: `POWER STORED` and `POWER CONSUMED`. Instrument Serif italic numeric, 120px. Each has a live "now" value and a 24h bar beneath.
- To the right, a **3D low-poly sun** (R3F) slowly rotating. One-off use, worth the bundle cost for the wow.
- Below: a radial gauge showing solar vs grid mix *right now*. Custom SVG, animated needle.
- Solar roof status sub-panel: cleaning cycle progress ring, panel tilt angle (animated gauge), last-cleaned timestamp, next-scheduled clean.

### 6.6 `/controls` Equipment Console

Grid of control tiles grouped by building. Each tile:
- Device icon, room code, current state, a chunky custom toggle (not a native checkbox).
- "Schedule" mini-icon opens a popover with a day/night scheduler (fake).
- "Manual override" badge appears when a user has overridden AI — with a countdown to auto-revert.

Top of page: big **MASTER MODE** segmented control: `AUTO / SEMI-AUTO / MANUAL`. Switching animates a color wash across the tiles.

### 6.7 `/activity` CV Personnel Detection

A 3×4 grid of "CCTV tiles." Each tile is a **static looping placeholder** — use CSS-generated animated scenes (moving dot "people") rather than video, to keep the repo light. On each tile:
- Building / room label
- Detected count (Geist Mono big)
- Bounding boxes drawn over the "scene" via SVG, jittering slightly every 1.5s to feel live
- Status pill: `OCCUPIED` / `EMPTY` / `ANOMALY`

Click a tile → expands to a full-screen modal with a fake timeline of detections.

### 6.8 `/safety` Seismic & Hazard

- Hero: a seismograph-style live trace (Motion + SVG, continuously scrolling).
- Big red button: `RUN SEISMIC DRILL`. Pressing it:
  1. Triggers a full-app red wash (200ms).
  2. Klaxon icon in top bar starts pulsing.
  3. A full-screen takeover modal appears: *"SEISMIC EVENT DETECTED — NON-CRITICAL SYSTEMS CUTTING OFF IN 05…04…03…"*
  4. The controls page "non-critical" tiles, in the background, flip to OFF with a staggered animation.
  5. After 6s, a recovery screen appears with a post-event checklist.
- Breaker panel visualization: SVG schematic of the campus breaker tree with live state.

### 6.9 `/ai` AI Recommendations

- Inbox-style list of recommendations, each a card with: title, affected building(s), projected savings (₱/month), effort tag, priority pivot tags (`TIME`, `SAFETY`, `FACILITY`).
- Click → right-side drawer opens with the full rationale, the data it was based on (a mini chart), and two buttons: `DISMISS` / `CREATE WORK ORDER`.
- Top of page: a "generate new insights" button that runs a fake 3-second generating animation (shimmer bar + faux-streaming text).

### 6.10 `/maintenance`

- Kanban: `Requested / Scheduled / In Progress / Done`. Cards drag (use `@dnd-kit`).
- Full log view toggle (table).
- "New Request" button opens a modal with a proper react-hook-form + zod form.

### 6.11 `/security`

- Users table (10 fake users, mix of roles).
- RFID access log (live-appending rows every 8s — this sells the realtime story).
- Role matrix (who can do what) — read-only, visually rich.

### 6.12 `/settings`

- Theme toggle (dark active, light = "coming soon" ghost state).
- "Reset demo" button → reseeds all mock data and reloads.
- Seed value input (advanced).

---

## 7. Mock Data Strategy

All in `lib/mock/`. Every generator is **seeded** (`seedrandom("omniscient-2026")`) so reloads are deterministic.

```
lib/mock/
  seed.ts              // exports getRng() — seeded PRNG singleton
  buildings.ts         // the 101 buildings (name + svg path id + category + baseline kW)
  rooms.ts             // ~6–20 rooms per building, generated
  devices.ts           // 3–8 devices per room
  telemetry.ts         // generates 24h of 5-min-interval readings per room
  alerts.ts            // rolling alert feed generator
  users.ts             // 10 users with roles
  rfidLogs.ts          // appending log generator
  recommendations.ts   // 12 canned AI recs, hand-authored for quality
  live.ts              // setInterval-based "stream" that nudges telemetry + emits alerts
```

The 101-building list is **hand-entered from the legend** (Image 1). Do not abbreviate or paraphrase names. Geometry comes from `data/campus-layout.json` (see Section 8). Store in `lib/mock/buildings.ts` as:

```ts
import layout from "@/data/campus-layout.json";

export type Building = {
  id: number;                      // 1..101, matches the legend
  name: string;
  category: "academic" | "admin" | "residential" | "sports" | "utility"
          | "worship" | "dining" | "garden" | "parking" | "other";
  baselineKw: number;              // drives 3D extrusion height + color intensity
  polygon: [number, number][];     // normalized 0..1 from campus-layout.json
};

export const BUILDINGS: Building[] = [
  { id: 1,  name: "Dr. Rex D. Drilon Hall",           category: "academic", baselineKw: 42, polygon: layout.byId["1"] ?? [] },
  { id: 2,  name: "Dr. Rex D. Drilon Annex Building", category: "academic", baselineKw: 18, polygon: layout.byId["2"] ?? [] },
  // ... all 101
];

export const FIELDS = layout.fields;
export const STREETS = layout.streets;
```

Any building whose polygon is `[]` (not yet mapped from the extractor's provisional IDs to the legend's 1–101) simply won't render on the map until its geometry is authored in the layout editor — this is deliberate, not a bug.

Categories (affect icon + baseline): `academic | admin | residential | sports | utility | worship | dining | garden | parking | other`.

The "live" simulation runs a single `setInterval(tick, 1000)` in a Zustand store; each tick:
- Nudges every room's power by ±2%
- Rolls a 3% chance to emit a new alert
- Rolls a 0.5% chance to flip a building to "red-flagged"
- Advances the RFID log if on `/security`

---

## 8. The Campus Map — replicated as stylized 2D + 3D

The map is **not** the original photograph. It is a bespoke, design-system-native scene rendered from structured data. Same data drives two renderers (PLAN and SPATIAL). The photograph is used only as a tracing reference during authoring and is never user-facing.

### 8.1 Data — `data/campus-layout.json`

A single JSON file is the source of truth for all campus geometry. Provided starter file (see `campus-layout.json` shipped alongside this spec) contains:

```jsonc
{
  "meta": {
    "source_size": [865, 720],
    "coordinate_system": "normalized 0..1"
  },
  "buildings": [
    {
      "provisional_id": 1,              // extraction order — MUST be remapped to legend id
      "points": [[0.38, 0.05], [0.41, 0.05], [0.41, 0.09], [0.38, 0.09]],
      "bbox": { "x": 0.38, "y": 0.05, "w": 0.03, "h": 0.04 },
      "area": 0.0012,
      "vertex_count": 4
    },
    // ... ~60 auto-extracted polygons
  ],
  "fields": [
    { "provisional_id": 1, "points": [[...]], ... }  // football field, half moon field, etc.
  ],
  "streets": [
    { "name": "LOPEZ JAENA ST", "points": "TODO", "side": "south" },
    { "name": "STO. DOMINGO ST", "points": "TODO", "side": "west" },
    { "name": "ARGUELLES ST",   "points": "TODO", "side": "east" },
    { "name": "DUNGON CREEK",   "points": "TODO", "side": "north-east", "kind": "water" }
  ],
  "compass": { "rotation_deg": 0, "position": [0.82, 0.08] }
}
```

**Provisional vs legend IDs:** the extractor assigns `provisional_id` in top-to-bottom, left-to-right order. These do NOT match the 1–101 legend numbering. The layout editor (§8.4) is where this mapping happens. The final shipped file adds a top-level `byId` field: `{ "1": [[...]], "2": [[...]], ..., "101": [[...]] }` keyed by legend id.

### 8.2 Visual language — PLAN mode (2D SVG)

A dark, technical site plan. Not a skeuomorphic photo of paper.

| Element | Treatment |
|---|---|
| Background | `--color-bg` + dot grid underlay |
| Buildings (default) | `fill: var(--color-surface-3)`, `stroke: var(--color-border-strong)`, 1px. A 1px inset gradient top-left → bottom-right to fake soft lighting. |
| Buildings (hover) | Fill tweens to `--color-signal` at 18% over `--color-surface-3`; stroke becomes `--color-signal`; `filter: drop-shadow(0 0 8px var(--color-signal-glow))` |
| Buildings (flagged) | Fill stays default; animated halo ring in `--color-danger` pulses around the polygon centroid |
| Buildings (selected) | Stroke `--color-signal`, 1.5px; small label card sprouts with pointer line |
| Fields | `fill: var(--color-ok)` at 14% opacity, `stroke: var(--color-ok)` at 40% with `stroke-dasharray: 4 3` |
| Streets | Thick polylines: `stroke: var(--color-surface-2)`, `stroke-width: 10`, rounded caps. Secondary street casings: `stroke: var(--color-border)`, 12px, behind. |
| Street labels | Geist Mono, 10px, `tracking-[0.2em]`, uppercase, following path with `textPath`. Color `--color-fg-subtle`. |
| Water (Dungon Creek) | Stroke `--color-grid`, width 4, slight `stroke-opacity: 0.6`, animated dash offset to suggest flow |
| Building numbers | Geist Mono, 8px, `--color-fg-subtle`, placed at polygon centroid — only visible at zoom ≥ 1.4× |
| Compass | Custom SVG (not redrawn from the photo) — two concentric circles, N/E/S/W mono ticks, a single accent arrow |
| Heatmap overlay | Each building fill is `color-mix(in oklch, var(--color-surface-3) X%, var(--color-warn) Y%)` where Y = intensity; at extreme intensity the color rolls toward `--color-danger` |

**No drop shadows on buildings in default state.** Elevation is done with 1px strokes, not blurs. This keeps the look technical rather than soft.

### 8.3 Visual language — SPATIAL mode (3D, React Three Fiber)

Same polygons, extruded. Scene built with `@react-three/fiber` + `drei`.

- **Camera:** `PerspectiveCamera`, fov 35. Starts top-down (looking straight down) when transitioning from PLAN. Animates to an isometric position (elevation ~55°, azimuth 225°) over 1400ms using the project's standard easing.
- **Controls:** `OrbitControls` with `enableZoom`, `enableRotate`, `enablePan`, damped. Auto-rotate slowly (0.3 rad/s) when idle for 4s; stops on user interaction.
- **Ground:** a large `Plane` (40×40 world units) with a subtle `ShaderMaterial` that draws the same dot grid as the app background, plus the street polylines rendered as flat extruded ribbons (height 0.02) in `--color-surface-2`.
- **Fields:** `Plane` instances with slight downward offset (y = -0.01) in `--color-ok` at 30% opacity. No extrusion.
- **Buildings:** `<ExtrudeGeometry>` from each polygon (converted via Three.js `Shape`). Height = `lerp(0.3, 2.5, normalize(baselineKw))`. Material: `MeshStandardMaterial`, `color: --color-surface-3`, `roughness: 0.75`, `metalness: 0.05`. A subtle `edgesGeometry` wireframe overlay in `--color-border-strong`.
- **Lighting:**
  - `ambientLight` at 0.3 intensity
  - Key `directionalLight` from north-west, intensity 0.8, color slightly warm
  - Rim `directionalLight` from south-east, intensity 0.4, cool blue tint (`--color-grid`)
  - Shadow plane receives but buildings do not cast (performance)
- **Interaction:**
  - Hover: material emissive shifts to `--color-signal` at low intensity; building raises `y` by +0.1 over 240ms.
  - Flagged buildings: billboarded `<Sprite>` ring above their roof, pulsing scale, `color: --color-danger`.
  - Selected: edges glow with a thicker outline pass (use `drei`'s `Outlines`).
- **Transition to PLAN:** reverse the extrusion — heights animate back to 0 while camera returns to top-down. 1400ms.

Performance budget: extruded geometry must be generated once at mount and memoized. Do not regenerate on every frame. For buildings with >12 vertices, simplify to 8 before extrusion.

### 8.4 The layout editor — `/dev/layout-editor`

A dev-only page (`NODE_ENV === "development"`) that does three jobs:

1. **Map provisional IDs to legend IDs.** Left sidebar shows all 101 legend entries (from `BUILDINGS` array). Right side shows the photograph (`public/ref/campus-map-reference.jpg`) with every detected polygon overlaid as a colored outline. Click a polygon → pick its legend ID from the sidebar. Mapping is stored in `localStorage` and dumped via "Export to campus-layout.json".
2. **Edit polygons.** Click a polygon to select, then drag vertices. Shift+click adds a vertex. Delete removes one.
3. **Author missing geometry.** For buildings not detected by the extractor (there will be ~40), click "New" → pick legend ID → click-click-click to draw polygon points → double-click to close.

This tool exists so the layout data can be finalized in ~45 minutes of focused work instead of days of hand-typing coordinates. Build it in Phase 2 before hand-authoring anything.

**Implementation note:** the photograph `public/ref/campus-map-reference.jpg` is used ONLY by this editor. The runtime `/map` page never loads it. Users never see the photograph.

### 8.5 Component architecture

```
components/map/
  CampusMap.tsx          // top-level — decides PLAN vs SPATIAL, handles shared state (hover, select, layers)
  plan/
    PlanRenderer.tsx     // SVG renderer; composes layers below
    BuildingsLayer.tsx
    FieldsLayer.tsx
    StreetsLayer.tsx
    HeatmapLayer.tsx
    OccupancyLayer.tsx
    FlagsLayer.tsx
    LabelsLayer.tsx      // street + building number labels
  spatial/
    SpatialRenderer.tsx  // R3F canvas
    BuildingsMesh.tsx
    FieldsMesh.tsx
    GroundMesh.tsx
    FlagSprites.tsx
    SceneLighting.tsx
  shared/
    MapHud.tsx           // cursor-anchored info card (used in both modes)
    MapLegend.tsx        // layer toggles + PLAN/SPATIAL segmented control
    MapCompass.tsx
    MapTimeScrubber.tsx
  utils/
    polygon.ts           // normalize, centroid, area, simplify
    toThreeShape.ts      // polygon[] → THREE.Shape for extrusion
```

`CampusMap` accepts:
```ts
type CampusMapProps = {
  mode?: "plan" | "spatial";
  intensity?: Record<number, number>;   // buildingId → 0..1
  flagged?: Set<number>;
  occupancy?: Record<number, number>;
  layer?: "heatmap" | "occupancy" | "water" | "flags-only" | "clean";
  onBuildingClick?: (id: number) => void;
  size?: "contain" | "full";            // dashboard embed vs /map full-bleed
  allowModeToggle?: boolean;            // true on /map, false on dashboard embed
};
```

### 8.6 The HUD card on hover

Same in both modes (rendered in HTML, not canvas). Anchored to cursor with 12px offset, flips near viewport edges. Contents:

1. 11px mono caps: `BUILDING · 064`
2. 20px Geist 500: `University Gym`
3. Divider
4. Two-column mini grid:
   - `NOW` → Instrument Serif italic kW + mono `kW` unit
   - `TODAY` → Instrument Serif italic ₱ value
   - `OCCUPANCY` → mono count, thin bar
   - `STATUS` → pill
5. Footer: `OPEN →` mono caps, animated arrow

Fade-in 120ms, fade-out 80ms. Never blocks the cursor.

### 8.7 Non-negotiables

- **Never render the photograph at runtime.** It is a build-time reference only.
- **Same data, two renderers.** If you have to duplicate polygon data between PLAN and SPATIAL, you did it wrong.
- **Buildings without polygons simply don't render** — this keeps partial layout data shippable.
- **The PLAN → SPATIAL transition is a keynote moment.** Spend real time on the camera + extrusion easing. Bad easing here will undercut the whole demo.

---

## 9. Component Conventions

### 9.1 Folder layout

```
app/
  layout.tsx             // fonts, providers, dot-grid + noise background
  template.tsx           // route shutter transition
  page.tsx               // /
  overview/page.tsx
  map/page.tsx
  building/[id]/page.tsx
  power/page.tsx
  controls/page.tsx
  activity/page.tsx
  safety/page.tsx
  ai/page.tsx
  maintenance/page.tsx
  security/page.tsx
  settings/page.tsx
  globals.css            // @theme tokens + base styles

components/
  primitives/            // Button, Card, Pill, Toggle, Slider, Tooltip, Sheet, Dialog, Tabs, ScrollArea, NumberFlow, Sparkline, Gauge, RadialGauge, SegmentedControl, KpiCard, SectionHeader
  chrome/                // Sidebar, Topbar, ConsoleTicker, RouteShutter, AlertToast
  map/                   // CampusMap, BuildingHud, MapLegend, TimeScrubber
  charts/                // LoadCurve, StackedArea, Sparkline, Seismograph, LoadGauge
  icons/
    domain/              // custom SVG icons
  scenes/                // CctvScene (animated placeholder CCTV)
  forms/                 // NewRequestForm
  intro/                 // LandingIntro (GSAP)
  three/                 // SolarSun (R3F)

lib/
  mock/                  // see Section 7
  stores/                // zustand stores: useTelemetry, useAlerts, useControls, useUser, useLive
  utils/                 // cn, formatters (peso, kwh, tempC, percent), time
  constants.ts           // SEED, CURRENCY, TZ ("Asia/Manila")

hooks/
  useInterval.ts
  useLiveTick.ts
  useReducedMotion.ts
  useSeededRng.ts
```

### 9.2 Naming

- Components: `PascalCase.tsx`
- Stores: `useFoo.ts` with a named export `useFoo`
- Types: co-located in `types.ts` next to the store/component, or in `types/` at root for shared

### 9.3 Client vs server

Every page is a **client component** (this is a demo with live mocks). Add `"use client"` at the top of each `page.tsx`. Server components are only for `layout.tsx` (fonts + providers).

### 9.4 Styling rules

- **Tailwind utilities only.** No `@apply`. No CSS modules. No styled-components.
- Tokens are consumed via Tailwind's arbitrary values: `bg-[var(--color-surface-1)]`, `text-[length:var(--text-body)]`, or by the auto-generated classes from `@theme` (`bg-surface-1`, `text-body`).
- `cn()` helper everywhere: `<div className={cn("base", condition && "variant")}>`.
- No inline styles except for dynamic transforms or `--` CSS var injections.

### 9.5 Accessibility defaults

- Every interactive is keyboard-reachable.
- Respect `prefers-reduced-motion` via `useReducedMotion()` — fall back to opacity-only transitions.
- Color is never the only signal (always pair with icon/text).

---

## 10. Formatters (strict)

In `lib/utils/format.ts`:

```ts
peso(1234567)        // "₱1,234,567"
pesoShort(1234567)   // "₱1.23M"
kwh(42.77)           // "42.77 kWh"   // always 2 decimals
kw(42.7)             // "42.7 kW"
tempC(28.5)          // "28.5°C"
percent(0.42)        // "42%"
time(d)              // "21:04:11"
date(d)              // "16 Apr 2026"
```

Every number in the UI passes through one of these. No `toString()` shortcuts.

---

## 11. Example "Wow" Specs (reference implementations)

### 11.1 The KPI number

```tsx
<div className="flex items-baseline gap-2">
  <NumberFlow
    value={currentLoadKw}
    format={{ maximumFractionDigits: 1 }}
    className="font-serif italic text-[length:var(--text-display)] leading-none tabular-nums"
  />
  <span className="font-mono text-fg-subtle text-meta uppercase tracking-wider">kW</span>
</div>
<div className="mt-1 flex items-center gap-1.5 font-mono text-micro text-fg-muted uppercase tracking-wider">
  <span className={cn("size-1.5 rounded-full", delta > 0 ? "bg-danger" : "bg-ok")} />
  <NumberFlow value={Math.abs(delta)} format={{ style: "percent", maximumFractionDigits: 1 }} />
  <span>vs 24h</span>
</div>
```

### 11.2 Section header

```tsx
<div className="flex items-center gap-3 font-mono text-micro uppercase tracking-[0.18em] text-fg-subtle">
  <span>╌╌</span>
  <span>01 — Baseline</span>
  <span className="h-px flex-1 bg-[var(--color-border)]" />
</div>
```

### 11.3 Pulsing red flag (on the map)

```tsx
<motion.circle
  cx={x} cy={y} r={6}
  fill="var(--color-danger)"
  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
  transition={{ duration: 2, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
/>
```

---

## 12. Acceptance Checklist (per screen)

Before marking a screen "done," verify all of:
- [ ] Mounts without console errors or hydration warnings
- [ ] Has at least one entry animation (stagger or path-draw)
- [ ] All numbers use Geist Mono + the formatter helpers
- [ ] All section headers use the 11px mono caps pattern
- [ ] At least one hover state feels tactile (lift, glow, or border shift)
- [ ] Looks correct at 1440 and 1920 widths
- [ ] Honors `prefers-reduced-motion`
- [ ] Has a dense, realistic-looking screenshot-worthy first viewport

---

## 13. Build Phases (do these in order)

### Phase 1 — Shell & Tokens (ship first)
- Next.js app, fonts loaded, `globals.css` with `@theme` tokens
- Sidebar + Topbar + ConsoleTicker chrome
- Route shutter transition
- All 11 routes exist with placeholder page headers (section-header pattern)
- Mock data seed + stores instantiated (even if unused)
- Dot grid + noise background

**Demo-able:** user can navigate the skeleton, ticker runs, routes transition.

### Phase 2 — Overview + Map (PLAN mode only)
- `/overview` KPI strip with NumberFlow
- `CampusMap` with PLAN (2D SVG) renderer only — buildings, fields, streets, compass
- **Build `/dev/layout-editor` FIRST**, then use it to (a) map provisional IDs to legend IDs and (b) author polygons for the ~40 buildings the extractor missed
- Alert feed (seeded), load curve on `/overview`
- `/map` full-screen PLAN view with zoom/pan, hover HUD, red flag halos, layer toggles, time scrubber

**Demo-able:** the core story — "see the whole campus, spot the problems" — in stylized 2D.

### Phase 2.5 — SPATIAL mode (the keynote moment)
- Add R3F SpatialRenderer with ExtrudeGeometry from the same layout data
- PLAN ↔ SPATIAL segmented control + 1400ms camera/extrusion transition
- Lighting, idle auto-orbit, hover/select interactions in 3D

**Demo-able:** the transition alone justifies the entire stack choice. Polish this disproportionately.

### Phase 3 — Drill-in + Power
- `/building/[id]` split view with rooms + room detail
- `/power` hero cards, radial gauge, solar sub-panel, R3F sun

**Demo-able:** the drill-down narrative and the hybrid-power story.

### Phase 4 — Controls + Activity + Safety
- `/controls` console with master mode + tiles
- `/activity` CCTV grid with animated scenes
- `/safety` seismograph + `RUN DRILL` cinematic

**Demo-able:** the "automation + hazard" story. The seismic drill is a keynote moment.

### Phase 5 — AI + Maintenance + Security + Settings
- `/ai` inbox + drawer + fake-streaming generation
- `/maintenance` kanban + request form
- `/security` users + RFID live log + role matrix
- `/settings` theme + reset

**Demo-able:** the "closes the loop" story (insight → work order → access).

### Phase 6 — Polish

This is where the demo either lands or doesn't. The rule: **if a panelist remembers any single moment after the defense, it came from Phase 6.** Budget real time here, not leftover time.

#### 6.A Sound design
Sound is the highest-leverage polish in the whole project — and the easiest to ruin. Follow these rules exactly:

- **Muted by default.** A `🔇` toggle in the top bar controls a global `useSound()` store. First-visit state is MUTED. Never auto-play sound on page load.
- **Library:** Howler.js. Assets in `public/sounds/`, `.webm` with `.mp3` fallback, each under 50KB.
- **Sound map** (commission or source from freesound.org, CC0 only):
  | Event | File | Character |
  |---|---|---|
  | Toggle on | `tick-on.webm` | Soft tick, rising 800→1200Hz, 70ms |
  | Toggle off | `tick-off.webm` | Soft tick, falling 1200→800Hz, 70ms |
  | Tab/route change | `whoosh.webm` | Airy low whoosh, 180ms, -18dB |
  | Alert appears | `chime-alert.webm` | Two-note chime (minor third), 400ms |
  | Recommendation generated | `chime-complete.webm` | Two-note chime (major sixth), 500ms |
  | PLAN → SPATIAL transition | `swell.webm` | Slow synth swell, 1400ms, matches transition duration |
  | Seismic drill start | `klaxon.webm` | Classic two-tone klaxon, loops 3× then stops |
  | Seismic drill recovery | `chime-safe.webm` | Descending three-note resolution |
  | Error / denied action | `thud-low.webm` | Single low hit, 120ms |
- **Volume bus:** all playback through a single `Howl` group with master volume 0.4. Individual sounds may scale from there.
- **Never layer more than 2 sounds within 200ms.** Enforce a debounce in the play helper.

#### 6.B Micro-interaction catalogue
Every interactive element must have all four states defined: `rest`, `hover`, `press`, `disabled`. Non-negotiable items:

- **Toggles** (the chunky custom ones): spring animation on thumb (`type: "spring", stiffness: 500, damping: 30`), track color tweens over 180ms, haptic-feel "bump" at the end of travel via a final scale 1→1.08→1 micro-animation.
- **Buttons**: `press` state scales to 0.97 over 80ms, releases with spring. Never use default browser `:active`.
- **KPI cards**: on hover, the card's border shifts from `--color-border` to `--color-border-strong` over 200ms and a faint `--color-signal` hairline fades in at the top edge.
- **List rows** (alerts, recommendations, rooms): on hover, background fills with `color-mix(in oklch, var(--color-surface-2) 92%, var(--color-signal) 8%)`; a chevron `→` fades in on the right.
- **Number transitions**: any number that changes mid-session animates via NumberFlow. Deltas get a brief color flash — up = `--color-danger` (bad for energy!), down = `--color-ok` — for 600ms, then return to neutral.
- **Chart tooltips**: crosshair draws to cursor with a 120ms ease, tooltip card slides in from the crosshair with 8px offset.

#### 6.C Loading, empty, and error states
No default browser spinners. No blank screens. No generic "Something went wrong." Every non-happy state is designed.

- **Initial app boot (≤400ms)**: dot-grid background visible, top bar skeleton (a 1px animated gradient sweep), route content empty. If boot exceeds 400ms, show a single centered `INITIALIZING…` in Geist Mono with an animated underscore cursor.
- **Chart / card skeleton**: 1px dashed border in `--color-border`, centered `— —` in mono, shimmer gradient sweep left-to-right every 2s. Never longer than 400ms.
- **"AI generating recommendations"**: replace the recommendation list with 3–5 placeholder cards. Each shows a shimmer-bar where the title will be, with text appearing character-by-character as if streaming (150 chars/sec). Takes exactly 2800ms total. A subtle progress bar at the bottom of the page ticks across during the wait.
- **Empty states**: every list has a designed empty state. Examples:
  - Empty alerts: a single centered line — `All clear.` in Instrument Serif italic, below it mono caps `NO ACTIVE INCIDENTS · LAST CHECKED 14:22:08`.
  - Empty maintenance queue: `Nothing to do. Impressive.` italic, mono sub-line explaining when the next scheduled task is.
  - Empty RFID log (will never actually happen but design it anyway): `No access events in this window.`
- **Error boundary**: for any React error, a branded screen with a subtle glitch animation on the `OMNISCIENT` wordmark (per-character jitter + chromatic aberration pulse), a mono error code, and a `RELOAD` button. Never show raw stack traces.

#### 6.D Command palette (⌘K)
This alone lifts the demo from "nice dashboard" to "serious product." Build with `cmdk`.

- Trigger: `⌘K` / `Ctrl+K` anywhere. Shows a centered panel with a blurred backdrop (`backdrop-blur-xl` + `--color-bg` at 60%).
- Input: Geist, 18px, no visible border, cursor is a blinking `--color-signal` line.
- Results grouped by section: **Navigate** (routes), **Buildings** (searches the 101), **Actions** (Trigger Drill, Toggle Layer, Reseed Data, Switch to SPATIAL), **Recent** (last 5 actions).
- Each result row: icon + Instrument Serif title + Geist Mono shortcut chip on the right (e.g., `G → O` for overview).
- Enter executes. Escape closes. Arrow keys + Tab navigate.
- Opening animation: 180ms — backdrop fades, panel scales from 0.96 → 1.0 with spring.

#### 6.E Landing intro (GSAP cinematic) — build LAST
The 4-second cold open from Section 6.1. Implementation notes:
- Use a single GSAP timeline, paused on mount, played on `window.load` with `gsap.timeline({ paused: true })`.
- Assemble the campus silhouette using the same `campus-layout.json` polygons — they scatter in from random off-screen positions and converge. This is thematically right: the intro *is* the data, not decoration.
- The Instrument Serif tagline fades in via a `SplitText`-style per-character reveal (don't pay for the GSAP plugin — hand-roll with `<span>` per character, stagger 18ms).
- `sessionStorage.setItem("omniscient:seen-intro", "1")` after first play; on subsequent visits within the session, skip straight to `/overview`.
- Pressing any key during the intro skips to the end instantly.

#### 6.F Performance budget
Treat these as hard ceilings. If you break them, the demo stutters on the projector and the panel notices.

- **60fps** on a 2020 MacBook Air (integrated graphics) at 1440×900. Measure with the Performance tab, not vibes.
- **First contentful paint < 1.2s** on `/overview` (this is a demo, not web-perf-graded, but the landing must feel instant).
- **SPATIAL mode** specifically: ≤ 200 draw calls, target 60fps with all 101 buildings extruded. Use `<Instances>` where possible.
- **Bundle size**: main route chunks < 350KB gzipped per route. R3F only loads on `/map` and `/power` via dynamic import with `ssr: false`.
- **No layout shift**: every async-loaded element reserves its space first. CLS score 0.0.

#### 6.G Accessibility final pass
- Every button, link, toggle is keyboard-reachable with a visible focus ring (`outline: 2px solid var(--color-signal); outline-offset: 2px`).
- `prefers-reduced-motion`: fall back to 120ms opacity transitions everywhere. Disable the PLAN→SPATIAL camera animation (snap instead). Disable the landing intro (skip straight to `/overview`).
- `prefers-contrast: more`: bump `--color-border` → `--color-border-strong` globally.
- Every chart has an adjacent hidden `<table>` with the same data for screen readers.
- The command palette is fully navigable with keyboard only.

#### 6.H Keyboard shortcuts
A mono-caps cheat sheet accessible via `?`. Core shortcuts:
- `⌘K` — Command palette
- `G → O` — Go to overview
- `G → M` — Go to map
- `G → P` — Go to power
- `G → S` — Go to safety
- `M` — Toggle PLAN / SPATIAL on `/map`
- `L` — Cycle map layers
- `/` — Focus search (in alert feed, maintenance list, etc.)
- `.` — Toggle mute
- `Esc` — Close any modal / drawer
- `?` — Show shortcut cheat sheet

Shortcut registry lives in `lib/shortcuts.ts` — use `react-hotkeys-hook`.

#### 6.I 404 and error pages
- `/not-found` — a single Instrument Serif italic line: *"This route is off the grid."* Geist Mono sub-line: the attempted path + timestamp. A single `RETURN TO COMMAND CENTER →` button.
- Global error boundary: the glitch-wordmark screen from 6.C.

#### 6.J Marketing surface
- **Favicon**: the Eye monogram (Section 4.8), stroke version in `--color-signal`, rendered crisp at 16/32/64/180px (include `apple-touch-icon`).
- **OG image** (1200×630): dark background, dot grid, a stylized fragment of the campus map in `--color-signal` outline on the left 60%, on the right the Eye monogram above the Instrument Serif wordmark `OMNISCIENT` above the mono caps sub-line `SMART CAMPUS ENERGY MANAGEMENT SYSTEM` above the Instrument Serif italic tagline `Nothing goes unmeasured.`
- **`manifest.json`**: `name: "OMNISCIENT"`, `short_name: "OMNISCIENT"`, `description: "Smart Campus Energy Management System"`, `theme_color` matches `--color-bg`.
- **`<title>`**: `OMNISCIENT · {Route Name}` — e.g., `OMNISCIENT · Campus Map`.
- **README.md**: hero screenshot of `/overview`, the tagline under it, a short prose description, a "Run locally" section with three commands, a gallery of 6 screenshots (overview, map PLAN, map SPATIAL, power, safety drill mid-animation, AI recommendations).

#### 6.K Presenter mode
Press `P` to toggle. When active:
- Cursor auto-hides after 2s of inactivity, reappears on move.
- All animations play at 0.85× speed (gives the audience time to follow).
- Dev-only chrome (if any) hides.
- A subtle `PRESENTING` dot pulses in the top-right corner.
- `⌘K` is disabled (no accidental dev-tool-looking things on screen).

This is how you run the actual defense without fumbling.

---

## 14. Rules for Claude Code

1. **Never invent a dependency.** If it's not in Section 3, ask before adding.
2. **Never paraphrase building names.** They are copied verbatim from Image 1.
3. **Never use Recharts defaults.** Every chart must be re-styled (no default tooltips, no default axes colors, no default legend).
4. **Never ship a `<Skeleton />` as the final state.** Skeletons are allowed for the 400ms of perceived-load after "generate insights," nothing else.
5. **Never leave `any`**. Use proper types from the mock generators.
6. **Do not commit `.env` values.** There are no secrets in this demo — refuse if asked.
7. **When stuck on a motion value, err toward slower + smoother.** 420ms is almost always better than 200ms for "wow."
8. **When stuck on a color, err toward the established tokens.** Do not introduce new colors without extending `@theme`.
9. **Every PR-sized change: update this file's Section 13 checkboxes.** Treat it as the living spec.

---

## 15. Initial Scaffold Command

When starting from an empty directory, Claude Code should run this exact sequence:

```bash
pnpm create next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias="@/*" --no-turbopack
pnpm add motion gsap @number-flow/react zustand @faker-js/faker seedrandom \
         recharts @visx/visx lucide-react clsx tailwind-merge \
         @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-dropdown-menu \
         @radix-ui/react-tabs @radix-ui/react-slider @radix-ui/react-switch \
         @radix-ui/react-scroll-area @radix-ui/react-popover \
         react-hook-form zod @hookform/resolvers \
         date-fns react-zoom-pan-pinch @dnd-kit/core @dnd-kit/sortable
pnpm add three @react-three/fiber @react-three/drei
pnpm add -D @types/seedrandom @types/three
```

Then Claude Code should:
1. Replace `app/globals.css` with the `@theme` block from Section 4.2 + base resets + dot-grid background.
2. Replace `app/layout.tsx` to load Instrument Serif, Geist, Geist Mono via `next/font/google`.
3. Create the folder skeleton from Section 9.1 (empty files with a TODO comment header).
4. **Copy the provided `campus-layout.json` into `data/campus-layout.json`** — this is the auto-extracted starting geometry for the map.
5. **Copy the provided `campus-map-reference.jpg` into `public/ref/campus-map-reference.jpg`** — this is ONLY for the `/dev/layout-editor` tool, never rendered at runtime on user-facing routes.
6. Implement Phase 1 per Section 13.

---

## 16. Success Criteria

> When a capstone panelist sees the `/overview` screen for the first time, they should spontaneously say *"oh"*. That's the bar.

If a screen doesn't earn an "oh," it isn't done. Iterate on typography, motion, and density before adding features.

---

## 17. Demo Day Script

A 3-minute walkthrough the presenter rehearses. Every moment below is something the build must support; if any beat doesn't land, that beat is a polish bug.

**[0:00] Cold open.** Presenter opens the browser to `/`. Lets the GSAP intro play untouched. The polygons scatter, assemble, tagline fades.

> "OMNISCIENT is a smart campus energy management system. We built it for a university paying ₱3.8 million a month with no visibility into where that goes."

**[0:15] Overview lands.** KPIs count up. Load curve draws.

> "Four numbers, one campus. Real-time load, today's cost, solar share, active alerts. Behind them, a live view of every building."

**[0:30] Click `/map`.** PLAN mode, zoomed out. Presenter hovers over a red-flagged building. HUD card appears.

> "The Henry Luce library is drawing 42 kW right now — 1.8× its baseline. Flagged, unacknowledged."

**[0:50] Press `M`. PLAN → SPATIAL.** The keynote moment. Camera tilts up, buildings extrude, sound swell plays.

> "Same data, spatial."

*(Let the transition breathe. Do not speak over it.)*

**[1:10] Slow orbit (auto).** Presenter doesn't touch the mouse for 4 seconds. The camera auto-orbits. Flag halos pulse on their buildings.

**[1:20] Click the library building.** Drawer slides in.

> "Room 3F-204 is at 29°C and empty. The AC is still running. AI's already flagged it."

**[1:35] ⌘K → navigate to `/power`.**

> "Our solar roof provided 34% of today's load. Stored, consumed, live."

*(Let the R3F sun turn for 3 seconds.)*

**[1:55] ⌘K → navigate to `/safety`.**

> "Now — what happens if the ground shakes."

**[2:05] Click `RUN SEISMIC DRILL`.** The cinematic fires:
- Red flash (200ms)
- Full-screen countdown: `05 · 04 · 03 · 02 · 01`
- Klaxon plays once, low volume
- Background tabs (via the router prefetch) can be seen shutting off non-critical systems in the ticker at the bottom of the screen: `[21:04:11] BUILDING 070 LIGHTS OFF · [21:04:12] BUILDING 074 OUTLETS OFF · ...`

**[2:30] Recovery screen.** Checklist shows which systems are back.

> "Six seconds from tremor to automatic cutoff of non-critical load across 101 buildings."

**[2:45] ⌘K → navigate to `/ai`.**

> "And when things aren't on fire, the AI just suggests where to save next month's bill."

**[3:00] Closing.** Presenter returns to `/overview`.

> "₱3.8 million a month. One screen. Nothing goes unmeasured."

End.

**Rehearsal rule:** if the presenter has to say "uh, let me just click this real quick" at any point, something on the build side is unfinished. The script should flow without narration tape.

---

## 18. Polish Checklist (final sweep before defense)

Run through this the day before. Every item is binary.

**Motion**
- [ ] No animation runs longer than 1400ms
- [ ] Every number over 4 digits animates with NumberFlow on mount
- [ ] Reduced motion tested by toggling OS setting — app degrades gracefully
- [ ] No layout shift when charts mount (reserved space)
- [ ] Route transitions don't flash white

**Typography**
- [ ] Every number in the UI is in Geist Mono
- [ ] Every section header uses the `╌╌ 01 — LABEL` pattern
- [ ] No default system font anywhere (check with DevTools → Computed → font-family)
- [ ] No widow words in any card title

**Color**
- [ ] No raw hex values in JSX (`grep -r "#" components/` → should be empty)
- [ ] All colors via `var(--color-*)` tokens
- [ ] Heatmap ramp tested at 0%, 50%, 100% — no gray mush in the middle

**Density**
- [ ] First viewport of every page has ≥ 6 pieces of live data visible
- [ ] No card is more than 40% whitespace

**Sound**
- [ ] Muted by default (verify in incognito)
- [ ] No sound ever plays without a user gesture first
- [ ] Toggle mute works mid-animation (cuts cleanly)

**Performance**
- [ ] `/overview` hits 60fps on target hardware
- [ ] SPATIAL mode hits 60fps with all buildings
- [ ] Bundle size under budget (check `next build`)

**Demo**
- [ ] The 3-minute script runs end-to-end with no console errors
- [ ] Presenter mode tested on the actual defense machine + projector
- [ ] Fallback: the demo works offline (no API calls, no CDN fonts on hot path — fonts self-hosted via `next/font`)
- [ ] `sessionStorage` is cleared so the intro plays for the panel

**Content**
- [ ] All 101 buildings have real legend names (no "Building 47")
- [ ] No `Lorem ipsum` anywhere (`grep -ri "lorem" .`)
- [ ] No `console.log` in committed code
- [ ] No `TODO` comments in committed code (convert to issues or delete)

**Failure modes**
- [ ] 404 page renders correctly
- [ ] Error boundary tested by throwing in a component
- [ ] Network offline: app still renders with last-seeded data
