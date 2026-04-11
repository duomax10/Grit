/**
 * Dev-only level picker.
 *
 * Not part of the main gameplay loop — reached only by opening the
 * game with `?dev=picker` in the URL. Lists every level registered
 * in src/data/levels.ts and launches the chosen level when tapped.
 *
 * Keep this lightweight: no fancy art, just a scrollable list. When
 * a level is picked, we start the level scene and the UIScene in
 * parallel (the same pair BootScene would start normally).
 */

import Phaser from 'phaser';
import { listLevelsInOrder, Level } from '../data/levels';

export class LevelPickerScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelPickerScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#0a0a0a');

    // Title
    this.add.text(cx, 32, 'GRIT — Dev Picker', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#c0a880',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, 54, 'Select a level', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#6b5a4c',
    }).setOrigin(0.5);

    // Level buttons
    const startY = 90;
    const rowH = 58;
    const btnW = Math.min(240, width - 32);

    const levels = listLevelsInOrder();
    levels.forEach((level, i) => {
      const y = startY + i * rowH;
      this.createLevelButton(cx, y, btnW, level);
    });

    // Footer hint
    this.add.text(cx, height - 18, 'Remove ?dev=picker to boot normally', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#4a4a4a',
    }).setOrigin(0.5);
  }

  private createLevelButton(cx: number, cy: number, w: number, level: Level): void {
    const h = 48;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a1f, 0.9);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
    bg.lineStyle(1, 0x3a3a40, 0.9);
    bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);

    this.add.text(cx - w / 2 + 14, cy - 10, level.title, {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#c0a880',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    if (level.subtitle) {
      this.add.text(cx - w / 2 + 14, cy + 8, level.subtitle, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#7a7a80',
      }).setOrigin(0, 0.5);
    }

    const zone = this.add.zone(cx, cy, w, h).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this.launchLevel(level));
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a2a30, 0.95);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
      bg.lineStyle(1, 0x8a5a38, 1);
      bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1a1a1f, 0.9);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
      bg.lineStyle(1, 0x3a3a40, 0.9);
      bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 6);
    });
  }

  private launchLevel(level: Level): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Mirror BootScene's normal launch sequence: start the level
      // scene and the shared UIScene in parallel.
      this.scene.start(level.sceneKey);
      this.scene.launch('UIScene');
      this.scene.stop();
    });
  }
}
