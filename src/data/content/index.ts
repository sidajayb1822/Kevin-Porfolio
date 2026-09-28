import type { ContinentId } from "../continents";
import { aboutContent, type PanelContent } from "./about";

export type { PanelContent };

// Per-continent content registries. Only "about" is populated for the slice.
export const CONTENT: Partial<Record<ContinentId, Record<string, PanelContent>>> = {
  about: aboutContent,
};

export function getContent(
  continent: ContinentId,
  contentId: string,
): PanelContent | undefined {
  return CONTENT[continent]?.[contentId];
}
