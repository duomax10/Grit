import Phaser from 'phaser';

export type InteractionType = 'inspect' | 'dialog' | 'enter';

export interface InteractiveConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  texture: string;
  interactionType: InteractionType;
  interactionRadius?: number;
  label?: string;
  inspectData?: Record<string, unknown>;
  onInteract?: () => void;
}

export class InteractiveObject extends Phaser.GameObjects.Sprite {
  public interactionType: InteractionType;
  public interactionRadius: number;
  public label: string;
  public inspectData: Record<string, unknown>;
  public onInteract?: () => void;

  constructor(config: InteractiveConfig) {
    super(config.scene, config.x, config.y, config.texture);

    this.interactionType = config.interactionType;
    this.interactionRadius = config.interactionRadius ?? 40;
    this.label = config.label ?? '';
    this.inspectData = config.inspectData ?? {};
    this.onInteract = config.onInteract;

    config.scene.add.existing(this as Phaser.GameObjects.GameObject);
    config.scene.physics.add.existing(this as Phaser.GameObjects.GameObject, true);

    this.setDepth(5);
  }

  isPlayerInRange(playerX: number, playerY: number): boolean {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    return Math.sqrt(dx * dx + dy * dy) <= this.interactionRadius;
  }
}
