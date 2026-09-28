import type { MapDef } from "../../engine/types";
import { CONTINENT_BY_ID, type ContinentId } from "../continents";
import { loadAboutMap } from "./about";
import { stubMap } from "./stub";

// About Me loads a baked image map (async); the other continents use the
// synchronous primitive stub until they get built out.
export async function loadMap(id: ContinentId): Promise<MapDef> {
  if (id === "about") return loadAboutMap();
  return stubMap(id, CONTINENT_BY_ID[id].title);
}
