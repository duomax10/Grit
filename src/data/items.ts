/**
 * Item definitions for the game.
 */

export type EquipSlot = 'leftHand' | 'rightHand' | 'ring' | 'pendant' | 'blessing';

export interface GameItem {
  id: string;
  name: string;
  description: string;
  /** If set, the item can be equipped into this slot. Otherwise it
   *  lives only in the backpack. */
  slot?: EquipSlot;
  /** Phaser texture key for the inventory icon. */
  icon?: string;
  damage?: number;
  defense?: number;
  special?: string;
}

export const ITEMS: Record<string, GameItem> = {
  fists: {
    id: 'fists',
    name: 'Bare Fists',
    description: 'Your own two hands. Not much, but they\'ll do.',
    slot: 'leftHand',
    damage: 1,
  },
  spade: {
    id: 'spade',
    name: 'Spade',
    description: 'A small folding spade. Good for digging up soil samples.',
    slot: 'rightHand',
    icon: 'item-spade',
    damage: 2,
  },
  sampleContainer: {
    id: 'sampleContainer',
    name: 'Sample Container',
    description: 'A small glass vial with a cork stopper. Holds one soil sample.',
    icon: 'item-container',
  },
};
