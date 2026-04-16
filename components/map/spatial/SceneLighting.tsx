"use client";

export function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.32} />
      <directionalLight
        position={[6, 10, 8]}
        intensity={0.85}
        color="#fef3da"
      />
      <directionalLight
        position={[-8, 6, -4]}
        intensity={0.45}
        color="#7facd9"
      />
      <hemisphereLight color="#9bbcda" groundColor="#0a0d12" intensity={0.18} />
    </>
  );
}
