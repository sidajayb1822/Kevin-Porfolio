import type { AmbientEntity } from "./types";

// Decorative critters: no collision, no pathing, just an idle animation. Drawn
// y-sorted with the player so they overlap correctly. Small hand-shaded pixel
// blobs — deliberately simple so they read as background life.

export interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  s: number; // tile size * scale, device px
  camX: number;
  camY: number;
  t: number;
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  c: string,
) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
}

export class Critter {
  private ph: number;
  constructor(private e: AmbientEntity) {
    this.ph = (e.x * 12.9898 + e.y * 78.233) % (Math.PI * 2);
  }

  // baseline used for y-sorting against the player (feet row)
  get baseY() {
    return this.e.y + 0.9;
  }

  draw({ ctx, s, camX, camY, t }: DrawCtx) {
    const u = s / 16;
    const bx = this.e.x * s - camX;
    const by = this.e.y * s - camY;
    const idle = this.e.idle ?? "bob";
    const breathe = Math.sin(t * 2 + this.ph);
    const bob = idle === "bob" ? Math.round(breathe) * u : 0;

    // soft shadow
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(bx + 3 * u, by + 12 * u, 10 * u, 3 * u);

    if (this.e.kind === "cat") {
      const squash = idle === "sleep" ? 1 + 0.06 * breathe : 1;
      const bodyY = by + 7 * u + bob;
      // curled body
      px(ctx, bx + 3 * u, bodyY, 10 * u, 5 * u * squash, "#8a6b45");
      px(ctx, bx + 2 * u, bodyY + 1 * u, 12 * u, 3 * u * squash, "#8a6b45");
      // tail wrap
      px(ctx, bx + 10 * u, bodyY + 2 * u, 4 * u, 2 * u, "#6b4f30");
      // head tucked
      px(ctx, bx + 3 * u, bodyY - 1 * u, 4 * u, 4 * u, "#8a6b45");
      // ears
      px(ctx, bx + 3 * u, bodyY - 2 * u, 1 * u, 1 * u, "#6b4f30");
      px(ctx, bx + 6 * u, bodyY - 2 * u, 1 * u, 1 * u, "#6b4f30");
      if (idle === "sleep") {
        // "z"
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + this.ph);
        px(ctx, bx + 12 * u, bodyY - 4 * u, 2 * u, 1 * u, "#f4ecd8");
        ctx.globalAlpha = 1;
      }
    } else {
      // bird — little body + head, periodic peck dip
      const peck =
        idle === "peck" ? Math.max(0, Math.sin(t * 4 + this.ph)) * 3 * u : bob;
      const bodyY = by + 8 * u - peck;
      px(ctx, bx + 5 * u, bodyY, 6 * u, 4 * u, "#5a6b7a");
      px(ctx, bx + 9 * u, bodyY - 1 * u, 3 * u, 3 * u, "#48586a");
      px(ctx, bx + 11 * u, bodyY, 2 * u, 1 * u, "#ffcb47"); // beak
      px(ctx, bx + 4 * u, bodyY + 1 * u, 2 * u, 2 * u, "#48586a"); // tail
      px(ctx, bx + 6 * u, bodyY + 4 * u, 1 * u, 2 * u, "#3a3a30"); // legs
      px(ctx, bx + 9 * u, bodyY + 4 * u, 1 * u, 2 * u, "#3a3a30");
    }
  }
}

export function makeCritters(list: AmbientEntity[] | undefined): Critter[] {
  return (list ?? []).map((e) => new Critter(e));
}
