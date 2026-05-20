"""Generate climb-mountain art assets via DeerAPI gpt-image-2.

Style: dark cosmic-horror snowy mountain. Cool palette (navy / teal accents)
with crimson reserved for danger (snow demon, slide indicators).

Usage:
    python gen_sprites.py                  # generate all missing
    python gen_sprites.py --force          # overwrite existing
    python gen_sprites.py mountain_bg hastur  # subset by stem name
"""

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

API_KEY = os.environ["DEERAPI_KEY"]
API_URL = "https://api.deerapi.com/v1/images/generations"
MODEL = "gpt-image-2"

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

STYLE_SUFFIX = (
    " Painted-illustration style, cosmic horror, dark snowy mountain mood. "
    "Limited palette: deep navy #0F1820, panel blue #1B2C3C, cyan accent #00A3B5, "
    "off-white #C8D6E4, blood crimson reserved for danger. "
    "Solid magenta #FF00FF background (will be removed). "
    "High contrast, painterly brushwork, sharp focal subject, no text, no UI elements."
)

PROMPTS = {
    "mountain_bg": (
        "A vertical wide composition of a sheer Cthulhu-haunted snow mountain seen from below, "
        "with mist coiling around impossible angles near the summit and a distant glowing rune "
        "etched into the rock. No climbers visible."
    ),
    "climber": (
        "Portrait bust of a lone mountaineer in heavy snow gear, frost on the goggles, "
        "axe slung over shoulder, ice on the parka, exhausted but resolute. Three-quarter view."
    ),
    "snow_demon": (
        "Portrait bust of a Cthulhu-influenced snow demon: tendrils of frost-flesh, "
        "burning crimson eye-slits in a featureless white mask, drifting snow around it. "
        "Three-quarter view, looming."
    ),
    "card_march_to_death": (
        "Tarot-card composition: a lone figure walking into a snowstorm toward a distant red light. "
        "Vertical card aspect, painterly, ominous."
    ),
    "card_armata_stare": (
        "Tarot-card composition: a giant frozen eye embedded in glacier ice, "
        "snowflakes orbiting like satellites. Vertical card aspect."
    ),
    "card_sasna_anomaly": (
        "Tarot-card composition: a fractal frost crystal collapsing into impossible geometry, "
        "thin red veins inside. Vertical card aspect."
    ),
    "card_continuous_pain": (
        "Tarot-card composition: bone-thin climber roped to ghostly twins of itself fading into snow. "
        "Vertical card aspect."
    ),
    "card_hastur": (
        "Tarot-card composition: a yellow-robed silhouette barely visible through a blizzard, "
        "wearing a featureless mask. Vertical card aspect, slight sickly yellow tint over the cool palette."
    ),
    "card_ithaqua": (
        "Tarot-card composition: a giant humanoid storm-shape descending from sky into a village, "
        "ice claws extended. Vertical card aspect."
    ),
}


def request_image(prompt: str, out_path: Path) -> None:
    payload = {
        "model": MODEL,
        "prompt": prompt + STYLE_SUFFIX,
        "n": 1,
        "size": "1024x1024",
        "response_format": "b64_json",
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.load(resp)
                b64 = body["data"][0]["b64_json"]
                out_path.write_bytes(base64.b64decode(b64))
                return
        except urllib.error.URLError as e:
            print(f"  retry {attempt + 1}/3 for {out_path.name}: {e}", file=sys.stderr)
            time.sleep(2 ** attempt)
    raise RuntimeError(f"failed to generate {out_path.name}")


def main(argv: list[str]) -> int:
    force = "--force" in argv
    args = [a for a in argv if not a.startswith("--")]
    targets = args if args else list(PROMPTS.keys())

    todo: list[tuple[str, str, Path]] = []
    for stem in targets:
        if stem not in PROMPTS:
            print(f"unknown stem: {stem}; valid: {', '.join(PROMPTS)}")
            return 1
        out = OUT_DIR / f"{stem}.png"
        if out.exists() and not force:
            print(f"skip {out.name} (already exists)")
            continue
        todo.append((stem, PROMPTS[stem], out))

    if not todo:
        print("nothing to generate")
        return 0

    print(f"generating {len(todo)} images...")
    with ThreadPoolExecutor(max_workers=3) as pool:
        futs = {pool.submit(request_image, prompt, out): stem for stem, prompt, out in todo}
        for fut in as_completed(futs):
            stem = futs[fut]
            try:
                fut.result()
                print(f"  + {stem}.png")
            except Exception as e:
                print(f"  ! {stem}.png - {e}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
