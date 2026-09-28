import * as THREE from "three";

// A hard N-step ramp for MeshToonMaterial — gives terrace faces a crisp
// lit / mid / shadow band instead of a smooth falloff.
let cached: THREE.DataTexture | null = null;

export function makeToonGradient(steps = 3): THREE.DataTexture {
  if (cached) return cached;
  const data = new Uint8Array(steps * 4);
  for (let i = 0; i < steps; i++) {
    // 0.58 .. 1.0 so the darkest band still reads clearly
    const v = Math.round((0.58 + (0.42 * i) / (steps - 1)) * 255);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  cached = tex;
  return tex;
}
