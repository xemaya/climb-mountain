import os
from PIL import Image

def inspect_coordinates(image_path):
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size
    print(f"\nCoarse color inspection of {os.path.basename(image_path)} (10x10 grid of center area):")
    # Inspect a grid of 15x15 pixels in the center area (around center)
    cx, cy = w // 2, h // 2
    step = w // 20
    for y_idx in range(-7, 8):
        y = cy + y_idx * step
        row_str = ""
        for x_idx in range(-7, 8):
            x = cx + x_idx * step
            r, g, b, a = img.getpixel((x, y))
            # Represent pixel with simple character
            if a == 0:
                row_str += " . " # transparent
            elif r > 220 and g > 220 and b > 220:
                row_str += " W " # white
            elif r > 180 and g > 180 and b > 180:
                row_str += " w " # light grey
            else:
                row_str += f" {r:02x}"[:3] # hex red value or colored
        print(row_str)

if __name__ == "__main__":
    assets_dir = "/Users/huanghaibin/Workspace/games/climb-mountain/src/assets"
    inspect_coordinates(os.path.join(assets_dir, "listen_deity_btn.png"))
