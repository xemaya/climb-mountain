import os
import math
from PIL import Image, ImageFilter

def process_button_transparency(image_path, output_path):
    print(f"Applying advanced color-keying transparency to {image_path}...")
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    center_x = width / 2.0
    center_y = height / 2.0
    max_radius = min(width, height) / 2.0
    
    pixels = img.load()
    
    # Traverse all pixels and key out the background
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Compute normalized distance from center (0.0 to 1.0)
            dx = x - center_x
            dy = y - center_y
            dist = math.sqrt(dx*dx + dy*dy) / max_radius
            
            # 1. Hard crop everything outside the main circle
            if dist > 0.465:
                pixels[x, y] = (r, g, b, 0)
                continue
                
            # 2. Key out the solid white disc and checkerboard grid inside the outer bounds
            # Background checkerboard/white disc are light desaturated pixels (white/grey shades)
            if dist > 0.28:
                # Is it a light color?
                is_light = (r > 195 and g > 195 and b > 195)
                # Is it desaturated (grey/white)?
                is_desaturated = (abs(r - g) < 15 and abs(g - b) < 15 and abs(r - b) < 15)
                
                # Check for white disc or light grey checkerboard cells
                if is_light and is_desaturated:
                    pixels[x, y] = (r, g, b, 0)
                    continue
                    
                # Secondary pass: key out pure white or light highlights in the background
                if r > 220 and g > 220 and b > 220:
                    pixels[x, y] = (r, g, b, 0)
                    continue

    # Soften the edges to prevent jaggy borders
    # We do this by creating a feathered circular mask for the absolute boundaries
    feather_mask = Image.new("L", (width, height), 0)
    for y in range(height):
        for x in range(width):
            dx = x - center_x
            dy = y - center_y
            dist = math.sqrt(dx*dx + dy*dy) / max_radius
            if dist <= 0.455:
                feather_mask.putpixel((x, y), 255)
            elif dist <= 0.465:
                # Smooth transition from 255 to 0
                factor = (0.465 - dist) / 0.01
                feather_mask.putpixel((x, y), int(255 * factor))
                
    # Combine original alpha with our feather mask
    r, g, b, a = img.split()
    final_alpha = Image.new("L", (width, height), 0)
    for y in range(height):
        for x in range(width):
            original_a = a.getpixel((x, y))
            mask_a = feather_mask.getpixel((x, y))
            final_alpha.putpixel((x, y), min(original_a, mask_a))
            
    final_img = Image.merge("RGBA", (r, g, b, final_alpha))
    
    # Save the processed image back
    final_img.save(output_path, "PNG")
    print(f"Successfully processed transparency on {output_path}!")

if __name__ == "__main__":
    assets_dir = "/Users/huanghaibin/Workspace/games/climb-mountain/src/assets"
    
    deity_btn = os.path.join(assets_dir, "listen_deity_btn.png")
    backfire_btn = os.path.join(assets_dir, "backfire_btn.png")
    
    if os.path.exists(deity_btn):
        process_button_transparency(deity_btn, deity_btn)
    else:
        print("deity_btn not found")
        
    if os.path.exists(backfire_btn):
        process_button_transparency(backfire_btn, backfire_btn)
    else:
        print("backfire_btn not found")
