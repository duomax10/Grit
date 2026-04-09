/**
 * Generate all non-character level assets using descriptions from
 * level-asset-descriptions.mjs. Uses PixelLab Pixflux API.
 */

import { PixelLabClient } from '@pixellab-code/pixellab';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  TILES, TILE_API_SETTINGS,
  GRAVESTONES, OBJECT_API_SETTINGS,
  TREES, BUSHES, LARGE_OBJECTS, FENCE, DETAILS,
} from './level-asset-descriptions.mjs';

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

let totalCost = 0;

async function gen(name, description, imageSize, apiSettings, outPath, noBackground = true) {
  console.log(`  ${name}...`);
  try {
    const r = await client.generateImagePixflux({
      description,
      imageSize,
      noBackground,
      ...apiSettings,
    });
    await r.image.saveToFile(outPath);
    totalCost += r.usage.usd;
    console.log(`    ✓ ${outPath} ($${r.usage.usd.toFixed(4)})`);
  } catch (err) {
    console.error(`    ✗ ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('=== Level 1 Asset Generation ===');
  console.log('Using descriptions from level-asset-descriptions.mjs\n');

  try {
    const b = await client.getBalance();
    console.log(`Balance: $${b.usd.toFixed(2)}\n`);
  } catch (e) { console.warn('Could not check balance'); }

  // --- GROUND TILES ---
  console.log('Ground Tiles:');
  for (const [key, tile] of Object.entries(TILES)) {
    await gen(key, tile.description, tile.size, TILE_API_SETTINGS,
      join(ASSETS, 'tiles', `${key}.png`), false);
  }

  // --- GRAVESTONES ---
  console.log('\nGravestones:');
  for (let i = 0; i < GRAVESTONES.length; i++) {
    const gs = GRAVESTONES[i];
    await gen(gs.name, gs.description, gs.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `gravestone-${i}.png`));
  }

  // --- TREES ---
  console.log('\nTrees:');
  for (const [key, tree] of Object.entries(TREES)) {
    await gen(key, tree.description, tree.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `tree-${key}.png`));
  }

  // --- BUSHES ---
  console.log('\nBushes:');
  for (const [key, bush] of Object.entries(BUSHES)) {
    await gen(key, bush.description, bush.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `bush-${key}.png`));
  }

  // --- LARGE OBJECTS ---
  console.log('\nLarge Objects:');
  await gen('fountain', LARGE_OBJECTS.fountain.description,
    LARGE_OBJECTS.fountain.size, OBJECT_API_SETTINGS,
    join(ASSETS, 'objects', 'fountain.png'));
  await gen('caretaker house', LARGE_OBJECTS.caretakerHouse.description,
    LARGE_OBJECTS.caretakerHouse.size, OBJECT_API_SETTINGS,
    join(ASSETS, 'objects', 'caretaker-house.png'));

  // --- FENCE ---
  console.log('\nFence:');
  await gen('fence section', FENCE.section.description,
    FENCE.section.size, OBJECT_API_SETTINGS,
    join(ASSETS, 'objects', 'fence.png'));
  await gen('fence post', FENCE.post.description,
    FENCE.post.size, OBJECT_API_SETTINGS,
    join(ASSETS, 'objects', 'fence-post.png'));

  // --- SMALL DETAILS ---
  console.log('\nSmall Details:');
  for (const [key, detail] of Object.entries(DETAILS)) {
    await gen(key, detail.description, detail.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `${key}.png`));
  }

  console.log(`\n=== Done! Total cost: $${totalCost.toFixed(4)} ===`);
}

main().catch(console.error);
