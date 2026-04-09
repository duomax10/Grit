"""
Analyze the reference sprite sheet to identify all sprites and extract
key colors (hex codes) for grass, gravel, dirt, stone, etc.
"""
from PIL import Image
import numpy as np
from collections import Counter

img = Image.open('/home/user/Grit/public/assets/1775767237336.png')
right = img.crop((512, 0, 1024, 1024))
arr = np.array(right)

def get_dominant_colors(region, n=5):
    """Get the top N most common non-white colors in a region."""
    px = np.array(region.convert('RGB')).reshape(-1, 3)
    # Filter out near-white
    mask = ~((px[:, 0] > 240) & (px[:, 1] > 240) & (px[:, 2] > 240))
    px = px[mask]
    if len(px) == 0:
        return []
    # Quantize to reduce similar colors
    px = (px // 8) * 8
    colors = Counter(map(tuple, px))
    top = colors.most_common(n)
    return [(f'#{r:02x}{g:02x}{b:02x}', count) for (r, g, b), count in top]

def analyze_region(name, x1, y1, x2, y2):
    region = right.crop((x1, y1, x2, y2))
    colors = get_dominant_colors(region, 8)
    print(f'\n=== {name} ({x2-x1}x{y2-y1}) ===')
    for hex_color, count in colors:
        print(f'  {hex_color}: {count} pixels')
    return region

# Analyze each section
print('REFERENCE IMAGE ANALYSIS')
print('========================')

# Ground tiles - Row 1 (y ~14-132)
analyze_region('GRASS TILE', 11, 14, 130, 132)
analyze_region('GRAVEL TILE', 176, 14, 288, 132)

# Check the left half for the assembled scene to get accurate grass/path colors
left = img.crop((0, 0, 512, 1024))
left_arr = np.array(left)

# Sample grass from the left scene
print('\n\n=== SCENE GRASS COLORS (sampled from assembled view) ===')
# Sample from a known grass area on the left (away from path)
grass_area = left.crop((10, 400, 100, 500))
colors = get_dominant_colors(grass_area, 8)
for hex_color, count in colors:
    print(f'  {hex_color}: {count} pixels')

print('\n=== SCENE GRAVEL/PATH COLORS ===')
# Sample from the center path
path_area = left.crop((220, 400, 280, 500))
colors = get_dominant_colors(path_area, 8)
for hex_color, count in colors:
    print(f'  {hex_color}: {count} pixels')

print('\n=== SCENE DIRT COLORS ===')
# Sample from a dirt area (sides of path)
dirt_area = left.crop((150, 300, 200, 400))
colors = get_dominant_colors(dirt_area, 8)
for hex_color, count in colors:
    print(f'  {hex_color}: {count} pixels')

# Analyze individual sprites from the right side
print('\n\n=== INDIVIDUAL SPRITES ===')

# Transition tiles
analyze_region('TRANSITION BLOCK 1 (grass-gravel)', 0, 140, 132, 260)
analyze_region('TRANSITION BLOCK 2', 138, 140, 290, 260)
analyze_region('TRANSITION BLOCK 3 (grass-dirt)', 318, 140, 454, 260)

# Gravestones - Row 3-4
analyze_region('GRAVESTONE ROW 1', 0, 275, 500, 375)
analyze_region('GRAVESTONE ROW 2', 0, 385, 500, 495)

# Trees
analyze_region('TREES ROW', 0, 510, 510, 665)

# Large objects
analyze_region('LARGE OBJECTS ROW', 0, 665, 510, 840)

# Small details
analyze_region('DETAILS ROW', 0, 840, 500, 1000)

# Now get precise gravestone stone color
print('\n\n=== GRAVESTONE STONE COLOR ===')
stone_sample = right.crop((20, 290, 80, 360))
colors = get_dominant_colors(stone_sample, 5)
for hex_color, count in colors:
    print(f'  {hex_color}: {count} pixels')

# Fence color
print('\n=== FENCE COLOR ===')
fence_sample = right.crop((380, 680, 450, 800))
colors = get_dominant_colors(fence_sample, 5)
for hex_color, count in colors:
    print(f'  {hex_color}: {count} pixels')

# Tree trunk color
print('\n=== TREE TRUNK/BARK COLOR ===')
trunk_sample = right.crop((40, 580, 80, 650))
colors = get_dominant_colors(trunk_sample, 5)
for hex_color, count in colors:
    print(f'  {hex_color}: {count} pixels')

# Tree canopy color
print('\n=== TREE CANOPY COLOR ===')
canopy_sample = right.crop((20, 520, 100, 570))
colors = get_dominant_colors(canopy_sample, 5)
for hex_color, count in colors:
    print(f'  {hex_color}: {count} pixels')
