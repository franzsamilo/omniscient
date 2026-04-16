"use client";

/**
 * /dev/layout-editor (CLAUDE.md §8.4) — dev-only authoring tool.
 *
 * Three jobs:
 *   1. Map extractor's provisional_id → legend id (1..101)
 *   2. Edit existing polygon vertices
 *   3. Author new polygons for buildings the extractor missed
 *
 * Mapping + edits live in localStorage and can be exported as a patch JSON
 * that the user pastes into data/campus-layout.json#byId.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import layout from "@/data/campus-layout.json";
import { BUILDINGS } from "@/lib/mock/buildings";
import { Button } from "@/components/primitives/Button";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { cn } from "@/lib/utils/cn";
import { pad } from "@/lib/utils/format";

const STORAGE_KEY = "omniscient:layout-editor:v1";

type Polygon = number[][];
type ProvisionalBuilding = { provisional_id: number; points: Polygon };

type EditorState = {
  /** legend id → polygon (in normalized coords). */
  byId: Record<number, Polygon>;
  /** legend id → provisional id (for traceability). */
  legendToProvisional: Record<number, number>;
};

type Mode = "assign" | "edit" | "draw";

export default function LayoutEditorPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <div className="grid flex-1 place-items-center px-8">
        <p className="font-serif italic text-[var(--color-fg-muted)]">
          Layout editor is disabled in production builds.
        </p>
      </div>
    );
  }

  return <Editor />;
}

function Editor() {
  const [state, setState] = useState<EditorState>(() => loadState());
  const [activeLegendId, setActiveLegendId] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("assign");
  const [drawBuffer, setDrawBuffer] = useState<Polygon>([]);
  const [hoveredProvisional, setHoveredProvisional] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const provisional = useMemo<ProvisionalBuilding[]>(
    () =>
      ((layout.buildings ?? []) as unknown as ProvisionalBuilding[]).map((b) => ({
        provisional_id: b.provisional_id,
        points: b.points,
      })),
    [],
  );

  const provisionalToLegend = useMemo(() => {
    const m = new Map<number, number>();
    for (const [legendStr, prov] of Object.entries(state.legendToProvisional)) {
      m.set(prov, Number(legendStr));
    }
    return m;
  }, [state.legendToProvisional]);

  // Persist to localStorage whenever state changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota / private mode errors
    }
  }, [state]);

  // Click on the stage in DRAW mode → append point.
  const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "draw" || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const v = (e.clientY - rect.top) / rect.height;
    setDrawBuffer((b) => [...b, [u, v]]);
  };

  const handleStageDoubleClick = () => {
    if (mode !== "draw" || drawBuffer.length < 3 || activeLegendId == null) return;
    setState((s) => ({
      ...s,
      byId: { ...s.byId, [activeLegendId]: drawBuffer },
    }));
    setDrawBuffer([]);
    setMode("edit");
  };

  const assignProvisional = (provId: number) => {
    if (activeLegendId == null) return;
    const polygon = provisional.find((p) => p.provisional_id === provId)?.points ?? [];
    setState((s) => ({
      ...s,
      byId: { ...s.byId, [activeLegendId]: polygon },
      legendToProvisional: { ...s.legendToProvisional, [activeLegendId]: provId },
    }));
  };

  const clearAssignment = (legendId: number) => {
    setState((s) => {
      const { [legendId]: _, ...byId } = s.byId;
      const { [legendId]: __, ...l2p } = s.legendToProvisional;
      return { byId, legendToProvisional: l2p };
    });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ byId: state.byId }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "campus-layout.byId.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetState = () => {
    if (confirm("Erase all assignments and edits?")) {
      setState({ byId: {}, legendToProvisional: {} });
      setActiveLegendId(null);
      setDrawBuffer([]);
    }
  };

  const assignedCount = Object.keys(state.byId).length;

  return (
    <div className="grid h-full grid-cols-[300px_1fr_300px] gap-px overflow-hidden bg-[var(--color-border)]">
      {/* LEFT — legend list */}
      <div className="flex flex-col bg-[var(--color-surface-1)]">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <SectionHeader index="L" label={`Legend · ${assignedCount}/101 mapped`} />
        </div>
        <ul className="flex-1 overflow-y-auto py-2">
          {BUILDINGS.map((b) => {
            const assigned = state.byId[b.id];
            const isActive = activeLegendId === b.id;
            return (
              <li key={b.id}>
                <button
                  onClick={() => setActiveLegendId(b.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-4 py-2 text-left",
                    "transition-colors duration-150",
                    isActive
                      ? "bg-[color-mix(in_oklch,var(--color-signal)_14%,transparent)] text-[var(--color-signal)]"
                      : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium truncate">{b.name}</p>
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                      {pad(b.id)} · {b.category}
                    </p>
                  </div>
                  {assigned ? (
                    <Pill tone="ok">OK</Pill>
                  ) : (
                    <Pill tone="neutral">—</Pill>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* CENTER — stage */}
      <div
        ref={stageRef}
        className="relative bg-black"
        onClick={handleStageClick}
        onDoubleClick={handleStageDoubleClick}
      >
        <Image
          src="/ref/campus-map-reference.jpg"
          alt="Campus reference photograph (build-time only — never shown to users)"
          fill
          unoptimized
          priority
          style={{ objectFit: "contain", opacity: 0.7, pointerEvents: "none" }}
        />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1 1"
          preserveAspectRatio="xMidYMid meet"
          pointerEvents="none"
        >
          {/* All provisional polygons */}
          {provisional.map((p) => {
            const legendId = provisionalToLegend.get(p.provisional_id);
            const isHover = hoveredProvisional === p.provisional_id;
            return (
              <g key={p.provisional_id} pointerEvents="all">
                <polygon
                  points={p.points.map(([x, y]) => `${x},${y}`).join(" ")}
                  fill={legendId ? "rgba(155,222,240,0.18)" : "rgba(255,255,255,0.06)"}
                  stroke={legendId ? "var(--color-signal)" : "rgba(255,255,255,0.45)"}
                  strokeWidth={0.0015}
                  style={{ cursor: mode === "assign" ? "pointer" : "default" }}
                  onMouseEnter={() => setHoveredProvisional(p.provisional_id)}
                  onMouseLeave={() => setHoveredProvisional(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (mode === "assign") assignProvisional(p.provisional_id);
                  }}
                />
                {isHover && (
                  <text
                    x={p.points[0]?.[0] ?? 0}
                    y={(p.points[0]?.[1] ?? 0) - 0.005}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 0.012,
                      fill: "var(--color-signal)",
                    }}
                  >
                    P{p.provisional_id}
                    {legendId ? ` → ${pad(legendId)}` : ""}
                  </text>
                )}
              </g>
            );
          })}

          {/* DRAW buffer */}
          {drawBuffer.length > 0 && (
            <polyline
              points={drawBuffer.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="rgba(255,206,75,0.15)"
              stroke="var(--color-warn)"
              strokeWidth={0.002}
              strokeDasharray="0.005 0.003"
              pointerEvents="none"
            />
          )}
          {drawBuffer.map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={0.0035}
              fill="var(--color-warn)"
              pointerEvents="none"
            />
          ))}
        </svg>
      </div>

      {/* RIGHT — controls + active inspector */}
      <div className="flex flex-col bg-[var(--color-surface-1)]">
        <div className="border-b border-[var(--color-border)] px-4 py-3">
          <SectionHeader index="E" label="Editor" />
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="flex flex-col gap-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Active legend
            </p>
            {activeLegendId ? (
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                  {pad(activeLegendId)}
                </p>
                <p className="text-[14px] font-medium text-[var(--color-fg)]">
                  {BUILDINGS.find((b) => b.id === activeLegendId)?.name ?? "—"}
                </p>
              </div>
            ) : (
              <p className="text-[12px] text-[var(--color-fg-muted)] italic">
                Pick a legend entry on the left.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Mode
            </p>
            <div className="flex gap-1">
              {(["assign", "edit", "draw"] as Mode[]).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mode === m ? "primary" : "outline"}
                  onClick={() => {
                    setMode(m);
                    if (m !== "draw") setDrawBuffer([]);
                  }}
                >
                  {m}
                </Button>
              ))}
            </div>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
              {mode === "assign" && "Click a polygon on the stage to bind it to the active legend."}
              {mode === "edit" && "Vertex editing — coming next pass."}
              {mode === "draw" &&
                "Click on the stage to add points · double-click to close · pick a legend first."}
            </p>
          </div>

          {activeLegendId && state.byId[activeLegendId] && (
            <Button size="sm" variant="outline" onClick={() => clearAssignment(activeLegendId)}>
              Clear assignment
            </Button>
          )}

          <div className="border-t border-[var(--color-border)] pt-3">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Output
            </p>
            <div className="flex flex-col gap-2">
              <Button size="sm" variant="primary" onClick={exportJson}>
                Export byId.json
              </Button>
              <Button size="sm" variant="ghost" onClick={resetState}>
                Reset all
              </Button>
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
              Mapped {assignedCount}/101 · drawn{" "}
              {Object.keys(state.byId).filter(
                (id) => !state.legendToProvisional[Number(id)],
              ).length}
            </p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 border-t border-[var(--color-border)] pt-3 font-serif italic text-[12px] text-[var(--color-fg-muted)]"
          >
            The reference photo is build-time only — users never see it.
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function loadState(): EditorState {
  if (typeof window === "undefined") {
    return { byId: {}, legendToProvisional: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { byId: {}, legendToProvisional: {} };
    const parsed = JSON.parse(raw) as Partial<EditorState>;
    return {
      byId: parsed.byId ?? {},
      legendToProvisional: parsed.legendToProvisional ?? {},
    };
  } catch {
    return { byId: {}, legendToProvisional: {} };
  }
}
