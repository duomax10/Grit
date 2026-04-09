/**
 * Generate all graveyard assets using PixelLab Bitforge with the
 * sprite sheet as a style reference. This ensures all generated
 * assets match the art style of the reference.
 *
 * Usage: node scripts/generate-from-reference.mjs
 */

import { PixelLabClient, Base64Image } from '@pixellab-code/pixellab';
import { mkdirSync, existsSync } from 'fs';
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

// Load the sprite sheet as style reference
const STYLE_REF = join(ASSETS, '1775767237336.png');
let styleImage;
try {
  styleImage = await Base64Image.fromFile(STYLE_REF);
  console.log('Loaded style reference image');
} catch (e) {
  console.error('Could not load style reference:', e.message);
  process.exit(1);
}

// Common settings
const STYLE = {
  outline: 'selective outline',
  shading: 'detailed shading',
  detail: 'highly detailed',
};

async function gen(name, params, outPath) {
  console.log(`  Generating: ${name}...`);
  try {
    const r = await client.generateImageBitforge({
      ...params,
      styleImage,
      styleStrength: 70,
    });
    await r.image.saveToFile(outPath);
    console.log(`    ✓ ${outPath} ($${r.usage.usd.toFixed(4)})`);
    return r;
  } catch (err) {
    console.error(`    ✗ ${name}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('=== Generate Assets from Style Reference ===\n');

  try {
    const b = await client.getBalance();
    console.log(`Balance: $${b.usd.toFixed(2)}\n`);
  } catch (e) { console.warn('Could not check balance'); }

  // ==================
  // GROUND TILES
  // ==================
  console.log('--- Ground Tiles ---');

  await gen('Grass tile', {
    description: 'dark green grass ground tile, short mowed cemetery lawn, seamless tileable texture, top-down view, pixel art',
    imageSize: { width: 32, height: 32 },
    noBackground: false,
    view: 'high top-down',
    ...STYLE, outline: 'lineless',
  }, join(ASSETS, 'tiles', 'grass-base.png'));

  await gen('Gravel tile', {
    description: 'gray stone gravel pathway tile, crushed pebbles, seamless tileable texture, top-down view, pixel art',
    imageSize: { width: 32, height: 32 },
    noBackground: false,
    view: 'high top-down',
    ...STYLE, outline: 'lineless',
  }, join(ASSETS, 'tiles', 'gravel-base.png'));

  await gen('Dirt tile', {
    description: 'brown dirt earth pathway tile, packed earth, seamless tileable texture, top-down view, pixel art',
    imageSize: { width: 32, height: 32 },
    noBackground: false,
    view: 'high top-down',
    ...STYLE, outline: 'lineless',
  }, join(ASSETS, 'tiles', 'dirt-base.png'));

  // ==================
  // GRAVESTONES (8 variants)
  // ==================
  console.log('\n--- Gravestones ---');

  const stones = [
    'rounded top gravestone with carved text, dark gray weathered stone, old cemetery',
    'gravestone with small cross on top, dark stone, old cemetery',
    'tall gravestone with large cross carved into face, dark gray stone',
    'ornate Victorian gravestone with decorative carving, dark weathered stone',
    'simple cross-shaped headstone, dark stone, old cemetery',
    'gravestone with occult symbol carved on face, dark weathered stone, mysterious',
    'small stone mausoleum crypt entrance with iron door, dark stone, gothic',
    'short simple rectangular gravestone, dark gray stone, old and worn',
  ];

  for (let i = 0; i < stones.length; i++) {
    await gen(`Gravestone ${i}`, {
      description: `${stones[i]}, pixel art, top-down 3/4 view`,
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
    description: 'large green oak tree with full leafy canopy, thick trunk, grass at base, pixel art, top-down 3/4 view',
    imageSize: { width: 64, height: 64 },
    noBackground: true,
    view: 'low top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'tree-oak.png'));

  await gen('Dead tree', {
    description: 'dead leafless gnarled tree, dark bare twisted branches, spooky, pixel art, top-down 3/4 view',
    imageSize: { width: 48, height: 64 },
    noBackground: true,
    view: 'low top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'dead-tree.png'));

  await gen('Evergreen tree', {
    description: 'tall dark green pine or cypress tree, conical shape, pixel art, top-down 3/4 view',
    imageSize: { width: 48, height: 64 },
    noBackground: true,
    view: 'low top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'tree-evergreen.png'));

  // ==================
  // BUSHES
  // ==================
  console.log('\n--- Bushes ---');

  await gen('Bush', {
    description: 'green rounded hedge bush, dark green, pixel art, top-down 3/4 view',
    imageSize: { width: 32, height: 32 },
    noBackground: true,
    view: 'low top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'bush.png'));

  // ==================
  // LARGE OBJECTS
  // ==================
  console.log('\n--- Large Objects ---');

  await gen('Fountain', {
    description: 'old stone water fountain with circular basin, blue water, dark stone, pixel art, top-down 3/4 view',
    imageSize: { width: 96, height: 96 },
    noBackground: true,
    view: 'low top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'fountain.png'));

  await gen('Caretaker house', {
    description: 'small old stone cottage house, dark shingled roof, chimney, lit window, wooden door, pixel art, top-down 3/4 view',
    imageSize: { width: 96, height: 96 },
    noBackground: true,
    view: 'low top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'caretaker-house.png'));

  // ==================
  // FENCE
  // ==================
  console.log('\n--- Fence ---');

  await gen('Iron fence section', {
    description: 'wrought iron cemetery fence section with pointed bars, dark metal, pixel art, front view',
    imageSize: { width: 32, height: 48 },
    noBackground: true,
    view: 'low top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'fence.png'));

  await gen('Iron fence post', {
    description: 'wrought iron cemetery fence post pillar with decorative cap, dark metal, pixel art',
    imageSize: { width: 32, height: 48 },
    noBackground: true,
    view: 'low top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'fence-post.png'));

  // ==================
  // SMALL DETAILS
  // ==================
  console.log('\n--- Details ---');

  await gen('Rocks', {
    description: 'small scattered gray rocks and pebbles on ground, pixel art, top-down view',
    imageSize: { width: 32, height: 32 },
    noBackground: true,
    view: 'high top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'rocks.png'));

  await gen('Grass tufts', {
    description: 'small tufts of tall grass, dark green, pixel art, top-down view',
    imageSize: { width: 32, height: 32 },
    noBackground: true,
    view: 'high top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'grass-tufts.png'));

  await gen('Fallen leaves', {
    description: 'scattered brown fallen dead leaves on ground, pixel art, top-down view',
    imageSize: { width: 32, height: 32 },
    noBackground: true,
    view: 'high top-down',
    ...STYLE,
  }, join(ASSETS, 'objects', 'fallen-leaves.png'));

  console.log('\n=== Done ===');
}

main().catch(console.error);
