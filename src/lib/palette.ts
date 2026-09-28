// One limited palette drives the whole "neo-pixel" look — planet, map and
// overworld. Swap these hex values to re-skin the entire site.

export const palette = {
  // space / UI
  void: "#05060f",
  deepSpace: "#0b1026",
  ink: "#12132b",
  parchment: "#f4ecd8",
  parchmentDim: "#cdbf9a",
  shadow: "#1a1730",
  white: "#ffffff",

  // accents
  aurora: "#5ef0c4",
  magenta: "#ff5ea8",
  gold: "#ffcb47",
  violet: "#9b6bff",
  sky: "#63b7ff",

  // planet / terrain
  ocean: "#1f6fb2",
  oceanDeep: "#154c86",
  shore: "#f2d9a0",
  grass: "#4fae56",
  grassDark: "#3c8a45",
  grassLight: "#69c66f",
  forest: "#2f6b3c",
  path: "#c9a26b",
  pathDark: "#a9834f",
  rock: "#7d7791",
  rockDark: "#585269",
  ice: "#e7f6ff",
  water: "#3aa7d6",
  waterDark: "#2b86ad",
  portal: "#b98bff",

  // neo-pixel world map — a hard terrace ramp, sea -> peak
  seaAbyss: "#0d2f5c",
  seaDeep: "#154c86",
  sea: "#1f6fb2",
  seaShallow: "#3aa7d6",
  coast: "#f2d9a0",
  plains: "#4fae56",
  hills: "#3c8a45",
  highland: "#2f6b3c",
  peak: "#6a6577",
  peakHi: "#8f8aa0",
  snowCap: "#e7f6ff",
  landEdge: "#21301f",
} as const;

export type PaletteKey = keyof typeof palette;

// continent identity tints — bright, matching the overworld accent language
export const continentColors: Record<string, string> = {
  about: "#5ef0c4",
  general: "#9b6bff",
  gallery: "#ffcb47",
  portfolio: "#ff5ea8",
  other: "#63b7ff",
  contact: "#69c66f",
};
