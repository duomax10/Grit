/**
 * Targeted PixelLab asset generator.
 *
 * Usage: node scripts/generate-targeted.mjs <target>
 *
 * Targets:
 *   walk-anims   - Generate Gabe walk animation frames (4 dirs x 4 frames)
 *   character    - Generate Gabe static directional sprites
 *   tiles        - Generate ground tiles (grass, dirt)
 *   monuments    - Generate interactive gravestone monuments
 *   environment  - Generate trees, fountain, bench, bush, flowers, fence
 *   house        - Generate caretaker's house
 *   flat-graves  - Generate flat grave marker variants
 *   all          - Generate everything
 */

import { PixelLabClient, Base64Image } from '@pixellab-code/pixellab';
import { mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  CHARACTER, MONUMENTS as MONUMENT_DESCS, FLAT_GRAVE, TREES, ENVIRONMENT,
  BUILDINGS, SPRITE_STYLE, TILE_STYLE,
} from './asset-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'public', 'assets');

const API_KEY = process.env.PIXELLAB_SECRET || '';
if (!API_KEY) {
  console.error('Set PIXELLAB_SECRET env var');
  process.exit(1);
}
const client = new PixelLabClient(API_KEY);

// Ensure dirs
for (const d of ['sprites', 'tiles', 'objects']) {
  const p = join(ASSETS, d);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// Use style settings from central config
const STYLE = SPRITE_STYLE;
const T_STYLE = TILE_STYLE;

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

// --- TARGET: walk-anims ---
// Uses animateWithText with high imageGuidanceScale to keep the character
// consistent across all frames. Each direction uses its static sprite as
// the reference image so the walk cycle matches the idle pose.
async function generateWalkAnims() {
  console.log('\n=== Walk Animation Frames ===');
  const gabeDesc = CHARACTER.description;

  for (const dir of ['south', 'north', 'east', 'west']) {
    const refPath = join(ASSETS, 'sprites', `gabe-${dir}.png`);
    if (!existsSync(refPath)) {
      console.log(`  ✗ Skipping ${dir} — no reference image at ${refPath}`);
      console.log(`    Run 'character' target first.`);
      continue;
    }

    const refImage = await Base64Image.fromFile(refPath);
    console.log(`  Generating ${dir} walk cycle (animateWithText)...`);

    try {
      const r = await client.animateWithText({
        description: gabeDesc,
        action: CHARACTER.walkAction,
        referenceImage: refImage,
        imageSize: { width: 32, height: 48 },
        direction: dir,
        view: 'low top-down',
        nFrames: 4,
        imageGuidanceScale: 5,   // high — keep character consistent across frames
        textGuidanceScale: 4,    // lower — let the reference image dominate
        seed: 42,                // deterministic
      });

      console.log(`    Got ${r.images.length} frames (cost: $${r.usage.usd.toFixed(4)})`);
      for (let f = 0; f < r.images.length; f++) {
        const outPath = join(ASSETS, 'sprites', `gabe-${dir}-walk-${f}.png`);
        await r.images[f].saveToFile(outPath);
        console.log(`    ✓ Frame ${f}: ${outPath}`);
      }
    } catch (err) {
      console.error(`    ✗ FAILED ${dir}: ${err.message}`);
      if (err.status) console.error(`      HTTP ${err.status}`);
    }
  }
}

// --- TARGET: character ---
async function generateCharacter() {
  console.log('\n=== Character Sprites ===');
  for (const dir of ['south', 'north', 'east', 'west']) {
    await gen(`Gabe ${dir}`, {
      description: CHARACTER.description,
      imageSize: { width: 32, height: 48 },
      noBackground: true,
      direction: dir,
      ...STYLE,
    }, join(ASSETS, 'sprites', `gabe-${dir}.png`));
  }
}

// --- TARGET: tiles ---
async function generateTiles() {
  console.log('\n=== Ground Tiles ===');
  await gen('Grass', {
    description: 'lush green grass ground, seamless tileable texture, soft natural look, slight color variation, no hard edges, no visible grid, organic feel, top-down view',
    imageSize: { width: 32, height: 32 },
    noBackground: false, ...STYLE,
  }, join(ASSETS, 'tiles', 'grass.png'));

  await gen('Dirt path', {
    description: 'worn packed dirt path, seamless tileable texture, top-down view, brown earth with subtle footworn look',
    imageSize: { width: 32, height: 32 },
    noBackground: false, ...STYLE,
  }, join(ASSETS, 'tiles', 'dirt.png'));
}

// --- TARGET: graveyard-tiles ---
// Large base textures that repeat less visibly. Grass is 128x128 so
// the repeat is far less frequent. Gravel and dirt are 64x64.
async function generateGraveyardTiles() {
  console.log('\n=== Graveyard Base Tiles (large, seamless) ===');

  await gen('Grass base (128x128)', {
    description: 'green grass lawn texture, perfectly seamless tileable, uniform short mowed grass, consistent color across the entire image with no bright or dark patches near the edges, no border, no outline, fills entire image edge to edge, viewed directly from above, pixel art',
    imageSize: { width: 128, height: 128 },
    noBackground: false, ...TILE_STYLE,
    seed: 555,
  }, join(ASSETS, 'tiles', 'grass-base.png'));

  await gen('Gravel base (64x64)', {
    description: 'gray gravel crushed stone ground texture, perfectly seamless tileable, small uniform pebbles, consistent color across entire image, no border, no outline, fills entire image edge to edge, viewed directly from above, pixel art',
    imageSize: { width: 64, height: 64 },
    noBackground: false, ...TILE_STYLE,
    seed: 666,
  }, join(ASSETS, 'tiles', 'gravel-base.png'));

  await gen('Dirt base (64x64)', {
    description: 'brown packed dirt earth ground texture, perfectly seamless tileable, flat worn earth, consistent color across entire image, no border, no outline, fills entire image edge to edge, viewed directly from above, pixel art',
    imageSize: { width: 64, height: 64 },
    noBackground: false, ...TILE_STYLE,
    seed: 777,
  }, join(ASSETS, 'tiles', 'dirt-base.png'));
}

// --- TARGET: monuments ---
async function generateMonuments() {
  console.log('\n=== Interactive Monuments ===');
  for (let i = 0; i < MONUMENT_DESCS.length; i++) {
    await gen(MONUMENT_DESCS[i].name, {
      description: MONUMENT_DESCS[i].description,
      imageSize: { width: 32, height: 48 },
      noBackground: true, ...STYLE,
    }, join(ASSETS, 'objects', `monument-${i}.png`));
  }
}

// --- TARGET: environment ---
async function generateEnvironment() {
  console.log('\n=== Environment Objects ===');
  const E = ENVIRONMENT;
  const T = TREES;

  await gen('Oak tree', {
    description: T.oak.description,
    imageSize: T.oak.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'tree-oak.png'));

  await gen('Evergreen tree', {
    description: T.evergreen.description,
    imageSize: T.evergreen.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'tree-evergreen.png'));

  await gen('Dead tree', {
    description: T.dead.description,
    imageSize: T.dead.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'dead-tree.png'));

  await gen('Fountain', {
    description: E.fountain.description,
    imageSize: E.fountain.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'fountain.png'));

  await gen('Bench', {
    description: E.bench.description,
    imageSize: E.bench.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'bench.png'));

  await gen('Bush', {
    description: E.bush.description,
    imageSize: E.bush.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'bush.png'));

  await gen('Flowers', {
    description: E.flowerArrangement.description,
    imageSize: E.flowerArrangement.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'flower-arrangement.png'));

  await gen('Fence section', {
    description: E.fence.description,
    imageSize: E.fence.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'fence.png'));

  await gen('Fence post', {
    description: E.fencePost.description,
    imageSize: E.fencePost.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'fence-post.png'));
}

// --- TARGET: house ---
async function generateHouse() {
  console.log('\n=== Caretaker House ===');
  await gen("Caretaker's house", {
    description: BUILDINGS.caretakerHouse.description,
    imageSize: BUILDINGS.caretakerHouse.size, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'caretaker-house.png'));
}

// --- TARGET: flat-graves ---
async function generateFlatGraves() {
  console.log('\n=== Flat Grave Markers ===');
  for (let i = 0; i < 4; i++) {
    await gen(`Flat grave ${i}`, {
      description: FLAT_GRAVE,
      imageSize: { width: 32, height: 32 }, noBackground: true, ...STYLE, seed: 1000 + i,
    }, join(ASSETS, 'objects', `flat-grave-${i}.png`));
  }
}

// --- MAIN ---
const TARGETS = {
  'walk-anims': generateWalkAnims,
  'character': generateCharacter,
  'tiles': generateTiles,
  'monuments': generateMonuments,
  'environment': generateEnvironment,
  'house': generateHouse,
  'flat-graves': generateFlatGraves,
};

async function main() {
  const target = process.argv[2] || 'all';
  console.log(`=== Grit Asset Generator — Target: ${target} ===`);

  try {
    const bal = await client.getBalance();
    console.log(`Balance: $${bal.usd.toFixed(2)}`);
  } catch (e) { console.warn('Could not check balance'); }

  if (target === 'all') {
    for (const fn of Object.values(TARGETS)) await fn();
  } else if (TARGETS[target]) {
    await TARGETS[target]();
  } else {
    console.error(`Unknown target: ${target}`);
    console.error(`Available: ${Object.keys(TARGETS).join(', ')}, all`);
    process.exit(1);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
