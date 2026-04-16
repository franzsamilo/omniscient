"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { MAPPED_BUILDINGS } from "@/lib/mock/buildings";
import { centroid } from "@/components/map/utils/polygon";
import { heightForBaseline } from "@/components/map/utils/toThreeShape";
import { SPATIAL_WORLD_SIZE } from "./GroundMesh";

type Props = {
  flagged: Set<number>;
  extrudeT: number;
};

type FlagPos = {
  id: number;
  pos: [number, number, number];
};

export function FlagSprites({ flagged, extrudeT }: Props) {
  const positions = useMemo<FlagPos[]>(() => {
    const half = SPATIAL_WORLD_SIZE / 2;
    return MAPPED_BUILDINGS.filter((b) => flagged.has(b.id)).map((b) => {
      const [u, v] = centroid(b.polygon);
      const cx = u * SPATIAL_WORLD_SIZE - half;
      const cz = -(v * SPATIAL_WORLD_SIZE - half);
      const cy = heightForBaseline(b.baselineKw);
      return { id: b.id, pos: [cx, cy, cz] };
    });
  }, [flagged]);

  return (
    <group>
      {positions.map((p) => (
        <FlagSprite key={p.id} pos={p.pos} extrudeT={extrudeT} />
      ))}
    </group>
  );
}

function FlagSprite({ pos, extrudeT }: { pos: [number, number, number]; extrudeT: number }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * Math.PI) * 0.18 + 0.18; // 1.0 → 1.36
    ringRef.current.scale.setScalar(s);
    const mat = ringRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.4 + (1 - (Math.sin(t * Math.PI) + 1) / 2) * 0.5;
  });
  const liftY = pos[1] * extrudeT + 0.4;
  return (
    <group position={[pos[0], liftY, pos[2]]}>
      <Billboard>
        <mesh ref={ringRef}>
          <ringGeometry args={[0.18, 0.26, 32]} />
          <meshBasicMaterial color="#bf3a30" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.06, 16]} />
          <meshBasicMaterial color="#bf3a30" />
        </mesh>
      </Billboard>
    </group>
  );
}
