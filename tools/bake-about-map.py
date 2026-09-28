import base64, zlib, struct, os, json
import xml.etree.ElementTree as ET
from PIL import Image

ROOT = os.path.dirname(__file__)
TSDIR = os.path.join(ROOT, "tux/gfx/tilesets")
MAP = os.path.join(ROOT, "tux/maps/candy_town.tmx")
DEST = os.path.abspath(os.path.join(ROOT, "../src/assets/overworld"))
os.makedirs(DEST, exist_ok=True)

GIDMASK = 0x1FFFFFFF
FLIP_H, FLIP_V, FLIP_D = 0x80000000, 0x40000000, 0x20000000

m = ET.parse(MAP).getroot()
MW, MH = int(m.get("width")), int(m.get("height"))
TS = int(m.get("tilewidth"))

tilesets = []
for ts in m.findall("tileset"):
    fg = int(ts.get("firstgid"))
    src = ts.get("source")
    if src:
        tsx = ET.parse(os.path.join(TSDIR, os.path.basename(src))).getroot()
        cols, cnt = int(tsx.get("columns")), int(tsx.get("tilecount"))
        img = tsx.find("image").get("source")
    else:
        cols, cnt = int(ts.get("columns")), int(ts.get("tilecount"))
        img = ts.find("image").get("source")
    im = Image.open(os.path.join(TSDIR, os.path.basename(img))).convert("RGBA")
    tilesets.append((fg, cols, im, cnt))
tilesets.sort(key=lambda t: t[0])

def resolve(gid):
    raw = gid & GIDMASK
    if raw == 0:
        return None
    fh, fv, fd = bool(gid & FLIP_H), bool(gid & FLIP_V), bool(gid & FLIP_D)
    chosen = None
    for fgv, colsv, imv, cntv in tilesets:
        if fgv <= raw < fgv + cntv:
            chosen = (fgv, colsv, imv)
    if not chosen:
        for fgv, colsv, imv, cntv in tilesets:
            if raw >= fgv:
                chosen = (fgv, colsv, imv)
    fgv, colsv, imv = chosen
    lid = raw - fgv
    sx, sy = (lid % colsv) * TS, (lid // colsv) * TS
    t = imv.crop((sx, sy, sx + TS, sy + TS))
    if fd:
        t = t.transpose(Image.TRANSPOSE)
    if fh:
        t = t.transpose(Image.FLIP_LEFT_RIGHT)
    if fv:
        t = t.transpose(Image.FLIP_TOP_BOTTOM)
    return t

def decode_layer(layer):
    data = layer.find("data")
    b = base64.b64decode(data.text.strip())
    comp = data.get("compression")
    if comp in ("zlib", "gzip"):
        b = zlib.decompress(b, 47)
    n = MW * MH
    return struct.unpack("<%dI" % n, b[: n * 4])

ground = Image.new("RGBA", (MW * TS, MH * TS), (0, 0, 0, 0))
over = Image.new("RGBA", (MW * TS, MH * TS), (0, 0, 0, 0))
for layer in m.findall("layer"):
    name = (layer.get("name") or "").lower()
    target = over if ("above" in name or "overlay" in name) else ground
    for i, gid in enumerate(decode_layer(layer)):
        if gid == 0:
            continue
        t = resolve(gid)
        if t is None:
            continue
        target.alpha_composite(t, ((i % MW) * TS, (i // MW) * TS))

collision = [0] * (MW * MH)
for og in m.findall("objectgroup"):
    if "collision" not in (og.get("name") or "").lower():
        continue
    for obj in og.findall("object"):
        ox, oy = float(obj.get("x", 0)), float(obj.get("y", 0))
        ow, oh = float(obj.get("width", 0) or 0), float(obj.get("height", 0) or 0)
        if ow == 0 or oh == 0:
            tx, ty = int(ox // TS), int(oy // TS)
            if 0 <= tx < MW and 0 <= ty < MH:
                collision[ty * MW + tx] = 1
            continue
        for ty in range(int(oy // TS), int((oy + oh - 1) // TS) + 1):
            for tx in range(int(ox // TS), int((ox + ow - 1) // TS) + 1):
                if 0 <= tx < MW and 0 <= ty < MH:
                    collision[ty * MW + tx] = 1

px = ground.load()
water = [0] * (MW * MH)
for ty in range(MH):
    for tx in range(MW):
        blue = samp = 0
        for dy in range(2, TS, 3):
            for dx in range(2, TS, 3):
                r, g, b, a = px[tx * TS + dx, ty * TS + dy]
                samp += 1
                if a > 200 and b > 120 and b > r + 35 and b >= g - 10:
                    blue += 1
        if samp and blue / samp > 0.55:
            water[ty * MW + tx] = 1

# un-flag bridge / dock tiles (visible brown planks over water) so they stay walkable
for ty in range(MH):
    for tx in range(MW):
        if not water[ty * MW + tx]:
            continue
        brown = 0
        for dy in range(2, TS, 3):
            for dx in range(2, TS, 3):
                r, g, b, a = px[tx * TS + dx, ty * TS + dy]
                if a > 200 and r > 90 and r > b + 10 and 40 < g < 170 and b < 120:
                    brown += 1
        if brown >= 4:
            water[ty * MW + tx] = 0

ground.save(os.path.join(DEST, "about-ground.png"))
over.save(os.path.join(DEST, "about-over.png"))
json.dump({"w": MW, "h": MH, "tile": TS, "collision": collision, "water": water},
          open(os.path.join(DEST, "about-map.json"), "w"))

# player: vendor adventurer.png as-is (48x128 = 3 frames x [down,left,right,up], 16x32)
Image.open(os.path.join(ROOT, "tux/sprites/adventurer.png")).convert("RGBA").save(
    os.path.join(DEST, "player.png"))

print("wrote to", DEST)
print("solids", sum(collision), "water", sum(water), "map", MW, "x", MH)
