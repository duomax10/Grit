"""
Slice sprite sheet into individual game assets.
Positions determined from band analysis.
"""
from PIL import Image
import os
import numpy as np

img = Image.open('/home/user/Grit/public/assets/1775767237336.png')
right = img.crop((512, 0, 1024, 1024))

OUT_T = '/home/user/Grit/public/assets/tiles'
OUT_O = '/home/user/Grit/public/assets/objects'
os.makedirs(OUT_T, exist_ok=True)
os.makedirs(OUT_O, exist_ok=True)

def make_transparent(region):
    rgba = region.convert('RGBA')
    px = np.array(rgba)
    # White-ish pixels -> transparent
    mask = (px[:,:,0] > 242) & (px[:,:,1] > 242) & (px[:,:,2] > 242)
    px[mask] = [0, 0, 0, 0]
    result = Image.fromarray(px)
    bbox = result.getbbox()
    return result.crop(bbox) if bbox else result

def save_tile(x1, y1, x2, y2, path):
    s = right.crop((x1, y1, x2, y2))
    s.save(path)
    print(f'  TILE {path} ({s.size[0]}x{s.size[1]})')

def save_obj(x1, y1, x2, y2, path):
    s = make_transparent(right.crop((x1, y1, x2, y2)))
    s.save(path)
    print(f'  OBJ  {path} ({s.size[0]}x{s.size[1]})')

# ============================
# BAND 1: Base tiles (y ~14-132)
# ============================
print('=== Base Tiles ===')
save_tile(11, 14, 130, 132, f'{OUT_T}/grass-base.png')      # 119x118 dark green grass
save_tile(176, 14, 288, 132, f'{OUT_T}/gravel-base.png')    # gray gravel

# ============================
# BAND 2: Transition tiles (y ~140-260)
# These are grass-to-gravel and grass-to-dirt transitions
# 3 blocks of ~4 tiles each
# ============================
print('\n=== Transition Tiles ===')
# Block 1: top-left corners (grass-gravel)
# Row 1 of transitions: 2 tiles side by side ~y=140
save_tile(11, 140, 72, 200, f'{OUT_T}/trans-grass-gravel-tl.png')
save_tile(72, 140, 132, 200, f'{OUT_T}/trans-grass-gravel-tr.png')
# Row 2:
save_tile(11, 200, 72, 260, f'{OUT_T}/trans-grass-gravel-bl.png')
save_tile(72, 200, 132, 260, f'{OUT_T}/trans-grass-gravel-br.png')

# Block 2: middle transitions
save_tile(176, 140, 237, 200, f'{OUT_T}/trans-gravel-grass-tl.png')
save_tile(237, 140, 290, 200, f'{OUT_T}/trans-gravel-grass-tr.png')
save_tile(176, 200, 237, 260, f'{OUT_T}/trans-gravel-grass-bl.png')
save_tile(237, 200, 290, 260, f'{OUT_T}/trans-gravel-grass-br.png')

# Block 3: grass-dirt transitions
save_tile(332, 140, 393, 200, f'{OUT_T}/trans-grass-dirt-tl.png')
save_tile(393, 140, 454, 200, f'{OUT_T}/trans-grass-dirt-tr.png')
save_tile(332, 200, 393, 260, f'{OUT_T}/trans-grass-dirt-bl.png')
save_tile(393, 200, 454, 260, f'{OUT_T}/trans-grass-dirt-br.png')

# ============================
# BAND 3-4: Gravestones (y ~275-510)
# Row of 4 gravestones, then row of 4 more (including crypt)
# ============================
print('\n=== Gravestones ===')
# Row 1: 4 gravestones ~y=275-370
save_obj(5, 275, 100, 370, f'{OUT_O}/monument-0.png')      # rounded top
save_obj(110, 275, 200, 370, f'{OUT_O}/monument-1.png')     # cross top
save_obj(215, 275, 310, 370, f'{OUT_O}/monument-2.png')     # tall with cross
save_obj(330, 275, 420, 370, f'{OUT_O}/monument-3.png')     # cross inset

# Row 2: 4 more ~y=385-490
save_obj(5, 385, 100, 490, f'{OUT_O}/monument-4.png')       # cross headstone
save_obj(110, 385, 200, 490, f'{OUT_O}/monument-5.png')     # ornate/symbol
save_obj(215, 385, 330, 490, f'{OUT_O}/monument-6.png')     # crypt/mausoleum
save_obj(340, 385, 420, 490, f'{OUT_O}/monument-7.png')     # small simple

# ============================
# BAND 5: Trees and bushes (y ~510-660)
# ============================
print('\n=== Trees & Bushes ===')
save_obj(5, 510, 120, 660, f'{OUT_O}/tree-oak.png')         # green oak
save_obj(130, 510, 240, 660, f'{OUT_O}/dead-tree.png')      # dead tree
save_obj(250, 510, 340, 660, f'{OUT_O}/tree-evergreen.png') # pine/evergreen
save_obj(345, 510, 410, 620, f'{OUT_O}/bush.png')           # large bush
save_obj(410, 540, 460, 610, f'{OUT_O}/bush-small-1.png')   # small bush
save_obj(460, 550, 510, 610, f'{OUT_O}/bush-small-2.png')   # tiny bush

# ============================
# BAND 6-7: Fountain, House, Fence, Details (y ~660-900)
# ============================
print('\n=== Large Objects ===')
save_obj(5, 660, 170, 830, f'{OUT_O}/fountain.png')         # stone fountain
save_obj(180, 660, 370, 830, f'{OUT_O}/caretaker-house.png') # house
save_obj(380, 660, 450, 830, f'{OUT_O}/fence.png')          # fence section
save_obj(455, 660, 510, 830, f'{OUT_O}/fence-post.png')     # fence post/gate

print('\n=== Small Details ===')
save_obj(5, 840, 80, 900, f'{OUT_O}/rocks.png')             # scattered rocks
save_obj(100, 840, 180, 900, f'{OUT_O}/grass-tufts.png')    # grass tufts
save_obj(200, 840, 280, 900, f'{OUT_O}/fallen-leaves.png')  # dead leaves

print('\n=== Done! ===')
