import os
from PIL import Image

def find_opaque_whites(image_path):
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size
    print(f"\nChecking opaque light-colored pixels in {os.path.basename(image_path)}...")
    
    count_all = 0
    count_light = 0
    count_white = 0
    
    for y in range(h):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            if a > 0:
                count_all += 1
                # Is it light-colored?
                if r > 180 and g > 180 and b > 180:
                    count_light += 1
                if r > 240 and g > 240 and b > 240:
                    count_white += 1
                    
    print(f"Total non-transparent pixels: {count_all}")
    print(f"Non-transparent pixels with R,G,B > 180 (light grey/white): {count_light} ({count_light/count_all*100:.1f}%)")
    print(f"Non-transparent pixels with R,G,B > 240 (bright white): {count_white} ({count_white/count_all*100:.1f}%)")

if __name__ == "__main__":
    assets_dir = "/Users/huanghaibin/Workspace/games/climb-mountain/src/assets"
    find_opaque_whites(os.path.join(assets_dir, "listen_deity_btn.png"))
    find_opaque_whites(os.path.join(assets_dir, "backfire_btn.png"))
