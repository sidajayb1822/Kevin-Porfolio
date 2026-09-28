import { create } from "zustand";
import { isContinentId, type ContinentId } from "../data/continents";

// Derive the starting phase from the URL so deep links land in the right place.
function initialFromUrl(): { phase: Phase; currentContinent: ContinentId | null } {
  if (typeof window === "undefined") return { phase: "space", currentContinent: null };
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts[0] === "world") {
    if (parts[1] && isContinentId(parts[1]))
      return { phase: "overworld", currentContinent: parts[1] };
    return { phase: "select", currentContinent: null };
  }
  return { phase: "space", currentContinent: null };
}

export type Phase =
  | "space" // globe in orbit, waiting for click
  | "diving" // camera dive toward the globe, clouds close in
  | "select" // pixel relief map, clouds parted, regions clickable
  | "entering" // camera descends into a region, flash, then overworld
  | "overworld" // walking around a continent
  | "panel"; // a content panel / dialogue is open on top of the overworld

interface GameState {
  phase: Phase;
  currentContinent: ContinentId | null;
  visited: Record<string, boolean>;
  muted: boolean;
  audioUnlocked: boolean;

  setPhase: (p: Phase) => void;
  beginDive: () => void;
  enterContinent: (id: ContinentId) => void;
  landInOverworld: () => void;
  openPanel: () => void;
  closePanel: () => void;
  returnToSelect: () => void;
  returnToSpace: () => void;

  toggleMute: () => void;
  unlockAudio: () => void;
}

const boot = initialFromUrl();

export const useGame = create<GameState>((set) => ({
  phase: boot.phase,
  currentContinent: boot.currentContinent,
  visited: boot.currentContinent ? { [boot.currentContinent]: true } : {},
  muted: true,
  audioUnlocked: false,

  setPhase: (p) => set({ phase: p }),
  beginDive: () => set({ phase: "diving" }),
  enterContinent: (id) =>
    set((s) => ({
      phase: "entering",
      currentContinent: id,
      visited: { ...s.visited, [id]: true },
    })),
  landInOverworld: () => set({ phase: "overworld" }),
  openPanel: () => set({ phase: "panel" }),
  closePanel: () => set({ phase: "overworld" }),
  returnToSelect: () => set({ phase: "select", currentContinent: null }),
  returnToSpace: () => set({ phase: "space", currentContinent: null }),

  toggleMute: () => set((s) => ({ muted: !s.muted })),
  unlockAudio: () => set({ audioUnlocked: true }),
}));

// expose phase for smoke tests / debugging
if (typeof window !== "undefined") {
  (window as unknown as { __phase?: string }).__phase = boot.phase;
  useGame.subscribe((s) => {
    (window as unknown as { __phase?: string }).__phase = s.phase;
  });
}
