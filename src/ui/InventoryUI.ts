/**
 * Full-screen inventory overlay.
 * Shows equipment slots and backpack.
 */

import Phaser from 'phaser';
import { InventorySystem } from '../systems/InventorySystem';
import { EquipSlot } from '../data/items';

const SLOT_SIZE = 44;
const SLOT_GAP = 8;

const SLOT_LABELS: Record<EquipSlot, string> = {
  leftHand: 'L. Hand',
  rightHand: 'R. Hand',
  ring: 'Ring',
  pendant: 'Pendant',
  blessing: 'Blessing',
};

export class InventoryUI {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private isOpen = false;
  public onClose?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
  }

  private createUI(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(300);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.rebuild();
    this.container.setVisible(true);
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.container.setVisible(false);
    this.onClose?.();
  }

  get active(): boolean {
    return this.isOpen;
  }

  private rebuild(): void {
    this.container.removeAll(true);

    const { width, height } = this.scene.scale;
    const inventory = InventorySystem.getInstance();
    const equipped = inventory.getAllEquipped();

    // Full-screen dark overlay
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0a0a, 0.9);
    bg.fillRect(0, 0, width, height);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(width / 2, 24, 'INVENTORY', {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#c0a880',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    // Equipment slots
    const slots: EquipSlot[] = ['leftHand', 'rightHand', 'ring', 'pendant', 'blessing'];
    const startY = 60;

    slots.forEach((slot, i) => {
      const sx = width / 2 - (SLOT_SIZE + SLOT_GAP) * 1.5 + (i % 3) * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const sy = startY + Math.floor(i / 3) * (SLOT_SIZE + SLOT_GAP + 20) + SLOT_SIZE / 2;

      // Slot background
      const slotBg = this.scene.add.graphics();
      slotBg.fillStyle(0x1a1a20, 1);
      slotBg.fillRoundedRect(sx - SLOT_SIZE / 2, sy - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 4);
      slotBg.lineStyle(1, 0x3a3a40, 0.8);
      slotBg.strokeRoundedRect(sx - SLOT_SIZE / 2, sy - SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE, 4);
      this.container.add(slotBg);

      // Slot label
      const label = this.scene.add.text(sx, sy + SLOT_SIZE / 2 + 6, SLOT_LABELS[slot], {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: '#5a5a60',
      }).setOrigin(0.5);
      this.container.add(label);

      // Item in slot
      const item = equipped.get(slot);
      if (item) {
        const itemText = this.scene.add.text(sx, sy, item.name.charAt(0), {
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          color: '#c0a880',
        }).setOrigin(0.5);
        this.container.add(itemText);
      } else {
        const emptyText = this.scene.add.text(sx, sy, '-', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#2a2a30',
        }).setOrigin(0.5);
        this.container.add(emptyText);
      }
    });

    // Close button
    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(0x3a2a2a, 0.8);
    closeBg.fillRoundedRect(width / 2 - 40, height - 60, 80, 36, 6);
    closeBg.lineStyle(1, 0x5a3a3a, 0.8);
    closeBg.strokeRoundedRect(width / 2 - 40, height - 60, 80, 36, 6);
    this.container.add(closeBg);

    const closeText = this.scene.add.text(width / 2, height - 42, 'Close', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#c0a0a0',
    }).setOrigin(0.5);
    this.container.add(closeText);

    const closeZone = this.scene.add.zone(width / 2, height - 42, 100, 50)
      .setInteractive()
      .setOrigin(0.5);
    this.container.add(closeZone);
    closeZone.on('pointerdown', () => this.close());
  }
}
