"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { Building } from "@/lib/mock/buildings";
import { MAPPED_BUILDINGS } from "@/lib/mock/buildings";
import { PlanRenderer } from "./plan/PlanRenderer";
import { MapHud } from "./shared/MapHud";
import { MapLegend } from "./shared/MapLegend";
import { MapCompass } from "./shared/MapCompass";
import { MapTimeScrubber } from "./shared/MapTimeScrubber";
import {
  buildingIntensity,
  flaggedBuildings,
  todayLoadCurve,
  currentSlotIndex,
} from "@/lib/mock/telemetry";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { cn } from "@/lib/utils/cn";

const SpatialRenderer = dynamic(
  () => import("./spatial/SpatialRenderer").then((m) => m.SpatialRenderer),
  { ssr: false, loading: () => null },
);

type Mode = "plan" | "spatial";
type Layer = "heatmap" | "occupancy" | "water" | "environment" | "flags-only" | "clean";

export type CampusMapProps = {
  mode?: Mode;
  layer?: Layer;
  flagged?: Set<number>;
  intensity?: Record<number, number>;
  size?: "contain" | "full";
  allowModeToggle?: boolean;
  showScrubber?: boolean;
  enableZoomPan?: boolean;
  onBuildingClick?: (id: number) => void;
};

export function CampusMap({
  mode: modeProp,
  layer: layerProp,
  flagged: flaggedProp,
  intensity: intensityProp,
  size = "contain",
  allowModeToggle = true,
  showScrubber = false,
  enableZoomPan = false,
  onBuildingClick,
}: CampusMapProps) {
  const router = useRouter();

  // Local state — controlled-via-prop where provided, else internal.
  const [mode, setMode] = useState<Mode>(modeProp ?? "plan");
  const [layer, setLayer] = useState<Layer>(layerProp ?? "heatmap");
  const [hovered, setHovered] = useState<Building | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [scrubSlot, setScrubSlot] = useState<number>(currentSlotIndex());
  const [zoom, setZoom] = useState(1);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (modeProp) setMode(modeProp);
  }, [modeProp]);
  useEffect(() => {
    if (layerProp) setLayer(layerProp);
  }, [layerProp]);

  // Listen for keyboard events broadcasted by ShortcutBoot.
  useEffect(() => {
    if (!allowModeToggle) return;
    const onMode = () => setMode((m) => (m === "plan" ? "spatial" : "plan"));
    const onLayer = () =>
      setLayer((l) => {
        const order: Layer[] = ["heatmap", "occupancy", "water", "environment", "flags-only", "clean"];
        const i = order.indexOf(l);
        return order[(i + 1) % order.length];
      });
    window.addEventListener("omni:map:toggle-mode", onMode);
    window.addEventListener("omni:map:cycle-layer", onLayer);
    return () => {
      window.removeEventListener("omni:map:toggle-mode", onMode);
      window.removeEventListener("omni:map:cycle-layer", onLayer);
    };
  }, [allowModeToggle]);

  // Sync scrub slot to clock when not user-controlled.
  useEffect(() => {
    if (!showScrubber) {
      const id = setInterval(() => setScrubSlot(currentSlotIndex()), 30_000);
      return () => clearInterval(id);
    }
  }, [showScrubber]);

  const intensity = useMemo(
    () => intensityProp ?? buildingIntensity(),
    [intensityProp],
  );
  const flagged = useMemo(
    () => flaggedProp ?? flaggedBuildings(),
    [flaggedProp],
  );

  // Bring back today's curve to derive a "current draw" estimate per building.
  const curve = useMemo(() => todayLoadCurve(), []);
  const slotShare = useMemo(() => {
    const slot = curve[Math.min(curve.length - 1, scrubSlot)];
    return { totalKw: slot.total, solar: slot.solar };
  }, [curve, scrubSlot]);

  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const cur = wrapRef.current;
      if (cur) setContainerRect(cur.getBoundingClientRect());
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("scroll", update, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update, true);
    };
  }, []);

  const handleSelect = (b: Building) => {
    setSelectedId(b.id);
    if (onBuildingClick) onBuildingClick(b.id);
    else router.push(`/building/${b.id}`);
  };

  const renderPlan = (
    <PlanRenderer
      hoveredId={hovered?.id ?? null}
      selectedId={selectedId}
      flagged={flagged}
      intensity={intensity}
      layer={layer}
      zoom={zoom}
      onHover={(b) => setHovered(b)}
      onSelect={handleSelect}
      watermark={size === "full"}
    />
  );

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative h-full w-full overflow-hidden",
        "rounded-[var(--radius-md)] border bg-[var(--color-surface-1)]",
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* the renderer */}
      <AnimatePresence mode="wait">
        {mode === "plan" ? (
          <motion.div
            key="plan"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {enableZoomPan ? (
              <TransformWrapper
                minScale={1}
                maxScale={4}
                limitToBounds
                centerOnInit
                doubleClick={{ disabled: true }}
                wheel={{ step: 0.18 }}
                onZoom={(ref) => setZoom(ref.state.scale)}
              >
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{ width: "100%", height: "100%" }}
                >
                  {renderPlan}
                </TransformComponent>
              </TransformWrapper>
            ) : (
              renderPlan
            )}
          </motion.div>
        ) : (
          <motion.div
            key="spatial"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <SpatialRenderer
              flagged={flagged}
              intensity={intensity}
              hoveredId={hovered?.id ?? null}
              selectedId={selectedId}
              onHover={(b) => setHovered(b)}
              onSelect={handleSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD overlay */}
      <MapHud
        building={hovered}
        occupancy={hovered ? intensity[hovered.id] ?? 0 : 0}
        currentKw={
          hovered ? round1((slotShare.totalKw * (intensity[hovered.id] ?? 0)) / 12) : 0
        }
        todayPhp={hovered ? Math.round((slotShare.totalKw * 0.7 * 12.8) / 12) : 0}
        flagged={hovered ? flagged.has(hovered.id) : false}
        containerRect={containerRect}
      />

      {/* Top-right: legend + compass */}
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-start gap-2.5">
        <MapLegend
          mode={mode}
          layer={layer}
          allowModeToggle={allowModeToggle}
          onModeChange={setMode}
          onLayerChange={setLayer}
        />
        {size === "full" && (
          <div
            className="rounded-[var(--radius-sm)] border-2 bg-[var(--color-surface-1)] p-2 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.6)]"
            style={{ borderColor: "var(--color-border-strong)" }}
          >
            <MapCompass />
          </div>
        )}
      </div>

      {/* Bottom-center: time scrubber */}
      {showScrubber && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
          <MapTimeScrubber value={scrubSlot} onChange={setScrubSlot} />
        </div>
      )}

      {/* Footer: status block — observing count, flagged count, mode pill */}
      <div
        className="pointer-events-none absolute bottom-3 left-3 z-10 flex items-stretch gap-3 rounded-[var(--radius-sm)] border-2 bg-[var(--color-surface-1)] px-3 py-2 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.6)]"
        style={{ borderColor: "var(--color-border-strong)" }}
      >
        <div className="flex items-center gap-2 pr-3 border-r border-[var(--color-border)]">
          <span className="size-1.5 rounded-full bg-[var(--color-signal)] animate-[pulse_1.4s_ease-in-out_infinite]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-muted)]">
            Observing
          </span>
        </div>
        <MapStat label="Buildings" value="101" />
        <MapStat label="Mapped" value={String(MAPPED_BUILDINGS.length)} />
        <MapStat
          label="Flagged"
          value={String([...flagged].length)}
          tone={[...flagged].length > 0 ? "danger" : "ok"}
        />
        <div className="ml-1 flex items-center gap-1.5 border-l border-[var(--color-border)] pl-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            Mode
          </span>
          <span className="rounded-[3px] bg-[var(--color-surface-3)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-signal)]">
            {mode}
          </span>
        </div>
      </div>
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function MapStat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" }) {
  const color = tone === "danger" ? "var(--color-danger)" : tone === "ok" ? "var(--color-ok)" : "var(--color-fg)";
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {label}
      </span>
      <span className="font-mono text-[12px] tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
