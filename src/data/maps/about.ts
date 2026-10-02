import type { MapDef } from "../../engine/types";
import { loadImage } from "../../engine/assets";
import groundUrl from "../../assets/overworld/about-ground.png";
import overUrl from "../../assets/overworld/about-over.png";
import mapMeta from "../../assets/overworld/about-map.json";

// About Me runs on a pre-baked image map (flattened Tuxemon tileset art — see
// src/assets/overworld/LICENSE-ART.md). `about-map.json` carries the derived
// collision + water grids; interactables, critters and ambient FX are authored
// here against the town's tile coordinates.

const META = mapMeta as {
  w: number;
  h: number;
  tile: number;
  collision: number[];
  water: number[];
};

let cached: MapDef | null = null;

export async function loadAboutMap(): Promise<MapDef> {
  if (cached) return cached;
  const [ground, over] = await Promise.all([
    loadImage(groundUrl),
    loadImage(overUrl),
  ]);

  const size = META.w * META.h;

  cached = {
    id: "about",
    width: META.w,
    height: META.h,
    tileSize: META.tile,
    ground: new Array(size).fill(0),
    decoration: new Array(size).fill(0),
    collision: META.collision,
    water: META.water,
    image: { ground, over },
    spawn: { x: 12, y: 38, facing: "up" },
    entities: [
      { kind: "cat", x: 26, y: 8, idle: "sleep" },
      { kind: "bird", x: 13, y: 32, idle: "peck" },
      { kind: "bird", x: 18, y: 32, idle: "peck" },
    ],
    ambient: { fireflies: 46, cloudShadows: true, sway: true },
    interactables: [
      {
        id: "about-sign",
        x: 10,
        y: 36,
        kind: "sign",
        label: "Read",
        solid: true,
        dialogue: [
          "WELCOME TO SIDDHANT'S WORLD.",
          "This town is ABOUT ME — wander it.",
          "Press E / SPACE at the fountain, the hall and the workshop to look closer.",
          "Press E at the glowing pad (or ESC anywhere) to return to orbit.",
        ],
      },
      {
        id: "about-bio",
        x: 6,
        y: 6,
        kind: "exhibit",
        label: "Examine",
        solid: true,
        contentId: "bio",
      },
      {
        id: "about-timeline",
        x: 22,
        y: 6,
        kind: "exhibit",
        label: "Examine",
        solid: true,
        contentId: "timeline",
      },
      {
        id: "about-skills",
        x: 16,
        y: 19,
        kind: "exhibit",
        label: "Examine",
        solid: true,
        contentId: "skills",
      },
      {
        id: "about-portal",
        x: 13,
        y: 37,
        kind: "portal",
        label: "Return",
        to: "select",
      },
    ],
  };
  return cached;
}
