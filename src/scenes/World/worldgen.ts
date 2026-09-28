import * as THREE from "three";
import { makeNoise2D, fbm2D, clamp01 } from "../../lib/noise";
import { palette } from "../../lib/palette";
import type { ContinentId } from "../../data/continents";

// ---------------------------------------------------------------------------
// Authored geography. u = longitude 0..1 (left→right), v = latitude 0..1
// (0 = north pole, 1 = south pole). Landmasses are unions of metaballs so the
// world is *designed*, not random; fbm noise only roughens the coastlines and
// carves interior mountains.
// ---------------------------------------------------------------------------

interface Blob {
  u: number;
  v: number;
  r: number;
  mtn?: number; // 0..1 how mountainous this lobe is
}

interface Landmass {
  name: string;
  blobs: Blob[];
}

export const LANDMASSES: Landmass[] = [
  {
    name: "Heartland", // big central continent, ~ u[0.42,0.74] v[0.34,0.70]
    blobs: [
      { u: 0.48, v: 0.46, r: 0.075, mtn: 0.1 },
      { u: 0.55, v: 0.42, r: 0.08, mtn: 0.25 },
      { u: 0.62, v: 0.46, r: 0.08, mtn: 0.55 },
      { u: 0.6, v: 0.56, r: 0.075, mtn: 0.2 },
      { u: 0.52, v: 0.55, r: 0.07, mtn: 0.1 },
      { u: 0.68, v: 0.42, r: 0.055, mtn: 0.75 },
      { u: 0.45, v: 0.4, r: 0.045 },
      { u: 0.66, v: 0.53, r: 0.05, mtn: 0.45 },
    ],
  },
  {
    name: "Frostcap", // northern land
    blobs: [
      { u: 0.38, v: 0.17, r: 0.06 },
      { u: 0.45, v: 0.15, r: 0.055 },
      { u: 0.32, v: 0.2, r: 0.04 },
    ],
  },
  {
    name: "Ember Isles", // south-west volcanic archipelago
    blobs: [
      { u: 0.19, v: 0.68, r: 0.042, mtn: 0.85 },
      { u: 0.25, v: 0.72, r: 0.032, mtn: 0.6 },
      { u: 0.13, v: 0.73, r: 0.028, mtn: 0.7 },
      { u: 0.23, v: 0.62, r: 0.024, mtn: 0.5 },
    ],
  },
  {
    name: "Drift Reach", // eastern island chain
    blobs: [
      { u: 0.75, v: 0.58, r: 0.052, mtn: 0.3 },
      { u: 0.82, v: 0.52, r: 0.032 },
      { u: 0.8, v: 0.66, r: 0.03 },
    ],
  },
  {
    name: "Westland", // small separate western continent — hosts the "Other" site
    blobs: [
      { u: 0.16, v: 0.42, r: 0.05, mtn: 0.2 },
      { u: 0.12, v: 0.5, r: 0.038 },
      { u: 0.2, v: 0.36, r: 0.03 },
    ],
  },
  {
    name: "Islets",
    blobs: [
      { u: 0.35, v: 0.52, r: 0.013 },
      { u: 0.74, v: 0.66, r: 0.014 },
      { u: 0.5, v: 0.78, r: 0.016 },
      { u: 0.3, v: 0.6, r: 0.011 },
      { u: 0.72, v: 0.3, r: 0.012 },
    ],
  },
];

// Where each site's clickable region sits — must be well inside land AND inside
// the visible frame (u ~ 0.12..0.88, v ~ 0.14..0.86).
export const REGION_POS: Record<ContinentId, { u: number; v: number }> = {
  about: { u: 0.475, v: 0.47 },
  general: { u: 0.55, v: 0.56 },
  portfolio: { u: 0.645, v: 0.44 },
  gallery: { u: 0.19, v: 0.67 },
  contact: { u: 0.4, v: 0.2 },
  other: { u: 0.16, v: 0.44 },
};

// Decorative crater lake (set r: 0 to disable).
const CRATER = { u: 0.66, v: 0.34, r: 0 };

// ---------------------------------------------------------------------------

// Gaussian metaballs -> compact, well-separated landmasses (lots of ocean).
function landField(u: number, v: number): number {
  let f = 0;
  for (const lm of LANDMASSES) {
    for (const b of lm.blobs) {
      let du = Math.abs(u - b.u);
      du = Math.min(du, 1 - du); // wrap longitude
      const dv = v - b.v;
      const d2 = du * du + dv * dv;
      f += Math.exp(-d2 / (2 * b.r * b.r));
    }
  }
  return f;
}

const LAND_THRESHOLD = 0.55;

function mountainWeight(u: number, v: number): number {
  let num = 0;
  let den = 0;
  for (const lm of LANDMASSES) {
    for (const b of lm.blobs) {
      let du = Math.abs(u - b.u);
      du = Math.min(du, 1 - du);
      const dv = v - b.v;
      const w = Math.exp(-(du * du + dv * dv) / (2 * b.r * b.r));
      num += w * (b.mtn ?? 0);
      den += w;
    }
  }
  return den > 0.02 ? num / den : 0;
}

type RGB = [number, number, number];
function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function shade(c: RGB, k: number): RGB {
  return [
    Math.round(clamp01(c[0] / 255 + k) * 255),
    Math.round(clamp01(c[1] / 255 + k) * 255),
    Math.round(clamp01(c[2] / 255 + k) * 255),
  ];
}

// ---------------------------------------------------------------------------
// Terrace bands: sea -> peak. Level drives the stepped displacement, colour is
// picked per band with a 2x2 ordered dither into the darker shade.
// ---------------------------------------------------------------------------
const LEVELS = 6;
interface Band {
  level: number; // 0..LEVELS-1 -> displacement step
  color: RGB;
}
// index order matters — stored as a Uint8 grid
const BAND_LIST: Band[] = [
  { level: 0, color: hexToRgb(palette.seaAbyss) }, // 0 sea deep
  { level: 0, color: hexToRgb(palette.sea) }, // 1 sea shallow
  { level: 1, color: hexToRgb(palette.coast) }, // 2 coast
  { level: 2, color: hexToRgb(palette.plains) }, // 3 plains
  { level: 3, color: hexToRgb(palette.hills) }, // 4 hills
  { level: 4, color: hexToRgb(palette.highland) }, // 5 highland
  { level: 5, color: hexToRgb(palette.peak) }, // 6 peak
  { level: 5, color: hexToRgb(palette.snowCap) }, // 7 snow
];
const EDGE = hexToRgb(palette.landEdge);

// 4x4 Bayer matrix, values 0..15
const BAYER = [
  0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5,
];

export interface RegionInfo {
  id: ContinentId;
  u: number;
  v: number;
  level: number; // terrace band level (0..LEVELS-1) of the terrain under it
}

// Map-space Y of the relief surface for a given terrace level — mirrors
// ReliefMap's displacementScale (2.0) / displacementBias (-0.2) so landmarks and
// markers sit exactly on the displaced terrain.
export function regionElevation(level: number): number {
  return (level / (LEVELS - 1)) * 2.0 - 0.2;
}

export interface World {
  colorMap: THREE.CanvasTexture;
  heightMap: THREE.CanvasTexture;
  regions: RegionInfo[];
  aspect: number;
}

let cached: World | null = null;

// terrace level of the terrain under a region marker (0..LEVELS-1)
export function regionLevel(id: ContinentId): number {
  return generateWorld().regions.find((r) => r.id === id)?.level ?? 2;
}

export function generateWorld(): World {
  if (cached) return cached;

  const W = 1024;
  const H = 512;
  const coastNoise = makeNoise2D(101);
  const ridgeNoise = makeNoise2D(202);

  // --- raw height field ---
  const HW = 512;
  const HH = 256;
  const raw = new Float32Array(HW * HH);

  const sampleHeight = (u: number, v: number): number => {
    const coast =
      0.16 * fbm2D((a, b) => coastNoise(a, b), u * 6, v * 6, 4) +
      0.08 * fbm2D((a, b) => coastNoise(a, b), u * 16, v * 16, 3);
    const f = landField(u, v) + coast;
    if (f <= LAND_THRESHOLD) return 0.03; // sea (flat)
    const bevel = clamp01((f - LAND_THRESHOLD) / 0.45);
    // gentle base: most of a continent should be plains/hills, not peaks
    let h = 0.13 + 0.16 * Math.pow(bevel, 0.8);
    const mw = mountainWeight(u, v);
    if (mw > 0.2) {
      const r = fbm2D((a, b) => ridgeNoise(a, b), u * 13, v * 13, 4);
      h += (mw - 0.2) * Math.pow(1 - Math.abs(r), 1.8) * 0.85 * bevel;
    }
    // crater lake: carved basin (shallow water) with a raised rim
    let dcu = Math.abs(u - CRATER.u);
    dcu = Math.min(dcu, 1 - dcu);
    const dc = Math.hypot(dcu, v - CRATER.v) / CRATER.r;
    if (dc < 1.25) {
      if (dc < 0.72) h = 0.02; // lake -> classified as sea
      else if (dc < 1.05) h = 0.28; // rim
    }
    return clamp01(h);
  };

  for (let y = 0; y < HH; y++)
    for (let x = 0; x < HW; x++)
      raw[y * HW + x] = sampleHeight(x / HW, y / HH);

  const rawAt = (u: number, v: number) => {
    const x = Math.min(HW - 1, Math.max(0, Math.floor(u * HW)));
    const y = Math.min(HH - 1, Math.max(0, Math.floor(v * HH)));
    return raw[y * HW + x];
  };

  // classify every texel -> band index once, into a grid
  const grid = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W;
      const v = y / H;
      const jitter =
        0.05 * fbm2D((a, b) => coastNoise(a, b), u * 26, v * 26, 2);
      const f = landField(u, v) + jitter;
      const polar = v < 0.05 || v > 0.96;

      // crater lake sits inside the continent -> force shallow sea
      let dcu = Math.abs(u - CRATER.u);
      dcu = Math.min(dcu, 1 - dcu);
      const inLake = Math.hypot(dcu, v - CRATER.v) / CRATER.r < 0.72;

      let idx: number;
      if (inLake) {
        idx = 1;
      } else if (f <= LAND_THRESHOLD) {
        idx = polar ? 7 : f <= LAND_THRESHOLD - 0.14 ? 0 : 1;
      } else if (polar) {
        idx = 7;
      } else {
        const h = rawAt(u, v);
        idx = h < 0.18 ? 2 : h < 0.26 ? 3 : h < 0.36 ? 4 : h < 0.5 ? 5 : 6;
      }
      grid[y * W + x] = idx;
    }
  }
  const gLvl = (x: number, y: number) =>
    BAND_LIST[
      grid[
        Math.min(H - 1, Math.max(0, y)) * W + Math.min(W - 1, Math.max(0, x))
      ]
    ].level;

  // --- colour map ---
  const colorC = document.createElement("canvas");
  colorC.width = W;
  colorC.height = H;
  const cctx = colorC.getContext("2d")!;
  const cimg = cctx.createImageData(W, H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const band = BAND_LIST[grid[y * W + x]];
      const lvl = band.level;
      const rt = gLvl(x + 2, y);
      const dn = gLvl(x, y + 2);
      const lf = gLvl(x - 2, y);
      const up = gLvl(x, y - 2);
      const isEdge =
        (lvl > 0 && (rt < lvl || dn < lvl || lf < lvl || up < lvl)) ||
        (lvl === 0 && (rt > 0 || dn > 0 || lf > 0 || up > 0));

      let rgb: RGB;
      if (isEdge && lvl > 0) {
        rgb = EDGE;
      } else if (lvl === 0) {
        rgb = band.color; // keep open water perfectly flat so margins blend
      } else {
        const b = BAYER[(y & 3) * 4 + (x & 3)] / 16;
        const hash = ((x * 73856093) ^ (y * 19349663)) >>> 0;
        const speck = (hash % 100) / 100;
        rgb = b > 0.7 && speck > 0.55 ? shade(band.color, -0.07) : band.color;
      }

      const i = (y * W + x) * 4;
      cimg.data[i] = rgb[0];
      cimg.data[i + 1] = rgb[1];
      cimg.data[i + 2] = rgb[2];
      cimg.data[i + 3] = 255;
    }
  }
  cctx.putImageData(cimg, 0, 0);

  // --- height texture: quantised to LEVELS discrete steps ---
  // The relief map crops the poles (VCROP), but the globe wraps the full texture
  // over a sphere — so fade displacement to zero across the top/bottom rows or
  // the pole vertices all shoot out into a spike.
  const heightC = document.createElement("canvas");
  heightC.width = W;
  heightC.height = H;
  const hctx = heightC.getContext("2d")!;
  const himg = hctx.createImageData(W, H);
  const smoothstep = (e0: number, e1: number, x: number) => {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < H; y++) {
    const v = y / H;
    // hard-flat across the polar caps, ramp over the next few % (still well
    // outside the relief map's VCROP window, so the flat map is untouched)
    const polar =
      v < 0.05 || v > 0.95
        ? 0
        : smoothstep(0.05, 0.11, v) * smoothstep(0.95, 0.89, v);
    for (let x = 0; x < W; x++) {
      const p = y * W + x;
      const g = Math.round(
        (BAND_LIST[grid[p]].level / (LEVELS - 1)) * 255 * polar,
      );
      himg.data[p * 4] = himg.data[p * 4 + 1] = himg.data[p * 4 + 2] = g;
      himg.data[p * 4 + 3] = 255;
    }
  }
  hctx.putImageData(himg, 0, 0);

  const mk = (c: HTMLCanvasElement, srgb: boolean) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  };

  cached = {
    colorMap: mk(colorC, true),
    heightMap: mk(heightC, false),
    regions: (Object.keys(REGION_POS) as ContinentId[]).map((id) => ({
      id,
      u: REGION_POS[id].u,
      v: REGION_POS[id].v,
      level: gLvl(
        Math.round(REGION_POS[id].u * W),
        Math.round(REGION_POS[id].v * H),
      ),
    })),
    aspect: W / H,
  };
  return cached;
}
