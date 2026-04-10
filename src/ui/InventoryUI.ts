/**
 * Full-screen inventory overlay.
 * Shows equipment slots and a 10-slot backpack.
 */

import Phaser from 'phaser';
import { InventorySystem, BACKPACK_CAPACITY } from '../systems/InventorySystem';
import { EquipSlot, GameItem } from '../data/items';

// Tunable layout constants
const SLOT_SIZE = 56;
const SLOT_GAP = 10;
const PANEL_PAD = 20;
const HEADER_H = 40;
const SECTION_GAP = 28;
const LABEL_H = 18;
const CLOSE_H = 40;

const SLOT_LABELS: Record<EquipSlot, string> = {
  leftHand: 'L. Hand',
  rightHand: 'R. Hand',
  ring: 'Ring',
  pendant: 'Pendant',
  blessing: 'Blessing',
};

const EQUIP_ORDER: EquipSlot[] = ['leftHand', 'rightHand', 'ring', 'pendant', 'blessing'];

// Backpack layout: 2 rows of 5 slots
const BP_COLS = 5;
const BP_ROWS = Math.ceil(BACKPACK_CAPACITY / BP_COLS);

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

  /**
   * Compute the panel dimensions based on the fixed grid contents.
   * Panel width is driven by the widest row (5 slots). Height stacks:
   * header + equip row + labels + gap + backpack label + 2 rows +
   * gap + close button + padding.
   */
  private computePanelSize(): { w: number; h: number } {
    const rowWidth = BP_COLS * SLOT_SIZE + (BP_COLS - 1) * SLOT_GAP;
    const w = rowWidth + PANEL_PAD * 2;

    const equipRowH = SLOT_SIZE + LABEL_H;
    const backpackRowsH = BP_ROWS * SLOT_SIZE + (BP_ROWS - 1) * SLOT_GAP;
    const h =
      PANEL_PAD +
      HEADER_H +
      LABEL_H +
      equipRowH +
      SECTION_GAP +
      LABEL_H +
      backpackRowsH +
      SECTION_GAP +
      CLOSE_H +
      PANEL_PAD;

    return { w, h };
  }

  private rebuild(): void {
    this.container.removeAll(true);

    const { width: sw, height: sh } = this.scene.scale;
    const inventory = InventorySystem.getInstance();
    const equipped = inventory.getAllEquipped();
    const backpack = inventory.getBackpack();

    // Full-screen dimmer
    const dim = this.scene.add.graphics();
    dim.fillStyle(0x000000, 0.75);
    dim.fillRect(0, 0, sw, sh);
    this.container.add(dim);

    // Center panel
    const { w: pw, h: ph } = this.computePanelSize();
    const px = Math.round((sw - pw) / 2);
    const py = Math.round((sh - ph) / 2);

    const panel = this.scene.add.graphics();
    panel.fillStyle(0x16141a, 0.98);
    panel.fillRoundedRect(px, py, pw, ph, 10);
    panel.lineStyle(2, 0x5a4a30, 0.9);
    panel.strokeRoundedRect(px, py, pw, ph, 10);
    // Inner bevel
    panel.lineStyle(1, 0x2a2428, 0.8);
    panel.strokeRoundedRect(px + 3, py + 3, pw - 6, ph - 6, 8);
    this.container.add(panel);

    // --- Title ---
    const title = this.scene.add.text(px + pw / 2, py + PANEL_PAD + HEADER_H / 2, 'INVENTORY', {
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
      color: '#c0a880',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    // Horizontal rule under title
    const rule = this.scene.add.graphics();
    rule.lineStyle(1, 0x3a3028, 0.8);
    rule.lineBetween(px + PANEL_PAD, py + PANEL_PAD + HEADER_H + 4, px + pw - PANEL_PAD, py + PANEL_PAD + HEADER_H + 4);
    this.container.add(rule);

    // --- EQUIPPED section ---
    let cursorY = py + PANEL_PAD + HEADER_H + LABEL_H;

    const equipLabel = this.scene.add.text(px + PANEL_PAD, cursorY - 14, 'EQUIPPED', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#8a7a5a',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.container.add(equipLabel);

    const equipRowWidth = EQUIP_ORDER.length * SLOT_SIZE + (EQUIP_ORDER.length - 1) * SLOT_GAP;
    const equipStartX = px + Math.round((pw - equipRowWidth) / 2);

    EQUIP_ORDER.forEach((slot, i) => {
      const sx = equipStartX + i * (SLOT_SIZE + SLOT_GAP);
      const sy = cursorY;
      this.drawSlot(sx, sy, equipped.get(slot) ?? null, SLOT_LABELS[slot]);
    });

    cursorY += SLOT_SIZE + LABEL_H + SECTION_GAP;

    // --- BACKPACK section ---
    const bagLabel = this.scene.add.text(px + PANEL_PAD, cursorY - 14, 'BACKPACK', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#8a7a5a',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.container.add(bagLabel);

    const bpRowWidth = BP_COLS * SLOT_SIZE + (BP_COLS - 1) * SLOT_GAP;
    const bpStartX = px + Math.round((pw - bpRowWidth) / 2);

    for (let i = 0; i < BACKPACK_CAPACITY; i++) {
      const col = i % BP_COLS;
      const row = Math.floor(i / BP_COLS);
      const sx = bpStartX + col * (SLOT_SIZE + SLOT_GAP);
      const sy = cursorY + row * (SLOT_SIZE + SLOT_GAP);
      const item = backpack[i] ?? null;
      this.drawSlot(sx, sy, item, undefined);
    }

    cursorY += BP_ROWS * SLOT_SIZE + (BP_ROWS - 1) * SLOT_GAP + SECTION_GAP;

    // --- Close button ---
    const btnW = 120;
    const btnH = CLOSE_H;
    const btnX = px + Math.round((pw - btnW) / 2);
    const btnY = cursorY;

    const closeBg = this.scene.add.graphics();
    closeBg.fillStyle(0x3a2a2a, 0.9);
    closeBg.fillRoundedRect(btnX, btnY, btnW, btnH, 6);
    closeBg.lineStyle(1, 0x5a3a3a, 0.9);
    closeBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 6);
    this.container.add(closeBg);

    const closeText = this.scene.add.text(btnX + btnW / 2, btnY + btnH / 2, 'Close', {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: '#c0a0a0',
    }).setOrigin(0.5);
    this.container.add(closeText);

    const closeZone = this.scene.add.zone(btnX + btnW / 2, btnY + btnH / 2, btnW + 8, btnH + 8)
      .setInteractive()
      .setOrigin(0.5);
    this.container.add(closeZone);
    closeZone.on('pointerdown', () => this.close());
  }

  /**
   * Draw a single inventory slot at top-left (sx, sy). If `label`
   * is provided, it's rendered below the slot (used for equipment).
   */
  private drawSlot(sx: number, sy: number, item: GameItem | null, label: string | undefined): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0d0c10, 1);
    bg.fillRoundedRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 5);
    bg.lineStyle(1, 0x3a3028, 0.9);
    bg.strokeRoundedRect(sx, sy, SLOT_SIZE, SLOT_SIZE, 5);
    this.container.add(bg);

    if (item) {
      if (item.icon && this.scene.textures.exists(item.icon)) {
        const img = this.scene.add.image(sx + SLOT_SIZE / 2, sy + SLOT_SIZE / 2, item.icon);
        // Icons are drawn at 32x32; fit them to the slot with padding.
        const targetSize = SLOT_SIZE - 12;
        img.setDisplaySize(targetSize, targetSize);
        this.container.add(img);
      } else {
        // Text fallback — first letter of item name
        const letter = this.scene.add.text(
          sx + SLOT_SIZE / 2,
          sy + SLOT_SIZE / 2,
          item.name.charAt(0),
          {
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            color: '#c0a880',
          },
        ).setOrigin(0.5);
        this.container.add(letter);
      }
    } else {
      const dot = this.scene.add.text(
        sx + SLOT_SIZE / 2,
        sy + SLOT_SIZE / 2,
        '·',
        {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#2a2428',
        },
      ).setOrigin(0.5);
      this.container.add(dot);
    }

    if (label) {
      const lbl = this.scene.add.text(sx + SLOT_SIZE / 2, sy + SLOT_SIZE + 10, label, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#6a6068',
      }).setOrigin(0.5);
      this.container.add(lbl);
    }
  }
}
