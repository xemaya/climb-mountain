import os
from PIL import Image

def inspect_image(path):
    if not os.path.exists(path):
        print(f"Path {path} does not exist")
        return
    img = Image.open(path)
    print(f"Image {os.path.basename(path)}: Size={img.size}, Mode={img.mode}")
    img_rgba = img.convert("RGBA")
    
    # Sample a grid of pixels
    w, h = img_rgba.size
    print("Sampling alpha channel values at different key locations:")
    points = [
        ("Top-Left corner (10%, 10%)", int(w * 0.1), int(h * 0.1)),
        ("Top Edge (50%, 5%)", int(w * 0.5), int(h * 0.05)),
        ("Center (50%, 50%)", int(w * 0.5), int(h * 0.5)),
        ("Outer edge inside radius (50%, 15%)", int(w * 0.5), int(h * 0.15)),
        ("Near boundary (50%, 6%)", int(w * 0.5), int(h * 0.06)),
        ("Corner (5%, 5%)", int(w * 0.05), int(h * 0.05))
    ]
    for name, x, y in points:
        pixel = img_rgba.getpixel((x, y))
        print(f"  {name} at ({x}, {y}): RGBA={pixel}")

if __name__ == "__main__":
    assets_dir = "/Users/huanghaibin/Workspace/games/climb-mountain/src/assets"
    inspect_image(os.path.join(assets_dir, "listen_deity_btn.png"))
    inspect_image(os.path.join(assets_dir, "backfire_btn.png"))
