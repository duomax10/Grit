/**
 * Procedural pixel-art icons for inventory items.
 * Each icon is drawn to a 32x32 canvas and registered as a Phaser
 * texture. The visual style matches the game's muted palette.
 */

import Phaser from 'phaser';

const ICON = 32;

// Shared palette — keep in sync with the muted/dark look used
// elsewhere in the game.
const PAL = {
  steelDark: '#2a2a30',
  steel: '#4a4a54',
  steelLight: '#7a7a86',
  steelHi: '#9a9aa4',
  woodDark: '#2a1a10',
  wood: '#4a2e1a',
  woodLight: '#6a4228',
  glassDark: '#2a3a3e',
  glass: '#4a6468',
  glassLight: '#7a9498',
  corkDark: '#3a2814',
  cork: '#5a4020',
  corkLight: '#7a5a30',
  // Rich dark topsoil — brown with a reddish undertone
  soilDark: '#2a1808',
  soil: '#40240c',
  soilLight: '#5a3414',
  soilHi: '#6e4018',
  outline: '#0a0a0a',
  shadow: 'rgba(0,0,0,0.35)',
};

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/**
 * Draw a folding spade: wooden T-handle up top, steel blade angled
 * down across the icon.
 */
function drawSpade(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, ICON, ICON);

  // Soft drop shadow under the whole icon
  ctx.fillStyle = PAL.shadow;
  ctx.fillRect(6, ICON - 4, 20, 2);

  // --- HANDLE SHAFT (diagonal from top-left toward middle) ---
  // The shaft runs from around (10, 4) to (18, 18).
  const shaftPts: Array<[number, number]> = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const x = Math.round(10 + t * 8);
    const y = Math.round(5 + t * 13);
    shaftPts.push([x, y]);
  }
  for (const [x, y] of shaftPts) {
    px(ctx, x - 1, y, PAL.woodDark);
    px(ctx, x, y, PAL.wood);
    px(ctx, x + 1, y, PAL.woodLight);
  }

  // T-handle grip at top
  rect(ctx, 6, 3, 9, 2, PAL.woodDark);
  rect(ctx, 6, 4, 9, 1, PAL.wood);
  rect(ctx, 7, 4, 7, 1, PAL.woodLight);
  // Grip caps
  px(ctx, 5, 3, PAL.outline);
  px(ctx, 5, 4, PAL.outline);
  px(ctx, 15, 3, PAL.outline);
  px(ctx, 15, 4, PAL.outline);

  // Ferrule (metal ring where shaft meets blade)
  rect(ctx, 17, 17, 4, 3, PAL.steelDark);
  rect(ctx, 17, 18, 4, 1, PAL.steelLight);

  // --- BLADE (spade shape, pointing down-right) ---
  // Rounded trapezoid
  const bladeColor = PAL.steel;
  const bladeHi = PAL.steelHi;
  const bladeLo = PAL.steelDark;
  // Row by row blade shape
  // y=20..28, widening then narrowing
  const bladeRows: Array<[number, number]> = [
    [18, 23], // y20
    [17, 25], // y21
    [16, 26], // y22
    [16, 27], // y23
    [16, 27], // y24
    [17, 27], // y25
    [18, 26], // y26
    [19, 25], // y27
    [21, 24], // y28 (tip)
  ];
  for (let i = 0; i < bladeRows.length; i++) {
    const y = 20 + i;
    const [x0, x1] = bladeRows[i];
    for (let x = x0; x <= x1; x++) {
      px(ctx, x, y, bladeColor);
    }
    // Highlight along top-left edge
    px(ctx, x0, y, bladeHi);
    // Shadow along bottom-right
    px(ctx, x1, y, bladeLo);
  }
  // Outline the blade
  for (let i = 0; i < bladeRows.length; i++) {
    const y = 20 + i;
    const [x0, x1] = bladeRows[i];
    px(ctx, x0 - 1, y, PAL.outline);
    px(ctx, x1 + 1, y, PAL.outline);
  }
  // Top and bottom outlines
  for (let x = bladeRows[0][0]; x <= bladeRows[0][1]; x++) px(ctx, x, 19, PAL.outline);
  const last = bladeRows[bladeRows.length - 1];
  for (let x = last[0]; x <= last[1]; x++) px(ctx, x, 29, PAL.outline);
}

/**
 * Draw the glass + cork outline/base for the sample container. Shared
 * between the empty and filled variants so they're visually consistent.
 */
function drawContainerShell(ctx: CanvasRenderingContext2D): void {
  ctx.clearRect(0, 0, ICON, ICON);

  // Drop shadow
  ctx.fillStyle = PAL.shadow;
  ctx.fillRect(10, 28, 12, 2);

  // --- CORK STOPPER ---
  rect(ctx, 12, 4, 8, 1, PAL.outline);
  rect(ctx, 12, 5, 8, 2, PAL.corkDark);
  rect(ctx, 12, 6, 8, 1, PAL.cork);
  rect(ctx, 13, 6, 6, 1, PAL.corkLight);
  rect(ctx, 13, 7, 6, 1, PAL.cork);

  // --- VIAL NECK (slightly narrower) ---
  rect(ctx, 13, 8, 6, 2, PAL.glassDark);
  px(ctx, 13, 8, PAL.outline);
  px(ctx, 18, 8, PAL.outline);
  px(ctx, 12, 8, PAL.outline);
  px(ctx, 19, 8, PAL.outline);
  px(ctx, 13, 9, PAL.glass);
  px(ctx, 18, 9, PAL.glassDark);

  // Shoulder transition
  px(ctx, 12, 10, PAL.outline);
  px(ctx, 19, 10, PAL.outline);
  rect(ctx, 13, 10, 6, 1, PAL.glass);

  // --- VIAL BODY (wider) ---
  for (let y = 11; y <= 27; y++) {
    px(ctx, 11, y, PAL.outline);
    px(ctx, 20, y, PAL.outline);
  }
  for (let x = 12; x <= 19; x++) {
    px(ctx, x, 28, PAL.outline);
  }
  px(ctx, 11, 27, PAL.glass);
  px(ctx, 20, 27, PAL.glass);
  px(ctx, 11, 28, PAL.outline);
  px(ctx, 20, 28, PAL.outline);

  // Glass fill (dark background layer — hint of transparency)
  for (let y = 11; y <= 27; y++) {
    for (let x = 12; x <= 19; x++) {
      px(ctx, x, y, PAL.glassDark);
    }
  }

  // Left-side vertical highlight (always visible — catches the light)
  for (let y = 12; y <= 16; y++) px(ctx, 13, y, PAL.glassLight);
  // Tiny top-right sparkle
  px(ctx, 18, 12, PAL.glassLight);
}

/**
 * Empty sample container — the glass shell with no contents.
 */
function drawSampleContainer(ctx: CanvasRenderingContext2D): void {
  drawContainerShell(ctx);
  // A thin bottom film so it doesn't look completely flat/transparent
  for (let x = 12; x <= 19; x++) {
    px(ctx, x, 27, '#1a2428');
  }
}

/**
 * Filled sample container — nearly full of rich dark topsoil with
 * visible soil clumps and a gritty texture.
 */
function drawSampleContainerFilled(ctx: CanvasRenderingContext2D): void {
  drawContainerShell(ctx);

  // Soil fills most of the body, from y=12 to y=27
  const soilTop = 12;
  for (let y = soilTop; y <= 27; y++) {
    for (let x = 12; x <= 19; x++) {
      px(ctx, x, y, PAL.soil);
    }
  }
  // Shaded bottom half (darker at the base)
  for (let y = 22; y <= 27; y++) {
    for (let x = 12; x <= 19; x++) {
      px(ctx, x, y, PAL.soilDark);
    }
  }
  // Highlighted top surface (lighter at the top)
  for (let x = 12; x <= 19; x++) {
    px(ctx, x, soilTop, PAL.soilLight);
    px(ctx, x, soilTop + 1, PAL.soilLight);
  }
  // Gritty clumps — deterministic scatter for stable icon
  const grit: Array<[number, number, string]> = [
    [13, 14, PAL.soilHi],
    [17, 15, PAL.soilDark],
    [15, 16, PAL.soilLight],
    [18, 17, PAL.soilDark],
    [13, 19, PAL.soilHi],
    [16, 20, PAL.soilLight],
    [14, 22, PAL.soilDark],
    [18, 23, PAL.soilHi],
    [15, 25, PAL.soilLight],
    [17, 26, PAL.soilDark],
  ];
  for (const [x, y, c] of grit) px(ctx, x, y, c);

  // Tiny meniscus just under the cork — soil packed up to the neck
  for (let x = 13; x <= 18; x++) {
    px(ctx, x, 11, PAL.soilDark);
  }
}

/**
 * Register all item icon textures with the scene. Safe to call
 * multiple times — existing textures are left in place.
 */
export function generateItemIcons(scene: Phaser.Scene): void {
  const icons: Array<[string, (ctx: CanvasRenderingContext2D) => void]> = [
    ['item-spade', drawSpade],
    ['item-container', drawSampleContainer],
    ['item-container-filled', drawSampleContainerFilled],
  ];

  for (const [key, draw] of icons) {
    if (scene.textures.exists(key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = ICON;
    canvas.height = ICON;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    scene.textures.addCanvas(key, canvas);
    scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
}
