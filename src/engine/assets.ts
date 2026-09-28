// Image asset loading for the overworld. Everything is cached at module scope
// (same pattern as generateWorld() / cloudSheetUrl()), so re-entering a
// continent is instant.

import playerUrl from "../assets/overworld/player.png";

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // decode() so the first canvas blit doesn't stall
      (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() =>
        resolve(img),
      );
    };
    img.onerror = () => reject(new Error(`failed to load ${url}`));
    img.src = url;
  });
}

let playerPromise: Promise<HTMLImageElement> | null = null;

// 48x128 sheet: 3 walk frames wide, 4 rows tall.
// Row order (top->bottom): down, left, right, up. Frames 16x32.
export function getPlayerSprite(): Promise<HTMLImageElement> {
  if (!playerPromise) playerPromise = loadImage(playerUrl);
  return playerPromise;
}

export const PLAYER_FRAME_W = 16;
export const PLAYER_FRAME_H = 32;
export const PLAYER_ROW: Record<"down" | "left" | "right" | "up", number> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};
