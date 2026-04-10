import Phaser from 'phaser';
import { generateAudio } from '../assets/AudioGenerator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.setBackgroundColor('#0a0a0a');

    this.add.text(cx, cy - 40, 'GRIT', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#6b4226',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#5a5a60',
    }).setOrigin(0.5);

    // Character sprites
    this.load.image('gabe-south', 'assets/sprites/gabe-south.png');
    this.load.image('gabe-north', 'assets/sprites/gabe-north.png');
    this.load.image('gabe-east', 'assets/sprites/gabe-east.png');
    this.load.image('gabe-west', 'assets/sprites/gabe-west.png');

    // Walk frames
    for (const dir of ['south', 'north', 'east', 'west']) {
      for (let f = 0; f < 6; f++) {
        this.load.image(`gabe-${dir}-walk-${f}`, `assets/sprites/gabe-${dir}-walk-${f}.png`);
      }
    }

    // Tiles
    this.load.image('grass', 'assets/tiles/grass.png');
    this.load.image('gravel', 'assets/tiles/stone_path.png');

    // Gravestones
    for (let i = 0; i < 8; i++) {
      this.load.image(`gravestone-${i}`, `assets/objects/gravestone-${i}.png`);
    }

    // Trees
    this.load.image('tree-oak', 'assets/objects/tree-oak.png');
    this.load.image('tree-evergreen', 'assets/objects/tree-evergreen.png');
    this.load.image('tree-dead', 'assets/objects/tree-dead.png');

    // Bushes
    this.load.image('bush-large', 'assets/objects/bush-large.png');
    this.load.image('bush-small', 'assets/objects/bush-small.png');

    // Large objects
    this.load.image('fountain', 'assets/objects/fountain.png');

    // Fence
    this.load.image('fence', 'assets/objects/fence.png');
    this.load.image('fence-post', 'assets/objects/fence-post.png');

    // Details
    this.load.image('rocks', 'assets/objects/rocks.png');
    this.load.image('grassTufts', 'assets/objects/grassTufts.png');
    this.load.image('fallenLeaves', 'assets/objects/fallenLeaves.png');
  }

  create(): void {
    // Create walk animations
    const dirMap = { south: 'down', north: 'up', east: 'right', west: 'left' } as const;

    for (const [dir, gameDir] of Object.entries(dirMap)) {
      let walkFrameCount = 0;
      for (let f = 0; f < 6; f++) {
        if (this.textures.exists(`gabe-${dir}-walk-${f}`)) walkFrameCount++;
        else break;
      }

      if (walkFrameCount >= 2) {
        const frames = [];
        for (let f = 0; f < walkFrameCount; f++) {
          frames.push({ key: `gabe-${dir}-walk-${f}` });
        }
        this.anims.create({ key: `gabe-walk-${gameDir}`, frames, frameRate: 8, repeat: -1 });
      } else {
        this.anims.create({ key: `gabe-walk-${gameDir}`, frames: [{ key: `gabe-${dir}` }], frameRate: 1, repeat: -1 });
      }

      this.anims.create({ key: `gabe-idle-${gameDir}`, frames: [{ key: `gabe-${dir}` }], frameRate: 1, repeat: -1 });
    }

    // Generate procedural audio (fire and forget — don't block scene transition)
    generateAudio(this).catch(() => {});

    // Go to game
    this.time.delayedCall(300, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GraveyardScene');
        this.scene.start('UIScene');
      });
    });
  }
}
