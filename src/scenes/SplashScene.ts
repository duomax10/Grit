/**
 * Simple splash screen shown when Gabe walks out of the graveyard
 * after completing the soil-sample mission. Placeholder for now —
 * just a "GRIT" title on a dark background with a tagline.
 */

import Phaser from 'phaser';

export class SplashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SplashScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.setBackgroundColor('#0a0a0a');

    // Subtle vignette so the title doesn't sit on pure black
    const vignette = this.add.graphics();
    vignette.fillStyle(0x1a0f08, 0.6);
    vignette.fillRect(0, 0, width, height);

    const title = this.add.text(cx, cy - 20, 'GRIT', {
      fontFamily: 'Georgia, serif',
      fontSize: '64px',
      color: '#8a5a38',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    title.setShadow(0, 2, '#000000', 6, true, true);

    this.add.text(cx, cy + 40, 'End of day one.', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#6b5a4c',
    }).setOrigin(0.5);

    // Fade in from black
    this.cameras.main.fadeIn(700, 0, 0, 0);
  }
}
