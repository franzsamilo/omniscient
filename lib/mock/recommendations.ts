/**
 * 12 hand-authored AI recommendations (CLAUDE.md §6.9, §7).
 *
 * Each one references a real building from BUILDINGS so the demo "feels"
 * earned — not a Lorem ipsum dump.
 */

import { BUILDINGS } from "@/lib/mock/buildings";

export type Pivot = "TIME" | "SAFETY" | "FACILITY";
export type Effort = "low" | "medium" | "high";

export type Recommendation = {
  id: string;
  title: string;
  rationale: string;
  buildingIds: number[];
  /** Projected savings, ₱ per month. */
  savingsPerMonth: number;
  effort: Effort;
  pivots: Pivot[];
  /** Mini-chart: 24 baseline-vs-recommended kW samples for the drawer. */
  miniSeries: { baseline: number; proposed: number }[];
  /** Confidence 0..1. */
  confidence: number;
  generatedAt: number;
};

function bId(name: string): number | null {
  return BUILDINGS.find((b) => b.name === name)?.id ?? null;
}

const NOW = Date.now();

function series(base: number, save: number): { baseline: number; proposed: number }[] {
  return Array.from({ length: 24 }, (_, i) => {
    const h = i;
    const peak = Math.exp(-Math.pow((h - 13) / 4, 2));
    const baseline = base * (0.4 + peak * 0.6) * (0.95 + Math.random() * 0.1);
    const proposed = baseline * (1 - save) + 1.5;
    return { baseline: round1(baseline), proposed: round1(proposed) };
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pickIds(...names: string[]): number[] {
  const ids = names.map(bId).filter((x): x is number => x !== null);
  return ids.length ? ids : [1];
}

export const RECOMMENDATIONS: Recommendation[] = [
  {
    id: "R-001",
    title: "Re-time Henry Luce HVAC to occupancy",
    rationale:
      "Library cooling runs at 23°C from 06:00–22:00 daily, but CV occupancy data shows the building is below 12% utilization before 09:00 and after 19:00. Setpoint adjustment to 26°C in those windows preserves comfort during peak study hours while cutting predicted draw by ~31% off-peak.",
    buildingIds: pickIds("Henry Luce Library"),
    savingsPerMonth: 78_400,
    effort: "low",
    pivots: ["TIME", "FACILITY"],
    miniSeries: series(45, 0.31),
    confidence: 0.88,
    generatedAt: NOW - 4 * 60 * 60_000,
  },
  {
    id: "R-002",
    title: "Replace U-Gym roof MAUs with VRF",
    rationale:
      "The University Gym makeup-air units cycle every 7 minutes during open hours, drawing peak 22 kW per unit. A 4-zone variable-refrigerant-flow retrofit modulates instead of cycling, projected 38% reduction with full payback in 18 months.",
    buildingIds: pickIds("University Gym"),
    savingsPerMonth: 124_000,
    effort: "high",
    pivots: ["FACILITY"],
    miniSeries: series(60, 0.38),
    confidence: 0.74,
    generatedAt: NOW - 1 * 60 * 60_000,
  },
  {
    id: "R-003",
    title: "Solar diversion to Drilon Hall battery vault",
    rationale:
      "Drilon Hall pulls 100% from grid 18:00–22:00. Excess solar 11:00–14:00 currently spills to the inverter dump load. Routing 220 kWh/day to the building's existing 280 kWh vault would offset ~74% of the evening peak, no new hardware required.",
    buildingIds: pickIds("Dr. Rex D. Drilon Hall"),
    savingsPerMonth: 96_700,
    effort: "low",
    pivots: ["TIME"],
    miniSeries: series(38, 0.42),
    confidence: 0.92,
    generatedAt: NOW - 30 * 60_000,
  },
  {
    id: "R-004",
    title: "Stagger College of Engineering lab bench startup",
    rationale:
      "All 14 lab benches in the College of Engineering power up simultaneously at 07:30, creating a 180 kW spike and tariff surcharge. A 4-minute staggered cold-start (controlled via the existing master breaker) flattens the spike below the demand-charge threshold.",
    buildingIds: pickIds("College of Engineering"),
    savingsPerMonth: 42_300,
    effort: "low",
    pivots: ["TIME", "FACILITY"],
    miniSeries: series(28, 0.18),
    confidence: 0.81,
    generatedAt: NOW - 6 * 60 * 60_000,
  },
  {
    id: "R-005",
    title: "Insulate Power Substation heat-loss panels",
    rationale:
      "Thermal imaging of the substation between 14:00–16:00 shows 11°C delta on the south wall. Inadequate insulation is forcing the cooling system 18% above its design point. Installing R-19 batt insulation on the affected panels recovers efficiency.",
    buildingIds: pickIds("Power Substation"),
    savingsPerMonth: 18_900,
    effort: "medium",
    pivots: ["FACILITY"],
    miniSeries: series(72, 0.18),
    confidence: 0.69,
    generatedAt: NOW - 12 * 60 * 60_000,
  },
  {
    id: "R-006",
    title: "Move 23:00 cleaning shift water draw to 04:00",
    rationale:
      "Domestic water heating for the cleaning shift overlaps with the late-night residential peak. Shifting the heater preheat cycle by 5 hours uses off-peak tariff and reduces the campus demand-charge bracket.",
    buildingIds: pickIds("Men's Dormitory", "Women's Dormitory"),
    savingsPerMonth: 31_200,
    effort: "low",
    pivots: ["TIME"],
    miniSeries: series(22, 0.22),
    confidence: 0.79,
    generatedAt: NOW - 2 * 60 * 60_000,
  },
  {
    id: "R-007",
    title: "Disable corridor lighting on the Architecture loop",
    rationale:
      "Hallway lighting in the Architecture Studio runs 24/7. Foot traffic data shows zero detections between 21:00 and 06:00 in three of four corridors. Recommend motion-activated mode in those windows; current lighting wastes ~140 kWh/day.",
    buildingIds: pickIds("Architecture Studio"),
    savingsPerMonth: 14_600,
    effort: "low",
    pivots: ["FACILITY"],
    miniSeries: series(8, 0.62),
    confidence: 0.84,
    generatedAt: NOW - 80 * 60_000,
  },
  {
    id: "R-008",
    title: "Schedule generator load test outside peak tariff",
    rationale:
      "Monthly generator load test currently runs Mondays 11:00–12:00 — squarely inside peak tariff (₱14.60/kWh). Shifting to Saturdays 06:00–07:00 (₱9.40/kWh) saves ~36% on the test alone with no operational impact.",
    buildingIds: pickIds("Generator Building"),
    savingsPerMonth: 9_800,
    effort: "low",
    pivots: ["TIME", "SAFETY"],
    miniSeries: series(42, 0.36),
    confidence: 0.95,
    generatedAt: NOW - 150 * 60_000,
  },
  {
    id: "R-009",
    title: "Audit aquatic-center pool pump variable-speed setpoint",
    rationale:
      "Pool circulation runs at fixed 70% pump speed regardless of occupancy. Reducing to 45% during off-hours (22:00–05:00) maintains chemistry within tolerance but halves the pump's energy.",
    buildingIds: pickIds("Aquatic Center"),
    savingsPerMonth: 23_500,
    effort: "low",
    pivots: ["FACILITY"],
    miniSeries: series(18, 0.45),
    confidence: 0.86,
    generatedAt: NOW - 3 * 60 * 60_000,
  },
  {
    id: "R-010",
    title: "Replace dormitory bulbs (1F-104 anomaly cluster)",
    rationale:
      "Three rooms in the Men's Dormitory (1F-104, 1F-106, 1F-108) draw 38% above similar rooms despite identical fixtures. Inspection log indicates 2017-vintage CFLs still in service. LED replacement payback ~5 weeks.",
    buildingIds: pickIds("Men's Dormitory"),
    savingsPerMonth: 7_200,
    effort: "low",
    pivots: ["FACILITY"],
    miniSeries: series(6, 0.4),
    confidence: 0.91,
    generatedAt: NOW - 10 * 60 * 60_000,
  },
  {
    id: "R-011",
    title: "Open chapel windows during predicted breeze hours",
    rationale:
      "Forecast wind data and the Chapel's cross-ventilation geometry suggest passive cooling could replace AC for 60% of mornings April–June. A simple operator alert (or motorized louvre upgrade) saves the bulk of the AC bill in those hours.",
    buildingIds: pickIds("University Chapel"),
    savingsPerMonth: 6_400,
    effort: "medium",
    pivots: ["FACILITY"],
    miniSeries: series(5, 0.5),
    confidence: 0.62,
    generatedAt: NOW - 18 * 60 * 60_000,
  },
  {
    id: "R-012",
    title: "Pre-cool Drilon Annex before peak window",
    rationale:
      "Drilon Annex consistently cools to setpoint 23°C between 09:00–10:00 — exactly when tariff jumps to peak. Pre-cooling to 22°C between 06:00–08:00 (off-peak) and letting building drift to 24°C until 14:00 saves ~28% with negligible comfort impact.",
    buildingIds: pickIds("Dr. Rex D. Drilon Annex Building"),
    savingsPerMonth: 38_700,
    effort: "low",
    pivots: ["TIME"],
    miniSeries: series(20, 0.28),
    confidence: 0.83,
    generatedAt: NOW - 5 * 60 * 60_000,
  },
];

export const TOTAL_PROJECTED_SAVINGS = RECOMMENDATIONS.reduce(
  (s, r) => s + r.savingsPerMonth,
  0,
);
