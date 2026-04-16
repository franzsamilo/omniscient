"use client";

/**
 * Slowly-rotating low-poly sun (CLAUDE.md §6.5). Loaded via dynamic import in
 * the /power page so it doesn't bloat the rest of the bundle.
 */

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function SolarSun({ size = 280 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="pointer-events-none select-none"
    >
      <Canvas
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 6], fov: 35 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.35} />
        <pointLight position={[6, 6, 6]} intensity={1.2} color="#ffd680" />
        <pointLight position={[-4, -2, 4]} intensity={0.5} color="#ff7950" />
        <Sun />
        <Halo />
      </Canvas>
    </div>
  );
}

function Sun() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * 0.18;
    ref.current.rotation.x += dt * 0.04;
  });
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.6, 1]} />
      <meshStandardMaterial
        color="#f4b651"
        roughness={0.45}
        metalness={0.1}
        emissive="#ff8a35"
        emissiveIntensity={0.65}
        flatShading
      />
    </mesh>
  );
}

function Halo() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 0.6) * 0.04;
    ref.current.scale.setScalar(s);
  });
  return (
    <mesh ref={ref}>
      <ringGeometry args={[2.0, 2.2, 64]} />
      <meshBasicMaterial color="#ffae5a" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  );
}
