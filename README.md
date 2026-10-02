# Siddhant's World

A neo-pixel 2.5D portfolio site. Orbit a pixel-art world globe → click it to dive
→ pixel clouds part down the middle → a full-screen terraced pixel relief map
(same toon material as the globe) → pick a region → into a Pokémon-style pixel
overworld where objects open content panels. One uniform CRT / neo-pixel look
throughout.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run preview  # serve the built site
```

## How it works

| Layer | Where |
| --- | --- |
| Scene state machine | `src/store/gameStore.ts` — `phase: space → diving → select → entering → overworld → panel` |
| URL sync (deep links, back/forward) | `src/routes.tsx` |
| World scene (globe + terraced relief map + clouds + camera), one persistent R3F canvas | `src/scenes/World/` |
| World geography — authored landmasses → terraced color + height textures, region positions | `src/scenes/World/worldgen.ts` (single source of truth) |
| Cel-shading gradient for `MeshToonMaterial` (globe + map) | `src/scenes/World/toon.ts` |
| Camera keyframes / fill-vs-fit framing + `uvToWorld` (with the polar crop) | `src/scenes/World/layout.ts`, `CameraRig.tsx` |
| Pixelation pass (`<Pixelation granularity={3}>`) | `src/scenes/World/WorldScene.tsx` |
| Pixel cloud curtain (horizontal split) | `src/scenes/World/CloudCurtain.tsx` + `clouds.ts` |
| CRT scanline + vignette (all phases) | `src/App.tsx` + `src/styles/crt-overlay.css` |
| Region hotspots + pixel-panel labels | `src/scenes/World/RegionMarkers.tsx` (meta from `src/data/continents.ts`) |
| Themed landmark per continent (globe + map) | `src/scenes/World/landmarks.tsx` — cottage/windmill/rotunda/tower/twin-huts/lighthouse, cel-shaded primitives; `GlobeLandmarks` plants them on the sphere via `uvToSphere` |
| Globe terrain relief | `src/scenes/World/Globe.tsx` CPU-displaces the sphere from `world.heightMap` + recomputes normals; poles tapered in `worldgen.ts` |
| Overworld (pixel grid walker) | `src/scenes/Overworld/` + `src/engine/` (custom 2D `<canvas>` engine) |
| Overworld art / player sprite / ambient FX | `src/engine/assets.ts` (loader), `src/engine/fx.ts` (fireflies, cloud shadows, water shimmer), `src/engine/entities.ts` (idle critters) |
| Maps | `src/data/maps/` — `about.ts` is a **baked image map** (`src/assets/overworld/`, `loadAboutMap()` async); `stub.ts` (the other continents) still uses `parse.ts` ASCII + `tiles.ts` primitives |
| Panel / dialogue content | `src/data/content/` |
| Palette (re-skin the whole site here) | `src/lib/palette.ts` — the `sea*` / `plains` / `hills` / `peak` / `landEdge` terrace ramp drives the map |

## Status — vertical slice

- **About Me** continent is fully playable (welcome sign + 3 exhibits + return
  pad) on a lush baked pixel-art town with ambient critters, fireflies, drifting
  cloud shadows and water shimmer.
- The other 5 continents show a "coming soon" stub map drawn with canvas
  primitives (`src/engine/tiles.ts`).
- **About Me copy is still placeholder** — search for `TODO` in
  `src/data/content/about.tsx`.

### About Me overworld art

The town art is **derived from [Tuxemon](https://github.com/Tuxemon/Tuxemon)**
(tilesets + the `candy_town` map + the `adventurer` player sprite), flattened to
`src/assets/overworld/about-{ground,over}.png` + a derived collision/water grid
in `about-map.json`. Tuxemon art is **CC BY-SA 3.0** — see
`src/assets/overworld/LICENSE-ART.md`. The baked images inherit share-alike; the
rest of the repo's code is unaffected. Interactables, critters and ambient FX are
authored in `src/data/maps/about.ts` against the town's tile coordinates.

## Adding a real continent

1. Author `src/data/maps/<id>.ts` — copy `stub.ts` for an ASCII/primitive map, or
   `about.ts` for a baked image map (bake pipeline lives in the scratchpad).
2. Add its content to `src/data/content/<id>.tsx` and register it in `content/index.ts`.
3. Set `ready: true` for that continent in `src/data/continents.ts`.
4. Return it from `loadMap()` in `src/data/maps/index.ts` (it's async).

## Tuning the world map

Geography is authored in `src/scenes/World/worldgen.ts`: `LANDMASSES` (Gaussian
metaball centres per continent) and `REGION_POS` (where each site's clickable
marker sits — must be on land and inside the visible frame). `sampleHeight()`
sets terrain elevation; the `grid` loop quantises it into 6 terrace bands
(`BAND_LIST`) that drive both the stepped `heightMap` (displacement) and the flat
band colours. The same generator feeds the globe and the flat relief map, so they
can't drift apart. Pixelation strength = `granularity` in `WorldScene.tsx`;
terrace step height = `displacementScale` in `ReliefMap.tsx`; cel banding =
`makeToonGradient` steps in `toon.ts`. Colours are the terrace-ramp tokens in
`src/lib/palette.ts`.

Globe relief: `GLOBE_BASE_R` / `GLOBE_RELIEF` in `layout.ts` (CPU displacement in
`Globe.tsx`); pole flattening is the `polar` fade in `worldgen.ts`'s height-texture
loop (kept outside the relief map's VCROP window). Landmark size: `GLOBE_SCALE` in
`landmarks.tsx`, `MAP_SCALE` in `RegionMarkers.tsx`. `uvToSphere` in `layout.ts`
must match three's `SphereGeometry` uv × the colour texture's `flipY`
(`theta = v·π`, `phi = u·2π`) — if a landmark drifts off its continent, that's the
knob.

## Controls

Arrows / WASD move · E / Space / Enter action · Esc back to the map · on-screen
D-pad appears on touch devices and narrow screens.
