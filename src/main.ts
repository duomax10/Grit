import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GraveyardScene } from './scenes/GraveyardScene';
import { UIScene } from './scenes/UIScene';
import { InspectScene } from './scenes/InspectScene';
import { SplashScene } from './scenes/SplashScene';
import { LevelPickerScene } from './scenes/LevelPickerScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 320,
  height: 480,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GraveyardScene, UIScene, InspectScene, SplashScene, LevelPickerScene],
  backgroundColor: '#0a0a0a',
  input: {
    activePointers: 3,
  },
};

new Phaser.Game(config);
