export type ContinentId =
  | "about"
  | "general"
  | "gallery"
  | "portfolio"
  | "other"
  | "contact";

export interface Continent {
  id: ContinentId;
  title: string;
  subtitle: string;
  landmass: string; // which world-map landmass it sits on
  ready: boolean; // false -> "coming soon" stub map
}

// Map position (u,v on the equirect world) lives in scenes/World/worldgen.ts
// (REGION_POS) so geography stays in one place.
export const CONTINENTS: Continent[] = [
  {
    id: "about",
    title: "About Me",
    subtitle: "Who Siddhant is",
    landmass: "Heartland",
    ready: true,
  },
  {
    id: "general",
    title: "General",
    subtitle: "Inspiration & sketches",
    landmass: "Heartland",
    ready: false,
  },
  {
    id: "gallery",
    title: "Gallery",
    subtitle: "Finished projects",
    landmass: "Ember Isles",
    ready: false,
  },
  {
    id: "portfolio",
    title: "Portfolio",
    subtitle: "Curated projects",
    landmass: "Heartland",
    ready: false,
  },
  {
    id: "other",
    title: "Other",
    subtitle: "Collaboration projects",
    landmass: "Westland",
    ready: false,
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Say hello",
    landmass: "Frostcap",
    ready: false,
  },
];

export const CONTINENT_BY_ID: Record<ContinentId, Continent> = Object.fromEntries(
  CONTINENTS.map((c) => [c.id, c]),
) as Record<ContinentId, Continent>;

export function isContinentId(v: string | undefined): v is ContinentId {
  return !!v && v in CONTINENT_BY_ID;
}
