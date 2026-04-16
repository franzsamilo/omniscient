# CLAUDE-UPDATES.md — Revision patches to the OMNISCIENT spec

> **Read CLAUDE.md first.** This file contains targeted amendments, not a replacement.
> Apply each patch to the section it references. If a patch conflicts with CLAUDE.md, **this file wins.**
>
> **Context:** The project has been under active development. Some of these items may already be partially implemented in the codebase.
> Before implementing any patch, check what currently exists — adapt rather than overwrite working code.

---

## PATCH 1 — `/power` Hybrid Power Tab: animated energy flow diagram + battery fill

**Overrides:** CLAUDE.md §6.5 (`/power` Hybrid Power)

**Problem with the original spec:** the `/power` page described two oversized static cards (STORED / CONSUMED) and a radial gauge. This is too flat — it doesn't convey the *flow* of energy through the campus system. The panel needs to *see* energy moving.

### 1.1 New `/power` layout (top to bottom)

**Row 1 — Section header**
```
╌╌ 01 — HYBRID POWER FLOW
```

**Row 2 — The Energy Flow Diagram (hero element, 12-col span)**

A live animated schematic showing energy flowing between four nodes. Reference: the HelioGrid "Capacity" panel (see `ref/heliogrid-reference.jpg`), but adapted to OMNISCIENT's dark design language and campus scale.

```
                    ┌──────────────┐
                    │  SOLAR ROOF  │
                    │   2.7 kW ☀   │
                    └──────┬───────┘
                           │
                     (animated flow)
                           │
              ┌────────────┼────────────┐
              │                         │
              ▼                         ▼
     ┌────────────────┐       ┌────────────────┐
     │  GRID (IMPORT) │       │    BATTERY     │
     │    1.8 kW ⚡    │◄─────►│   86% ████░░   │
     │                │       │    0.6 kW      │
     └────────┬───────┘       └────────────────┘
              │
        (animated flow)
              │
              ▼
     ┌────────────────┐
     │  CAMPUS LOAD   │
     │   4.2 kW 🏫    │
     └────────────────┘
```

**Node design (each of the 4 nodes):**
- A card (`--ring-1`, `rounded-lg`, `bg-surface-1`) with:
  - Top: domain icon (custom SVG) + Geist Mono label, 10px caps, `tracking-[0.18em]`
  - Center: Instrument Serif italic number + Geist Mono unit (`kW`)
  - Bottom (varies per node): status pill or mini sparkline

**Animated flow lines (the key wow element):**
- SVG `<path>` connecting the nodes
- Stroke: `--color-signal` (solar→battery), `--color-solar` (solar→grid), `--color-grid` (grid→campus)
- Animated dashes traveling along each path: `stroke-dasharray: 6 10`, `stroke-dashoffset` animated via CSS `@keyframes` — the dashes "flow" in the direction of energy transfer
- Flow speed proportional to kW: higher flow = faster dash animation (map kW to animation-duration: 0.5kW → 4s, 5kW → 0.8s)
- When a path has zero flow (e.g., solar at night), the line dims to `--color-border` and dashes stop
- A small glowing dot (4px, `--color-signal`) travels along each active path on a loop — the "energy particle"
- Lines have a subtle `filter: drop-shadow(0 0 3px var(--color-signal-glow))` — not heavy, just alive

**Row 3 — Battery + Solar detail (two cards, 6-col each)**

**Card 1: Battery Storage — the animated fill**
- Outer shape: a large battery icon (custom SVG), ~180px tall, oriented vertically
- The battery body is an outlined rect with rounded corners, `stroke: --color-border-strong`, 1.5px
- Fill: a `<rect>` inside, clipped to the battery body, whose `height` animates from 0% to current SOC% on mount (720ms, the standard easing)
- Fill color: gradient from `--color-ok` (full) → `--color-warn` (30%) → `--color-danger` (<15%)
- The fill has a **subtle wave animation** on its top edge — a sine-wave `<path>` that gently oscillates (amplitude 2px, period 3s). This is the single most important micro-animation on the page: it makes the battery feel *liquid*, not static.
- Inside the battery body, centered: `86%` in Instrument Serif italic, 48px, white — composited over the fill
- Below the battery: `22.0 kWh CAPACITY` in Geist Mono caps
- Status label: `CHARGING` / `DISCHARGING` / `FULL` / `LOW` — pill colored by state
- A 24h mini bar chart below (24 bars, one per hour, showing SOC history) — bars draw up on mount with 40ms stagger

**Card 2: Solar Roof Status**
- A custom SVG illustration of a tilted solar panel (~120px wide) with animated sun rays:
  - During daytime (mock): rays emanate from a small `--color-solar` circle, drawn as 6–8 lines rotating slowly (one revolution per 12s)
  - At "night" (if the time scrubber or mock says so): rays fade to 0, a moon crescent icon fades in at 30% opacity
- Below the panel illustration:
  - `PANEL TILT` → animated gauge (current angle, e.g., `32°`)
  - `CLEANING CYCLE` → a circular progress ring showing next-clean countdown
  - `LAST CLEANED` → Geist Mono timestamp
  - `EFFICIENCY` → percentage with delta vs yesterday

**Row 4 — Load curve (12 col, same as before)**
- 24h stacked area chart: Grid (indigo) + Solar (amber), but now also showing Battery charge/discharge as a third color below the x-axis (negative = discharging, positive = charging), mirroring how real energy dashboards work.

### 1.2 Mock data additions

In `lib/mock/telemetry.ts`, add:

```ts
export type PowerFlow = {
  solarKw: number;       // current solar production
  gridImportKw: number;  // current grid draw
  gridExportKw: number;  // current export to grid (usually 0 for this campus)
  batteryKw: number;     // positive = charging, negative = discharging
  campusLoadKw: number;  // total campus consumption
  batterySoc: number;    // 0..1 state of charge
  batteryCapacityKwh: number; // fixed, e.g. 22.0
};
```

The live tick should update `PowerFlow` every second with small deltas. Solar follows a bell curve peaking at noon (PHT). Battery charges when solar > load, discharges when solar < load. Grid fills the gap.

### 1.3 New components

```
components/power/
  EnergyFlowDiagram.tsx       // the 4-node animated schematic
  EnergyFlowLine.tsx          // single animated SVG path with dashes + particle
  BatteryGauge.tsx            // the animated fill battery with wave top
  SolarPanelStatus.tsx        // panel illustration + rays + status fields
  PowerLoadCurve.tsx          // the existing load curve, extended with battery band
```

---

## PATCH 2 — `/controls` restructured: building cards → floor drill-in → device controls

**Overrides:** CLAUDE.md §6.6 (`/controls` Equipment Console)

**Problem with the original spec:** showing a flat grid of every device toggle across the entire campus is overwhelming and unrealistic. No admin controls 101 buildings' devices on one screen. The original spec has poor UI isolation.

### 2.1 New `/controls` — three-level drill-down

The controls page uses a **progressive disclosure** pattern: Campus → Building → Floor/Room → Device.

**Level 1: Building cards (default view)**

Section header: `╌╌ 01 — EQUIPMENT CONTROL`

Top: the **MASTER MODE** segmented control stays (`AUTO / SEMI-AUTO / MANUAL`). Switching this affects all buildings — the color wash animation across the cards still applies.

Below: a **card grid** (3 columns on 1440, 4 on 1920) of building cards. Each card:
- Building name (Geist 500, 16px)
- Building number badge (Geist Mono, `--color-fg-subtle`)
- A **mini status bar** showing active device ratio: e.g., `14/22 devices active` as a thin progress bar, color = `--color-signal` when in normal range, `--color-warn` if >80% devices running, `--color-ok` if <30%
- Total current draw for this building: Instrument Serif italic, 20px, + `kW` mono
- Mode override indicator: a small pill (`AUTO` / `MANUAL`) if this building deviates from the master mode
- **Click → transitions to Level 2** with a satisfying zoom-in animation: the card expands to fill the content area (Motion `layoutId` transition, 420ms)

A search bar at the top filters buildings by name or number. Also a quick-filter row: `ALL / FLAGGED / MANUAL OVERRIDE / HIGH LOAD`.

**Level 2: Building detail — floor view**

Breadcrumb: `Controls → Dr. Rex D. Drilon Hall`

Left panel (4 col): **Floor list.** A vertical stack of floor cards:
- Floor label: `3F`, `2F`, `1F`, `B1` (Geist Mono, 14px)
- Active device count / total
- Thin horizontal bar showing floor's share of building load
- Click → selects floor, populates right panel

Right panel (8 col): **Room + device grid for the selected floor.**

Each room is a card containing:
- Room code header: `3F-204` (Geist Mono, 12px caps)
- Occupancy dot: green if occupied (from CV/sensor), hollow if empty
- Temperature + humidity reading (if sensors exist for this room): `28.5°C · 72%` in Geist Mono
- Device toggles — one row per device:
  | Device | Toggle | Status |
  |---|---|---|
  | 💡 Lights | `[====]` | ON · 0.4 kW |
  | 🌀 AC | `[====]` | ON · 1.8 kW · 24°C set |
  | 🌀 Fan | `[  ==]` | LOW · 0.1 kW |
  | 🔌 Outlets | `[====]` | ON · 0.6 kW |
  | 🚰 Water Valve | `[====]` | OPEN |
  
- Each toggle: the same chunky spring-animated custom toggle from the original spec
- If a device has been **manually overridden** (i.e., deviates from AUTO recommendation), show a small `OVERRIDE` badge with a countdown to auto-revert
- If the room is **empty and devices are still ON**, flag the whole room card with a subtle `--color-warn` left-border accent and a Geist Mono note: `EMPTY · DEVICES ACTIVE`

**Back navigation:** a `←` button in the breadcrumb, or click the building card in the sidebar (which stays visible as a collapsed column showing building name + total kW).

**Level 3 (optional, if time permits):** clicking a single device row expands it inline to show:
- 24h usage sparkline for that device
- Schedule editor (day/night time blocks, drag to set on/off windows)
- "Lock to manual" toggle with admin confirmation

### 2.2 Animation spec

- **L1 → L2 transition:** the clicked building card uses `motion.div` with `layoutId={`bldg-${id}`}` to expand into the building detail header. Other cards fade out (opacity 0, 180ms). The floor list slides in from the left (translateX -20px → 0, 240ms). Stagger: floors appear 40ms apart.
- **L2 → L1 transition:** reverse. The building header collapses back to its card position. Floor list slides out. Other cards fade back in.
- **Floor selection:** right panel crossfades (opacity swap, 180ms). Device toggles stagger in (40ms each).
- **Toggle interaction:** thumb slides with spring physics. Track color tweens. If sound is unmuted, play the `tick-on` / `tick-off` sound.

### 2.3 Component structure

```
components/controls/
  BuildingCardGrid.tsx         // Level 1 — filterable grid of building cards
  BuildingCard.tsx             // individual card with mini status bar
  BuildingDetail.tsx           // Level 2 — floor list + room/device panel
  FloorList.tsx                // vertical floor stack
  RoomDeviceGrid.tsx           // grid of room cards for a selected floor
  RoomCard.tsx                 // single room with device toggles
  DeviceToggleRow.tsx          // one device: icon + label + toggle + status
  MasterModeControl.tsx        // the segmented control (reused from original)
  ControlsBreadcrumb.tsx       // Controls → Building → Floor
```

### 2.4 Mock data extension

In `lib/mock/rooms.ts`, ensure every room has:
```ts
export type Room = {
  id: string;              // e.g. "3F-204"
  buildingId: number;
  floor: string;           // "3F", "2F", "1F", "B1"
  devices: Device[];
  currentTempC: number;
  currentHumidity: number; // 0..1
  occupied: boolean;
  occupantCount: number;
};

export type Device = {
  id: string;
  kind: "lights" | "ac" | "fan" | "outlets" | "water_valve";
  state: "on" | "off" | "low" | "med" | "high";
  currentKw: number;
  mode: "auto" | "manual";
  manualOverrideExpiresAt: Date | null;
  setpointC?: number;      // for AC only
};
```

---

## PATCH 3 — Air quality monitoring: temperature, humidity, and air quality as a first-class feature

**Adds to:** CLAUDE.md §5 (IA), §6 (screen specs), §7 (mock data)

**Problem:** the original spec mentions temperature and humidity data in the telemetry pipeline (§Epic 2) and in room detail (§6.4), but there's no dedicated surface for air monitoring. It's buried. For a campus energy system, environmental conditions directly drive HVAC optimization — this deserves its own visible presence.

### 3.1 New route: `/environment`

Add to the information architecture (§5) between `/activity` and `/safety`:

```
/environment              → Air quality, temperature, humidity monitoring across campus
```

Add a nav item in the sidebar: icon = `Thermometer` (Lucide), label = `ENVIRONMENT`.

### 3.2 `/environment` page spec

Section header: `╌╌ 01 — ENVIRONMENTAL MONITORING`

**Row 1 — Campus-wide KPI strip (4 cards)**

| Card | Value | Unit | Sparkline |
|---|---|---|---|
| Avg Temperature | `28.5` | `°C` | 24h trend |
| Avg Humidity | `72` | `%` | 24h trend |
| Comfort Index | `74` | `/100` | 24h trend |
| HVAC Efficiency | `82` | `%` | 24h trend (ratio of cooling output to energy input) |

Comfort Index is a composite: derived from temp + humidity + occupancy using a simplified PMV (Predicted Mean Vote) model. Values 70–80 = comfortable (green), 60–70 = marginal (amber), <60 or >80 = uncomfortable (red). The formula doesn't need to be accurate — it needs to be *plausible* and give varied numbers across the campus.

**Row 2 — Campus heatmap (8 col) + Anomaly feed (4 col)**

Left: an embedded `CampusMap` (`size="contain"`, `layer="environment"`) with a **new layer mode** — buildings are colored by their average temperature deviation from setpoint:
- Blue-shifted (below setpoint by >2°C) → `--color-grid`
- Green (within ±2°C of setpoint) → `--color-ok`
- Red-shifted (above setpoint by >2°C) → `--color-danger`

Right: a live anomaly feed specific to environment. Example entries:
- `🌡 ROOM 3F-204 · 31.2°C · SETPOINT 24°C · +7.2° DEVIATION`
- `💧 BUILDING 070 · AVG HUMIDITY 89% · MOLD RISK`
- `❄ ROOM 1F-101 · 18.3°C · UNOCCUPIED · AC RUNNING`

Each entry is a small card with a severity bar (left edge, 3px, colored by severity).

**Row 3 — Building-level environment table (12 col)**

A data table (not a card grid — tables are better here for scanning):
| Building | Avg Temp | Avg Humidity | Comfort Index | Active AC Units | HVAC Load | Status |
|---|---|---|---|---|---|---|
| 070 · Henry Luce III Library | 27.8°C | 68% | 78 | 4/6 | 12.4 kW | ● OK |
| 064 · University Gym | 30.1°C | 82% | 61 | 2/4 | 8.2 kW | ▲ WARM |

Table rows are clickable → navigates to `/building/[id]` with the environment tab pre-selected.

**Row 4 — 24h temperature + humidity overlay chart (12 col)**

A dual-axis line chart:
- Left axis: temperature (°C), line in `--color-danger` (warm tones)
- Right axis: humidity (%), line in `--color-grid` (cool tones)
- A shaded "comfort band" (semi-transparent green) from 22–26°C
- The outdoor temperature (if modeled) as a dashed line for comparison

### 3.3 Additions to room detail (`/building/[id]`)

In the room detail right panel (§6.4), add a dedicated **Environment sub-section** between the mini-charts and the device list:

- A horizontal bar showing temperature on a gradient scale (16°C → 36°C) with a marker at current value and a marker at AC setpoint
- Humidity as a radial/arc gauge (0–100%) with zones marked: `DRY (<40%)`, `COMFORT (40–70%)`, `HUMID (>70%)`, `MOLD RISK (>85%)`
- A small "AI NOTE" card (if applicable): e.g., *"Room is 6.2°C above setpoint while unoccupied. Recommend AC shutdown."* — this links to the `/ai` recommendations

### 3.4 Environment layer for CampusMap

In `components/map/plan/` and `components/map/spatial/`, add support for `layer="environment"`:

- PLAN mode: building fill interpolates between `--color-grid` (cold) → `--color-ok` (comfortable) → `--color-warn` (warm) → `--color-danger` (hot)
- SPATIAL mode: same color mapping applied to building material, plus a subtle heat-shimmer `<Sprite>` effect above buildings that are >5°C over setpoint (a vertical wavy distortion, very faint — 6% opacity max)

### 3.5 Mock data

In `lib/mock/telemetry.ts`:
```ts
export type EnvironmentReading = {
  roomId: string;
  tempC: number;           // 18–36, varies by building category
  humidity: number;        // 0.3–0.95
  co2Ppm?: number;         // 400–2000 (optional, for future use)
  acSetpointC: number;     // typically 24
  comfortIndex: number;    // derived, 0–100
};
```

Temperature follows a pattern: academic buildings cooler (AC), sports facilities warmer, dining halls humid, residential moderate. The live tick nudges these by ±0.2°C per tick with occasional spikes.

---

## PATCH 4 — Water monitoring: leak detection + consumption tracking as a visible subsystem

**Adds to:** CLAUDE.md §5, §6, §7

**Problem:** water monitoring is mentioned in the original requirements (Epic 2, Task 2.1 — "water flow metrics"; Epic 3, Task 3.1 — "automated water flow shutdown") but has no dedicated UI surface. It's invisible. For a campus spending ₱3.8M/month, water waste is a significant cost driver that deserves its own monitoring view.

### 4.1 New route: `/water`

Add to the IA (§5) between `/environment` and `/safety`:

```
/water                    → Water flow monitoring, leak detection, consumption analytics
```

Sidebar icon: `Droplets` (Lucide). Label: `WATER`.

### 4.2 `/water` page spec

Section header: `╌╌ 01 — WATER SYSTEMS`

**Row 1 — KPI strip (4 cards)**

| Card | Value | Unit | Context |
|---|---|---|---|
| Today's Consumption | `142,800` | `L` | vs yesterday delta |
| Current Flow Rate | `2.4` | `L/min` | campus aggregate |
| Active Leaks | `1` | — | severity pill |
| Monthly Cost | `₱48,200` | — | vs last month delta |

**Row 2 — Water flow schematic (8 col) + Leak alert panel (4 col)**

Left: a simplified **water flow tree diagram** (SVG, animated):
- Main supply line enters from the left
- Branches into zones (academic, residential, sports, dining, utility)
- Each branch shows current flow rate (Geist Mono) and a proportional line thickness
- Animated flow: same dash-flow technique as the power flow diagram (PATCH 1), but in `--color-grid` (blue tones) instead of cyan
- If a leak is detected on a branch, the branch pulses `--color-danger` and a `⚠ LEAK` label appears

Right: **Leak detection panel**
- List of active + recent leaks
- Each leak card:
  - Location: building + room/zone
  - Detected: timestamp
  - Flow anomaly: `+340% above baseline`
  - Duration: `14m`
  - Status pill: `ACTIVE` (red pulse) / `INVESTIGATING` (amber) / `RESOLVED` (green)
  - Action button: `SHUT VALVE →` (triggers the automated water shutoff — mock only)
- If no active leaks: empty state — `No leaks detected. All valves nominal.` in Instrument Serif italic + last-scan timestamp in mono

**Row 3 — Building water consumption table (12 col)**

| Building | Today (L) | 7-Day Avg (L) | Delta | Peak Hour | Flow Status |
|---|---|---|---|---|---|
| 064 · University Gym | 18,400 | 16,200 | ▲ +13.6% | 07:00–08:00 | ● NORMAL |
| 069 · Swimming Pool | 42,100 | 41,800 | — +0.7% | CONTINUOUS | ● NORMAL |
| 009 · Dining Hall | 12,600 | 11,900 | ▲ +5.9% | 11:00–12:00 | ● NORMAL |
| 070 · Henry Luce III Library | 3,200 | 1,100 | ▲ +190% | 02:00–03:00 | ⚠ ANOMALY |

The `⚠ ANOMALY` row gets a subtle `--color-warn` left-border accent. Click → navigates to building detail.

**Row 4 — 7-day consumption chart (12 col)**

Bar chart (7 bars, one per day), each bar split into zones by color:
- Academic = `--color-signal`
- Residential = `--color-grid`
- Sports = `--color-ok`
- Dining = `--color-solar`
- Other = `--color-fg-subtle`

Hover a bar → tooltip breaks down per-zone.

### 4.3 Water layer for CampusMap

Support `layer="water"` in both PLAN and SPATIAL modes:

- Buildings with water sensors show a small water drop icon at their centroid
- Drop icon size scales with consumption (larger = more water use)
- Color: `--color-grid` (normal), `--color-warn` (above average), `--color-danger` (anomaly/leak)
- In SPATIAL mode: a subtle "drip" particle effect (one drop falls every 2s) above buildings with anomalies

### 4.4 Water valve integration in `/controls`

In the room device list (PATCH 2, §2.1 Level 2), the water valve toggle already exists. Add:
- A `FLOW` reading next to the valve toggle: `2.4 L/min` in Geist Mono
- If flow is anomalous (>200% of baseline while room is unoccupied), the valve row gets a `--color-warn` background and a `POSSIBLE LEAK` badge
- The `SHUT VALVE` action from the `/water` leak panel should also be accessible here

### 4.5 Mock data

In `lib/mock/telemetry.ts`:
```ts
export type WaterReading = {
  buildingId: number;
  zone: string;                // "main" | "restroom" | "kitchen" | "irrigation" | "pool"
  flowRateLpm: number;         // liters per minute
  dailyConsumptionL: number;
  baselineDailyL: number;
  leakDetected: boolean;
  leakSeverity?: "minor" | "major" | "critical";
  valveState: "open" | "closed" | "throttled";
};
```

The live tick should:
- Nudge flow rates by ±5% per tick
- Roll a 0.3% chance per building per tick to trigger a "leak" event (flow spikes to 3–5× baseline)
- Auto-resolve leaks after 5–15 minutes unless manually shut off

### 4.6 Additions to `/building/[id]`

In the room detail (§6.4), add a **Water sub-section** if the room has water infrastructure:
- Current flow rate (L/min) with a mini sparkline
- Today's consumption vs baseline bar
- Valve state indicator + manual control toggle
- If leak detected: prominent `--color-danger` banner with `SHUT VALVE` action

---

## PATCH 5 — Updated IA and sidebar order

**Overrides:** CLAUDE.md §5

The full route list, incorporating the two new routes:

```
/                          → Landing / intro sequence (GSAP)
/overview                  → Main dashboard: campus map + top-level KPIs + alert feed
/map                       → Full-screen interactive campus map (PLAN / SPATIAL)
/building/[id]             → Drill-in for one building → floors → rooms → devices
/power                     → Hybrid power (Solar + Grid + Battery flow diagram)
/environment               → Temperature, humidity, comfort index, HVAC efficiency
/water                     → Water flow monitoring, leak detection, consumption
/controls                  → Equipment control console (building cards → drill-in)
/activity                  → CV personnel detection grid (mock CCTV tiles)
/safety                    → Seismic + hazard operations
/ai                        → AI recommendations inbox
/maintenance               → Scheduled maintenance + request composer
/security                  → RBAC, users, RFID access logs
/settings                  → Theme toggle, seed reset
```

Sidebar groups (separated by a 1px divider + 16px gap):

```
── OBSERVE ──
  Overview
  Map
  
── MONITOR ──
  Power
  Environment
  Water
  Activity

── CONTROL ──
  Controls
  Safety

── OPTIMIZE ──
  AI Insights
  Maintenance

── SYSTEM ──
  Security
  Settings
```

The group labels are 9px Geist Mono caps, `--color-fg-subtle`, `tracking-[0.22em]`. They serve the "observation" brand metaphor: OBSERVE → MONITOR → CONTROL → OPTIMIZE is the system's cognitive hierarchy.

---

## PATCH 6 — Updated Phase 2 scope

With the new routes added, Phase 3 needs adjustment:

### Phase 3 (revised) — Drill-in + Power + Environment + Water

- `/building/[id]` split view with floors → rooms → devices
- `/power` with the animated energy flow diagram, battery fill gauge, solar panel status
- `/environment` with campus heatmap, anomaly feed, building table, comfort chart
- `/water` with flow schematic, leak panel, consumption chart

**Demo-able:** the complete monitoring story — power, air, water — plus the drill-down narrative.

### Phase 4 (revised) — Controls + Activity + Safety

- `/controls` restructured with building card grid → floor drill-in → device toggles
- `/activity` CCTV grid with animated scenes
- `/safety` seismograph + `RUN DRILL` cinematic

*(No change to Phase 5 or 6.)*

---

## PATCH 7 — Updated demo script beats

Insert these beats into the §17 demo script at the appropriate moments:

**After the power section (~1:45):**

> "Water systems — one active leak detected in the library's third floor. Flow is 340% above baseline."

*(Click `SHUT VALVE →` on the leak card. The valve status animates to `CLOSED`. Flow line in the schematic dims.)*

> "Remote shutoff. Maintenance has been notified."

**After the water beat (~2:00), before safety:**

> "Environmental monitoring. The gym is running 4 degrees above setpoint — the system has already flagged it and recommended an HVAC recalibration."

*(Hover over building 64 on the environment heatmap — it glows warm.)*

---

## PATCH 8 — `/logs` Unified sensor monitoring & event log

**Adds to:** CLAUDE.md §5 (IA), §6 (screen specs)

**Problem:** Raw sensor data is scattered across multiple pages — humidity/temp in `/environment`, RFID in `/security`, human detection in `/activity`, water flow in `/water`. There's no single place an admin can go to see *all* sensor activity as a chronological feed. For debugging, auditing, and demo credibility, a unified log view is essential.

### 8.1 New route: `/logs`

Add to the IA between `/security` and `/settings`:

```
/logs                     → Unified real-time sensor event log + historical query
```

Sidebar icon: `ScrollText` (Lucide). Label: `LOGS`. Placed in the `SYSTEM` group alongside Security and Settings.

### 8.2 `/logs` page spec

Section header: `╌╌ 01 — SENSOR LOGS`

**Top bar — filter controls (always visible, sticky)**

A horizontal filter bar with:
- **Source filter** (multi-select pills): `ALL` · `TEMPERATURE` · `HUMIDITY` · `OCCUPANCY` · `POWER` · `WATER` · `RFID` · `GAS` · `SEISMIC`
- **Building filter**: dropdown or search, defaults to `ALL BUILDINGS`
- **Severity filter**: `ALL` · `INFO` · `WARNING` · `CRITICAL`
- **Time range**: segmented control `LIVE` · `1H` · `6H` · `24H` · `7D`
- **Search**: free-text filter across log messages (Geist Mono input, magnifying glass icon)

When `LIVE` is selected, the log auto-scrolls and new entries slide in from the top with a 120ms fade.

**Main content — the log feed (12 col)**

A virtualized list (use `@tanstack/react-virtual` or similar) of log entries. Each entry is a single row:

```
┌─ severity bar (3px, colored) ──────────────────────────────────────────────────────┐
│ 21:04:11.342  │  🌡 TEMP  │  BLDG 070 · 3F-204  │  28.5°C → 31.2°C (+2.7°)  │ ▲ │
└────────────────────────────────────────────────────────────────────────────────────┘
```

Row anatomy (left to right):
- **Severity bar**: 3px left border — `--color-fg-subtle` (info), `--color-warn` (warning), `--color-danger` (critical)
- **Timestamp**: Geist Mono, 11px, `--color-fg-muted` — `HH:MM:SS.mmm` format, always PHT
- **Source badge**: icon + short label in a pill (`TEMP`, `HUMID`, `RFID`, `POWER`, `WATER`, `GAS`, `OCCUPANCY`, `SEISMIC`), colored by source type
- **Location**: building number + room code, Geist Mono, 11px
- **Event description**: the human-readable event, Geist, 13px
- **Severity icon**: `ℹ` / `▲` / `⚠` on the far right

Log entry examples by source type:

| Source | Example entry |
|---|---|
| TEMP | `BLDG 070 · 3F-204 · 28.5°C → 31.2°C (+2.7°) · ABOVE SETPOINT` |
| HUMID | `BLDG 064 · 1F-GYM · HUMIDITY 89% · MOLD RISK THRESHOLD` |
| OCCUPANCY | `BLDG 070 · 3F-204 · OCCUPANCY 0 → 3 · CV DETECTION` |
| OCCUPANCY | `BLDG 070 · 3F-204 · OCCUPANCY 3 → 0 · ROOM VACANT` |
| POWER | `BLDG 029 · TOTAL LOAD 42.7 kW · EXCEEDED BASELINE 1.8×` |
| WATER | `BLDG 070 · 3F-RESTROOM · FLOW ANOMALY +340% · POSSIBLE LEAK` |
| RFID | `BLDG 070 · MAIN ENTRANCE · RFID:4A:2B:8C · MARTINEZ, J. · ACCESS GRANTED` |
| RFID | `BLDG 091 · SERVER ROOM · RFID:7F:3D:1A · UNKNOWN · ACCESS DENIED` |
| GAS | `BLDG 034 · CHEM LAB · CO LEVEL 28 PPM · ELEVATED` |
| SEISMIC | `CAMPUS-WIDE · VIBRATION EVENT · 2.1 MAGNITUDE · MONITORING` |

**Right sidebar (collapsible, 3 col when open) — log statistics**

- **Event rate**: a mini real-time line chart showing events/minute over the last hour
- **Source breakdown**: a small horizontal stacked bar showing proportion by source type
- **Top active buildings**: ranked list of top 5 buildings by event count in selected window
- **Alert summary**: count of CRITICAL / WARNING / INFO in selected window

**Bottom console integration:** the existing bottom console ticker (CLAUDE.md §5) should be fed by the same event stream as `/logs`. The ticker shows the last 1 event; `/logs` shows everything.

### 8.3 Mock data

In `lib/mock/`:

```ts
// logs.ts
export type SensorLog = {
  id: string;                  // uuid
  timestamp: Date;
  source: "temp" | "humidity" | "occupancy" | "power" | "water" | "rfid" | "gas" | "seismic";
  severity: "info" | "warning" | "critical";
  buildingId: number;
  roomId?: string;
  message: string;             // human-readable
  value?: number;              // the numeric reading, if applicable
  previousValue?: number;      // for delta display
  unit?: string;               // "°C", "%", "kW", "L/min", "PPM"
  metadata?: Record<string, unknown>; // source-specific extras (RFID card id, person name, etc.)
};
```

The live tick should emit 2–5 log entries per second across all source types (weighted: temp/humidity most frequent, seismic least). Store a rolling buffer of the last 2,000 entries in the Zustand store.

### 8.4 RFID migration note

RFID logs currently live in `/security` (CLAUDE.md §6.11). With this patch:
- `/security` **keeps** the RFID section but as a summary view: "last 10 access events" + the access matrix
- `/logs` becomes the **full historical RFID feed** alongside all other sensor data
- Clicking "View full log →" in `/security`'s RFID section navigates to `/logs` with the `RFID` source filter pre-selected

### 8.5 Components

```
components/logs/
  LogFeed.tsx              // virtualized log list
  LogEntry.tsx             // single log row
  LogFilters.tsx           // sticky filter bar
  LogStats.tsx             // right sidebar statistics
  SourceBadge.tsx          // colored pill per source type
```

---

## PATCH 9 — Gas leak / air quality hazard detection added to `/safety`

**Extends:** CLAUDE.md §6.8 (`/safety`), CLAUDE-UPDATES.md PATCH 3 (`/environment`)

**Problem:** the safety page covers seismic events and electrical cutoffs, but ignores gas leaks — a real hazard for a university campus with science labs, kitchens, and utility areas. Gas detection is also part of the "air monitoring" system referenced in the original requirements doc.

### 9.1 Additions to `/safety` page

Below the existing seismic section, add a new section:

Section header: `╌╌ 02 — GAS & AIR HAZARD DETECTION`

**Gas monitoring panel (8 col)**

A grid of **zone cards** for areas with gas sensors (not every building — only labs, kitchens, power plant, dining halls). Each card:

- Zone name + building: `CHEM LAB · BLDG 042` (Geist Mono caps)
- **Gas type monitored**: CO (carbon monoxide), CO₂, LPG/methane, or a general "combustible gas" sensor — shown as a small label pill
- **Current reading**: big Instrument Serif italic number + Geist Mono unit (`PPM`)
- **Status gauge**: a horizontal bar from green → amber → red with a marker at the current reading
  - CO: 0–9 PPM = NORMAL, 10–35 = ELEVATED, >35 = DANGER
  - CO₂: 400–1000 = NORMAL, 1000–2000 = ELEVATED, >2000 = DANGER
  - LPG: 0–1000 = NORMAL, 1000–4000 = ELEVATED, >4000 = DANGER (explosion risk)
- **Trend**: 1h sparkline showing recent drift
- If ELEVATED: card gets `--color-warn` left border
- If DANGER: card pulses with `--color-danger` background at 8% opacity, animated

**Alert protocol (4 col)**

A status panel showing what happens at each threshold:

```
NORMAL    → Routine monitoring. No action.
ELEVATED  → Alert dispatched to maintenance.
            Ventilation systems increased to HIGH.
            Entry advisory posted.
DANGER    → AUTOMATIC VENTILATION OVERRIDE
            ROOM EVACUATION ALERT
            Gas supply shutoff triggered.
            Fire safety notified.
```

Each level is a row with the threshold color on the left and the protocol description on the right. The currently active level for the worst-case zone is highlighted.

### 9.2 Gas drill (extends the seismic drill)

The existing `RUN SEISMIC DRILL` button stays. Add a second button beside it:

`RUN GAS LEAK DRILL`

Pressing it:
1. A single zone card flashes `DANGER` (400ms).
2. The safety page shows a takeover banner: `⚠ GAS HAZARD DETECTED — CHEM LAB · BLDG 042 — VENTILATION OVERRIDE IN 03…02…01`
3. The console ticker at the bottom streams: `[21:04:11] BLDG 042 VENTILATION → HIGH · [21:04:12] BLDG 042 GAS SUPPLY SHUTOFF · [21:04:13] BLDG 042 EVACUATION ALERT SENT`
4. After 4 seconds, a recovery screen shows with a status checklist:
   - `☑ Ventilation override activated`
   - `☑ Gas supply valve closed`
   - `☑ Evacuation alert dispatched`
   - `☐ Manual all-clear (requires admin)`

**The gas drill is a 30-second demo moment** — shorter and less dramatic than the seismic drill but demonstrates a different hazard response path.

### 9.3 Mock data

In `lib/mock/telemetry.ts`:

```ts
export type GasReading = {
  buildingId: number;
  zone: string;              // "chem_lab" | "kitchen" | "power_plant" | "dining"
  gasType: "co" | "co2" | "lpg" | "combustible";
  ppm: number;
  status: "normal" | "elevated" | "danger";
  ventilationState: "normal" | "high" | "override";
  gasSupplyValve: "open" | "closed";
};
```

Only ~8–12 zones across the campus have gas sensors (science buildings, dining hall, power plant, kitchens). The live tick nudges PPM by ±2% with a 0.2% chance of an "elevated" spike that decays back to normal over 2 minutes.

### 9.4 Integration with `/environment`

The `/environment` page (PATCH 3) should include a small **Air Quality** sub-card in Row 1's KPI strip. Add a 5th card:

| Card | Value | Unit | Context |
|---|---|---|---|
| Air Quality | `GOOD` | — | worst-zone gas reading as pill: `GOOD` (green) / `MODERATE` (amber) / `HAZARD` (red) |

Clicking this card navigates to `/safety#gas`.

### 9.5 Integration with `/logs`

Gas readings emit to the unified log (PATCH 8) under source type `gas`. Critical gas events are `severity: "critical"`.

---

## PATCH 10 — Updated IA and sidebar (supersedes PATCH 5)

The full route list with all additions:

```
/                          → Landing / intro sequence (GSAP)
/overview                  → Main dashboard: campus map + top-level KPIs + alert feed
/map                       → Full-screen interactive campus map (PLAN / SPATIAL)
/building/[id]             → Drill-in for one building → floors → rooms → devices
/power                     → Hybrid power (Solar + Grid + Battery flow diagram)
/environment               → Temperature, humidity, comfort index, air quality, HVAC efficiency
/water                     → Water flow monitoring, leak detection, consumption
/controls                  → Equipment control console (building cards → floor drill-in)
/activity                  → CV personnel detection grid (mock CCTV tiles)
/safety                    → Seismic + gas hazard + emergency operations
/ai                        → AI recommendations inbox
/maintenance               → Scheduled maintenance + request composer
/logs                      → Unified real-time sensor event log + historical query
/security                  → RBAC, users, RFID summary
/settings                  → Theme toggle, seed reset
```

Sidebar groups:

```
── OBSERVE ──
  Overview
  Map

── MONITOR ──
  Power
  Environment
  Water
  Activity

── CONTROL ──
  Controls
  Safety

── OPTIMIZE ──
  AI Insights
  Maintenance

── SYSTEM ──
  Logs
  Security
  Settings
```

**14 items total.** Test sidebar at 768px viewport height — it must scroll gracefully with `ScrollArea`.

---

## PATCH 11 — Overlap resolution notes

These items from the second round of feedback are **already fully covered** by existing patches. No additional work needed:

| Feedback item | Already handled by |
|---|---|
| "Enhance Hybrid Power Tab animation" | PATCH 1 — energy flow diagram + battery fill + solar animation |
| "Water is good" | PATCH 4 — `/water` route already spec'd |
| "Controls isolation per building → cards → floor expand" | PATCH 2 — three-level drill-down |
| "Map building recalibration" | CLAUDE.md §8.4 — `/dev/layout-editor` already spec'd as optional |
| "General refinement" | Phase 6 (polish) in CLAUDE.md already covers micro-interactions, sound, a11y, performance |

---

## Implementation notes

- **Don't duplicate the energy flow animation logic.** The animated dash-flow SVG pattern (dashes + traveling particle) is used in BOTH `/power` (energy flow) and `/water` (water flow). Extract to a shared `components/primitives/AnimatedFlowLine.tsx` with props for `color`, `speed`, `direction`, and `active`.
- **The CampusMap `layer` prop now has 6 modes:** `heatmap | occupancy | water | environment | flags-only | clean`. Update the `MapLegend` toggle group and both renderers.
- **Sidebar has 14 items.** The group labels + dividers (PATCH 10) are critical to managing this. Test at 768px viewport height — if items overflow, the sidebar must scroll with `ScrollArea`.
- **The unified log feed (PATCH 8) and the bottom console ticker share the same event stream.** Don't build two separate generators. The Zustand store (`useLogStore`) is the single source — the ticker subscribes to it and shows the latest entry, the `/logs` page subscribes and shows the full buffer.
- **Gas sensor zones are sparse.** Only ~8–12 zones across the campus. Don't generate gas data for all 101 buildings — that would be unrealistic. Limit to: High School Science Building (42), Engineering Building (51), Dining Hall (9), Power Plant (65), MT Stall Canteen (18), Packaging Engineering Laboratory (34), Research Development Facility (44), and Elementary Canteen (87).
