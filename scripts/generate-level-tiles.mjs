/**
 * Generate only the ground tiles (grass, gravel, dirt).
 */

import { PixelLabClient } from '@pixellab-code/pixellab';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TILES, TILE_API_SETTINGS } from './level-asset-descriptions.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ASSETS = join(ROOT, 'public', 'assets');

const API_KEY = process.env.PIXELLAB_SECRET || '';
if (!API_KEY) { console.error('Set PIXELLAB_SECRET'); process.exit(1); }
const client = new PixelLabClient(API_KEY);

const tileDir = join(ASSETS, 'tiles');
if (!existsSync(tileDir)) mkdirSync(tileDir, { recursive: true });

async function main() {
  console.log('=== Level 1 Tile Assets Only ===\n');
  try {
    const b = await client.getBalance();
    console.log(`Balance: $${b.usd.toFixed(2)}\n`);
  } catch (e) { console.warn('Could not check balance'); }

  let totalCost = 0;
  for (const [key, tile] of Object.entries(TILES)) {
    console.log(`  ${key}...`);
    try {
      const r = await client.generateImagePixflux({
        description: tile.description,
        imageSize: tile.size,
        noBackground: false,
        ...TILE_API_SETTINGS,
      });
      await r.image.saveToFile(join(tileDir, `${key}.png`));
      totalCost += r.usage.usd;
      console.log(`    ✓ ${key}.png ($${r.usage.usd.toFixed(4)})`);
    } catch (err) {
      console.error(`    ✗ ${key}: ${err.message}`);
    }
  }

  console.log(`\n=== Done! Total cost: $${totalCost.toFixed(4)} ===`);
}

main().catch(console.error);
