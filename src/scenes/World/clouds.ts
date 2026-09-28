import { makeNoise2D, fbm2D } from "../../lib/noise";

let url: string | null = null;

// A low-res, hard-stepped pixel cloud sheet. The DOM curtain scales it up with
// image-rendering: pixelated so it reads as chunky pixel clouds.
export function cloudSheetUrl(): string {
  if (url) return url;
  const w = 256;
  const h = 160;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const n = makeNoise2D(77);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let d = fbm2D((a, b) => n(a, b), x / 42, y / 42, 4);
      d = d * 0.5 + 0.5;
      const edge = Math.min(
        1,
        (Math.min(x, w - x) / (w * 0.3)) * (Math.min(y, h - y) / (h * 0.34)),
      );
      let a = Math.max(0, d - 0.36) / 0.64;
      a = Math.pow(a, 1.2) * (0.5 + 0.5 * edge);
      // quantise alpha to 3 hard steps
      a = a > 0.66 ? 1 : a > 0.33 ? 0.72 : a > 0.12 ? 0.4 : 0;
      // 2-tone: brighter cores, pale-blue edges
      const bright = d > 0.62;
      const i = (y * w + x) * 4;
      img.data[i] = bright ? 255 : 226;
      img.data[i + 1] = bright ? 255 : 232;
      img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  url = c.toDataURL("image/png");
  return url;
}
