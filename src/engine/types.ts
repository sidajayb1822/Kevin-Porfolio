import type { ContinentId } from "../data/continents";

export type Dir = "up" | "down" | "left" | "right";

export type InteractKind = "sign" | "exhibit" | "portal";

export interface Interactable {
  id: string;
  // tile the player must stand on / face toward to trigger it
  x: number;
  y: number;
  kind: InteractKind;
  label: string;
  // sign: lines of dialogue
  dialogue?: string[];
  // exhibit: key into the continent's content map
  contentId?: string;
  // portal: where it leads
  to?: ContinentId | "select";
  solid?: boolean; // block movement onto this tile
}

// Decorative, idle-only critter placed on the map (no pathing, no collision).
export interface AmbientEntity {
  kind: "cat" | "bird";
  x: number;
  y: number;
  idle?: "bob" | "peck" | "sleep";
}

export interface AmbientConfig {
  fireflies?: number; // count of drifting motes
  cloudShadows?: boolean; // slow shadows scrolling across the map
  sway?: boolean; // gentle wind wobble on the image map
}

// A pre-baked image map (About Me): flattened tileset art + derived grids,
// used instead of the per-tile `ground`/`decoration` primitive renderer.
export interface ImageMap {
  ground: HTMLImageElement; // full map, below the player
  over: HTMLImageElement; // "above player" layer (canopy / roof fronts)
}

export interface MapDef {
  id: string;
  width: number;
  height: number;
  tileSize: number;
  // flat arrays of length width*height, tile ids (see engine/tiles.ts)
  ground: number[];
  decoration: number[];
  collision: number[]; // 1 = solid
  overlay?: number[]; // drawn above the player
  spawn: { x: number; y: number; facing?: Dir };
  interactables: Interactable[];
  // optional: pre-baked image map + ambient life (About Me continent)
  image?: ImageMap;
  water?: number[]; // 1 = animated water tile (image maps only)
  entities?: AmbientEntity[];
  ambient?: AmbientConfig;
}

export interface EngineCallbacks {
  onInteract: (it: Interactable) => void;
  onStep?: () => void;
}
