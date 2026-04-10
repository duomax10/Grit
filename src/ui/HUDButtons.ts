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

  // Callbacks
  public onInteract?: () => void;
  public onInventory?: () => void;

  private readonly BTN_SIZE = 48;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createInteractButton();
    this.createInventoryButton();
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

  private repositionButtons(): void {
    const { width, height } = this.scene.scale;

    // Interact/Attack button: primary thumb zone (bottom-right corner)
    // This button changes to 'attack' in combat and is the most-used
    // button, so it gets the prime thumb position.
    this.interactContainer.setPosition(width - 50, height - 70);

    // Inventory button: diagonally up-left from the interact button
    // so the right thumb can reach it by moving up+left (natural motion)
    // but it's far enough away that combat mashing the attack button
    // won't accidentally open the inventory.
    // Placed 72px above and 58px left of the interact button center.
    this.inventoryContainer.setPosition(width - 108, height - 142);
  }

  showInteract(): void {
    if (!this.interactVisible) {
      this.interactContainer.setVisible(true);
      this.interactVisible = true;
    }
  }

  hideInteract(): void {
    if (this.interactVisible) {
      this.interactContainer.setVisible(false);
      this.interactVisible = false;
    }
  }
}
