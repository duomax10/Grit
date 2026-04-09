/**
 * PixelLab Asset Generator for Grit
 *
 * Run this script locally (not in a sandboxed environment) to generate
 * all game assets via the PixelLab API:
 *
 *   node scripts/generate-assets.mjs
 *
 * Requires: npm install @pixellab-code/pixellab
 * Set your API key below or via PIXELLAB_SECRET env var.
 */

import { PixelLabClient } from '@pixellab-code/pixellab';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'public', 'assets');

// API key - set via env or hardcode yours here
const API_KEY = process.env.PIXELLAB_SECRET || '5a919008-0126-4e56-aa37-2a38727538e1';
const client = new PixelLabClient(API_KEY);

// Ensure output dirs exist
['sprites', 'tiles', 'objects'].forEach(dir => {
  const p = join(ASSETS, dir);
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
});

// Shared style settings for consistency
const STYLE = {
  outline: 'single color black outline',
  shading: 'detailed shading',
  detail: 'highly detailed',
  view: 'low top-down',
};

async function generateAsset(name, params, outPath) {
  console.log(`Generating: ${name}...`);
  try {
    const response = await client.generateImagePixflux(params);
    await response.image.saveToFile(outPath);
    console.log(`  ✓ Saved: ${outPath} (cost: $${response.usage.usd.toFixed(4)})`);
    return response;
  } catch (err) {
    console.error(`  ✗ Failed: ${name} - ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('=== Grit Asset Generator (PixelLab) ===\n');

  // Check balance first
  try {
    const balance = await client.getBalance();
    console.log(`Account balance: $${balance.usd.toFixed(2)}\n`);
  } catch (err) {
    console.error('Could not check balance:', err.message);
  }

  // ============================================
  // CHARACTER: Gabe Hollow (4 directions + idle)
  // ============================================
  const gabeDesc = 'pixel art character, white male, medium build, short brown messy hair, facial scruff stubble, brown leather jacket, blue jeans, dark boots, modern day, gritty adventure game protagonist';

  const directions = ['south', 'east', 'north', 'west'];
  for (const dir of directions) {
    await generateAsset(`Gabe facing ${dir}`, {
      description: gabeDesc,
      imageSize: { width: 32, height: 48 },
      noBackground: true,
      direction: dir,
      ...STYLE,
    }, join(ASSETS, 'sprites', `gabe-${dir}.png`));
  }

  // ============================================
  // TILES: Ground tiles
  // ============================================
  await generateAsset('Dark grass tile', {
    description: 'dark green grass ground tile, nighttime graveyard, seamless texture, top-down view, some dead patches',
    imageSize: { width: 32, height: 32 },
    noBackground: false,
    ...STYLE,
  }, join(ASSETS, 'tiles', 'grass.png'));

  await generateAsset('Dirt path tile', {
    description: 'worn dirt gravel path tile, seamless texture, top-down view, nighttime, some small pebbles',
    imageSize: { width: 32, height: 32 },
    noBackground: false,
    ...STYLE,
  }, join(ASSETS, 'tiles', 'dirt.png'));

  // ============================================
  // OBJECTS: Gravestones (5 interactive monuments)
  // ============================================
  const monuments = [
    { name: 'Angel statue', desc: 'stone angel statue gravestone monument, weathered gray stone, wings, praying pose, graveyard, nighttime' },
    { name: 'Obelisk', desc: 'tall stone obelisk grave monument, weathered gray, pointed top, old cemetery' },
    { name: 'Celtic cross', desc: 'ornate celtic cross gravestone, stone, moss covered base, old cemetery monument' },
    { name: 'Ornate headstone', desc: 'large ornate Victorian headstone, carved decorations, weathered stone, graveyard' },
    { name: 'Stone crypt', desc: 'small stone crypt mausoleum entrance, iron door, old cemetery, gothic style' },
  ];

  for (let i = 0; i < monuments.length; i++) {
    await generateAsset(monuments[i].name, {
      description: monuments[i].desc,
      imageSize: { width: 32, height: 48 },
      noBackground: true,
      ...STYLE,
    }, join(ASSETS, 'objects', `monument-${i}.png`));
  }

  // ============================================
  // OBJECTS: Flat grave markers (small, decorative)
  // ============================================
  for (let i = 0; i < 4; i++) {
    await generateAsset(`Flat grave marker ${i}`, {
      description: 'small flat rectangular grave marker in ground, stone slab, top-down view, grass around edges',
      imageSize: { width: 32, height: 32 },
      noBackground: true,
      ...STYLE,
      seed: 1000 + i,
    }, join(ASSETS, 'objects', `flat-grave-${i}.png`));
  }

  // ============================================
  // OBJECTS: Trees
  // ============================================
  await generateAsset('Oak tree', {
    description: 'large oak tree with full green canopy, thick trunk, top-down 3/4 view, graveyard setting',
    imageSize: { width: 64, height: 64 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'tree-oak.png'));

  await generateAsset('Evergreen tree', {
    description: 'tall dark cypress or evergreen tree, narrow conical shape, graveyard, top-down 3/4 view',
    imageSize: { width: 32, height: 64 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'tree-evergreen.png'));

  await generateAsset('Dead tree', {
    description: 'dead leafless gnarled tree, bare branches, dark bark, spooky graveyard atmosphere',
    imageSize: { width: 48, height: 64 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'dead-tree.png'));

  // ============================================
  // OBJECTS: Environment
  // ============================================
  await generateAsset('Stone fountain', {
    description: 'old stone water fountain, circular basin, weathered, moss, graveyard garden, top-down 3/4 view',
    imageSize: { width: 64, height: 64 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'fountain.png'));

  await generateAsset('Bench', {
    description: 'old wooden park bench, dark wood, iron frame, top-down 3/4 view, graveyard setting',
    imageSize: { width: 48, height: 32 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'bench.png'));

  await generateAsset('Bush', {
    description: 'green hedge bush, rounded shape, some small flowers, top-down 3/4 view',
    imageSize: { width: 32, height: 32 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'bush.png'));

  await generateAsset('Flower arrangement', {
    description: 'small flower bouquet arrangement on ground, colorful flowers, memorial tribute, top-down view',
    imageSize: { width: 16, height: 16 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'flower-arrangement.png'));

  // ============================================
  // OBJECTS: Fence
  // ============================================
  await generateAsset('Iron fence section', {
    description: 'wrought iron cemetery fence section with pointed bars, dark metal, rust spots, top-down 3/4 front view',
    imageSize: { width: 32, height: 32 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'fence.png'));

  await generateAsset('Iron fence post', {
    description: 'wrought iron cemetery fence post, thick dark metal pillar with cap, top-down 3/4 view',
    imageSize: { width: 32, height: 32 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'fence-post.png'));

  // ============================================
  // OBJECTS: Caretaker's house
  // ============================================
  await generateAsset("Caretaker's house", {
    description: "small stone caretaker's cottage house, shingled roof, lit window with warm glow, wooden door, chimney, dark nighttime setting, old cemetery groundskeeper building",
    imageSize: { width: 96, height: 96 },
    noBackground: true,
    ...STYLE,
  }, join(ASSETS, 'objects', 'caretaker-house.png'));

  console.log('\n=== Done! ===');
  console.log('Assets saved to public/assets/');
  console.log('Run "npm run build" to rebuild the game.');
}

main().catch(console.error);
