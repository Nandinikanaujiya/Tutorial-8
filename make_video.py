# make_video.py — Assembles recorded frames into high-quality animated demonstration
import os
import glob
from PIL import Image

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(CURRENT_DIR, "frames")
GIF_OUTPUT = os.path.join(CURRENT_DIR, "demonstration.gif")

frame_files = sorted(
    glob.glob(os.path.join(FRAMES_DIR, "frame_*.png")),
    key=lambda x: int(os.path.basename(x).split("_")[1].split(".")[0])
)

print(f"Loading {len(frame_files)} frames...")
if not frame_files:
    print("Error: No frames found to assemble.")
    exit(1)

images = []
for idx, f in enumerate(frame_files):
    img = Image.open(f).convert("RGBA")
    # Convert RGBA to P mode with adaptive palette for crisp GIF rendering
    img_p = img.convert("P", palette=Image.Palette.ADAPTIVE, colors=256)
    images.append(img_p)

# Save high quality GIF
images[0].save(
    GIF_OUTPUT,
    save_all=True,
    append_images=images[1:],
    duration=180,  # 180ms per frame
    loop=0,
    optimize=True
)

file_size_kb = os.path.getsize(GIF_OUTPUT) / 1024
print(f"Generated {GIF_OUTPUT} ({file_size_kb:.1f} KB)")
