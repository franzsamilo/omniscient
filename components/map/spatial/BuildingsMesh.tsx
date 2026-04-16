"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { MAPPED_BUILDINGS, type Building } from "@/lib/mock/buildings";
import { toThreeShape, heightForBaseline } from "@/components/map/utils/toThreeShape";
import { SPATIAL_WORLD_SIZE } from "./GroundMesh";

type Props = {
  /** Animated 0..1 — 0 = flat, 1 = full extruded (drives the keynote transition). */
  extrudeT: number;
  hoveredId: number | null;
  selectedId: number | null;
  flagged: Set<number>;
  intensity: Record<number, number>;
  onHover: (b: Building | null) => void;
  onSelect: (b: Building) => void;
};

type Prepared = {
  building: Building;
  geometry: THREE.ExtrudeGeometry;
  fullHeight: number;
};

const HEAT_PALETTE = [
  new THREE.Color("#3a4660"), // cool default — readable above ground
  new THREE.Color("#5e7a99"),
  new THREE.Color("#a3b86a"),
  new THREE.Color("#e0b25e"),
  new THREE.Color("#dd7f3d"),
  new THREE.Color("#c84538"),
];

function colorForIntensity(t: number): THREE.Color {
  const segs = HEAT_PALETTE.length - 1;
  const f = t * segs;
  const i = Math.min(segs - 1, Math.floor(f));
  const local = f - i;
  return HEAT_PALETTE[i].clone().lerp(HEAT_PALETTE[i + 1], local);
}

export function BuildingsMesh({
  extrudeT,
  hoveredId,
  selectedId,
  flagged,
  intensity,
  onHover,
  onSelect,
}: Props) {
  const prepared = useMemo<Prepared[]>(() => {
    return MAPPED_BUILDINGS.map((b) => {
      // toThreeShape emits world-space XZ coordinates centered on the campus
      // origin, so the resulting geometry is already correctly placed — no
      // additional per-mesh translation needed.
      const shape = toThreeShape(b.polygon, SPATIAL_WORLD_SIZE);
      const fullHeight = heightForBaseline(b.baselineKw);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 1, // scaled at runtime by extrudeT
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.03,
        bevelSegments: 1,
        steps: 1,
      });
      geometry.rotateX(-Math.PI / 2); // shape lies on Y=0 plane → extrude up

      return { building: b, geometry, fullHeight };
    });
  }, []);

  return (
    <group>
      {prepared.map((p) => (
        <BuildingInstance
          key={p.building.id}
          prep={p}
          extrudeT={extrudeT}
          isHovered={hoveredId === p.building.id}
          isSelected={selectedId === p.building.id}
          isFlagged={flagged.has(p.building.id)}
          intensity={intensity[p.building.id] ?? 0}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function BuildingInstance({
  prep,
  extrudeT,
  isHovered,
  isSelected,
  isFlagged,
  intensity,
  onHover,
  onSelect,
}: {
  prep: Prepared;
  extrudeT: number;
  isHovered: boolean;
  isSelected: boolean;
  isFlagged: boolean;
  intensity: number;
  onHover: (b: Building | null) => void;
  onSelect: (b: Building) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const liftTarget = useRef(0); // animated hover lift target

  // Smoothly approach lift / scale targets.
  useFrame((_, dt) => {
    if (!meshRef.current) return;
    const targetLift = isHovered ? 0.15 : 0;
    liftTarget.current += (targetLift - liftTarget.current) * Math.min(1, dt * 8);
    meshRef.current.position.y = liftTarget.current;
  });

  // Material color: heatmap base, override on hover/select/flag.
  const baseColor = useMemo(() => colorForIntensity(intensity), [intensity]);
  const color = isFlagged
    ? new THREE.Color("#bf3a30")
    : isHovered || isSelected
      ? new THREE.Color("#9bdef0")
      : baseColor;

  const heightScale = Math.max(0.001, prep.fullHeight * extrudeT);

  return (
    <mesh
      ref={meshRef}
      geometry={prep.geometry}
      scale={[1, heightScale, 1]}
      castShadow={false}
      receiveShadow={false}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(prep.building);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        onHover(null);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(prep.building);
      }}
    >
      <meshStandardMaterial
        color={color}
        roughness={0.78}
        metalness={0.05}
        emissive={isHovered || isSelected ? new THREE.Color("#3aa6c0") : new THREE.Color("#000")}
        emissiveIntensity={isHovered ? 0.35 : isSelected ? 0.22 : 0}
      />
      {extrudeT > 0.05 && <Edges color="#2c3548" threshold={20} />}
    </mesh>
  );
}
