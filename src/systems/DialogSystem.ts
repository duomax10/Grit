/**
 * Queue-based dialog system.
 * Supports internal thoughts, character speech, and branching choices.
 * Typewriter effect with tap-to-advance.
 *
 * Choice lines render buttons instead of a typewriter. When the
 * player picks one, the choice id is stored and handed to the
 * onComplete callback when the sequence finishes.
 */

import Phaser from 'phaser';
import { DialogSequence, DialogLine, DialogChoice } from '../data/dialogs';

export class DialogSystem {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private speakerText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private advanceIndicator!: Phaser.GameObjects.Text;

  // Choice-mode objects created on demand and cleaned up after pick
  private choiceObjects: Phaser.GameObjects.GameObject[] = [];
  private inChoiceMode = false;

  private queue: DialogLine[] = [];
  private currentLine: DialogLine | null = null;
  private displayedChars = 0;
  private fullText = '';
  private typewriterTimer: Phaser.Time.TimerEvent | null = null;
  private isActive = false;
  private onComplete?: (chosenId?: string) => void;
  private lastChoiceId: string | undefined;

  private readonly CHARS_PER_SECOND = 30;
  private readonly BOX_PADDING = 12;
  private readonly BOX_HEIGHT = 90;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI(): void {
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

    // Tap to advance (suppressed during choice mode)
    this.scene.input.on('pointerdown', () => {
      if (this.inChoiceMode) return;
      this.advance();
    });

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

    // More opaque background
    const isThought =
      this.currentLine?.type === 'thought' ||
      (this.currentLine?.type === 'choice');
    this.bgGraphics.fillStyle(
      isThought ? 0x0a0a1a : 0x0a0a0a,
      isThought ? 0.92 : 0.95,
    );
    this.bgGraphics.fillRoundedRect(8, boxY, width - 16, this.BOX_HEIGHT, 6);

    // Thicker, more visible border
    this.bgGraphics.lineStyle(2, isThought ? 0x6060a0 : 0x8a6a40, 1);
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

  showDialog(sequence: DialogSequence, onComplete?: (chosenId?: string) => void): void {
    this.queue = [...sequence];
    this.onComplete = onComplete;
    this.isActive = true;
    this.lastChoiceId = undefined;
    this.container.setVisible(true);
    this.showNextLine();
  }

  private showNextLine(): void {
    this.clearChoiceButtons();
    if (this.queue.length === 0) {
      this.close();
      return;
    }

    this.currentLine = this.queue.shift()!;

    if (this.currentLine.type === 'choice') {
      this.enterChoiceMode(this.currentLine.choices, this.currentLine.text);
      return;
    }

    this.fullText = this.currentLine.text;
    this.displayedChars = 0;
    this.advanceIndicator.setVisible(false);

    // Set speaker name and style
    if (this.currentLine.type === 'thought') {
      this.speakerText.setText(this.currentLine.speaker || 'Gabe');
      this.speakerText.setColor('#8080a0'); // muted blue-gray for thoughts
      this.bodyText.setFontStyle('italic');
      this.bodyText.setColor('#a0a0c0');
      this.bodyText.setVisible(true);
    } else if (this.currentLine.type === 'speech' && this.currentLine.speaker) {
      this.speakerText.setText(this.currentLine.speaker);
      this.speakerText.setColor('#c0a880'); // warm gold for speech
      this.bodyText.setFontStyle('normal');
      this.bodyText.setColor('#d0d0d0');
      this.bodyText.setVisible(true);
    } else {
      this.bodyText.setFontStyle('normal');
      this.bodyText.setColor('#d0d0d0');
      this.bodyText.setVisible(true);
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
    if (this.inChoiceMode) return;

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

  /**
   * Render a choice prompt with one button per option. Tap-to-advance
   * is suppressed while buttons are shown so clicking outside doesn't
   * accidentally dismiss.
   */
  private enterChoiceMode(choices: DialogChoice[], prompt?: string): void {
    this.inChoiceMode = true;
    this.advanceIndicator.setVisible(false);
    this.speakerText.setVisible(false);
    this.drawBackground();

    const { width } = this.scene.scale;
    const boxY = 48;
    const p = this.BOX_PADDING;

    if (prompt) {
      this.bodyText.setVisible(true);
      this.bodyText.setFontStyle('italic');
      this.bodyText.setColor('#a0a0c0');
      this.bodyText.setText(prompt);
      this.bodyText.setPosition(8 + p, boxY + p);
      this.bodyText.setWordWrapWidth(width - 16 - p * 2);
    } else {
      this.bodyText.setVisible(false);
    }

    // Lay out buttons horizontally inside the dialog box
    const btnH = 32;
    const btnGap = 10;
    const btnsAreaW = width - 16 - p * 2;
    const btnW = Math.floor((btnsAreaW - btnGap * (choices.length - 1)) / choices.length);
    const btnY = boxY + this.BOX_HEIGHT - btnH - p;

    choices.forEach((ch, i) => {
      const bx = 8 + p + i * (btnW + btnGap);

      const bg = this.scene.add.graphics();
      bg.fillStyle(0x1a1828, 0.95);
      bg.fillRoundedRect(bx, btnY, btnW, btnH, 5);
      bg.lineStyle(1, 0x8080a0, 0.9);
      bg.strokeRoundedRect(bx, btnY, btnW, btnH, 5);
      this.container.add(bg);
      this.choiceObjects.push(bg);

      const txt = this.scene.add.text(bx + btnW / 2, btnY + btnH / 2, ch.text, {
        fontFamily: 'Georgia, serif',
        fontSize: '13px',
        color: '#c0a8c0',
        fontStyle: 'italic',
      }).setOrigin(0.5);
      this.container.add(txt);
      this.choiceObjects.push(txt);

      const zone = this.scene.add.zone(bx + btnW / 2, btnY + btnH / 2, btnW + 6, btnH + 6)
        .setInteractive()
        .setOrigin(0.5);
      this.container.add(zone);
      this.choiceObjects.push(zone);

      zone.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x2a2838, 0.98);
        bg.fillRoundedRect(bx, btnY, btnW, btnH, 5);
        bg.lineStyle(1, 0xa0a0c0, 1);
        bg.strokeRoundedRect(bx, btnY, btnW, btnH, 5);
      });
      zone.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x1a1828, 0.95);
        bg.fillRoundedRect(bx, btnY, btnW, btnH, 5);
        bg.lineStyle(1, 0x8080a0, 0.9);
        bg.strokeRoundedRect(bx, btnY, btnW, btnH, 5);
      });
      // Fires on pointerup so the same tap doesn't also trigger
      // scene-level pointerdown handlers.
      zone.on('pointerup', () => {
        this.lastChoiceId = ch.id;
        this.inChoiceMode = false;
        this.clearChoiceButtons();
        this.showNextLine();
      });
    });
  }

  private clearChoiceButtons(): void {
    for (const o of this.choiceObjects) o.destroy();
    this.choiceObjects = [];
    this.inChoiceMode = false;
  }

  private close(): void {
    this.isActive = false;
    this.container.setVisible(false);
    this.currentLine = null;
    if (this.typewriterTimer) {
      this.typewriterTimer.remove();
      this.typewriterTimer = null;
    }
    this.clearChoiceButtons();
    const chosen = this.lastChoiceId;
    this.lastChoiceId = undefined;
    this.onComplete?.(chosen);
  }

  get active(): boolean {
    return this.isActive;
  }
}
