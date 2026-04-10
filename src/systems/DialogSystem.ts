/**
 * Queue-based dialog system.
 * Supports internal thoughts and character speech.
 * Typewriter effect with tap-to-advance.
 */

import Phaser from 'phaser';
import { DialogSequence, DialogLine } from '../data/dialogs';

export class DialogSystem {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private advanceIndicator!: Phaser.GameObjects.Text;

  private queue: DialogLine[] = [];
  private currentLine: DialogLine | null = null;
  private displayedChars = 0;
  private fullText = '';
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  private isActive = false;
  private onComplete?: () => void;

  private readonly CHARS_PER_SECOND = 30;
  private readonly BOX_PADDING = 12;
  private readonly BOX_HEIGHT = 90;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI(): void {
    const { width, height } = this.scene.scale;

    this.container = this.scene.add.container(0, 0);
    // Very high depth so it renders above all world objects, twilight, fog
    this.container.setDepth(10000);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);

    // Background
    this.bgGraphics = this.scene.add.graphics();
    this.container.add(this.bgGraphics);

    // Speaker name
    this.speakerText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#c0a880',
      fontStyle: 'bold',
    });
    this.container.add(this.speakerText);

    // Dialog body
    this.bodyText = this.scene.add.text(0, 0, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#e8e8e8',
      wordWrap: { width: 280 },
      lineSpacing: 4,
    });
    this.container.add(this.bodyText);

    // Advance indicator
    this.advanceIndicator = this.scene.add.text(0, 0, '\u25BC', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#c0a880',
    });
    this.advanceIndicator.setVisible(false);
    this.container.add(this.advanceIndicator);

    // Tap to advance
    this.scene.input.on('pointerdown', () => this.advance());

    // Reposition on resize
    this.scene.scale.on('resize', () => this.repositionUI());
  }

  private repositionUI(): void {
    if (!this.isActive) return;
    this.drawBackground();
    this.positionText();
  }

  private drawBackground(): void {
    const { width } = this.scene.scale;
    const boxY = 48; // offset for mobile status bars/notches

    this.bgGraphics.clear();

    // More opaque background — 0.92/0.95 vs old 0.75/0.85
    this.bgGraphics.fillStyle(
      this.currentLine?.type === 'thought' ? 0x0a0a1a : 0x0a0a0a,
      this.currentLine?.type === 'thought' ? 0.92 : 0.95,
    );
    this.bgGraphics.fillRoundedRect(8, boxY, width - 16, this.BOX_HEIGHT, 6);

    // Thicker, more visible border
    this.bgGraphics.lineStyle(2, this.currentLine?.type === 'thought' ? 0x6060a0 : 0x8a6a40, 1);
    this.bgGraphics.strokeRoundedRect(8, boxY, width - 16, this.BOX_HEIGHT, 6);
  }

  private positionText(): void {
    const { width } = this.scene.scale;
    const boxY = 48;
    const p = this.BOX_PADDING;

    if (this.currentLine?.type === 'speech' && this.currentLine.speaker) {
      this.speakerText.setPosition(8 + p, boxY + p);
      this.speakerText.setVisible(true);
      this.bodyText.setPosition(8 + p, boxY + p + 22);
    } else if (this.currentLine?.type === 'thought') {
      this.speakerText.setText(this.currentLine.speaker || 'Gabe');
      this.speakerText.setPosition(8 + p, boxY + p);
      this.speakerText.setVisible(true);
      this.bodyText.setPosition(8 + p, boxY + p + 22);
    } else {
      this.speakerText.setVisible(false);
      this.bodyText.setPosition(8 + p, boxY + p + 4);
    }

    this.bodyText.setWordWrapWidth(width - 16 - p * 2);
    this.advanceIndicator.setPosition(width - 28, boxY + this.BOX_HEIGHT - 20);
  }

  showDialog(sequence: DialogSequence, onComplete?: () => void): void {
    this.queue = [...sequence];
    this.onComplete = onComplete;
    this.isActive = true;
    this.container.setVisible(true);
    this.showNextLine();
  }

  private showNextLine(): void {
    if (this.queue.length === 0) {
      this.close();
      return;
    }

    this.currentLine = this.queue.shift()!;
    this.fullText = this.currentLine.text;
    this.displayedChars = 0;
    this.advanceIndicator.setVisible(false);

    // Set speaker name and style
    if (this.currentLine.type === 'thought') {
      this.speakerText.setText(this.currentLine.speaker || 'Gabe');
      this.speakerText.setColor('#8080a0'); // muted blue-gray for thoughts
      this.bodyText.setFontStyle('italic');
      this.bodyText.setColor('#a0a0c0');
    } else if (this.currentLine.type === 'speech' && this.currentLine.speaker) {
      this.speakerText.setText(this.currentLine.speaker);
      this.speakerText.setColor('#c0a880'); // warm gold for speech
      this.bodyText.setFontStyle('normal');
      this.bodyText.setColor('#d0d0d0');
    } else {
      this.bodyText.setFontStyle('normal');
      this.bodyText.setColor('#d0d0d0');
    }

    this.bodyText.setText('');
    this.drawBackground();
    this.positionText();

    // Start typewriter
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
    }
    this.typewriterTimer = this.scene.time.addEvent({
      delay: 1000 / this.CHARS_PER_SECOND,
      callback: this.typewriterTick,
      callbackScope: this,
      repeat: this.fullText.length - 1,
    });
  }

  private typewriterTick(): void {
    this.displayedChars++;
    this.bodyText.setText(this.fullText.substring(0, this.displayedChars));

    if (this.displayedChars >= this.fullText.length) {
      this.advanceIndicator.setVisible(true);
    }
  }

  advance(): void {
    if (!this.isActive) return;

    if (this.displayedChars < this.fullText.length) {
      // Skip to end of current line
      if (this.typewriterTimer) {
        this.typewriterTimer.remove();
        this.typewriterTimer = null;
      }
      this.displayedChars = this.fullText.length;
      this.bodyText.setText(this.fullText);
      this.advanceIndicator.setVisible(true);
    } else {
      // Next line
      this.showNextLine();
    }
  }

  private close(): void {
    this.isActive = false;
    this.container.setVisible(false);
    this.currentLine = null;
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
      this.typewriterTimer = null;
    }
    this.onComplete?.();
  }

  get active(): boolean {
    return this.isActive;
  }
}
