import Phaser from 'phaser';

export type Direction = 'down' | 'up' | 'left' | 'right';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed = 110;
  private facing: Direction = 'down';
  private isMoving = false;

  // When true, update() skips input-driven movement/animations.
  // Used during scripted sequences (crouch, dialogs, etc).
  private inputLocked = false;

  // When crouching, update() leaves the sprite alone so the tween
  // isn't stomped by the idle pose each frame.
  private isCrouching = false;

  // Input from virtual joystick or keyboard
  public inputX = 0;
  public inputY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'gabe-south');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    // 92x92 sprite — collision box at feet area
    this.setSize(20, 14);
    this.setOffset(36, 72);

    // Night tint — darken Gabe to match the twilight atmosphere
    this.setTint(0x7a8090);
  }

  get direction(): Direction {
    return this.facing;
  }

  get locked(): boolean {
    return this.inputLocked;
  }

  setInputLocked(locked: boolean): void {
    this.inputLocked = locked;
    if (locked) {
      this.inputX = 0;
      this.inputY = 0;
      this.setVelocity(0, 0);
    }
  }

  update(): void {
    if (this.inputLocked || this.isCrouching) {
      this.setVelocity(0, 0);
      this.setDepth(1000 + this.y + 30);
      return;
    }

    const vx = this.inputX * this.speed;
    const vy = this.inputY * this.speed;

    this.setVelocity(vx, vy);

    // Y-sorted depth so player goes behind tall objects higher on screen
    this.setDepth(1000 + this.y + 30);

    const moving = Math.abs(this.inputX) > 0.1 || Math.abs(this.inputY) > 0.1;

    if (moving) {
      // Determine facing direction — require a clear dominant axis
      // to prevent flickering on diagonals. Only switch when the
      // new axis is at least 30% stronger than the other.
      const ax = Math.abs(this.inputX);
      const ay = Math.abs(this.inputY);
      const threshold = 0.3;

      if (ax > ay * (1 + threshold)) {
        this.facing = this.inputX > 0 ? 'right' : 'left';
      } else if (ay > ax * (1 + threshold)) {
        this.facing = this.inputY > 0 ? 'down' : 'up';
      }
      // else: keep current facing direction (prevents flicker on diagonals)

      if (!this.isMoving || this.anims.currentAnim?.key !== `gabe-walk-${this.facing}`) {
        this.play(`gabe-walk-${this.facing}`, true);
      }
      this.isMoving = true;
    } else {
      if (this.isMoving) {
        this.play(`gabe-idle-${this.facing}`, true);
        this.isMoving = false;
      }
      this.setVelocity(0, 0);
    }
  }

  stopMovement(): void {
    this.inputX = 0;
    this.inputY = 0;
    this.setVelocity(0, 0);
    this.play(`gabe-idle-${this.facing}`, true);
    this.isMoving = false;
  }

  /**
   * Play a crouch-down animation by squashing the sprite's Y scale
   * (there are no dedicated crouch frames). Holds the squash for
   * `holdMs` before popping back up. Calls `onComplete` when the
   * sprite is back to full height.
   *
   * While crouching, update() leaves the sprite alone so the tween
   * isn't overridden each frame.
   */
  playCrouch(holdMs = 1500, onComplete?: () => void): void {
    if (this.isCrouching) return;
    this.isCrouching = true;
    this.stopMovement();
    // Stop the anim so it doesn't fight the scale tween
    this.anims.stop();
    this.setTexture(`gabe-${this.dirKey()}`);

    const downMs = 180;
    const upMs = 220;
    const squashY = 0.72;
    const squashX = 1.08;

    // Use scene tweens so Phaser ticks us even when isCrouching skips
    // update() changes.
    this.scene.tweens.add({
      targets: this,
      scaleY: squashY,
      scaleX: squashX,
      duration: downMs,
      ease: 'Sine.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(holdMs, () => {
          this.scene.tweens.add({
            targets: this,
            scaleY: 1,
            scaleX: 1,
            duration: upMs,
            ease: 'Sine.easeIn',
            onComplete: () => {
              this.isCrouching = false;
              this.play(`gabe-idle-${this.facing}`, true);
              onComplete?.();
            },
          });
        });
      },
    });
  }

  /** Map internal 'down/up/left/right' to sprite direction suffix. */
  private dirKey(): string {
    switch (this.facing) {
      case 'down': return 'south';
      case 'up': return 'north';
      case 'right': return 'east';
      case 'left': return 'west';
    }
  }
}
