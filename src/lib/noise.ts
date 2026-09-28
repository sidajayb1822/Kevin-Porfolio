import { createNoise2D, createNoise3D } from "simplex-noise";

// Deterministic-ish PRNG so procedural art is stable within a session.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNoise2D(seed = 1337) {
  return createNoise2D(mulberry32(seed));
}

export function makeNoise3D(seed = 4242) {
  return createNoise3D(mulberry32(seed));
}

// Fractal brownian motion helper for richer terrain.
export function fbm2D(
  noise: (x: number, y: number) => number,
  x: number,
  y: number,
  octaves = 4,
  lacunarity = 2,
  gain = 0.5,
) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq);
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}

export function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
