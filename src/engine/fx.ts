import type { AmbientConfig } from "./types";

// Ambient particle + weather layer for the image maps. Everything is world-space
// (tile units), converted to screen at draw time. Cheap: a few dozen motes and
// 3 cloud shadows, all closed-form from elapsed time.

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Mote {
  x: number;
  y: number;
  r: number; // drift radius (tiles)
  sp: number; // speed
  ph: number; // phase
  size: number;
  warm: boolean;
}

interface Shadow {
  y: number;
  w: number;
  h: number;
  sp: number;
  off: number;
}

export class AmbientFx {
  private motes: Mote[] = [];
  private shadows: Shadow[] = [];
  private hasShadows: boolean;

  constructor(
    private mapW: number,
    mapH: number,
    cfg: AmbientConfig,
    private water: number[] | undefined,
  ) {
    const rnd = mulberry32(0x1337);
    const n = cfg.fireflies ?? 0;
    for (let i = 0; i < n; i++) {
      this.motes.push({
        x: rnd() * mapW,
        y: rnd() * mapH,
        r: 0.4 + rnd() * 1.6,
        sp: 0.15 + rnd() * 0.5,
        ph: rnd() * Math.PI * 2,
        size: rnd() < 0.5 ? 1 : 2,
        warm: rnd() < 0.55,
      });
    }
    if (cfg.sway) {
      // low, slow pollen close to the ground
      for (let i = 0; i < Math.max(8, n >> 2); i++) {
        this.motes.push({
          x: rnd() * mapW,
          y: rnd() * mapH,
          r: 0.2 + rnd() * 0.5,
          sp: 0.05 + rnd() * 0.12,
          ph: rnd() * Math.PI * 2,
          size: 1,
          warm: true,
        });
      }
    }
    this.hasShadows = !!cfg.cloudShadows;
    for (let i = 0; i < 3; i++) {
      this.shadows.push({
        y: rnd() * mapH,
        w: 8 + rnd() * 10,
        h: 5 + rnd() * 6,
        sp: 0.25 + rnd() * 0.25,
        off: rnd() * (mapW + 30),
      });
    }
  }

  // dark drifting cloud shadows — drawn over the ground, under entities
  drawShadows(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    s: number,
    t: number,
  ) {
    if (!this.hasShadows) return;
    ctx.save();
    ctx.fillStyle = "rgba(10,14,30,0.17)";
    for (const sh of this.shadows) {
      const wx = ((sh.off + t * sh.sp) % (this.mapW + 40)) - 20;
      const cx = wx * s - camX;
      const cy = sh.y * s - camY;
      ctx.beginPath();
      ctx.ellipse(cx, cy, sh.w * s, sh.h * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // water sparkle on animated water tiles within the visible tile range
  drawWater(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    s: number,
    t: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) {
    if (!this.water) return;
    ctx.save();
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        if (!this.water[ty * this.mapW + tx]) continue;
        const wob = Math.sin(t * 1.7 + tx * 0.9 + ty * 0.6);
        const wob2 = Math.sin(t * 2.3 + tx * 0.4 - ty * 1.1);
        const bx = tx * s - camX;
        const by = ty * s - camY;
        ctx.fillStyle = "rgba(231,246,255,0.5)";
        if (wob > 0.25)
          ctx.fillRect(bx + s * 0.2, by + s * (0.3 + 0.12 * wob2), s * 0.34, Math.max(1, s * 0.06));
        if (wob2 > 0.55)
          ctx.fillRect(bx + s * 0.55, by + s * 0.62, s * 0.2, Math.max(1, s * 0.06));
      }
    }
    ctx.restore();
  }

  // glowing motes — drawn above everything except the interaction marker / UI
  drawMotes(
    ctx: CanvasRenderingContext2D,
    camX: number,
    camY: number,
    s: number,
    t: number,
  ) {
    if (!this.motes.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const m of this.motes) {
      const wx = m.x + Math.cos(t * m.sp + m.ph) * m.r;
      const wy = m.y + Math.sin(t * m.sp * 0.8 + m.ph * 1.3) * m.r * 0.7;
      const cx = wx * s - camX;
      const cy = wy * s - camY;
      const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 3 + m.ph * 5));
      const px = Math.max(1, Math.round(m.size * (s / 16) * 0.7));
      ctx.globalAlpha = 0.28 * tw;
      ctx.fillStyle = m.warm ? "#ffe9a8" : "#bff5e2";
      ctx.fillRect(cx - px, cy - px, px * 2, px * 2);
      ctx.globalAlpha = 0.85 * tw;
      ctx.fillRect(cx - px / 2, cy - px / 2, Math.max(1, px), Math.max(1, px));
    }
    ctx.restore();
  }
}
