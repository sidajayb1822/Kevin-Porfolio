# tools/

## bake-about-map.py

Regenerates the **About Me** overworld art in `src/assets/overworld/` from the
Tuxemon source (CC BY-SA 3.0 — see `src/assets/overworld/LICENSE-ART.md`).

It expects the Tuxemon tilesets + the `candy_town` map + the `adventurer` player
sprite laid out under a local `tux/` dir:

```
tux/maps/candy_town.tmx
tux/gfx/tilesets/{core_city_and_country,core_buildings,core_set pieces,core_outdoor,core_outdoor_nature,core_outdoor_water}.{tsx,png}
tux/sprites/adventurer.png
```

(fetch them from https://github.com/Tuxemon/Tuxemon `mods/tuxemon/…`).

```bash
pip install Pillow
python tools/bake-about-map.py
```

Outputs: `about-ground.png` (below player), `about-over.png` (above player),
`player.png`, and `about-map.json` (`{w,h,tile,collision[],water[]}`). The
collision grid comes from the map's Collisions object layer; `water[]` is a
colour heuristic (blue tiles, minus bridge planks) and the engine treats water as
solid. Interactable / critter / firefly placement is authored separately in
`src/data/maps/about.ts`.
