/**
 * Touch-based virtual joystick for mobile controls.
 * Appears where the user touches in the left half of the screen.
 * Also supports keyboard WASD/arrows for desktop testing.
 */

import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  private baseGraphics: Phaser.GameObjects.Graphics;
  private thumbGraphics: Phaser.GameObjects.Graphics;

  private isDown = false;
  private baseX = 0;
  private baseY = 0;
  private thumbX = 0;
  private thumbY = 0;
  private pointerId = -1;

  private readonly BASE_RADIUS = 36;
  private readonly THUMB_RADIUS = 14;
  private readonly MAX_DISTANCE = 32;

  // Output: normalized direction
  public x = 0;
  public y = 0;

  // Keyboard support
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd?: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.baseGraphics = scene.add.graphics();
    this.baseGraphics.setDepth(200);
    this.baseGraphics.setScrollFactor(0);
    this.baseGraphics.setVisible(false);

    this.thumbGraphics = scene.add.graphics();
    this.thumbGraphics.setDepth(201);
    this.thumbGraphics.setScrollFactor(0);
    this.thumbGraphics.setVisible(false);

    // Touch input
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Only activate in left half of screen
      if (pointer.x < scene.scale.width * 0.5 && !this.isDown) {
        this.onDown(pointer);
      }
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDown && pointer.id === this.pointerId) {
        this.onMove(pointer);
      }
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isDown && pointer.id === this.pointerId) {
        this.onUp();
      }
    });

    // Keyboard support
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    this.isDown = true;
    this.pointerId = pointer.id;
    this.baseX = pointer.x;
    this.baseY = pointer.y;
    this.thumbX = pointer.x;
    this.thumbY = pointer.y;
    this.drawBase();
    this.drawThumb();
    this.baseGraphics.setVisible(true);
    this.thumbGraphics.setVisible(true);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.MAX_DISTANCE) {
      this.thumbX = this.baseX + (dx / dist) * this.MAX_DISTANCE;
      this.thumbY = this.baseY + (dy / dist) * this.MAX_DISTANCE;
    } else {
      this.thumbX = pointer.x;
      this.thumbY = pointer.y;
    }

    // Normalize output
    const clampedDist = Math.min(dist, this.MAX_DISTANCE);
    if (clampedDist > 4) { // deadzone
      this.x = (dx / dist) * (clampedDist / this.MAX_DISTANCE);
      this.y = (dy / dist) * (clampedDist / this.MAX_DISTANCE);
    } else {
      this.x = 0;
      this.y = 0;
    }

    this.drawThumb();
  }

  private onUp(): void {
    this.isDown = false;
    this.pointerId = -1;
    this.x = 0;
    this.y = 0;
    this.baseGraphics.setVisible(false);
    this.thumbGraphics.setVisible(false);
  }

  private drawBase(): void {
    this.baseGraphics.clear();
    this.baseGraphics.fillStyle(0x222222, 0.3);
    this.baseGraphics.fillCircle(this.baseX, this.baseY, this.BASE_RADIUS);
    this.baseGraphics.lineStyle(1, 0x444444, 0.4);
    this.baseGraphics.strokeCircle(this.baseX, this.baseY, this.BASE_RADIUS);
  }

  private drawThumb(): void {
    this.thumbGraphics.clear();
    this.thumbGraphics.fillStyle(0x555555, 0.5);
    this.thumbGraphics.fillCircle(this.thumbX, this.thumbY, this.THUMB_RADIUS);
    this.thumbGraphics.lineStyle(1, 0x777777, 0.6);
    this.thumbGraphics.strokeCircle(this.thumbX, this.thumbY, this.THUMB_RADIUS);
  }

  /**
   * Force-release the joystick (used when input is locked by a
   * scripted sequence so the thumb stick snaps back).
   */
  reset(): void {
    if (this.isDown) {
      this.onUp();
    }
    this.x = 0;
    this.y = 0;
  }

  update(): void {
    // Keyboard override when no touch
    if (!this.isDown && this.cursors) {
      let kx = 0;
      let ky = 0;

      if (this.cursors.left.isDown || this.wasd?.A.isDown) kx -= 1;
      if (this.cursors.right.isDown || this.wasd?.D.isDown) kx += 1;
      if (this.cursors.up.isDown || this.wasd?.W.isDown) ky -= 1;
      if (this.cursors.down.isDown || this.wasd?.S.isDown) ky += 1;

      // Normalize diagonal movement
      if (kx !== 0 && ky !== 0) {
        const len = Math.sqrt(kx * kx + ky * ky);
        kx /= len;
        ky /= len;
      }

      this.x = kx;
      this.y = ky;
    }
  }
}
