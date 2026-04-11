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
   * Play the crouch-down animation, hold at the bottom of the pose
   * for `holdMs`, then play the crouch-up animation. Calls
   * `onComplete` when the sprite is back to standing.
   *
   * Uses dedicated crouch frames (5 per direction) created in
   * BootScene. While crouching, update() leaves the sprite alone so
   * the anim isn't overridden by idle/walk.
   *
   * Timing is driven by scene.time.delayedCall rather than the
   * ANIMATION_COMPLETE_KEY event — the event-based approach was
   * silently failing in some Phaser builds, so the deterministic
   * timer keeps the sequence visible.
   *
   * Falls back to a simple delay if the crouch frames didn't load.
   */
  playCrouch(holdMs = 1500, onComplete?: () => void): void {
    if (this.isCrouching) return;
    this.isCrouching = true;
    this.stopMovement();

    const dir = this.facing;
    const downKey = `gabe-crouch-down-${dir}`;
    const holdKey = `gabe-crouch-hold-${dir}`;
    const upKey = `gabe-crouch-up-${dir}`;

    // Fallback if crouch frames are missing — just wait it out.
    // NOTE: check scene-level anim manager, NOT `this.anims.exists`.
    // The sprite-local AnimationState.exists only returns true for
    // animations that have already been played on this sprite; for
    // globally-registered animations we have to ask the manager.
    if (!this.scene.anims.exists(downKey)) {
      this.scene.time.delayedCall(holdMs, () => {
        this.isCrouching = false;
        onComplete?.();
      });
      return;
    }

    // 5 frames @ 12 fps = ~417ms per transition. Add a small buffer
    // so the last frame is actually rendered before we switch anims.
    const transitionMs = 460;

    this.play(downKey, true);

    this.scene.time.delayedCall(transitionMs, () => {
      if (!this.isCrouching) return;
      this.play(holdKey, true);
      this.scene.time.delayedCall(holdMs, () => {
        if (!this.isCrouching) return;
        this.play(upKey, true);
        this.scene.time.delayedCall(transitionMs, () => {
          this.isCrouching = false;
          this.play(`gabe-idle-${this.facing}`, true);
          onComplete?.();
        });
      });
    });
  }
}
