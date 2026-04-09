/**
 * Coordinates all asset generation.
 */
import { generateGabeSprite, createGabeAnimations } from './SpriteGenerator';
import { generateTilesetAndObjects } from './TilesetGenerator';
import { generateAudio } from './AudioGenerator';

export async function generateAllAssets(scene: Phaser.Scene): Promise<void> {
  // Generate visual assets (synchronous canvas operations)
  generateGabeSprite(scene);
  generateTilesetAndObjects(scene);

  // Generate audio (async - uses Web Audio API)
  await generateAudio(scene);

  // Create animations after sprites are loaded
  createGabeAnimations(scene);
}
