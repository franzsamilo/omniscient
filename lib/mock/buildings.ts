/**
 * 101 buildings of the campus.
 *
 * IMPORTANT — Phase 1 placeholder data:
 *   The four named buildings ("Dr. Rex D. Drilon Hall", etc.) come from
 *   CLAUDE.md verbatim. The remaining 97 entries are PROVISIONAL placeholders
 *   that must be replaced with the real names from the legend image
 *   (CLAUDE.md §14, §18: "All 101 buildings have real legend names").
 *
 *   Polygon mapping is also provisional — we map provisional_id → id 1:1
 *   for now. The /dev/layout-editor (Phase 2) is what produces the correct
 *   provisional_id ↔ legend_id mapping in `data/campus-layout.json#byId`.
 *
 *   Buildings whose polygon is `[]` deliberately do not render on the map
 *   until their geometry is authored. (CLAUDE.md §7, §8.4)
 */

import layout from "@/data/campus-layout.json";
import { streamRng, pick, range } from "@/lib/mock/seed";

export type BuildingCategory =
  | "academic"
  | "admin"
  | "residential"
  | "sports"
  | "utility"
  | "worship"
  | "dining"
  | "garden"
  | "parking"
  | "other";

export type Building = {
  id: number;
  name: string;
  category: BuildingCategory;
  baselineKw: number;
  polygon: [number, number][];
};

type LayoutBuilding = {
  points: number[][];
  provisional_id: number;
  area: number;
  vertex_count: number;
};

const LAYOUT_BUILDINGS = (layout.buildings ?? []) as unknown as LayoutBuilding[];

function toPolygon(points: number[][]): [number, number][] {
  return points
    .filter((p) => p.length >= 2)
    .map((p) => [p[0], p[1]] as [number, number]);
}

/* ---- name table -------------------------------------------------------- */

/** Verbatim names from CLAUDE.md. */
const KNOWN_NAMES: Record<number, string> = {
  1: "Dr. Rex D. Drilon Hall",
  2: "Dr. Rex D. Drilon Annex Building",
  64: "University Gym",
  77: "Henry Luce Library",
};

/** Plausible Filipino-university building names. PROVISIONAL pending legend. */
const PROVISIONAL_PATTERNS: Array<{ category: BuildingCategory; names: string[] }> = [
  {
    category: "academic",
    names: [
      "College of Engineering",
      "College of Arts & Sciences",
      "College of Business",
      "College of Education",
      "College of Computer Studies",
      "College of Nursing",
      "Graduate School",
      "Senior High School Building",
      "Junior High School Building",
      "Elementary Pavilion",
      "Mathematics Building",
      "Physics Laboratory",
      "Chemistry Laboratory",
      "Biology Laboratory",
      "Language Center",
      "Lecture Hall A",
      "Lecture Hall B",
      "Lecture Hall C",
      "Research Annex",
      "Faculty Building",
      "ROTC Center",
      "Music Conservatory",
      "Fine Arts Pavilion",
      "Architecture Studio",
      "Communication Studies Building",
    ],
  },
  {
    category: "admin",
    names: [
      "Administration Building",
      "Registrar's Office",
      "Cashier's Annex",
      "President's Office",
      "Office of Student Affairs",
      "Alumni Center",
      "Guidance & Counseling Center",
      "Human Resources Building",
    ],
  },
  {
    category: "residential",
    names: [
      "Men's Dormitory",
      "Women's Dormitory",
      "International House",
      "Faculty Housing A",
      "Faculty Housing B",
      "Graduate Residence Hall",
    ],
  },
  {
    category: "sports",
    names: [
      "Aquatic Center",
      "Tennis Pavilion",
      "Basketball Court Cover",
      "Track Field House",
      "Volleyball Court",
      "Football Field House",
    ],
  },
  {
    category: "utility",
    names: [
      "Power Substation",
      "Water Treatment Facility",
      "Generator Building",
      "Maintenance Yard",
      "Solar Battery Vault",
      "Telecom Hub",
      "Pump House",
      "Waste Management Facility",
    ],
  },
  {
    category: "worship",
    names: ["University Chapel", "Multi-Faith Prayer Room", "Adoration Chapel"],
  },
  {
    category: "dining",
    names: [
      "Main Cafeteria",
      "Faculty Lounge",
      "Food Court Pavilion",
      "Student Lounge",
    ],
  },
  {
    category: "garden",
    names: ["Botanical Garden", "Memorial Garden", "Reflection Garden"],
  },
  {
    category: "parking",
    names: ["Visitor Parking Hub", "Faculty Parking", "Student Motorcycle Lot"],
  },
  {
    category: "other",
    names: [
      "Visitor Welcome Pavilion",
      "Heritage Marker",
      "Outdoor Amphitheater",
      "Bell Tower",
    ],
  },
];

/** Roughly-faithful baseline kW per category. */
const BASELINE_BY_CATEGORY: Record<BuildingCategory, [number, number]> = {
  academic: [22, 65],
  admin: [12, 28],
  residential: [18, 40],
  sports: [10, 32],
  utility: [40, 95],
  worship: [4, 10],
  dining: [22, 48],
  garden: [1, 4],
  parking: [3, 9],
  other: [2, 14],
};

/** Build the 101 entries deterministically. */
function buildBuildings(): Building[] {
  const rng = streamRng("buildings");

  // Flatten the pattern table into a (name, category) pool we can deal out.
  const pool: Array<{ name: string; category: BuildingCategory }> = [];
  for (const group of PROVISIONAL_PATTERNS) {
    for (const name of group.names) {
      pool.push({ name, category: group.category });
    }
  }

  // Shuffle pool deterministically.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const polygonByProvisional = new Map<number, [number, number][]>();
  for (const b of LAYOUT_BUILDINGS) {
    polygonByProvisional.set(b.provisional_id, toPolygon(b.points));
  }

  const out: Building[] = [];
  for (let id = 1; id <= 101; id++) {
    const known = KNOWN_NAMES[id];
    let name: string;
    let category: BuildingCategory;

    if (known) {
      name = known;
      category =
        id === 64 ? "sports" : id === 77 ? "academic" : id <= 2 ? "academic" : "other";
    } else {
      // Round-robin from the shuffled pool, with numeric suffixes if we run out.
      const slot = pool[(id - 1) % pool.length];
      const cycle = Math.floor((id - 1) / pool.length);
      name = cycle === 0 ? slot.name : `${slot.name} ${String.fromCharCode(64 + cycle)}`;
      category = slot.category;
    }

    const [lo, hi] = BASELINE_BY_CATEGORY[category];
    const baselineKw = Math.round(range(rng, lo, hi) * 10) / 10;

    out.push({
      id,
      name,
      category,
      baselineKw,
      polygon: polygonByProvisional.get(id) ?? [],
    });
  }

  return out;
}

export const BUILDINGS: Building[] = buildBuildings();

export function getBuilding(id: number): Building | undefined {
  return BUILDINGS.find((b) => b.id === id);
}

/** True when the building has authored geometry and can render on the map. */
export function isMapped(b: Building): boolean {
  return b.polygon.length >= 3;
}

/** All buildings that have a polygon. */
export const MAPPED_BUILDINGS: Building[] = BUILDINGS.filter(isMapped);
