import * as THREE from "three";

// World-unit size of the relief map plane (roughly 2:1 equirectangular + margin).
export const MAP_W = 20;
export const MAP_D = 11;

// The relief plane crops the equirect texture vertically to [VCROP_MIN, VCROP_MIN
// + VCROP_SPAN] so the white polar rows never show as a bright edge band.
export const VCROP_MIN = 0.06;
export const VCROP_SPAN = 0.88;

// equirect u,v (0..1) -> world position on the flat (cropped) map.
// XZ plane, y up, north = -Z.
export function uvToWorld(u: number, v: number, y = 0): THREE.Vector3 {
  const vn = (v - VCROP_MIN) / VCROP_SPAN; // account for the vertical crop
  return new THREE.Vector3((u - 0.5) * MAP_W, y, (vn - 0.5) * MAP_D);
}

// --- Globe ---------------------------------------------------------------
// Base sphere radius + how far the tallest terrace pushes out (dramatic relief).
export const GLOBE_BASE_R = 1.76;
export const GLOBE_RELIEF = 0.5;
// dialled against a screenshot so a region's u lands on its own continent.
export const GLOBE_LON_OFFSET = 0;

// equirect u,v (0..1) -> point on the globe surface. Matches three's
// SphereGeometry vertex mapping composed with the colour texture's flipY:
// worldgen v -> theta = v·π, worldgen u -> phi = u·2π.
export function uvToSphere(u: number, v: number, radius: number): THREE.Vector3 {
  const phi = u * Math.PI * 2 + GLOBE_LON_OFFSET;
  const theta = v * Math.PI;
  return new THREE.Vector3(
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export interface CamKey {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
}

// Far 3/4 view of the globe.
export const SPACE_KEY: CamKey = {
  pos: [0, 2.6, 7.8],
  look: [0, 0, 0],
  fov: 45,
};

// End of the dive — pushed in close to the globe's north face, about to be
// swallowed by cloud.
export const DIVE_KEY: CamKey = {
  pos: [0, 1.1, 3.0],
  look: [0, 0.3, 0],
  fov: 60,
};

// Top-down framing of the relief map.
// Landscape: fill the viewport (some width crop is fine).
// Portrait / near-square: fit the whole map so every region stays reachable —
// the scene background is the same deep-ocean colour, so the margins read as
// more ocean, not letterboxing.
export function mapKey(aspect: number): CamKey {
  const fov = 42;
  const t = Math.tan((fov * Math.PI) / 360);
  const dV = MAP_D / 2 / t;
  const dH = MAP_W / 2 / (t * aspect);
  const d =
    aspect >= 1.25
      ? Math.min(dV, dH) * 1.06 // landscape: fill + a little margin for the tilt
      : Math.max(dV, dH) * 1.0; // portrait: fit the whole map
  // slight oblique tilt so the terraced step-faces catch shadow (2.5D read)
  return { pos: [0, d * 0.93, d * 0.3], look: [0, 0, 0.8], fov };
}

// Descend toward a picked region before cutting to the pixel overworld.
export function enterKey(regionWorld: THREE.Vector3): CamKey {
  return {
    pos: [regionWorld.x, 2.4, regionWorld.z + 1.6],
    look: [regionWorld.x, 0, regionWorld.z],
    fov: 38,
  };
}
