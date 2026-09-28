# Overworld art — attribution & license

The pixel art used by the **About Me** overworld map is derived from the
open-source [Tuxemon](https://github.com/Tuxemon/Tuxemon) project.

## Source

- **Tilesets:** `core_city_and_country`, `core_buildings`, `core_set pieces`,
  `core_outdoor`, `core_outdoor_nature`, `core_outdoor_water`
  (`mods/tuxemon/gfx/tilesets/` in the Tuxemon repo).
- **Map layout:** based on Tuxemon's `candy_town` map
  (`mods/tuxemon/maps/candy_town.tmx`).
- **Player sprite:** `adventurer` overworld sprite
  (`mods/tuxemon/sprites/adventurer.png`).

The files in this folder (`about-ground.png`, `about-over.png`, `player.png`)
are **derivative works**: the Tuxemon tilesets and map were composited /
flattened into single images at build time. `about-map.json` holds the derived
collision + water grid.

## License

Tuxemon **game assets** (art, maps, audio) are licensed under
**Creative Commons Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)**:
<https://creativecommons.org/licenses/by-sa/3.0/>

- **Attribution:** "The Tuxemon project and its contributors —
  https://github.com/Tuxemon/Tuxemon".
- **ShareAlike:** the derived images in this folder are likewise distributed
  under CC BY-SA 3.0. Anyone redistributing them must keep this notice and the
  same license.

Only the art in this folder is CC BY-SA 3.0. The rest of this repository's
source code is under its own license (see the repo root) and is unaffected —
CC BY-SA applies to the artwork, not to the code that renders it.

Tuxemon's **engine code** is GPLv3; none of it is used here. Only CC BY-SA 3.0
art assets were taken.
