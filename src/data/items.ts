/**
 * Item definitions for the game.
 */

export type EquipSlot = 'leftHand' | 'rightHand' | 'ring' | 'pendant' | 'blessing';

export interface GameItem {
  id: string;
  name: string;
  description: string;
  slot: EquipSlot;
  damage?: number;
  defense?: number;
  special?: string;
}

// Items will be added as we develop more of the game.
// For now, define the structure and a few placeholder items.

export const ITEMS: Record<string, GameItem> = {
  fists: {
    id: 'fists',
    name: 'Bare Fists',
    description: 'Your own two hands. Not much, but they\'ll do.',
    slot: 'leftHand',
    damage: 1,
  },
};
