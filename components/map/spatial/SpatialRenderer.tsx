"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { Building } from "@/lib/mock/buildings";
import { GroundMesh, SPATIAL_WORLD_SIZE } from "./GroundMesh";
import { BuildingsMesh } from "./BuildingsMesh";
import { FlagSprites } from "./FlagSprites";
import { SceneLighting } from "./SceneLighting";

type Props = {
  flagged: Set<number>;
  intensity: Record<number, number>;
  hoveredId: number | null;
  selectedId: number | null;
  onHover: (b: Building | null) => void;
  onSelect: (b: Building) => void;
};

const ENTER_DURATION_MS = 1400;
const IDLE_AUTOROTATE_DELAY_MS = 4000;
// Distance must keep the entire 24-unit world inside the 35° FOV at the iso
// pose. World half-extent ≈ 12; at 35° fov, distance ≈ 12 / tan(17.5°) ≈ 38.
// We add headroom for the iso tilt's foreshortening.
const TARGET_DISTANCE = SPATIAL_WORLD_SIZE * 1.55;

export function SpatialRenderer(props: Props) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <SceneLighting />

      <PerspectiveCamera makeDefault fov={35} near={0.1} far={200} position={[0, TARGET_DISTANCE, 0.001]} />

      <SpatialScene {...props} />
    </Canvas>
  );
}

function SpatialScene({
  flagged,
  intensity,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: Props) {
  const startRef = useRef<number | null>(null);
  const [extrudeT, setExtrudeT] = useState(0);
  const [enterT, setEnterT] = useState(0); // 0 → 1 over ENTER_DURATION_MS
  const orbitRef = useRef<any>(null);
  const lastInteractionRef = useRef<number>(performance.now());

  // Cinematic enter: extrude buildings + tilt camera from top-down to iso.
  useFrame(({ camera, clock }) => {
    if (startRef.current === null) startRef.current = clock.getElapsedTime() * 1000;
    const elapsed = clock.getElapsedTime() * 1000 - startRef.current;
    const raw = Math.min(1, elapsed / ENTER_DURATION_MS);
    // ease: cubic-bezier(0.22, 1, 0.36, 1)-ish
    const eased = 1 - Math.pow(1 - raw, 3.6);
    setEnterT(eased);
    setExtrudeT(eased);

    // Camera arc: from straight overhead to iso (~35° tilt, azimuth 225°).
    // Spherical coords: polar measured from +Y (0 = straight up looking down).
    const polar = THREE.MathUtils.lerp(0.001, Math.PI * 0.32, eased); // ~57° from vertical
    const azimuth = THREE.MathUtils.lerp(0, Math.PI * 1.25, eased);
    const r = THREE.MathUtils.lerp(TARGET_DISTANCE, TARGET_DISTANCE * 1.05, eased);
    const sinP = Math.sin(polar);
    const cosP = Math.cos(polar);
    camera.position.set(
      r * sinP * Math.cos(azimuth),
      r * cosP,
      r * sinP * Math.sin(azimuth),
    );
    camera.lookAt(0, 0, 0);

    // While entering, suppress OrbitControls fully.
    if (orbitRef.current) {
      orbitRef.current.enabled = eased >= 0.99;
    }

    // Idle auto-rotate after 4s of no user input.
    if (eased >= 0.99 && orbitRef.current) {
      const idle = performance.now() - lastInteractionRef.current > IDLE_AUTOROTATE_DELAY_MS;
      orbitRef.current.autoRotate = idle;
      orbitRef.current.autoRotateSpeed = 0.55;
    }
  });

  return (
    <>
      <GroundMesh />
      <BuildingsMesh
        extrudeT={extrudeT}
        hoveredId={hoveredId}
        selectedId={selectedId}
        flagged={flagged}
        intensity={intensity}
        onHover={onHover}
        onSelect={onSelect}
      />
      <FlagSprites flagged={flagged} extrudeT={extrudeT} />
      <OrbitControls
        ref={orbitRef}
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={SPATIAL_WORLD_SIZE * 0.6}
        maxDistance={SPATIAL_WORLD_SIZE * 2.4}
        maxPolarAngle={Math.PI / 2 - 0.05}
        target={[0, 0, 0]}
        onStart={() => {
          lastInteractionRef.current = performance.now();
          if (orbitRef.current) orbitRef.current.autoRotate = false;
        }}
        onChange={() => {
          lastInteractionRef.current = performance.now();
        }}
      />
    </>
  );
}
