import Phaser from 'phaser';
import { generateAllAssets } from '../assets/AssetGenerator';

export class BootScene extends Phaser.Scene {
  private progressText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Dark background
    this.cameras.main.setBackgroundColor('#0a0a0a');

    // Title
    this.add.text(cx, cy - 60, 'GRIT', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#6b4226',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy - 30, 'A Gritty Adventure', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#5a5a60',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Progress bar background
    this.progressBar = this.add.graphics();
    this.progressBar.fillStyle(0x1a1a1a, 1);
    this.progressBar.fillRect(cx - 80, cy + 10, 160, 12);
    this.progressBar.lineStyle(1, 0x3a3a3e, 1);
    this.progressBar.strokeRect(cx - 80, cy + 10, 160, 12);

    // Progress text
    this.progressText = this.add.text(cx, cy + 40, 'Generating assets...', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#5a5a60',
    }).setOrigin(0.5);

    // Generate all assets
    this.generateAssets(cx, cy);
  }

  private async generateAssets(cx: number, cy: number): Promise<void> {
    try {
      this.updateProgress(cx, cy, 0.1, 'Conjuring sprites...');
      await this.delay(100);

      await generateAllAssets(this);

      this.updateProgress(cx, cy, 0.8, 'Summoning the darkness...');
      await this.delay(300);

      this.updateProgress(cx, cy, 1.0, 'Enter the graveyard...');
      await this.delay(500);

      // Fade out and start game
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GraveyardScene');
        this.scene.start('UIScene');
      });
    } catch (error) {
      console.error('Asset generation failed:', error);
      this.progressText.setText('Error loading assets. Refresh to retry.');
      this.progressText.setColor('#aa3333');
    }
  }

  private updateProgress(cx: number, cy: number, progress: number, text: string): void {
    this.progressBar.clear();
    this.progressBar.fillStyle(0x1a1a1a, 1);
    this.progressBar.fillRect(cx - 80, cy + 10, 160, 12);
    this.progressBar.fillStyle(0x6b4226, 1);
    this.progressBar.fillRect(cx - 80, cy + 10, 160 * progress, 12);
    this.progressBar.lineStyle(1, 0x3a3a3e, 1);
    this.progressBar.strokeRect(cx - 80, cy + 10, 160, 12);
    this.progressText.setText(text);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
