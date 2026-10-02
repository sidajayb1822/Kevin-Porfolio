import { buildMap } from "./parse";
import type { MapDef } from "../../engine/types";
import type { ContinentId } from "../../data/continents";

const rows = [
  "TTTTTTTTTTTTTTTTTTTT",
  "T..................T",
  "T....*........*....T",
  "T..................T",
  "T........i.........T",
  "T........##........T",
  "T........##........T",
  "T....o...##........T",
  "T........##........T",
  "TTTTTTTTTTTTTTTTTTTT",
];

export function stubMap(id: ContinentId, title: string): MapDef {
  return buildMap({
    id: `${id}-stub`,
    rows,
    spawn: { x: 9, y: 8, facing: "up" },
    interactables: [
      {
        id: `${id}-sign`,
        x: 9,
        y: 4,
        kind: "sign",
        label: "Read",
        solid: true,
        dialogue: [
          `${title.toUpperCase()} IS STILL BEING BUILT.`,
          "Siddhant is drawing this continent right now.",
          "Press E at the pad — or ESC anywhere — to head back.",
        ],
      },
      {
        id: `${id}-portal`,
        x: 4,
        y: 7,
        kind: "portal",
        label: "Return",
        to: "select",
      },
    ],
  });
}
