import Phaser from 'phaser';

export type Direction = 'down' | 'up' | 'left' | 'right';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private speed = 80;
  private facing: Direction = 'down';
  private isMoving = false;

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
    this.setDepth(10);

    // Night tint — darken Gabe to match the twilight atmosphere
    this.setTint(0x7a8090);
  }

  get direction(): Direction {
    return this.facing;
  }

  update(): void {
    const vx = this.inputX * this.speed;
    const vy = this.inputY * this.speed;

    this.setVelocity(vx, vy);

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
}
