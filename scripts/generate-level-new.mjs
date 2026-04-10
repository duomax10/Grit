/**
 * Generate only NEW assets — ones that don't already have a file.
 * Useful for adding new objects without regenerating existing ones.
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
let generated = 0;
let skipped = 0;

async function genIfMissing(name, description, imageSize, apiSettings, outPath, noBackground = true) {
  if (existsSync(outPath)) {
    console.log(`  ⊙ ${name} — already exists, skipping`);
    skipped++;
    return;
  }
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
    generated++;
    console.log(`    ✓ ${outPath} ($${r.usage.usd.toFixed(4)})`);
  } catch (err) {
    console.error(`    ✗ ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('=== Generate NEW Assets Only (missing files) ===\n');

  try {
    const b = await client.getBalance();
    console.log(`Balance: $${b.usd.toFixed(2)}\n`);
  } catch (e) { console.warn('Could not check balance'); }

  // Tiles
  console.log('Tiles:');
  for (const [key, tile] of Object.entries(TILES)) {
    await genIfMissing(key, tile.description, tile.size, TILE_API_SETTINGS,
      join(ASSETS, 'tiles', `${key}.png`), false);
  }

  // Gravestones
  console.log('\nGravestones:');
  for (let i = 0; i < GRAVESTONES.length; i++) {
    const gs = GRAVESTONES[i];
    await genIfMissing(gs.name, gs.description, gs.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `gravestone-${i}.png`));
  }

  // Trees
  console.log('\nTrees:');
  for (const [key, tree] of Object.entries(TREES)) {
    await genIfMissing(key, tree.description, tree.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `tree-${key}.png`));
  }

  // Bushes
  console.log('\nBushes:');
  for (const [key, bush] of Object.entries(BUSHES)) {
    await genIfMissing(key, bush.description, bush.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `bush-${key}.png`));
  }

  // Large objects
  console.log('\nLarge Objects:');
  for (const [key, obj] of Object.entries(LARGE_OBJECTS)) {
    await genIfMissing(key, obj.description, obj.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `${key === 'caretakerHouse' ? 'caretaker-house' : key}.png`));
  }

  // Fence
  console.log('\nFence:');
  for (const [key, obj] of Object.entries(FENCE)) {
    const filename = key === 'section' ? 'fence.png' : `fence-${key}.png`;
    await genIfMissing(`fence ${key}`, obj.description, obj.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', filename));
  }

  // Details
  console.log('\nDetails:');
  for (const [key, detail] of Object.entries(DETAILS)) {
    await genIfMissing(key, detail.description, detail.size, OBJECT_API_SETTINGS,
      join(ASSETS, 'objects', `${key}.png`));
  }

  console.log(`\n=== Done! Generated: ${generated}, Skipped: ${skipped}, Cost: $${totalCost.toFixed(4)} ===`);
}

main().catch(console.error);
