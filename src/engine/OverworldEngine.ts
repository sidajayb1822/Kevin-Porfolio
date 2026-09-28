import { palette } from "../lib/palette";
import { drawTile, T, SOLID_TILES } from "./tiles";
import { InputState } from "./input";
import { PLAYER_ROW } from "./assets";
import { AmbientFx } from "./fx";
import { makeCritters, type Critter } from "./entities";
import type { Dir, EngineCallbacks, Interactable, MapDef } from "./types";

const DIR_VEC: Record<Dir, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const MOVE_TIME = 0.16; // seconds per tile

export class OverworldEngine {
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private t = 0;
  private paused = false;
  private disposed = false;

  private input = new InputState();

  // player state in tile units
  private px: number;
  private py: number;
  private fromX: number;
  private fromY: number;
  private targetX: number;
  private targetY: number;
  private moving = false;
  private moveElapsed = 0;
  private facing: Dir;
  private stepFlip = false;
  private walkAcc = 0;

  private scale = 3; // integer zoom
  private solidGrid: Uint8Array;
  private interactableAt: Map<string, Interactable>;
  private critters: Critter[];
  private fx: AmbientFx | null;

  constructor(
    private canvas: HTMLCanvasElement,
    private map: MapDef,
    private cb: EngineCallbacks,
    private playerSprite: HTMLImageElement | null = null,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;

    this.px = map.spawn.x;
    this.py = map.spawn.y;
    this.fromX = this.px;
    this.fromY = this.py;
    this.targetX = this.px;
    this.targetY = this.py;
    this.facing = map.spawn.facing ?? "down";

    this.solidGrid = new Uint8Array(map.width * map.height);
    for (let i = 0; i < this.solidGrid.length; i++) {
      const solidByLayer =
        map.collision[i] === 1 ||
        map.water?.[i] === 1 || // image maps: water blocks movement
        SOLID_TILES.has(map.ground[i]) ||
        SOLID_TILES.has(map.decoration[i] ?? 0);
      this.solidGrid[i] = solidByLayer ? 1 : 0;
    }
    this.interactableAt = new Map();
    for (const it of map.interactables) {
      this.interactableAt.set(`${it.x},${it.y}`, it);
      if (it.solid) this.solidGrid[it.y * map.width + it.x] = 1;
    }

    this.critters = makeCritters(map.entities);
    this.fx = map.ambient
      ? new AmbientFx(map.width, map.height, map.ambient, map.water)
      : null;
  }

  start() {
    this.input.attach();
    this.resize();
    this.last = performance.now();
    this.loop(this.last);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.input.detach();
  }

  pause() {
    this.paused = true;
    // fully detach so keys meant for an open dialog/panel don't queue here
    this.input.detach();
  }

  resume() {
    this.paused = false;
    this.input.actionQueued = false;
    this.input.cancelQueued = false;
    this.input.attach();
    this.last = performance.now();
  }

  // used by touch controls
  getInput() {
    return this.input;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    // pick an integer scale so ~15 tiles are visible across the shorter axis
    const target = Math.min(w, h) / (15 * this.map.tileSize);
    this.scale = Math.max(2, Math.min(5, Math.round(target)));
  }

  private isSolid(tx: number, ty: number) {
    if (tx < 0 || ty < 0 || tx >= this.map.width || ty >= this.map.height)
      return true;
    return this.solidGrid[ty * this.map.width + tx] === 1;
  }

  private tryStartMove(dir: Dir) {
    this.facing = dir;
    const [dx, dy] = DIR_VEC[dir];
    const nx = Math.round(this.px) + dx;
    const ny = Math.round(this.py) + dy;
    if (this.isSolid(nx, ny)) return false;
    this.fromX = Math.round(this.px);
    this.fromY = Math.round(this.py);
    this.targetX = nx;
    this.targetY = ny;
    this.moving = true;
    this.moveElapsed = 0;
    return true;
  }

  private triggerAction() {
    const [dx, dy] = DIR_VEC[this.facing];
    const fx = Math.round(this.px) + dx;
    const fy = Math.round(this.py) + dy;
    const here = this.interactableAt.get(
      `${Math.round(this.px)},${Math.round(this.py)}`,
    );
    const it = this.interactableAt.get(`${fx},${fy}`) ?? here;
    if (it) this.cb.onInteract(it);
  }

  private update(dt: number) {
    this.t += dt;

    if (this.input.consumeCancel()) {
      const portal = [...this.interactableAt.values()].find(
        (i) => i.kind === "portal",
      );
      if (portal) this.cb.onInteract(portal);
      return;
    }

    if (!this.moving) {
      if (this.input.consumeAction()) {
        this.triggerAction();
        return;
      }
      const dir = this.input.bufferedDir();
      if (dir) this.tryStartMove(dir);
    }

    if (this.moving) {
      this.moveElapsed += dt;
      this.walkAcc += dt;
      const k = Math.min(1, this.moveElapsed / MOVE_TIME);
      this.px = this.fromX + (this.targetX - this.fromX) * k;
      this.py = this.fromY + (this.targetY - this.fromY) * k;
      if (k >= 1) {
        this.px = this.targetX;
        this.py = this.targetY;
        this.moving = false;
        this.stepFlip = !this.stepFlip;
        this.cb.onStep?.();
        // continue walking if a direction is still held
        const dir = this.input.currentDir();
        if (dir) this.tryStartMove(dir);
      }
    } else {
      this.walkAcc = 0;
    }
  }

  private render() {
    const ctx = this.ctx;
    const s = this.map.tileSize * this.scale;
    const viewW = this.canvas.clientWidth;
    const viewH = this.canvas.clientHeight;

    // camera centered on player, clamped to map bounds
    const playerPxX = this.px * s + s / 2;
    const playerPxY = this.py * s + s / 2;
    let camX = playerPxX - viewW / 2;
    let camY = playerPxY - viewH / 2;
    const maxX = this.map.width * s - viewW;
    const maxY = this.map.height * s - viewH;
    camX =
      maxX > 0
        ? Math.max(0, Math.min(camX, maxX))
        : (this.map.width * s - viewW) / 2;
    camY =
      maxY > 0
        ? Math.max(0, Math.min(camY, maxY))
        : (this.map.height * s - viewH) / 2;
    camX = Math.floor(camX);
    camY = Math.floor(camY);

    ctx.fillStyle = palette.deepSpace;
    ctx.fillRect(0, 0, viewW, viewH);

    const x0 = Math.max(0, Math.floor(camX / s));
    const y0 = Math.max(0, Math.floor(camY / s));
    const x1 = Math.min(this.map.width - 1, Math.ceil((camX + viewW) / s));
    const y1 = Math.min(this.map.height - 1, Math.ceil((camY + viewH) / s));

    if (this.map.image) {
      this.renderImageMap(ctx, s, camX, camY, x0, y0, x1, y1, playerPxX, playerPxY);
    } else {
      this.renderTileMap(ctx, s, camX, camY, x0, y0, x1, y1, playerPxX, playerPxY);
    }
  }

  private renderImageMap(
    ctx: CanvasRenderingContext2D,
    s: number,
    camX: number,
    camY: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    playerPxX: number,
    playerPxY: number,
  ) {
    const img = this.map.image!;
    const dw = img.ground.width * this.scale;
    const dh = img.ground.height * this.scale;
    ctx.drawImage(img.ground, 0, 0, img.ground.width, img.ground.height, -camX, -camY, dw, dh);

    this.fx?.drawShadows(ctx, camX, camY, s, this.t);
    this.fx?.drawWater(ctx, camX, camY, s, this.t, x0, y0, x1, y1);
    this.drawPortals(ctx, s, camX, camY);

    // y-sorted: critters + player, so feet-line overlaps read correctly
    const items: { y: number; draw: () => void }[] = this.critters.map((c) => ({
      y: c.baseY,
      draw: () => c.draw({ ctx, s, camX, camY, t: this.t }),
    }));
    items.push({
      y: this.py + 0.9,
      draw: () => this.drawPlayer(playerPxX - camX, playerPxY - camY),
    });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();

    ctx.drawImage(img.over, 0, 0, img.over.width, img.over.height, -camX, -camY, dw, dh);

    this.fx?.drawMotes(ctx, camX, camY, s, this.t);
    this.drawInteractMarker(ctx, s, camX, camY);
  }

  private renderTileMap(
    ctx: CanvasRenderingContext2D,
    s: number,
    camX: number,
    camY: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    playerPxX: number,
    playerPxY: number,
  ) {
    const drawLayer = (layer: number[] | undefined) => {
      if (!layer) return;
      for (let ty = y0; ty <= y1; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const id = layer[ty * this.map.width + tx];
          if (!id) continue;
          drawTile(ctx, id, tx * s - camX, ty * s - camY, s, tx, ty, this.t);
        }
      }
    };

    // ground fill first (so EMPTY decoration shows grass under trees etc.)
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const id = this.map.ground[ty * this.map.width + tx] || T.GRASS;
        drawTile(ctx, id, tx * s - camX, ty * s - camY, s, tx, ty, this.t);
      }
    }
    drawLayer(this.map.decoration);
    this.drawPortals(ctx, s, camX, camY);

    this.drawPlayer(playerPxX - camX, playerPxY - camY);
    drawLayer(this.map.overlay);
    this.drawInteractMarker(ctx, s, camX, camY);
  }

  private drawPortals(
    ctx: CanvasRenderingContext2D,
    s: number,
    camX: number,
    camY: number,
  ) {
    for (const it of this.interactableAt.values()) {
      if (it.kind !== "portal") continue;
      const cx = it.x * s - camX + s / 2;
      const cy = it.y * s - camY + s / 2;
      const pulse = 0.5 + 0.5 * Math.sin(this.t * 4);
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = palette.ink;
      ctx.beginPath();
      ctx.ellipse(cx, cy + s * 0.06, s * 0.46, s * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55 + 0.35 * pulse;
      ctx.fillStyle = palette.portal;
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * (0.4 + 0.03 * pulse), s * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.75 + 0.25 * pulse;
      ctx.fillStyle = palette.white;
      ctx.beginPath();
      ctx.ellipse(cx, cy, s * (0.2 + 0.06 * pulse), s * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawInteractMarker(
    ctx: CanvasRenderingContext2D,
    s: number,
    camX: number,
    camY: number,
  ) {
    const [fdx, fdy] = DIR_VEC[this.facing];
    const faceKey = `${Math.round(this.px) + fdx},${Math.round(this.py) + fdy}`;
    const facingIt = this.interactableAt.get(faceKey);
    if (!facingIt || this.moving) return;
    const bx = (Math.round(this.px) + fdx) * s - camX + s / 2;
    const by = (Math.round(this.py) + fdy) * s - camY - 4 * this.scale;
    const bob = Math.round(Math.sin(this.t * 6)) * this.scale;
    ctx.fillStyle = palette.ink;
    ctx.fillRect(
      bx - 3 * this.scale,
      by - 9 * this.scale + bob,
      6 * this.scale,
      9 * this.scale,
    );
    ctx.fillStyle = palette.gold;
    ctx.fillRect(
      bx - 2 * this.scale,
      by - 8 * this.scale + bob,
      2 * this.scale,
      5 * this.scale,
    );
    ctx.fillRect(
      bx - 2 * this.scale,
      by - 2 * this.scale + bob,
      2 * this.scale,
      2 * this.scale,
    );
  }

  private drawPlayer(cx: number, cy: number) {
    const ctx = this.ctx;
    const S = this.scale;

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(Math.round(cx - 5 * S), Math.round(cy - 1 * S), 10 * S, 3 * S);

    const spr = this.playerSprite;
    if (spr) {
      const fw = 16;
      const fh = 32;
      const row = PLAYER_ROW[this.facing];
      const frame = this.moving
        ? [1, 0, 1, 2][Math.floor(this.walkAcc / 0.09) % 4]
        : 1;
      const dw = fw * S;
      const dh = fh * S;
      const dx = Math.round(cx - dw / 2);
      const dy = Math.round(cy - dh + 5 * S);
      ctx.drawImage(spr, frame * fw, row * fh, fw, fh, dx, dy, dw, dh);
      return;
    }

    // primitive fallback (stub continents)
    const u = S;
    const w = 10 * u;
    const h = 14 * u;
    const x = Math.round(cx - w / 2);
    const y = Math.round(cy - h + 2 * u);
    const bob = this.moving && this.stepFlip ? -u : 0;

    ctx.fillStyle = palette.magenta;
    ctx.fillRect(x, y + 5 * u + bob, w, 7 * u);
    ctx.fillStyle = "#f7d9b5";
    ctx.fillRect(x + 1 * u, y + bob, w - 2 * u, 6 * u);
    ctx.fillStyle = palette.ink;
    ctx.fillRect(x + 1 * u, y + bob, w - 2 * u, 2 * u);

    ctx.fillStyle = palette.ink;
    if (this.facing === "down") {
      ctx.fillRect(x + 3 * u, y + 3 * u + bob, u, u);
      ctx.fillRect(x + w - 4 * u, y + 3 * u + bob, u, u);
    } else if (this.facing === "up") {
      ctx.fillRect(x + 1 * u, y + bob, w - 2 * u, 3 * u);
    } else if (this.facing === "left") {
      ctx.fillRect(x + 2 * u, y + 3 * u + bob, u, u);
    } else {
      ctx.fillRect(x + w - 3 * u, y + 3 * u + bob, u, u);
    }

    ctx.fillStyle = palette.ink;
    const stride = this.moving ? (this.stepFlip ? 1 : -1) : 0;
    ctx.fillRect(x + 1 * u + stride * u, y + 12 * u + bob, 3 * u, 2 * u);
    ctx.fillRect(x + w - 4 * u - stride * u, y + 12 * u + bob, 3 * u, 2 * u);
  }

  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.1) dt = 0.1;
    if (!this.paused) this.update(dt);
    this.render();
  };
}
