/**
 * Sticky note UI — shows the current mission objectives.
 * Drawn procedurally with Phaser graphics (no asset needed).
 * Yellow note with slight rotation, dark handwritten-style text.
 * Tap anywhere on it to dismiss.
 */

import Phaser from 'phaser';
import { MissionSystem } from '../systems/MissionSystem';

export class StickyNote {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private objectiveTexts: Phaser.GameObjects.Text[] = [];
  private strikes: Phaser.GameObjects.Graphics[] = [];
  private visible = false;
  private onDismiss?: () => void;

  private readonly NOTE_WIDTH = 220;
  private readonly NOTE_HEIGHT = 140;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(10001); // above dialog
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setAngle(-3); // slight tilt for sticky feel

    this.bg = this.scene.add.graphics();
    this.container.add(this.bg);

    // Title
    this.titleText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#3a3020',
      fontStyle: 'bold',
    });
    this.container.add(this.titleText);

    // Dismiss hint
    const hint = this.scene.add.text(
      this.NOTE_WIDTH / 2,
      this.NOTE_HEIGHT - 12,
      'tap to dismiss',
      {
        fontFamily: 'Georgia, serif',
        fontSize: '9px',
        color: '#7a6848',
        fontStyle: 'italic',
      },
    ).setOrigin(0.5);
    this.container.add(hint);

    // Interactive zone for dismiss
    const zone = this.scene.add.zone(
      this.NOTE_WIDTH / 2,
      this.NOTE_HEIGHT / 2,
      this.NOTE_WIDTH + 20,
      this.NOTE_HEIGHT + 20,
    ).setInteractive().setOrigin(0.5);
    this.container.add(zone);
    zone.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.dismiss();
    });

    this.scene.scale.on('resize', () => this.reposition());
  }

  private drawBackground(): void {
    this.bg.clear();
    // Shadow
    this.bg.fillStyle(0x000000, 0.3);
    this.bg.fillRoundedRect(4, 4, this.NOTE_WIDTH, this.NOTE_HEIGHT, 2);
    // Main yellow note
    this.bg.fillStyle(0xf4e48a, 1);
    this.bg.fillRoundedRect(0, 0, this.NOTE_WIDTH, this.NOTE_HEIGHT, 2);
    // Darker border shading on bottom/right
    this.bg.fillStyle(0xd4c06a, 1);
    this.bg.fillRect(0, this.NOTE_HEIGHT - 2, this.NOTE_WIDTH, 2);
    this.bg.fillRect(this.NOTE_WIDTH - 2, 0, 2, this.NOTE_HEIGHT);
    // Torn/curled corner hint (top-right small triangle)
    this.bg.fillStyle(0xe8d870, 1);
    this.bg.fillTriangle(
      this.NOTE_WIDTH - 14, 0,
      this.NOTE_WIDTH, 0,
      this.NOTE_WIDTH, 14,
    );
    // "Tape" at top
    this.bg.fillStyle(0xffffff, 0.5);
    this.bg.fillRect(this.NOTE_WIDTH / 2 - 20, -6, 40, 10);
  }

  private reposition(): void {
    if (!this.visible) return;
    const { width } = this.scene.scale;
    this.container.setPosition(
      (width - this.NOTE_WIDTH) / 2,
      70,
    );
  }

  show(onDismiss?: () => void): void {
    this.onDismiss = onDismiss;
    this.renderMission();
    this.visible = true;
    this.reposition();
    this.container.setVisible(true);

    // Small pop-in animation
    this.container.setScale(0.9);
    this.container.setAlpha(0);
    this.scene.tweens.add({
      targets: this.container,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });
  }

  private renderMission(): void {
    // Clear existing objective texts
    for (const t of this.objectiveTexts) t.destroy();
    for (const s of this.strikes) s.destroy();
    this.objectiveTexts = [];
    this.strikes = [];

    this.drawBackground();

    const mission = MissionSystem.getInstance().getCurrentMission();
    if (!mission) {
      this.titleText.setText('No mission');
      this.titleText.setPosition(16, 14);
      return;
    }

    this.titleText.setText(mission.title);
    this.titleText.setPosition(16, 14);

    // Render each objective with a bullet or strike-through
    const startY = 40;
    const lineHeight = 20;
    for (let i = 0; i < mission.objectives.length; i++) {
      const obj = mission.objectives[i];
      const completed = MissionSystem.getInstance().isCompleted(obj.id);
      const y = startY + i * lineHeight;

      const bullet = completed ? '\u2713 ' : '\u2022 ';
      const t = this.scene.add.text(16, y, bullet + obj.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: completed ? '#7a6848' : '#2a2010',
        fontStyle: completed ? 'italic' : 'normal',
        wordWrap: { width: this.NOTE_WIDTH - 32 },
      });
      this.container.add(t);
      this.objectiveTexts.push(t);

      if (completed) {
        // Draw strike-through line
        const strike = this.scene.add.graphics();
        strike.lineStyle(1.5, 0x3a2818, 0.8);
        const bounds = t.getBounds();
        const localY = y + t.height / 2;
        strike.lineBetween(16, localY, 16 + t.width, localY);
        this.container.add(strike);
        this.strikes.push(strike);
      }
    }
  }

  dismiss(): void {
    if (!this.visible) return;
    this.visible = false;
    this.scene.tweens.add({
      targets: this.container,
      scale: 0.9,
      alpha: 0,
      duration: 180,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
        this.onDismiss?.();
      },
    });
  }

  /** Re-render (e.g., after an objective completes) */
  refresh(): void {
    if (this.visible) this.renderMission();
  }

  get isVisible(): boolean {
    return this.visible;
  }
}
