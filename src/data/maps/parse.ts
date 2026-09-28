import { T } from "../../engine/tiles";
import type { Dir, Interactable, MapDef } from "../../engine/types";

// Each legend char -> [groundId, decorationId?]
export const LEGEND: Record<string, [number, number?]> = {
  ".": [T.GRASS],
  ",": [T.GRASS_DARK],
  "#": [T.PATH],
  "~": [T.WATER],
  "T": [T.GRASS, T.TREE],
  "^": [T.GRASS, T.CLIFF],
  "C": [T.CLIFF],
  "W": [T.WALL],
  "R": [T.ROOF],
  "f": [T.GRASS, T.FENCE],
  "*": [T.GRASS, T.FLOWER],
  "s": [T.SAND],
  "F": [T.FLOOR],
  "b": [T.FLOOR, T.BOOKSHELF],
  "p": [T.FLOOR, T.FRAME],
  "d": [T.FLOOR, T.DESK],
  "o": [T.GRASS, T.PORTAL],
  "i": [T.GRASS, T.SIGN],
};

interface BuildArgs {
  id: string;
  rows: string[];
  tileSize?: number;
  spawn: { x: number; y: number; facing?: Dir };
  interactables: Interactable[];
}

export function buildMap({
  id,
  rows,
  tileSize = 16,
  spawn,
  interactables,
}: BuildArgs): MapDef {
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const ground = new Array(width * height).fill(T.GRASS);
  const decoration = new Array(width * height).fill(0);
  const collision = new Array(width * height).fill(0);

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? ".";
      const entry = LEGEND[ch] ?? LEGEND["."];
      const idx = y * width + x;
      ground[idx] = entry[0];
      decoration[idx] = entry[1] ?? 0;
    }
  }

  return {
    id,
    width,
    height,
    tileSize,
    ground,
    decoration,
    collision,
    spawn,
    interactables,
  };
}
