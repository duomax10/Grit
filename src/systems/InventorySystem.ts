/**
 * Inventory system with equipment slots and a 10-slot backpack.
 * Slots: leftHand, rightHand, ring, pendant, blessing
 */

import { GameItem, EquipSlot, ITEMS } from '../data/items';

export const BACKPACK_CAPACITY = 10;

export class InventorySystem {
  private static instance: InventorySystem;

  private equipped: Map<EquipSlot, GameItem | null> = new Map([
    ['leftHand', null],
    ['rightHand', null],
    ['ring', null],
    ['pendant', null],
    ['blessing', null],
  ]);

  private backpack: GameItem[] = [];

  static getInstance(): InventorySystem {
    if (!InventorySystem.instance) {
      InventorySystem.instance = new InventorySystem();
      InventorySystem.instance.seedStartingItems();
    }
    return InventorySystem.instance;
  }

  /**
   * Seed the inventory with Gabe's starting loadout for the first
   * mission: a spade (equipped in the right hand) and two sample
   * containers in the backpack.
   */
  private seedStartingItems(): void {
    const spade = ITEMS.spade;
    if (spade) this.equipped.set('rightHand', { ...spade });

    const container = ITEMS.sampleContainer;
    if (container) {
      this.backpack.push({ ...container });
      this.backpack.push({ ...container });
    }
  }

  equip(slot: EquipSlot, item: GameItem): GameItem | null {
    const current = this.equipped.get(slot) ?? null;
    this.equipped.set(slot, item);
    // If there was something equipped, put it in backpack
    if (current) {
      this.backpack.push(current);
    }
    return current;
  }

  unequip(slot: EquipSlot): GameItem | null {
    const current = this.equipped.get(slot) ?? null;
    if (current) {
      this.equipped.set(slot, null);
      this.backpack.push(current);
    }
    return current;
  }

  getEquipped(slot: EquipSlot): GameItem | null {
    return this.equipped.get(slot) ?? null;
  }

  getAllEquipped(): Map<EquipSlot, GameItem | null> {
    return new Map(this.equipped);
  }

  addToBackpack(item: GameItem): void {
    this.backpack.push(item);
  }

  removeFromBackpack(itemId: string): GameItem | null {
    const index = this.backpack.findIndex((i) => i.id === itemId);
    if (index >= 0) {
      return this.backpack.splice(index, 1)[0];
    }
    return null;
  }

  getBackpack(): GameItem[] {
    return [...this.backpack];
  }

  isHandEmpty(hand: 'leftHand' | 'rightHand'): boolean {
    return this.equipped.get(hand) === null;
  }

  getWeaponDamage(): number {
    const left = this.equipped.get('leftHand');
    const right = this.equipped.get('rightHand');
    const leftDmg = left?.damage ?? 0;
    const rightDmg = right?.damage ?? 0;
    // Use the stronger hand, or 1 for bare fists
    return Math.max(leftDmg, rightDmg, 1);
  }
}
