/**
 * Polygon utilities. All polygons are arrays of [x, y] pairs in normalized
 * 0..1 coordinates against the campus extent (CLAUDE.md §8.1).
 */

export type Point = [number, number];
export type Polygon = Point[];

/** Signed area (positive when CCW). */
export function area(poly: Polygon): number {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    a += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  }
  return a / 2;
}

/** Geometric centroid (works for non-degenerate, non-self-intersecting polygons). */
export function centroid(poly: Polygon): Point {
  const a = area(poly);
  if (Math.abs(a) < 1e-9) {
    // Fallback to bbox center for degenerate input.
    const b = bbox(poly);
    return [b.x + b.w / 2, b.y + b.h / 2];
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const cross = poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
    cx += (poly[j][0] + poly[i][0]) * cross;
    cy += (poly[j][1] + poly[i][1]) * cross;
  }
  const f = 1 / (6 * a);
  return [cx * f, cy * f];
}

export type Bbox = { x: number; y: number; w: number; h: number };

export function bbox(poly: Polygon): Bbox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Convert a polygon to an SVG `points` attribute string. */
export function toPointsAttr(poly: Polygon, scaleX: number, scaleY: number): string {
  return poly.map(([x, y]) => `${(x * scaleX).toFixed(2)},${(y * scaleY).toFixed(2)}`).join(" ");
}

/** Convert a polygon to an SVG `d` path string (closed). */
export function toPathD(poly: Polygon, scaleX: number, scaleY: number): string {
  if (poly.length === 0) return "";
  const [first, ...rest] = poly;
  const head = `M ${(first[0] * scaleX).toFixed(2)} ${(first[1] * scaleY).toFixed(2)}`;
  const body = rest
    .map(([x, y]) => `L ${(x * scaleX).toFixed(2)} ${(y * scaleY).toFixed(2)}`)
    .join(" ");
  return `${head} ${body} Z`;
}

/** Douglas-Peucker simplification, tolerance in normalized units. */
export function simplify(poly: Polygon, tolerance = 0.001): Polygon {
  if (poly.length < 3) return poly;
  const sqTol = tolerance * tolerance;
  const keep = new Array<boolean>(poly.length).fill(false);
  keep[0] = true;
  keep[poly.length - 1] = true;

  const stack: Array<[number, number]> = [[0, poly.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxSqDist = 0;
    let index = first;
    for (let i = first + 1; i < last; i++) {
      const d = sqSegDist(poly[i], poly[first], poly[last]);
      if (d > maxSqDist) {
        maxSqDist = d;
        index = i;
      }
    }
    if (maxSqDist > sqTol) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }

  const out: Polygon = [];
  for (let i = 0; i < poly.length; i++) if (keep[i]) out.push(poly[i]);
  return out;
}

function sqSegDist(p: Point, a: Point, b: Point): number {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

/** Point-in-polygon (ray casting). */
export function contains(poly: Polygon, point: Point): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Linear blend two values by t (0..1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Clamp value to range. */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Normalize value to 0..1 by lo/hi. */
export function normalize01(v: number, lo: number, hi: number): number {
  return clamp((v - lo) / (hi - lo + 1e-12), 0, 1);
}
