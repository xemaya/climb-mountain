import os
import math
from PIL import Image

def analyze_pixels(image_path):
    if not os.path.exists(image_path):
        print(f"File {image_path} not found")
        return
    
    img = Image.open(image_path).convert("RGBA")
    w, h = img.size
    center_x, center_y = w / 2.0, h / 2.0
    max_radius = min(w, h) / 2.0
    
    print(f"\nAnalyzing {os.path.basename(image_path)} pixels...")
    
    # We want to check alpha and color distribution in radial buckets
    buckets = 10
    bucket_data = {i: {"count": 0, "transparent": 0, "white": 0, "colored": 0} for i in range(buckets)}
    
    pixels = img.load()
    for y in range(h):
        for x in range(w):
            dx = x - center_x
            dy = y - center_y
            dist = math.sqrt(dx*dx + dy*dy) / max_radius
            
            bucket_idx = int(dist * buckets)
            if bucket_idx >= buckets:
                continue
                
            r, g, b, a = pixels[x, y]
            data = bucket_data[bucket_idx]
            data["count"] += 1
            
            if a == 0:
                data["transparent"] += 1
            else:
                # Check if it is white/light grey
                is_white = (r > 200 and g > 200 and b > 200)
                if is_white:
                    data["white"] += 1
                else:
                    data["colored"] += 1
                    
    for i in range(buckets):
        d_min = i / buckets
        d_max = (i + 1) / buckets
        data = bucket_data[i]
        total = data["count"]
        if total == 0:
            continue
        pct_trans = (data["transparent"] / total) * 100
        pct_white = (data["white"] / total) * 100
        pct_color = (data["colored"] / total) * 100
        print(f"Radius {d_min:.1f} - {d_max:.1f}: Total={total}, Trans={pct_trans:.1f}%, White={pct_white:.1f}%, Color={pct_color:.1f}%")

if __name__ == "__main__":
    assets_dir = "/Users/huanghaibin/Workspace/games/climb-mountain/src/assets"
    analyze_pixels(os.path.join(assets_dir, "listen_deity_btn.png"))
    analyze_pixels(os.path.join(assets_dir, "backfire_btn.png"))
