import Phaser from 'phaser';
import { generateAudio } from '../assets/AudioGenerator';
import { generateItemIcons } from '../assets/ItemIconGenerator';
import { getDefaultLevel, getLevel, Level } from '../data/levels';
import { MissionSystem } from '../systems/MissionSystem';

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

    // Gracefully handle missing asset files (they may not be generated yet)
    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Missing asset: ${file.key} at ${file.url}`);
    });

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

    // Crouch frames (5 per direction)
    for (const dir of ['south', 'north', 'east', 'west']) {
      for (let f = 0; f < 5; f++) {
        this.load.image(`gabe-${dir}-crouch-${f}`, `assets/sprites/gabe-${dir}-crouch-${f}.png`);
      }
    }

    // Tiles
    this.load.image('grass', 'assets/tiles/grass.png');
    this.load.image('gravel', 'assets/tiles/stone_path.png');

    // Gravestones (up to 18 variants — any missing are skipped)
    for (let i = 0; i < 18; i++) {
      this.load.image({ key: `gravestone-${i}`, url: `assets/objects/gravestone-${i}.png` });
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
    this.load.image('fence-vertical', 'assets/objects/fence-vertical.png');

    // Details
    this.load.image('rocks', 'assets/objects/rocks.png');
    this.load.image('grassTufts', 'assets/objects/grassTufts.png');

    // Inventory items (optional — procedural fallbacks drawn in create())
    this.load.image({ key: 'item-spade', url: 'assets/items/item-spade.png' });
    this.load.image({ key: 'item-container', url: 'assets/items/item-container.png' });
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

      // Crouch: play frames 0..N forward, hold, then reverse back up.
      // We build two one-shot anims so Player can sequence them.
      let crouchFrameCount = 0;
      for (let f = 0; f < 5; f++) {
        if (this.textures.exists(`gabe-${dir}-crouch-${f}`)) crouchFrameCount++;
        else break;
      }
      if (crouchFrameCount >= 2) {
        const down: Array<{ key: string }> = [];
        for (let f = 0; f < crouchFrameCount; f++) {
          down.push({ key: `gabe-${dir}-crouch-${f}` });
        }
        const up = [...down].reverse();
        this.anims.create({ key: `gabe-crouch-down-${gameDir}`, frames: down, frameRate: 12, repeat: 0 });
        this.anims.create({ key: `gabe-crouch-up-${gameDir}`, frames: up, frameRate: 12, repeat: 0 });
        // Hold: the fully crouched pose (last frame)
        this.anims.create({
          key: `gabe-crouch-hold-${gameDir}`,
          frames: [{ key: `gabe-${dir}-crouch-${crouchFrameCount - 1}` }],
          frameRate: 1,
          repeat: -1,
        });
      }
    }

    // Generate procedural item icons for the inventory
    generateItemIcons(this);

    // Generate procedural audio (fire and forget — don't block scene transition)
    generateAudio(this).catch(() => {});

    // Pick the starting scene. Defaults to the first gameplay level
    // registered in data/levels.ts, but if the URL carries
    // `?dev=picker` we jump straight to the hidden dev picker instead.
    // A `?level=<id>` param can force a specific level for deep
    // linking without exposing the picker to players.
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const devFlag = params.get('dev');
    const levelParam = params.get('level');

    let startSceneKey: string;
    let startUI = true;
    if (devFlag === 'picker') {
      startSceneKey = 'LevelPickerScene';
      startUI = false; // picker owns its own chrome
    } else if (levelParam) {
      const lvl = getLevel(levelParam);
      startSceneKey = lvl ? lvl.sceneKey : getDefaultLevel().sceneKey;
    } else {
      startSceneKey = getDefaultLevel().sceneKey;
    }

    this.time.delayedCall(300, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(startSceneKey);
        if (startUI) this.scene.start('UIScene');
      });
    });
  }
}
