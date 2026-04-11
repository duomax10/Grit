/**
 * HUD buttons: Interact and Inventory.
 * Mobile-friendly touch targets.
 */

import Phaser from 'phaser';

export class HUDButtons {
  private scene: Phaser.Scene;

  // Interact button
  private interactContainer!: Phaser.GameObjects.Container;
  private interactBg!: Phaser.GameObjects.Graphics;
  private interactText!: Phaser.GameObjects.Text;
  private interactVisible = false;

  // Inventory button
  private inventoryContainer!: Phaser.GameObjects.Container;
  private inventoryBg!: Phaser.GameObjects.Graphics;
  private inventoryText!: Phaser.GameObjects.Text;

  // Mission button
  private missionContainer!: Phaser.GameObjects.Container;
  private missionBg!: Phaser.GameObjects.Graphics;
  private missionText!: Phaser.GameObjects.Text;

  // Secondary "interact available" pip — lives up by the top-right
  // button cluster so the player notices an interactable even when
  // their thumb is parked over the main E button at bottom-right.
  private interactPip!: Phaser.GameObjects.Container;
  private interactPipTween?: Phaser.Tweens.Tween;

  // Callbacks
  public onInteract?: () => void;
  public onInventory?: () => void;
  public onMission?: () => void;

  private readonly BTN_SIZE = 48;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createInteractButton();
    this.createInventoryButton();
    this.createMissionButton();
    this.createInteractPip();
    this.repositionButtons();

    scene.scale.on('resize', () => this.repositionButtons());
  }

  private createInteractButton(): void {
    this.interactContainer = this.scene.add.container(0, 0);
    this.interactContainer.setDepth(200);
    this.interactContainer.setScrollFactor(0);
    this.interactContainer.setVisible(false);

    this.interactBg = this.scene.add.graphics();
    this.interactBg.fillStyle(0x3a5a3a, 0.8);
    this.interactBg.fillRoundedRect(-this.BTN_SIZE / 2, -this.BTN_SIZE / 2, this.BTN_SIZE, this.BTN_SIZE, 8);
    this.interactBg.lineStyle(2, 0x5a8a5a, 0.9);
    this.interactBg.strokeRoundedRect(-this.BTN_SIZE / 2, -this.BTN_SIZE / 2, this.BTN_SIZE, this.BTN_SIZE, 8);
    this.interactContainer.add(this.interactBg);

    this.interactText = this.scene.add.text(0, 0, 'E', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#d0e0c0',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.interactContainer.add(this.interactText);

    // Touch zone
    const zone = this.scene.add.zone(0, 0, this.BTN_SIZE + 20, this.BTN_SIZE + 20)
      .setInteractive()
      .setOrigin(0.5);
    this.interactContainer.add(zone);

    zone.on('pointerdown', () => {
      this.interactBg.clear();
      this.interactBg.fillStyle(0x5a8a5a, 0.9);
      this.interactBg.fillRoundedRect(-this.BTN_SIZE / 2, -this.BTN_SIZE / 2, this.BTN_SIZE, this.BTN_SIZE, 8);
      this.interactBg.lineStyle(2, 0x7aaa7a, 1);
      this.interactBg.strokeRoundedRect(-this.BTN_SIZE / 2, -this.BTN_SIZE / 2, this.BTN_SIZE, this.BTN_SIZE, 8);
      this.onInteract?.();
    });

    zone.on('pointerup', () => {
      this.drawInteractNormal();
    });
  }

  private drawInteractNormal(): void {
    this.interactBg.clear();
    this.interactBg.fillStyle(0x3a5a3a, 0.8);
    this.interactBg.fillRoundedRect(-this.BTN_SIZE / 2, -this.BTN_SIZE / 2, this.BTN_SIZE, this.BTN_SIZE, 8);
    this.interactBg.lineStyle(2, 0x5a8a5a, 0.9);
    this.interactBg.strokeRoundedRect(-this.BTN_SIZE / 2, -this.BTN_SIZE / 2, this.BTN_SIZE, this.BTN_SIZE, 8);
  }

  private createInventoryButton(): void {
    this.inventoryContainer = this.scene.add.container(0, 0);
    this.inventoryContainer.setDepth(200);
    this.inventoryContainer.setScrollFactor(0);

    this.inventoryBg = this.scene.add.graphics();
    this.inventoryBg.fillStyle(0x2a2a30, 0.7);
    this.inventoryBg.fillRoundedRect(-20, -20, 40, 40, 6);
    this.inventoryBg.lineStyle(1, 0x4a4a50, 0.8);
    this.inventoryBg.strokeRoundedRect(-20, -20, 40, 40, 6);
    this.inventoryContainer.add(this.inventoryBg);

    // Bag icon (simple pixel art style)
    this.inventoryText = this.scene.add.text(0, 0, '\u25A1', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#8a8a90',
    }).setOrigin(0.5);
    this.inventoryContainer.add(this.inventoryText);

    const zone = this.scene.add.zone(0, 0, 50, 50)
      .setInteractive()
      .setOrigin(0.5);
    this.inventoryContainer.add(zone);

    zone.on('pointerdown', () => {
      this.onInventory?.();
    });
  }

  private createMissionButton(): void {
    this.missionContainer = this.scene.add.container(0, 0);
    this.missionContainer.setDepth(200);
    this.missionContainer.setScrollFactor(0);

    // Match the inventory button styling exactly
    this.missionBg = this.scene.add.graphics();
    this.missionBg.fillStyle(0x2a2a30, 0.7);
    this.missionBg.fillRoundedRect(-20, -20, 40, 40, 6);
    this.missionBg.lineStyle(1, 0x4a4a50, 0.8);
    this.missionBg.strokeRoundedRect(-20, -20, 40, 40, 6);
    this.missionContainer.add(this.missionBg);

    // Exclamation mark icon
    this.missionText = this.scene.add.text(0, 0, '!', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#8a8a90',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.missionContainer.add(this.missionText);

    const zone = this.scene.add.zone(0, 0, 50, 50)
      .setInteractive()
      .setOrigin(0.5);
    this.missionContainer.add(zone);

    zone.on('pointerdown', () => {
      this.onMission?.();
    });
  }

  /**
   * Small green pip placed under the mission/inventory button cluster.
   * Mirrors the main E button's visibility so the player always has a
   * "you can interact" signal in their peripheral vision regardless of
   * where their thumb is.
   */
  private createInteractPip(): void {
    this.interactPip = this.scene.add.container(0, 0);
    this.interactPip.setDepth(200);
    this.interactPip.setScrollFactor(0);
    this.interactPip.setVisible(false);

    const gfx = this.scene.add.graphics();
    // Outer soft glow
    gfx.fillStyle(0x5aff6a, 0.25);
    gfx.fillCircle(0, 0, 8);
    // Core dot — same green family as the E button
    gfx.fillStyle(0x6aff7a, 0.95);
    gfx.fillCircle(0, 0, 4);
    gfx.lineStyle(1, 0xa8ffb0, 0.9);
    gfx.strokeCircle(0, 0, 4);
    this.interactPip.add(gfx);
  }

  private repositionButtons(): void {
    const { width, height } = this.scene.scale;

    // Interact/Attack button: primary thumb zone (bottom-right corner)
    this.interactContainer.setPosition(width - 50, height - 70);

    // Inventory button: top-right corner, below mobile status bar
    this.inventoryContainer.setPosition(width - 34, 58);

    // Mission button: just left of the inventory button
    this.missionContainer.setPosition(width - 82, 58);

    // Interact pip: centered under the two top-right buttons
    this.interactPip.setPosition(width - 58, 90);
  }

  showInteract(): void {
    if (!this.interactVisible) {
      this.interactContainer.setVisible(true);
      this.interactPip.setVisible(true);
      this.interactPip.setAlpha(1);
      // Gentle pulse so the pip breathes and draws the eye
      this.interactPipTween?.stop();
      this.interactPipTween = this.scene.tweens.add({
        targets: this.interactPip,
        alpha: 0.4,
        duration: 700,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      this.interactVisible = true;
    }
  }

  hideInteract(): void {
    if (this.interactVisible) {
      this.interactContainer.setVisible(false);
      this.interactPipTween?.stop();
      this.interactPipTween = undefined;
      this.interactPip.setVisible(false);
      this.interactPip.setAlpha(1);
      this.interactVisible = false;
    }
  }
}
