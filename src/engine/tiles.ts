import { palette } from "../lib/palette";

// Tile ids. v1 renders every tile with canvas primitives — no image atlas.
// To use real art later, swap drawTile() for an atlas blit keyed by the same ids.
export const T = {
  EMPTY: 0,
  GRASS: 1,
  GRASS_DARK: 2,
  PATH: 3,
  WATER: 4,
  TREE: 5,
  CLIFF: 6,
  WALL: 7,
  ROOF: 8,
  SIGN: 9,
  FLOWER: 10,
  PORTAL: 11,
  SAND: 12,
  BOOKSHELF: 13,
  FRAME: 14,
  DESK: 15,
  FLOOR: 16,
  FENCE: 17,
} as const;

export const SOLID_TILES = new Set<number>([
  T.WATER,
  T.TREE,
  T.CLIFF,
  T.WALL,
  T.ROOF,
  T.SIGN,
  T.BOOKSHELF,
  T.FRAME,
  T.DESK,
  T.FENCE,
]);

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
}

// draw a single tile at device px (x,y) with size s. `t` = elapsed seconds for anim.
export function drawTile(
  ctx: CanvasRenderingContext2D,
  id: number,
  x: number,
  y: number,
  s: number,
  gx: number,
  gy: number,
  t: number,
) {
  const u = s / 16; // sub-pixel unit
  const checker = (gx + gy) % 2 === 0;

  switch (id) {
    case T.GRASS:
    case T.GRASS_DARK: {
      px(ctx, x, y, s, s, id === T.GRASS ? palette.grass : palette.grassDark);
      // sparse blades
      const seed = (gx * 31 + gy * 17) % 7;
      if (seed === 0) px(ctx, x + 4 * u, y + 9 * u, 2 * u, 4 * u, palette.grassLight);
      if (seed === 3) px(ctx, x + 10 * u, y + 5 * u, 2 * u, 4 * u, palette.grassDark);
      break;
    }
    case T.PATH: {
      px(ctx, x, y, s, s, palette.path);
      // scattered pebbles instead of a loud checker
      const p = (gx * 13 + gy * 7) % 5;
      if (p === 0) px(ctx, x + 3 * u, y + 4 * u, 2 * u, 2 * u, palette.pathDark);
      if (p === 2) px(ctx, x + 10 * u, y + 9 * u, 2 * u, 2 * u, palette.pathDark);
      if (p === 3) px(ctx, x + 7 * u, y + 2 * u, 1 * u, 1 * u, palette.pathDark);
      break;
    }
    case T.SAND:
      px(ctx, x, y, s, s, palette.shore);
      break;
    case T.FLOOR:
      px(ctx, x, y, s, s, checker ? "#c98b5b" : "#b97b4d");
      break;
    case T.WATER: {
      px(ctx, x, y, s, s, palette.water);
      const wob = Math.sin(t * 2 + gx * 0.8 + gy * 0.5) > 0.3;
      px(ctx, x + 2 * u, y + (wob ? 4 : 8) * u, 6 * u, 1 * u, palette.ice);
      px(ctx, x + 9 * u, y + (wob ? 10 : 6) * u, 4 * u, 1 * u, palette.waterDark);
      break;
    }
    case T.TREE: {
      px(ctx, x, y, s, s, palette.grass);
      // trunk
      px(ctx, x + 7 * u, y + 10 * u, 3 * u, 5 * u, "#6b4a2b");
      // canopy: stepped blob so it reads as foliage, not a box
      px(ctx, x + 3 * u, y + 3 * u, 10 * u, 8 * u, palette.forest);
      px(ctx, x + 1 * u, y + 5 * u, 14 * u, 5 * u, palette.forest);
      px(ctx, x + 5 * u, y + 1 * u, 6 * u, 4 * u, palette.forest);
      // highlights
      px(ctx, x + 4 * u, y + 4 * u, 5 * u, 3 * u, palette.grassLight);
      px(ctx, x + 2 * u, y + 6 * u, 3 * u, 2 * u, palette.grassLight);
      // shade
      px(ctx, x + 10 * u, y + 7 * u, 4 * u, 3 * u, palette.grassDark);
      break;
    }
    case T.CLIFF: {
      px(ctx, x, y, s, s, palette.rock);
      px(ctx, x, y, s, 3 * u, palette.rockDark);
      px(ctx, x + 5 * u, y + 7 * u, 6 * u, 5 * u, palette.rockDark);
      break;
    }
    case T.WALL:
      px(ctx, x, y, s, s, "#caa27a");
      px(ctx, x, y + 7 * u, s, 1 * u, "#9c7550");
      px(ctx, x + 7 * u, y, 1 * u, s, "#9c7550");
      break;
    case T.ROOF:
      px(ctx, x, y, s, s, palette.magenta);
      px(ctx, x, y, s, 4 * u, "#d63e86");
      break;
    case T.FENCE:
      px(ctx, x, y + 4 * u, s, 2 * u, "#8a6b45");
      px(ctx, x + 3 * u, y + 2 * u, 2 * u, 10 * u, "#6b4f30");
      px(ctx, x + 11 * u, y + 2 * u, 2 * u, 10 * u, "#6b4f30");
      break;
    case T.SIGN: {
      px(ctx, x, y, s, s, palette.grass);
      px(ctx, x + 7 * u, y + 8 * u, 2 * u, 6 * u, "#6b4a2b");
      px(ctx, x + 2 * u, y + 2 * u, 12 * u, 8 * u, "#a9713f");
      px(ctx, x + 3 * u, y + 4 * u, 10 * u, 1 * u, palette.parchment);
      px(ctx, x + 3 * u, y + 6 * u, 7 * u, 1 * u, palette.parchment);
      break;
    }
    case T.FLOWER:
      px(ctx, x, y, s, s, palette.grass);
      px(ctx, x + 6 * u, y + 6 * u, 4 * u, 4 * u, palette.gold);
      px(ctx, x + 7 * u, y + 7 * u, 2 * u, 2 * u, palette.magenta);
      break;
    case T.PORTAL: {
      px(ctx, x, y, s, s, palette.grass);
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      px(ctx, x + 2 * u, y + 2 * u, 12 * u, 12 * u, palette.portal);
      ctx.globalAlpha = 0.4 + 0.4 * pulse;
      px(ctx, x + 4 * u, y + 4 * u, 8 * u, 8 * u, palette.white);
      ctx.globalAlpha = 1;
      break;
    }
    case T.BOOKSHELF:
      px(ctx, x, y, s, s, "#7a4f2c");
      for (let r = 0; r < 3; r++) {
        px(ctx, x + 2 * u, y + (2 + r * 4) * u, 12 * u, 3 * u, "#5a3a20");
        px(ctx, x + 3 * u, y + (2 + r * 4) * u, 2 * u, 3 * u, palette.aurora);
        px(ctx, x + 6 * u, y + (2 + r * 4) * u, 2 * u, 3 * u, palette.gold);
        px(ctx, x + 9 * u, y + (2 + r * 4) * u, 2 * u, 3 * u, palette.magenta);
      }
      break;
    case T.FRAME:
      px(ctx, x, y, s, s, palette.grassDark);
      px(ctx, x + 2 * u, y + 1 * u, 12 * u, 11 * u, palette.gold);
      px(ctx, x + 4 * u, y + 3 * u, 8 * u, 7 * u, palette.sky);
      px(ctx, x + 5 * u, y + 7 * u, 6 * u, 3 * u, palette.grassLight);
      break;
    case T.DESK:
      px(ctx, x, y, s, s, palette.grass);
      px(ctx, x + 1 * u, y + 4 * u, 14 * u, 9 * u, "#8a5a34");
      px(ctx, x + 3 * u, y + 1 * u, 6 * u, 5 * u, palette.parchment);
      px(ctx, x + 10 * u, y + 2 * u, 4 * u, 4 * u, palette.aurora);
      break;
    default:
      // EMPTY -> leave whatever is under it (caller fills background)
      break;
  }
}
