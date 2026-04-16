"use client";

import { useMemo } from "react";
import * as THREE from "three";
import layout from "@/data/campus-layout.json";

const WORLD = 24;

type Field = { points: number[][] };

/**
 * Ground plane + flattened street ribbons + field patches.
 *
 * Streets in the source JSON are still TODO, so we draw a single soft inner
 * "campus pad" + the perimeter strokes; the fields come from the layout file.
 */
export function GroundMesh() {
  const fieldGeometries = useMemo<THREE.ShapeGeometry[]>(() => {
    const fields = (layout.fields ?? []) as unknown as Field[];
    return fields
      .map((f) => f.points.filter((p) => p.length >= 2).map((p) => [p[0], p[1]] as [number, number]))
      .filter((p) => p.length >= 3)
      .map((poly) => {
        const shape = new THREE.Shape();
        const half = WORLD / 2;
        poly.forEach(([u, v], i) => {
          const x = u * WORLD - half;
          const z = -(v * WORLD - half);
          if (i === 0) shape.moveTo(x, z);
          else shape.lineTo(x, z);
        });
        shape.closePath();
        return new THREE.ShapeGeometry(shape);
      });
  }, []);

  return (
    <group>
      {/* Base ground plane — slightly lighter than bg */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[WORLD * 1.6, WORLD * 1.6]} />
        <meshStandardMaterial color="#0e1116" roughness={1} metalness={0} />
      </mesh>

      {/* Campus inner pad — calls attention to extent */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[WORLD, WORLD]} />
        <meshStandardMaterial color="#13171f" roughness={1} metalness={0} />
      </mesh>

      {/* Subtle dot grid via instanced points (dim) */}
      <DotGrid />

      {/* Field overlays */}
      {fieldGeometries.map((g, i) => (
        <mesh
          key={i}
          geometry={g}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.001, 0]}
        >
          <meshBasicMaterial color="#3aa776" transparent opacity={0.18} />
        </mesh>
      ))}

      {/* Perimeter ribbons (stand-in for streets until points are authored) */}
      <PerimeterRibbons />
    </group>
  );
}

function DotGrid() {
  const dots = useMemo(() => {
    const positions: number[] = [];
    const step = 1;
    const half = WORLD / 2;
    for (let x = -half; x <= half; x += step) {
      for (let z = -half; z <= half; z += step) {
        positions.push(x, 0.005, z);
      }
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, []);
  return (
    <points geometry={dots}>
      <pointsMaterial size={0.04} color="#1a2030" sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}

function PerimeterRibbons() {
  const half = WORLD / 2;
  const inset = 0.4;
  const W = 0.5;

  const ribbons: Array<{ x: number; z: number; sx: number; sz: number }> = [
    { x: 0, z: -half + inset, sx: WORLD - inset * 2, sz: W }, // top
    { x: 0, z: half - inset, sx: WORLD - inset * 2, sz: W }, // bottom
    { x: -half + inset, z: 0, sx: W, sz: WORLD - inset * 2 }, // left
    { x: half - inset, z: 0, sx: W, sz: WORLD - inset * 2 }, // right
  ];

  return (
    <group position={[0, 0.005, 0]}>
      {ribbons.map((r, i) => (
        <mesh key={i} position={[r.x, 0, r.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[r.sx, r.sz]} />
          <meshBasicMaterial color="#1c222d" />
        </mesh>
      ))}
    </group>
  );
}

export const SPATIAL_WORLD_SIZE = WORLD;
