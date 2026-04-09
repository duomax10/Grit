import Phaser from 'phaser';
import { generateAudio } from '../assets/AudioGenerator';

export class BootScene extends Phaser.Scene {
  private progressText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.setBackgroundColor('#0a0a0a');

    this.add.text(cx, cy - 60, 'GRIT', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#6b4226',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 30, 'A Gritty Adventure', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#5a5a60',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    this.progressBar = this.add.graphics();
    this.progressText = this.add.text(cx, cy + 40, 'Loading...', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#5a5a60',
    }).setOrigin(0.5);

    // Progress bar updates
    this.load.on('progress', (value: number) => {
      this.progressBar.clear();
      this.progressBar.fillStyle(0x1a1a1a, 1);
      this.progressBar.fillRect(cx - 80, cy + 10, 160, 12);
      this.progressBar.fillStyle(0x6b4226, 1);
      this.progressBar.fillRect(cx - 80, cy + 10, 160 * value, 12);
      this.progressBar.lineStyle(1, 0x3a3a3e, 1);
      this.progressBar.strokeRect(cx - 80, cy + 10, 160, 12);
    });

    // --- Load all PNG assets ---

    // Character sprites — static + walk frames (walk frames may not exist yet)
    this.load.image('gabe-south', 'assets/sprites/gabe-south.png');
    this.load.image('gabe-north', 'assets/sprites/gabe-north.png');
    this.load.image('gabe-east', 'assets/sprites/gabe-east.png');
    this.load.image('gabe-west', 'assets/sprites/gabe-west.png');

    // Walk animation frames (up to 6 per direction) — optional, loaded if available
    for (const dir of ['south', 'north', 'east', 'west']) {
      for (let f = 0; f < 6; f++) {
        this.load.image({
          key: `gabe-${dir}-walk-${f}`,
          url: `assets/sprites/gabe-${dir}-walk-${f}.png`,
        });
      }
    }
    // Don't fail if walk frames are missing
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      if (file.key.includes('-walk-')) {
        // Expected — walk frames not generated yet, will use static fallback
      }
    });

    // Wang tilesets (proper autotile transitions)
    this.load.image({ key: 'wang-grass-gravel', url: 'assets/tiles/grass-to-gravel.png' });
    this.load.json({ key: 'wang-grass-gravel-meta', url: 'assets/tiles/grass-to-gravel.json' });
    this.load.image({ key: 'wang-grass-dirt', url: 'assets/tiles/grass-to-dirt.png' });
    this.load.json({ key: 'wang-grass-dirt-meta', url: 'assets/tiles/grass-to-dirt.json' });

    // Fallback base tiles
    this.load.image('grass', 'assets/tiles/grass.png');
    this.load.image('dirt', 'assets/tiles/dirt.png');
    this.load.image({ key: 'grass-base', url: 'assets/tiles/grass-base.png' });
    this.load.image({ key: 'gravel-base', url: 'assets/tiles/gravel-base.png' });
    this.load.image({ key: 'dirt-base', url: 'assets/tiles/dirt-base.png' });

    // Monuments (interactive gravestones)
    for (let i = 0; i < 5; i++) {
      this.load.image(`monument-${i}`, `assets/objects/monument-${i}.png`);
    }

    // Flat grave markers (decorative)
    for (let i = 0; i < 4; i++) {
      this.load.image(`flat-grave-${i}`, `assets/objects/flat-grave-${i}.png`);
    }

    // Trees
    this.load.image('tree-oak', 'assets/objects/tree-oak.png');
    this.load.image('tree-evergreen', 'assets/objects/tree-evergreen.png');
    this.load.image('dead-tree', 'assets/objects/dead-tree.png');

    // Environment objects
    this.load.image('fountain', 'assets/objects/fountain.png');
    this.load.image('bench', 'assets/objects/bench.png');
    this.load.image('bush', 'assets/objects/bush.png');
    this.load.image('flower-arrangement', 'assets/objects/flower-arrangement.png');

    // Fence
    this.load.image('fence', 'assets/objects/fence.png');
    this.load.image('fence-post', 'assets/objects/fence-post.png');

    // Caretaker's house
    this.load.image('caretaker-house', 'assets/objects/caretaker-house.png');
  }

  async create(): Promise<void> {
    this.progressText.setText('Summoning the darkness...');

    // Generate procedural audio (kept since PixelLab doesn't do audio)
    try {
      await generateAudio(this);
    } catch (e) {
      console.warn('Audio generation failed, continuing without sound:', e);
    }

    // Create player animations — walk frames if available, static fallback
    const directions = ['south', 'north', 'east', 'west'] as const;
    const dirMap = { south: 'down', north: 'up', east: 'right', west: 'left' } as const;

    for (const dir of directions) {
      const gameDir = dirMap[dir];

      // Count how many walk frames exist for this direction
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
        this.anims.create({
          key: `gabe-walk-${gameDir}`,
          frames,
          frameRate: 8,
          repeat: -1,
        });
      } else {
        this.anims.create({
          key: `gabe-walk-${gameDir}`,
          frames: [{ key: `gabe-${dir}` }],
          frameRate: 1,
          repeat: -1,
        });
      }

      this.anims.create({
        key: `gabe-idle-${gameDir}`,
        frames: [{ key: `gabe-${dir}` }],
        frameRate: 1,
        repeat: -1,
      });
    }

    this.progressText.setText('Enter the graveyard...');
    await new Promise((r) => setTimeout(r, 400));

    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GraveyardScene');
      this.scene.start('UIScene');
    });
  }
}
