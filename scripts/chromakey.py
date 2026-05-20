"""Remove the magenta (#FF00FF) background from PNG sprites - make it transparent.

Usage:
    python chromakey.py                       # process all PNGs in src/assets/
    python chromakey.py climber snow_demon    # process specific stems
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src" / "assets"


def chroma_key(path: Path, threshold: int = 70) -> None:
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    assert pixels is not None
    w, h = img.size
    removed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            if r > 200 and g < threshold and b > 200:
                pixels[x, y] = (0, 0, 0, 0)
                removed += 1
    img.save(path)
    pct = removed * 100 // (w * h) if w * h else 0
    print(f"  {path.name}: cleared {removed} / {w * h} pixels ({pct}%)")


def main(argv: list[str]) -> int:
    if argv:
        targets = [ASSETS / f"{stem}.png" for stem in argv]
    else:
        targets = sorted(ASSETS.glob("*.png"))
    for path in targets:
        if not path.exists():
            print(f"missing: {path}", file=sys.stderr)
            continue
        chroma_key(path)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
