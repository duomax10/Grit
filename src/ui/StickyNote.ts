/**
 * Sticky note UI — shows the current mission objectives.
 * Rendered to an offscreen canvas with anti-aliasing enabled so
 * it stays smooth when rotated (the game uses pixelArt mode which
 * would otherwise make rotated Graphics look jaggy).
 *
 * Tap to dismiss. Strike-through shown on completed objectives.
 */

import Phaser from 'phaser';
import { MissionSystem } from '../systems/MissionSystem';

export class StickyNote {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private noteImage!: Phaser.GameObjects.Image;
  private visible = false;
  private onDismiss?: () => void;
  private textureKey = 'sticky-note-dyn';
  private regenCount = 0;

  // Render the sticky note at 2x native size for crisper anti-aliasing,
  // then display at half scale.
  private readonly NOTE_WIDTH = 220;
  private readonly NOTE_HEIGHT = 140;
  private readonly SCALE_FACTOR = 2;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(10001);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);

    // Generate initial texture
    const texKey = this.regenerateTexture();

    this.noteImage = this.scene.add.image(0, 0, texKey);
    this.noteImage.setOrigin(0.5, 0.5);
    this.noteImage.setScale(1 / this.SCALE_FACTOR);
    this.noteImage.setAngle(-3); // slight tilt
    this.container.add(this.noteImage);

    // Dismiss on ANY tap on the screen (not just the note)
    this.scene.input.on('pointerdown', this.handleTap, this);

    this.scene.scale.on('resize', () => this.reposition());
  }

  private handleTap = (_p: Phaser.Input.Pointer, _x: number, _y: number, event?: Phaser.Types.Input.EventData): void => {
    if (this.visible) {
      if (event) event.stopPropagation();
      this.dismiss();
    }
  };

  /**
   * Draw the sticky note to an offscreen canvas with anti-aliasing,
   * then add/replace it in Phaser's texture cache with LINEAR filter.
   * Returns the texture key.
   */
  private regenerateTexture(): string {
    const key = `${this.textureKey}-${this.regenCount++}`;
    const w = this.NOTE_WIDTH * this.SCALE_FACTOR;
    const h = this.NOTE_HEIGHT * this.SCALE_FACTOR;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    // Scale so drawing happens at 2x resolution
    ctx.scale(this.SCALE_FACTOR, this.SCALE_FACTOR);

    this.drawNote(ctx);

    // Register with Phaser's texture manager
    if (this.scene.textures.exists(key)) {
      this.scene.textures.remove(key);
    }
    this.scene.textures.addCanvas(key, canvas);
    // Enable linear filtering for smooth rotation
    this.scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
    return key;
  }

  private drawNote(ctx: CanvasRenderingContext2D): void {
    const w = this.NOTE_WIDTH;
    const h = this.NOTE_HEIGHT;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.roundedRect(ctx, 4, 4, w, h, 3);
    ctx.fill();

    // Main yellow note
    ctx.fillStyle = '#f4e48a';
    this.roundedRect(ctx, 0, 0, w, h, 3);
    ctx.fill();

    // Darker bottom/right edge
    ctx.fillStyle = '#d4c06a';
    ctx.fillRect(0, h - 2, w, 2);
    ctx.fillRect(w - 2, 0, 2, h);

    // Top-right curled corner
    ctx.fillStyle = '#e8d870';
    ctx.beginPath();
    ctx.moveTo(w - 14, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, 14);
    ctx.closePath();
    ctx.fill();

    // Tape at top
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(w / 2 - 20, -6, 40, 10);

    // Title
    const mission = MissionSystem.getInstance().getCurrentMission();
    const title = mission?.title ?? 'Mission';
    ctx.fillStyle = '#3a3020';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.textBaseline = 'top';
    ctx.fillText(title, 16, 14);

    // Objectives
    if (mission) {
      const leftX = 16;
      const lineHeight = 16;
      const objGap = 4;
      const maxTextWidth = w - leftX * 2;
      let y = 40;

      for (let i = 0; i < mission.objectives.length; i++) {
        const obj = mission.objectives[i];
        const completed = MissionSystem.getInstance().isCompleted(obj.id);

        // Always a small en dash; completed lines get struck through.
        const bullet = '\u2013 ';

        ctx.fillStyle = completed ? '#7a6848' : '#2a2010';
        ctx.font = `${completed ? 'italic ' : ''}13px Georgia, serif`;

        const bulletWidth = ctx.measureText(bullet).width;
        const lines = this.wrapText(ctx, obj.text, maxTextWidth - bulletWidth);

        for (let j = 0; j < lines.length; j++) {
          const isFirst = j === 0;
          const prefix = isFirst ? bullet : '';
          const xLine = isFirst ? leftX : leftX + bulletWidth;
          const drawn = prefix + lines[j];
          ctx.fillText(drawn, xLine, y);

          if (completed) {
            const metrics = ctx.measureText(drawn);
            ctx.strokeStyle = '#3a2818';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(xLine, y + 7);
            ctx.lineTo(xLine + metrics.width, y + 7);
            ctx.stroke();
          }

          y += lineHeight;
        }
        y += objGap;
      }
    }

  }

  /**
   * Word-wrap `text` so each returned line fits within `maxWidth`
   * given the current ctx font. Long single words will still overflow.
   */
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private reposition(): void {
    if (!this.visible) return;
    const { width } = this.scene.scale;
    this.container.setPosition(width / 2, 70 + this.NOTE_HEIGHT / 2);
  }

  show(onDismiss?: () => void): void {
    this.onDismiss = onDismiss;
    this.refresh(); // re-render with latest mission state
    this.visible = true;
    this.reposition();
    this.container.setVisible(true);

    // Pop-in animation
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

  dismiss(): void {
    if (!this.visible) return;
    this.visible = false;
    const cb = this.onDismiss;
    this.onDismiss = undefined;
    this.scene.tweens.add({
      targets: this.container,
      scale: 0.9,
      alpha: 0,
      duration: 180,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
        cb?.();
      },
    });
  }

  /** Re-render (e.g., after an objective completes) */
  refresh(): void {
    const newKey = this.regenerateTexture();
    this.noteImage.setTexture(newKey);
  }

  get isVisible(): boolean {
    return this.visible;
  }
}
