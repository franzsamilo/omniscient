"use client";

import layout from "@/data/campus-layout.json";

type Props = { width: number; height: number };

type Street = { name: string; side: string; kind?: string };

/**
 * Streets only carry a `side` hint in the source JSON (CLAUDE.md §8.1 — points
 * are TODO until the layout-editor authors them). We render them as stylized
 * perimeter ribbons along the corresponding edge, with the name following the
 * path via <textPath>. Dungon Creek gets a "water" stroke + animated dash flow.
 */
export function StreetsLayer({ width, height }: Props) {
  const streets = (layout.streets ?? []) as unknown as Street[];

  // Inset perimeter rect so streets sit in the safe area.
  const inset = Math.min(width, height) * 0.012;
  const x0 = inset;
  const x1 = width - inset;
  const y0 = inset;
  const y1 = height - inset;

  const sideToPath = (side: string): string => {
    switch (side) {
      case "north":
      case "north-east":
        return `M ${x0} ${y0} L ${x1} ${y0}`;
      case "south":
      case "south-west":
        return `M ${x0} ${y1} L ${x1} ${y1}`;
      case "west":
        return `M ${x0} ${y0} L ${x0} ${y1}`;
      case "east":
        return `M ${x1} ${y0} L ${x1} ${y1}`;
      default:
        return `M ${x0} ${y0} L ${x1} ${y0}`;
    }
  };

  return (
    <g className="omni-streets-layer" pointerEvents="none">
      <defs>
        {streets.map((s, i) => (
          <path key={`p-${i}`} id={`street-path-${i}`} d={sideToPath(s.side)} />
        ))}
      </defs>

      {streets.map((s, i) => {
        const isWater = s.kind === "water";
        return (
          <g key={i}>
            {/* casing */}
            <use
              href={`#street-path-${i}`}
              stroke="var(--color-border)"
              strokeWidth={isWater ? 6 : 11}
              strokeLinecap="round"
              fill="none"
            />
            {/* core */}
            <use
              href={`#street-path-${i}`}
              stroke={isWater ? "var(--color-grid)" : "var(--color-surface-2)"}
              strokeWidth={isWater ? 4 : 9}
              strokeLinecap="round"
              strokeOpacity={isWater ? 0.65 : 1}
              strokeDasharray={isWater ? "10 6" : undefined}
              fill="none"
              className={isWater ? "omni-water-flow" : undefined}
            />
            {/* label */}
            <text
              fill="var(--color-fg-subtle)"
              style={{
                fontFamily: "var(--font-mono), ui-monospace",
                fontSize: 10,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
              dy={isWater ? -8 : -3}
            >
              <textPath href={`#street-path-${i}`} startOffset="3%">
                {s.name}
              </textPath>
            </text>
          </g>
        );
      })}

      <style>{`
        .omni-water-flow {
          animation: omni-water-dash 6s linear infinite;
        }
        @keyframes omni-water-dash {
          to { stroke-dashoffset: -160; }
        }
      `}</style>
    </g>
  );
}
