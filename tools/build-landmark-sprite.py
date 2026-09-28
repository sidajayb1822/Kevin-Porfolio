#!/usr/bin/env python3
"""Assemble the About-Me 'beacon' landmark sprite from Tuxemon core_buildings tiles.

Mirrors the continent-select map landmark (3 stepped cottages + a beacon tower)
as a single sprite the overworld engine drops into the walkable About Me town.

Tuxemon game art is CC BY-SA 3.0 (tiles by Kelvin Shadewing). This derived
sprite is distributed under the same license - see
src/assets/overworld/LICENSE-ART.md.

Usage: python3 build-landmark-sprite.py [tilesets_dir] [out.png]
  tilesets_dir must contain core_buildings.png from the Tuxemon repo
  (mods/tuxemon/gfx/tilesets/). Fetch with e.g.
    curl -o core_buildings.png \
      https://raw.githubusercontent.com/Tuxemon/Tuxemon/development/mods/tuxemon/gfx/tilesets/core_buildings.png
"""
import sys
from PIL import Image

TS = sys.argv[1] if len(sys.argv) > 1 else "tux/gfx/tilesets"
OUT = sys.argv[2] if len(sys.argv) > 2 else "about-landmark.png"
TILE = 16

bld = Image.open(f"{TS}/core_buildings.png").convert("RGBA")

# source rects (px) in core_buildings.png, located by alpha connected-components:
TOWER     = (605, 230, 694, 344)   # beacon tower: lantern + gallery + shaft
COT_BROWN = (113, 309, 190, 400)   # peaked-roof log cabin  (~77 x 91)
COT_RED   = (193, 309, 270, 400)
COT_GREY  = (273, 309, 350, 400)

canvas = Image.new("RGBA", (192, 176), (0, 0, 0, 0))
# beacon tower rising behind, centred
canvas.alpha_composite(bld.crop(TOWER), (50, 2))
# three cottages in a staggered row across the front
canvas.alpha_composite(bld.crop(COT_BROWN), (0, 84))
canvas.alpha_composite(bld.crop(COT_GREY), (112, 84))
canvas.alpha_composite(bld.crop(COT_RED), (55, 74))

# trim to content, pad to whole tiles
b = canvas.getbbox()
x0, y0 = (b[0] // TILE) * TILE, (b[1] // TILE) * TILE
x1, y1 = -(-b[2] // TILE) * TILE, -(-b[3] // TILE) * TILE
sprite = canvas.crop((x0, y0, x1, y1))
sprite.save(OUT)
print(f"wrote {OUT}  {sprite.size[0]}x{sprite.size[1]}px  "
      f"{sprite.size[0] // TILE}x{sprite.size[1] // TILE} tiles")
