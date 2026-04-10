/**
 * Generate only the object assets (no tiles). Useful for regenerating
 * trees, bushes, gravestones, etc. without touching tile files.
 */

import { PixelLabClient } from '@pixellab-code/pixellab';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  GRAVESTONES, OBJECT_API_SETTINGS,
  TREES, BUSHES, LARGE_OBJECTS, FENCE, DETAILS,
} from './level-asset-descriptions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'public', 'assets');

const API_KEY = process.env.PIXELLAB_SECRET || '';
if (!API_KEY) { console.error('Set PIXELLAB_SECRET'); process.exit(1); }
const client = new PixelLabClient(API_KEY);

const objDir = join(ASSETS, 'objects');
if (!existsSync(objDir)) mkdirSync(objDir, { recursive: true });

let totalCost = 0;

async function gen(name, description, imageSize, outPath) {
  console.log(`  ${name}...`);
  try {
    const r = await client.generateImagePixflux({
      description,
      imageSize,
      noBackground: true,
      ...OBJECT_API_SETTINGS,
    });
    await r.image.saveToFile(outPath);
    totalCost += r.usage.usd;
    console.log(`    ✓ ${outPath} ($${r.usage.usd.toFixed(4)})`);
  } catch (err) {
    console.error(`    ✗ ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('=== Level 1 Object Assets Only ===\n');

  try {
    const b = await client.getBalance();
    console.log(`Balance: $${b.usd.toFixed(2)}\n`);
  } catch (e) { console.warn('Could not check balance'); }

  // Gravestones
  console.log('Gravestones:');
  for (let i = 0; i < GRAVESTONES.length; i++) {
    const gs = GRAVESTONES[i];
    await gen(gs.name, gs.description, gs.size,
      join(objDir, `gravestone-${i}.png`));
  }

  // Trees
  console.log('\nTrees:');
  for (const [key, tree] of Object.entries(TREES)) {
    await gen(key, tree.description, tree.size,
      join(objDir, `tree-${key}.png`));
  }

  // Bushes
  console.log('\nBushes:');
  for (const [key, bush] of Object.entries(BUSHES)) {
    await gen(key, bush.description, bush.size,
      join(objDir, `bush-${key}.png`));
  }

  // Large objects
  console.log('\nLarge Objects:');
  await gen('fountain', LARGE_OBJECTS.fountain.description,
    LARGE_OBJECTS.fountain.size, join(objDir, 'fountain.png'));
  await gen('caretaker house', LARGE_OBJECTS.caretakerHouse.description,
    LARGE_OBJECTS.caretakerHouse.size, join(objDir, 'caretaker-house.png'));

  // Fence
  console.log('\nFence:');
  await gen('fence section', FENCE.section.description,
    FENCE.section.size, join(objDir, 'fence.png'));
  await gen('fence post', FENCE.post.description,
    FENCE.post.size, join(objDir, 'fence-post.png'));

  // Details
  console.log('\nDetails:');
  for (const [key, detail] of Object.entries(DETAILS)) {
    await gen(key, detail.description, detail.size,
      join(objDir, `${key}.png`));
  }

  console.log(`\n=== Done! Total cost: $${totalCost.toFixed(4)} ===`);
}

main().catch(console.error);
