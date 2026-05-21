import os
from PIL import Image

def verify_visual_transparency(image_path, output_path):
    if not os.path.exists(image_path):
        print(f"File {image_path} not found")
        return
    
    img = Image.open(image_path).convert("RGBA")
    # Create a solid bright red canvas of the same size
    red_canvas = Image.new("RGBA", img.size, (255, 0, 0, 255))
    # Paste the button image over the red canvas
    red_canvas.alpha_composite(img)
    # Save the composite image
    red_canvas.save(output_path)
    print(f"Composite saved to {output_path}. You can check it visually.")
    
    # Let's also check if there are any pixels in the composite that are white
    # (since the background is solid red, any remaining white pixels must belong to the button)
    w, h = red_canvas.size
    white_pixels = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = red_canvas.getpixel((x, y))
            if r > 200 and g > 200 and b > 200:
                white_pixels += 1
    print(f"Number of white/light pixels in composite: {white_pixels} ({white_pixels / (w*h) * 100:.2f}%)")

if __name__ == "__main__":
    assets_dir = "/Users/huanghaibin/Workspace/games/climb-mountain/src/assets"
    scratch_dir = "/Users/huanghaibin/.gemini/antigravity/scratch"
    os.makedirs(scratch_dir, exist_ok=True)
    
    verify_visual_transparency(
        os.path.join(assets_dir, "listen_deity_btn.png"),
        os.path.join(scratch_dir, "test_listen_composite.png")
    )
    verify_visual_transparency(
        os.path.join(assets_dir, "backfire_btn.png"),
        os.path.join(scratch_dir, "test_backfire_composite.png")
    )
