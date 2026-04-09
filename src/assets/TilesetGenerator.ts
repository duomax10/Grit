/**
 * Generates all graveyard tileset and object sprites.
 * Gritty, dark atmosphere — muted greens, grays, deep shadows.
 */

const TILE = 32;

// Graveyard color palette
const PAL = {
  grassDark: '#1a2a12',
  grass: '#243818',
  grassLight: '#2e4420',
  grassAccent: '#1e3014',
  dirtDark: '#2a2018',
  dirt: '#3a3028',
  dirtLight: '#4a3e30',
  stoneDark: '#3a3a3e',
  stone: '#5a5a60',
  stoneLight: '#7a7a82',
  stoneMoss: '#3a4a30',
  fenceMetal: '#4a4a50',
  fenceMetalDark: '#2a2a30',
  fenceMetalLight: '#6a6a72',
  fenceRust: '#5a3828',
  woodDark: '#2a1e14',
  wood: '#3e2e1e',
  woodLight: '#5a4430',
  roofDark: '#2a2228',
  roof: '#3e343e',
  roofLight: '#524a52',
  windowGlow: '#4a4028',
  windowGlowBright: '#6a6038',
  black: '#0a0a0a',
  fogLight: 'rgba(180, 190, 200, 0.08)',
  deadLeaf: '#3a2a18',
};

function setPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

// --- GRASS TILES ---
function drawGrassTile(ctx: CanvasRenderingContext2D, ox: number, oy: number, variant: number) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = noise(x + variant * 100, y + variant * 50);
      let color: string;
      if (n < 0.15) color = PAL.grassDark;
      else if (n < 0.5) color = PAL.grass;
      else if (n < 0.75) color = PAL.grassAccent;
      else if (n < 0.92) color = PAL.grassLight;
      else color = PAL.grassDark; // random dark spots
      setPixel(ctx, ox + x, oy + y, color);
    }
  }
  // Occasional dead leaf
  if (variant === 1) {
    setPixel(ctx, ox + 8, oy + 14, PAL.deadLeaf);
    setPixel(ctx, ox + 9, oy + 14, PAL.deadLeaf);
    setPixel(ctx, ox + 9, oy + 15, PAL.deadLeaf);
  }
  if (variant === 2) {
    setPixel(ctx, ox + 22, oy + 8, PAL.deadLeaf);
    setPixel(ctx, ox + 23, oy + 9, PAL.deadLeaf);
  }
}

// --- DIRT PATH TILES ---
function drawDirtTile(ctx: CanvasRenderingContext2D, ox: number, oy: number, variant: number) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const n = noise(x + variant * 200, y + variant * 70);
      let color: string;
      if (n < 0.2) color = PAL.dirtDark;
      else if (n < 0.6) color = PAL.dirt;
      else if (n < 0.85) color = PAL.dirtLight;
      else color = PAL.dirtDark;
      setPixel(ctx, ox + x, oy + y, color);
    }
  }
}

// --- GRAVESTONE SPRITES ---
function drawGravestone1(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // Classic rounded top gravestone
  const C = PAL;
  // Base dirt mound
  for (let x = 8; x <= 23; x++) setPixel(ctx, ox + x, oy + 28, C.dirtDark);
  for (let x = 6; x <= 25; x++) {
    setPixel(ctx, ox + x, oy + 29, C.dirtDark);
    setPixel(ctx, ox + x, oy + 30, C.dirt);
    setPixel(ctx, ox + x, oy + 31, C.grass);
  }
  // Stone body
  for (let y = 10; y <= 27; y++) {
    for (let x = 11; x <= 20; x++) {
      if (x === 11) setPixel(ctx, ox + x, oy + y, C.stoneDark);
      else if (x === 20) setPixel(ctx, ox + x, oy + y, C.stoneDark);
      else if (x <= 13) setPixel(ctx, ox + x, oy + y, C.stone);
      else setPixel(ctx, ox + x, oy + y, y <= 15 ? C.stoneLight : C.stone);
    }
  }
  // Rounded top
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 9, C.stone);
  for (let x = 13; x <= 18; x++) setPixel(ctx, ox + x, oy + 8, C.stoneLight);
  for (let x = 14; x <= 17; x++) setPixel(ctx, ox + x, oy + 7, C.stoneLight);
  // Moss
  setPixel(ctx, ox + 12, oy + 22, C.stoneMoss);
  setPixel(ctx, ox + 13, oy + 23, C.stoneMoss);
  setPixel(ctx, ox + 12, oy + 23, C.stoneMoss);
  // Crack
  setPixel(ctx, ox + 16, oy + 12, C.stoneDark);
  setPixel(ctx, ox + 17, oy + 13, C.stoneDark);
  setPixel(ctx, ox + 17, oy + 14, C.stoneDark);
  setPixel(ctx, ox + 16, oy + 15, C.stoneDark);
}

function drawGravestone2(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // Cross-shaped gravestone
  const C = PAL;
  // Base
  for (let x = 8; x <= 23; x++) {
    setPixel(ctx, ox + x, oy + 29, C.dirtDark);
    setPixel(ctx, ox + x, oy + 30, C.dirt);
    setPixel(ctx, ox + x, oy + 31, C.grass);
  }
  // Vertical beam
  for (let y = 5; y <= 28; y++) {
    for (let x = 13; x <= 18; x++) {
      if (x === 13 || y === 28) setPixel(ctx, ox + x, oy + y, C.stoneDark);
      else if (x === 18) setPixel(ctx, ox + x, oy + y, C.stoneDark);
      else setPixel(ctx, ox + x, oy + y, y <= 10 ? C.stoneLight : C.stone);
    }
  }
  // Horizontal beam
  for (let x = 9; x <= 22; x++) {
    for (let y = 11; y <= 14; y++) {
      if (y === 11) setPixel(ctx, ox + x, oy + y, C.stoneLight);
      else if (y === 14) setPixel(ctx, ox + x, oy + y, C.stoneDark);
      else setPixel(ctx, ox + x, oy + y, C.stone);
    }
  }
  // Moss on cross
  setPixel(ctx, ox + 14, oy + 24, C.stoneMoss);
  setPixel(ctx, ox + 15, oy + 25, C.stoneMoss);
}

function drawGravestone3(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // Tilted, cracked gravestone
  const C = PAL;
  // Base
  for (let x = 6; x <= 25; x++) {
    setPixel(ctx, ox + x, oy + 29, C.dirtDark);
    setPixel(ctx, ox + x, oy + 30, C.dirt);
    setPixel(ctx, ox + x, oy + 31, C.grass);
  }
  // Tilted stone body (leaning right)
  for (let y = 10; y <= 28; y++) {
    const tilt = Math.floor((28 - y) * 0.15);
    for (let x = 11; x <= 20; x++) {
      const tx = x + tilt;
      if (tx >= 0 && tx < 32) {
        if (x === 11) setPixel(ctx, ox + tx, oy + y, C.stoneDark);
        else if (x === 20) setPixel(ctx, ox + tx, oy + y, C.stoneDark);
        else setPixel(ctx, ox + tx, oy + y, C.stone);
      }
    }
  }
  // Flat top (tilted)
  for (let x = 12; x <= 19; x++) {
    setPixel(ctx, ox + x + 3, oy + 9, C.stoneLight);
    setPixel(ctx, ox + x + 3, oy + 10, C.stone);
  }
  // Major crack
  setPixel(ctx, ox + 15, oy + 14, C.black);
  setPixel(ctx, ox + 16, oy + 15, C.black);
  setPixel(ctx, ox + 15, oy + 16, C.black);
  setPixel(ctx, ox + 14, oy + 17, C.black);
  setPixel(ctx, ox + 15, oy + 18, C.black);
}

function drawGravestone4(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // Ornate gravestone with pointed top
  const C = PAL;
  // Base
  for (let x = 7; x <= 24; x++) {
    setPixel(ctx, ox + x, oy + 29, C.dirtDark);
    setPixel(ctx, ox + x, oy + 30, C.dirt);
    setPixel(ctx, ox + x, oy + 31, C.grass);
  }
  // Stone body
  for (let y = 10; y <= 28; y++) {
    for (let x = 10; x <= 21; x++) {
      if (x === 10 || x === 21) setPixel(ctx, ox + x, oy + y, C.stoneDark);
      else setPixel(ctx, ox + x, oy + y, y <= 14 ? C.stoneLight : C.stone);
    }
  }
  // Pointed top
  for (let x = 11; x <= 20; x++) setPixel(ctx, ox + x, oy + 9, C.stone);
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 8, C.stone);
  for (let x = 13; x <= 18; x++) setPixel(ctx, ox + x, oy + 7, C.stoneLight);
  for (let x = 14; x <= 17; x++) setPixel(ctx, ox + x, oy + 6, C.stoneLight);
  setPixel(ctx, ox + 15, oy + 5, C.stoneLight);
  setPixel(ctx, ox + 16, oy + 5, C.stoneLight);
  // Engraved border
  for (let y = 12; y <= 26; y++) {
    setPixel(ctx, ox + 12, oy + y, C.stoneDark);
    setPixel(ctx, ox + 19, oy + y, C.stoneDark);
  }
  for (let x = 12; x <= 19; x++) {
    setPixel(ctx, ox + x, oy + 12, C.stoneDark);
    setPixel(ctx, ox + x, oy + 26, C.stoneDark);
  }
  // Moss
  setPixel(ctx, ox + 11, oy + 26, C.stoneMoss);
  setPixel(ctx, ox + 11, oy + 27, C.stoneMoss);
  setPixel(ctx, ox + 12, oy + 27, C.stoneMoss);
}

function drawGravestone5(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // Simple, short, weathered tablet
  const C = PAL;
  // Base
  for (let x = 8; x <= 23; x++) {
    setPixel(ctx, ox + x, oy + 29, C.dirtDark);
    setPixel(ctx, ox + x, oy + 30, C.dirt);
    setPixel(ctx, ox + x, oy + 31, C.grass);
  }
  // Short stone
  for (let y = 16; y <= 28; y++) {
    for (let x = 10; x <= 21; x++) {
      if (x === 10 || x === 21) setPixel(ctx, ox + x, oy + y, C.stoneDark);
      else setPixel(ctx, ox + x, oy + y, C.stone);
    }
  }
  // Weathered top edge
  for (let x = 11; x <= 20; x++) {
    setPixel(ctx, ox + x, oy + 15, noise(x, 15) > 0.5 ? C.stoneLight : C.stone);
    if (noise(x, 14) > 0.7) setPixel(ctx, ox + x, oy + 14, C.stone);
  }
  // Heavy moss/weathering
  for (let y = 22; y <= 27; y++) {
    for (let x = 11; x <= 13; x++) {
      if (noise(x, y) > 0.4) setPixel(ctx, ox + x, oy + y, C.stoneMoss);
    }
  }
}

// --- FENCE ---
function drawFenceVertical(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  const C = PAL;
  // Horizontal bars
  for (let x = 0; x < TILE; x++) {
    setPixel(ctx, ox + x, oy + 8, C.fenceMetalDark);
    setPixel(ctx, ox + x, oy + 9, C.fenceMetal);
    setPixel(ctx, ox + x, oy + 22, C.fenceMetalDark);
    setPixel(ctx, ox + x, oy + 23, C.fenceMetal);
  }
  // Vertical bars with pointed tips
  for (let barX = 4; barX < TILE; barX += 8) {
    // Pointed tip
    setPixel(ctx, ox + barX, oy + 1, C.fenceMetalLight);
    setPixel(ctx, ox + barX - 1, oy + 2, C.fenceMetal);
    setPixel(ctx, ox + barX, oy + 2, C.fenceMetalLight);
    setPixel(ctx, ox + barX + 1, oy + 2, C.fenceMetalDark);
    // Bar
    for (let y = 3; y <= 29; y++) {
      setPixel(ctx, ox + barX - 1, oy + y, C.fenceMetal);
      setPixel(ctx, ox + barX, oy + y, C.fenceMetalLight);
      setPixel(ctx, ox + barX + 1, oy + y, C.fenceMetalDark);
    }
    // Rust spots
    if (noise(barX, 0) > 0.5) {
      setPixel(ctx, ox + barX, oy + 15, C.fenceRust);
      setPixel(ctx, ox + barX, oy + 16, C.fenceRust);
    }
  }
  // Ground connection
  for (let x = 0; x < TILE; x++) {
    setPixel(ctx, ox + x, oy + 30, C.dirtDark);
    setPixel(ctx, ox + x, oy + 31, C.grass);
  }
}

function drawFencePost(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  const C = PAL;
  // Thick post
  for (let y = 0; y <= 29; y++) {
    for (let x = 12; x <= 19; x++) {
      if (x <= 13) setPixel(ctx, ox + x, oy + y, C.fenceMetalDark);
      else if (x >= 18) setPixel(ctx, ox + x, oy + y, C.fenceMetalDark);
      else setPixel(ctx, ox + x, oy + y, y <= 3 ? C.fenceMetalLight : C.fenceMetal);
    }
  }
  // Cap
  for (let x = 11; x <= 20; x++) {
    setPixel(ctx, ox + x, oy + 0, C.fenceMetalLight);
    setPixel(ctx, ox + x, oy + 1, C.fenceMetal);
  }
  // Ground
  for (let x = 0; x < TILE; x++) {
    setPixel(ctx, ox + x, oy + 30, C.dirtDark);
    setPixel(ctx, ox + x, oy + 31, C.grass);
  }
}

// --- CARETAKER'S HOUSE ---
function drawCaretakerHouse(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // 3x3 tiles (96x96 pixels), drawn from ox,oy at top-left
  const C = PAL;
  const W = TILE * 3;
  const H = TILE * 3;

  // Roof
  for (let y = 0; y < 32; y++) {
    const indent = Math.max(0, 16 - y);
    for (let x = indent; x < W - indent; x++) {
      if (y <= 2) setPixel(ctx, ox + x, oy + y, C.roofLight);
      else if (x <= indent + 2 || x >= W - indent - 2) setPixel(ctx, ox + x, oy + y, C.roofDark);
      else setPixel(ctx, ox + x, oy + y, noise(x, y) > 0.7 ? C.roofLight : C.roof);
    }
  }

  // Walls
  for (let y = 32; y < H - 10; y++) {
    for (let x = 8; x < W - 8; x++) {
      const n = noise(x * 3, y * 3);
      if (n < 0.15) setPixel(ctx, ox + x, oy + y, C.stoneDark);
      else if (n < 0.6) setPixel(ctx, ox + x, oy + y, C.stone);
      else setPixel(ctx, ox + x, oy + y, C.stoneLight);
    }
    // Wall edges
    setPixel(ctx, ox + 8, oy + y, C.stoneDark);
    setPixel(ctx, ox + W - 9, oy + y, C.stoneDark);
  }

  // Door (center)
  const doorX = Math.floor(W / 2) - 6;
  for (let y = 52; y < H - 10; y++) {
    for (let x = doorX; x < doorX + 12; x++) {
      setPixel(ctx, ox + x, oy + y, x === doorX || x === doorX + 11 ? C.woodDark : C.wood);
    }
  }
  // Door handle
  setPixel(ctx, ox + doorX + 9, oy + 66, C.fenceMetal);
  setPixel(ctx, ox + doorX + 9, oy + 67, C.fenceMetalLight);

  // Window (left) with glow
  for (let y = 40; y < 52; y++) {
    for (let x = 18; x < 30; x++) {
      if (y === 40 || y === 51 || x === 18 || x === 29) {
        setPixel(ctx, ox + x, oy + y, C.woodDark);
      } else if (x === 23 || x === 24) {
        setPixel(ctx, ox + x, oy + y, C.woodDark); // window pane divider
      } else {
        setPixel(ctx, ox + x, oy + y, noise(x, y) > 0.5 ? C.windowGlowBright : C.windowGlow);
      }
    }
  }

  // Window (right) with glow
  for (let y = 40; y < 52; y++) {
    for (let x = 66; x < 78; x++) {
      if (y === 40 || y === 51 || x === 66 || x === 77) {
        setPixel(ctx, ox + x, oy + y, C.woodDark);
      } else if (x === 71 || x === 72) {
        setPixel(ctx, ox + x, oy + y, C.woodDark);
      } else {
        setPixel(ctx, ox + x, oy + y, noise(x, y) > 0.5 ? C.windowGlowBright : C.windowGlow);
      }
    }
  }

  // Foundation
  for (let x = 6; x < W - 6; x++) {
    for (let y = H - 10; y < H - 4; y++) {
      setPixel(ctx, ox + x, oy + y, C.stoneDark);
    }
  }
  // Ground around
  for (let x = 0; x < W; x++) {
    for (let y = H - 4; y < H; y++) {
      setPixel(ctx, ox + x, oy + y, noise(x, y) > 0.5 ? C.dirt : C.dirtDark);
    }
  }
}

// --- DEAD TREE ---
function drawDeadTree(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  const C = PAL;
  // Trunk
  for (let y = 12; y <= 28; y++) {
    for (let x = 14; x <= 17; x++) {
      setPixel(ctx, ox + x, oy + y, x <= 14 ? C.woodDark : C.wood);
    }
  }
  // Branches (left)
  for (let i = 0; i < 6; i++) {
    setPixel(ctx, ox + 13 - i, oy + 12 - i, C.wood);
    setPixel(ctx, ox + 12 - i, oy + 12 - i, C.woodDark);
  }
  // Branches (right)
  for (let i = 0; i < 5; i++) {
    setPixel(ctx, ox + 18 + i, oy + 10 - i, C.wood);
    setPixel(ctx, ox + 19 + i, oy + 10 - i, C.woodDark);
  }
  // Small branch right lower
  for (let i = 0; i < 3; i++) {
    setPixel(ctx, ox + 18 + i, oy + 16 - i, C.wood);
  }
  // Base
  setPixel(ctx, ox + 13, oy + 29, C.woodDark);
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 30, C.dirtDark);
  for (let x = 10; x <= 21; x++) setPixel(ctx, ox + x, oy + 31, C.grass);
}

// --- DEAD BUSH ---
function drawDeadBush(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  const C = PAL;
  // Random twigs
  const twigs = [
    [16, 20, 12, 16], [16, 20, 20, 16], [14, 18, 10, 14],
    [18, 22, 18, 14], [13, 17, 8, 12], [19, 23, 22, 18],
    [15, 19, 14, 18], [17, 21, 9, 13],
  ];
  for (const [x1, x2, y1, y2] of twigs) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(x1 + (x2 - x1) * (i / steps));
      const y = Math.round(y1 + (y2 - y1) * (i / steps));
      setPixel(ctx, ox + x, oy + y, noise(x, y) > 0.5 ? C.wood : C.woodDark);
    }
  }
  // Base
  for (let x = 14; x <= 18; x++) setPixel(ctx, ox + x, oy + 21, C.woodDark);
  for (let x = 12; x <= 20; x++) setPixel(ctx, ox + x, oy + 31, C.grass);
}

// --- INTERACT ICON ---
function drawInteractIcon(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // Small 16x16 "E" button icon (scaled to 32x32 area, centered)
  const C = { bg: '#3a5a3a', border: '#2a3a2a', text: '#d0e0c0' };
  // Background circle-ish shape
  for (let y = 8; y <= 23; y++) {
    for (let x = 8; x <= 23; x++) {
      const dx = x - 15.5, dy = y - 15.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 8) {
        if (dist >= 7) setPixel(ctx, ox + x, oy + y, C.border);
        else setPixel(ctx, ox + x, oy + y, C.bg);
      }
    }
  }
  // "E" letter
  for (let y = 11; y <= 20; y++) setPixel(ctx, ox + 12, oy + y, C.text);
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 11, C.text);
  for (let x = 12; x <= 18; x++) setPixel(ctx, ox + x, oy + 15, C.text);
  for (let x = 12; x <= 19; x++) setPixel(ctx, ox + x, oy + 20, C.text);
}

export function generateTilesetAndObjects(scene: Phaser.Scene): void {
  // --- GRASS TILES ---
  for (let v = 0; v < 3; v++) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext('2d')!;
    drawGrassTile(ctx, 0, 0, v);
    scene.textures.addCanvas(`grass-${v}`, canvas);
  }

  // --- DIRT TILES ---
  for (let v = 0; v < 2; v++) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext('2d')!;
    drawDirtTile(ctx, 0, 0, v);
    scene.textures.addCanvas(`dirt-${v}`, canvas);
  }

  // --- GRAVESTONES ---
  const gravestoneDrawers = [drawGravestone1, drawGravestone2, drawGravestone3, drawGravestone4, drawGravestone5];
  for (let i = 0; i < gravestoneDrawers.length; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext('2d')!;
    // Draw grass background first
    drawGrassTile(ctx, 0, 0, i % 3);
    gravestoneDrawers[i](ctx, 0, 0);
    scene.textures.addCanvas(`gravestone-${i}`, canvas);
  }

  // --- FENCE ---
  const fenceCanvas = document.createElement('canvas');
  fenceCanvas.width = TILE;
  fenceCanvas.height = TILE;
  let fctx = fenceCanvas.getContext('2d')!;
  drawFenceVertical(fctx, 0, 0);
  scene.textures.addCanvas('fence', fenceCanvas);

  const postCanvas = document.createElement('canvas');
  postCanvas.width = TILE;
  postCanvas.height = TILE;
  fctx = postCanvas.getContext('2d')!;
  drawFencePost(fctx, 0, 0);
  scene.textures.addCanvas('fence-post', postCanvas);

  // --- CARETAKER'S HOUSE (3x3 tiles) ---
  const houseCanvas = document.createElement('canvas');
  houseCanvas.width = TILE * 3;
  houseCanvas.height = TILE * 3;
  const hctx = houseCanvas.getContext('2d')!;
  drawCaretakerHouse(hctx, 0, 0);
  scene.textures.addCanvas('caretaker-house', houseCanvas);

  // --- DEAD TREE ---
  const treeCanvas = document.createElement('canvas');
  treeCanvas.width = TILE;
  treeCanvas.height = TILE;
  const trCtx = treeCanvas.getContext('2d')!;
  drawGrassTile(trCtx, 0, 0, 0);
  drawDeadTree(trCtx, 0, 0);
  scene.textures.addCanvas('dead-tree', treeCanvas);

  // --- DEAD BUSH ---
  const bushCanvas = document.createElement('canvas');
  bushCanvas.width = TILE;
  bushCanvas.height = TILE;
  const buCtx = bushCanvas.getContext('2d')!;
  drawGrassTile(buCtx, 0, 0, 1);
  drawDeadBush(buCtx, 0, 0);
  scene.textures.addCanvas('dead-bush', bushCanvas);

  // --- INTERACT ICON ---
  const iconCanvas = document.createElement('canvas');
  iconCanvas.width = TILE;
  iconCanvas.height = TILE;
  const iCtx = iconCanvas.getContext('2d')!;
  drawInteractIcon(iCtx, 0, 0);
  scene.textures.addCanvas('interact-icon', iconCanvas);
}
