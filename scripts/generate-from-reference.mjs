/**
 * Generate graveyard assets using PixelLab Pixflux.
 * v3 - No style reference, uses detailed prompts instead.
 */

import { PixelLabClient, Base64Image } from '@pixellab-code/pixellab';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'public', 'assets');

const API_KEY = process.env.PIXELLAB_SECRET || '';
if (!API_KEY) { console.error('Set PIXELLAB_SECRET'); process.exit(1); }
const client = new PixelLabClient(API_KEY);

for (const d of ['tiles', 'objects']) {
  const p = join(ASSETS, d);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// The style reference must match the output image size.
// We'll crop relevant sections of the sprite sheet and resize.
// For simplicity, use Pixflux (no style ref needed) with very
// specific prompts that match the reference art style.
const STYLE = {
  outline: 'selective outline',
  shading: 'detailed shading',
  detail: 'highly detailed',
};

const TILE_STYLE = {
  outline: 'lineless',
  shading: 'detailed shading',
  detail: 'highly detailed',
};

// Use the dark muted pixel art style from the reference
const ART = 'pixel art, dark muted color palette, retro 16-bit style, low saturation greens and grays, gritty fantasy graveyard aesthetic';

async function gen(name, params, outPath) {
  console.log(`  Generating: ${name}...`);
  try {
    const r = await client.generateImagePixflux(params);
    await r.image.saveToFile(outPath);
    console.log(`    ✓ ${outPath} ($${r.usage.usd.toFixed(4)})`);
    return r;
  } catch (err) {
    console.error(`    ✗ ${name}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('=== Generate Graveyard Assets (v3 - Pixflux) ===\n');

  try {
    const b = await client.getBalance();
    console.log(`Balance: $${b.usd.toFixed(2)}\n`);
  } catch (e) { console.warn('Could not check balance'); }

  // ==================
  // GROUND TILES
  // ==================
  console.log('--- Ground Tiles ---');

  await gen('Grass tile', {
    description: `dark forest green grass ground, short cemetery lawn with subtle texture variation, seamless tileable, ${ART}, top-down view`,
    imageSize: { width: 32, height: 32 },
    noBackground: false,
    view: 'high top-down',
    ...TILE_STYLE,
  }, join(ASSETS, 'tiles', 'grass-base.png'));

  await gen('Gravel tile', {
    description: `gray cobblestone gravel pathway ground, small rounded stones tightly packed, seamless tileable, ${ART}, top-down view`,
    imageSize: { width: 32, height: 32 },
    noBackground: false,
    view: 'high top-down',
    ...TILE_STYLE,
  }, join(ASSETS, 'tiles', 'gravel-base.png'));

  await gen('Dirt tile', {
    description: `brown dirt earth pathway ground, packed worn earth with pebbles, seamless tileable, ${ART}, top-down view`,
    imageSize: { width: 32, height: 32 },
    noBackground: false,
    view: 'high top-down',
    ...TILE_STYLE,
  }, join(ASSETS, 'tiles', 'dirt-base.png'));

  // ==================
  // GRAVESTONES (8 variants)
  // ==================
  console.log('\n--- Gravestones ---');

  const stones = [
    'rounded top gravestone with carved text, dark gray weathered stone',
    'gravestone with small cross on top, dark gray stone, weathered',
    'tall gravestone with large cross carved into face, dark stone',
    'ornate Victorian gravestone with decorative carving, dark stone',
    'simple cross-shaped headstone, dark stone, old',
    'gravestone with carved symbol on face, dark weathered stone',
    'small stone mausoleum crypt entrance with iron door, gothic',
    'short simple rectangular gravestone, dark gray stone, worn',
  ];

  for (let i = 0; i < stones.length; i++) {
    await gen(`Gravestone ${i}`, {
      description: `${stones[i]}, old cemetery, ${ART}, 3/4 top-down view`,
      imageSize: { width: 32, height: 48 },
      noBackground: true,
      view: 'low top-down',
      ...STYLE,
    }, join(ASSETS, 'objects', `monument-${i}.png`));
  }

  // ==================
  // TREES
  // ==================
  console.log('\n--- Trees ---');

  await gen('Oak tree', {
    description: `large green oak tree with full leafy canopy, thick brown trunk, green bushes at base, ${ART}, 3/4 top-down view`,
    imageSize: { width: 64, height: 64 },
    noBackground: true, view: 'low top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'tree-oak.png'));

  await gen('Dead tree', {
    description: `dead leafless gnarled tree, dark brown bare twisted branches, spooky atmosphere, ${ART}, 3/4 top-down view`,
    imageSize: { width: 48, height: 64 },
    noBackground: true, view: 'low top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'dead-tree.png'));

  await gen('Evergreen tree', {
    description: `tall dark green pine tree, conical shape, dense needles, ${ART}, 3/4 top-down view`,
    imageSize: { width: 48, height: 64 },
    noBackground: true, view: 'low top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'tree-evergreen.png'));

  // ==================
  // BUSHES
  // ==================
  console.log('\n--- Bushes ---');

  await gen('Bush', {
    description: `green rounded hedge bush, dark green leaves, ${ART}, 3/4 top-down view`,
    imageSize: { width: 32, height: 32 },
    noBackground: true, view: 'low top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'bush.png'));

  // ==================
  // LARGE OBJECTS
  // ==================
  console.log('\n--- Large Objects ---');

  await gen('Fountain', {
    description: `old stone water fountain with circular basin, blue water, dark gray stone, ${ART}, 3/4 top-down view`,
    imageSize: { width: 96, height: 96 },
    noBackground: true, view: 'low top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'fountain.png'));

  await gen('Caretaker house', {
    description: `small old stone cottage groundskeeper house, dark shingled roof, chimney, warm lit window, wooden door, ${ART}, 3/4 top-down view`,
    imageSize: { width: 96, height: 96 },
    noBackground: true, view: 'low top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'caretaker-house.png'));

  // ==================
  // FENCE
  // ==================
  console.log('\n--- Fence ---');

  await gen('Iron fence section', {
    description: `wrought iron cemetery fence section with pointed bars, dark black metal, ${ART}, front view`,
    imageSize: { width: 32, height: 48 },
    noBackground: true, view: 'low top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'fence.png'));

  await gen('Iron fence post', {
    description: `wrought iron cemetery fence post pillar with decorative cap, dark black metal, ${ART}`,
    imageSize: { width: 32, height: 48 },
    noBackground: true, view: 'low top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'fence-post.png'));

  // ==================
  // SMALL DETAILS
  // ==================
  console.log('\n--- Details ---');

  await gen('Rocks', {
    description: `small scattered gray rocks and pebbles on ground, ${ART}, top-down view`,
    imageSize: { width: 32, height: 32 },
    noBackground: true, view: 'high top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'rocks.png'));

  await gen('Grass tufts', {
    description: `small tufts of tall dark green grass blades, ${ART}, top-down view`,
    imageSize: { width: 32, height: 32 },
    noBackground: true, view: 'high top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'grass-tufts.png'));

  await gen('Fallen leaves', {
    description: `scattered brown fallen dead leaves on ground, autumn, ${ART}, top-down view`,
    imageSize: { width: 32, height: 32 },
    noBackground: true, view: 'high top-down', ...STYLE,
  }, join(ASSETS, 'objects', 'fallen-leaves.png'));

  console.log('\n=== Done ===');
}

main().catch(console.error);
