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

const STYLE = {
  outline: 'single color black outline',
  shading: 'detailed shading',
  detail: 'highly detailed',
  view: 'low top-down',
};

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
async function generateWalkAnims() {
  console.log('\n=== Walk Animation Frames ===');
  const gabeDesc = 'pixel art character, white male, medium build, short brown messy hair, facial scruff stubble, brown leather jacket, blue jeans, dark boots, gritty adventure game protagonist';

  for (const dir of ['south', 'north', 'east', 'west']) {
    const refPath = join(ASSETS, 'sprites', `gabe-${dir}.png`);
    if (!existsSync(refPath)) {
      console.log(`  Skipping ${dir} - no reference image at ${refPath}`);
      continue;
    }

    // Try animateWithText first
    let success = false;
    try {
      const refImage = await Base64Image.fromFile(refPath);
      console.log(`  Animating ${dir} walk cycle via animateWithText...`);
      const r = await client.animateWithText({
        description: gabeDesc,
        action: 'walking',
        referenceImage: refImage,
        imageSize: { width: 32, height: 48 },
        direction: dir,
        view: 'low top-down',
        nFrames: 4,
      });
      for (let f = 0; f < r.images.length; f++) {
        const outPath = join(ASSETS, 'sprites', `gabe-${dir}-walk-${f}.png`);
        await r.images[f].saveToFile(outPath);
        console.log(`    ✓ Frame ${f}: ${outPath}`);
      }
      console.log(`    Cost: $${r.usage.usd.toFixed(4)}`);
      success = true;
    } catch (err) {
      console.error(`    ✗ animateWithText failed for ${dir}: ${err.message}`);
    }

    // Fallback: generate individual walk frames with pixflux + different seeds
    if (!success) {
      console.log(`  Falling back to pixflux generation for ${dir}...`);
      const walkDescs = [
        `${gabeDesc}, walking pose, left foot forward`,
        `${gabeDesc}, walking pose, standing straight mid-stride`,
        `${gabeDesc}, walking pose, right foot forward`,
        `${gabeDesc}, walking pose, standing straight mid-stride`,
      ];
      for (let f = 0; f < 4; f++) {
        await gen(`${dir} walk frame ${f}`, {
          description: walkDescs[f],
          imageSize: { width: 32, height: 48 },
          noBackground: true,
          direction: dir,
          ...STYLE,
          seed: 2000 + f * 100 + ['south','north','east','west'].indexOf(dir) * 10,
        }, join(ASSETS, 'sprites', `gabe-${dir}-walk-${f}.png`));
      }
    }
  }
}

// --- TARGET: character ---
async function generateCharacter() {
  console.log('\n=== Character Sprites ===');
  const gabeDesc = 'pixel art character, white male, medium build, short brown messy hair, facial scruff stubble, brown leather jacket, blue jeans, dark boots, modern day, gritty adventure game protagonist';
  for (const dir of ['south', 'north', 'east', 'west']) {
    await gen(`Gabe ${dir}`, {
      description: gabeDesc,
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
  await gen('Dark grass', {
    description: 'dark green grass ground tile, nighttime graveyard, seamless texture, top-down view, some dead patches',
    imageSize: { width: 32, height: 32 },
    noBackground: false, ...STYLE,
  }, join(ASSETS, 'tiles', 'grass.png'));

  await gen('Dirt path', {
    description: 'worn dirt gravel path tile, seamless texture, top-down view, nighttime, some small pebbles',
    imageSize: { width: 32, height: 32 },
    noBackground: false, ...STYLE,
  }, join(ASSETS, 'tiles', 'dirt.png'));
}

// --- TARGET: monuments ---
async function generateMonuments() {
  console.log('\n=== Interactive Monuments ===');
  const items = [
    { name: 'Angel statue', desc: 'stone angel statue gravestone monument, weathered gray stone, wings, praying pose, graveyard, nighttime' },
    { name: 'Obelisk', desc: 'tall stone obelisk grave monument, weathered gray, pointed top, old cemetery' },
    { name: 'Celtic cross', desc: 'ornate celtic cross gravestone, stone, moss covered base, old cemetery monument' },
    { name: 'Ornate headstone', desc: 'large ornate Victorian headstone, carved decorations, weathered stone, graveyard' },
    { name: 'Stone crypt', desc: 'small stone crypt mausoleum entrance, iron door, old cemetery, gothic style' },
  ];
  for (let i = 0; i < items.length; i++) {
    await gen(items[i].name, {
      description: items[i].desc,
      imageSize: { width: 32, height: 48 },
      noBackground: true, ...STYLE,
    }, join(ASSETS, 'objects', `monument-${i}.png`));
  }
}

// --- TARGET: environment ---
async function generateEnvironment() {
  console.log('\n=== Environment Objects ===');
  await gen('Oak tree', {
    description: 'large oak tree with full green canopy, thick trunk, top-down 3/4 view, graveyard setting',
    imageSize: { width: 64, height: 64 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'tree-oak.png'));

  await gen('Evergreen tree', {
    description: 'tall dark cypress or evergreen tree, narrow conical shape, graveyard, top-down 3/4 view',
    imageSize: { width: 32, height: 64 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'tree-evergreen.png'));

  await gen('Dead tree', {
    description: 'dead leafless gnarled tree, bare branches, dark bark, spooky graveyard atmosphere',
    imageSize: { width: 48, height: 64 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'dead-tree.png'));

  await gen('Fountain', {
    description: 'old stone water fountain, circular basin, weathered, moss, graveyard garden, top-down 3/4 view',
    imageSize: { width: 64, height: 64 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'fountain.png'));

  await gen('Bench', {
    description: 'old wooden park bench, dark wood, iron frame, top-down 3/4 view, graveyard setting',
    imageSize: { width: 48, height: 32 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'bench.png'));

  await gen('Bush', {
    description: 'green hedge bush, rounded shape, some small flowers, top-down 3/4 view',
    imageSize: { width: 32, height: 32 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'bush.png'));

  await gen('Flowers', {
    description: 'small flower bouquet arrangement on ground, colorful flowers, memorial tribute, top-down view',
    imageSize: { width: 16, height: 16 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'flower-arrangement.png'));

  await gen('Fence section', {
    description: 'wrought iron cemetery fence section with pointed bars, dark metal, rust spots, top-down 3/4 front view',
    imageSize: { width: 32, height: 32 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'fence.png'));

  await gen('Fence post', {
    description: 'wrought iron cemetery fence post, thick dark metal pillar with cap, top-down 3/4 view',
    imageSize: { width: 32, height: 32 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'fence-post.png'));
}

// --- TARGET: house ---
async function generateHouse() {
  console.log('\n=== Caretaker House ===');
  await gen("Caretaker's house", {
    description: "small stone caretaker's cottage house, shingled roof, lit window with warm glow, wooden door, chimney, dark nighttime setting, old cemetery groundskeeper building",
    imageSize: { width: 96, height: 96 }, noBackground: true, ...STYLE,
  }, join(ASSETS, 'objects', 'caretaker-house.png'));
}

// --- TARGET: flat-graves ---
async function generateFlatGraves() {
  console.log('\n=== Flat Grave Markers ===');
  for (let i = 0; i < 4; i++) {
    await gen(`Flat grave ${i}`, {
      description: 'small flat rectangular grave marker in ground, stone slab, top-down view, grass around edges',
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
