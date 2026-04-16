import * as THREE from "three";
import type { Polygon } from "./polygon";
import { simplify } from "./polygon";

/**
 * Convert a normalized 0..1 polygon into a THREE.Shape suitable for ExtrudeGeometry.
 * The polygon is mapped onto a -worldHalf..+worldHalf XZ plane (Y is up at runtime),
 * so the returned Shape is in the X/Z=Y mapping caller will apply via geometry rotation.
 *
 * For perf (CLAUDE.md §8.3), polygons with >12 vertices are simplified to ~8.
 */
export function toThreeShape(poly: Polygon, worldSize: number): THREE.Shape {
  let working = poly;
  if (working.length > 12) {
    // bump tolerance progressively until we cut down to manageable count
    let tol = 0.0015;
    while (working.length > 8 && tol < 0.02) {
      working = simplify(poly, tol);
      tol *= 1.6;
    }
  }

  const half = worldSize / 2;
  const shape = new THREE.Shape();
  for (let i = 0; i < working.length; i++) {
    const [u, v] = working[i];
    // u ∈ [0,1] → x ∈ [-half, +half]
    // v ∈ [0,1] → y ∈ [-half, +half] (will be rotated -90° about X to lie on XZ ground)
    const x = u * worldSize - half;
    const y = -(v * worldSize - half); // flip so map "north" is +Z
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/** Reasonable extrusion height for a building given its baseline kW. */
export function heightForBaseline(
  baselineKw: number,
  minKw = 4,
  maxKw = 95,
  minH = 0.6,
  maxH = 4.2,
): number {
  const t = Math.max(0, Math.min(1, (baselineKw - minKw) / (maxKw - minKw)));
  // Slight ease so small buildings don't read as flat tiles.
  const eased = Math.pow(t, 0.75);
  return minH + (maxH - minH) * eased;
}
