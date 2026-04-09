/**
 * Basic combat system framework.
 * Handles attack actions based on equipped items.
 * Will be expanded with enemy AI, boss patterns, etc.
 */

import { InventorySystem } from './InventorySystem';

export type CombatState = 'idle' | 'combat' | 'attacking';

export class CombatSystem {
  private static instance: CombatSystem;
  private state: CombatState = 'idle';
  private inventory: InventorySystem;
  private attackCooldown = 0;

  private constructor() {
    this.inventory = InventorySystem.getInstance();
  }

  static getInstance(): CombatSystem {
    if (!CombatSystem.instance) {
      CombatSystem.instance = new CombatSystem();
    }
    return CombatSystem.instance;
  }

  getState(): CombatState {
    return this.state;
  }

  enterCombat(): void {
    this.state = 'combat';
  }

  exitCombat(): void {
    this.state = 'idle';
  }

  attack(): { damage: number; type: string } | null {
    if (this.attackCooldown > 0) return null;

    const damage = this.inventory.getWeaponDamage();
    const leftHand = this.inventory.getEquipped('leftHand');
    const rightHand = this.inventory.getEquipped('rightHand');

    let type = 'punch';
    if (leftHand || rightHand) {
      type = (leftHand ?? rightHand)!.name.toLowerCase();
    }

    this.state = 'attacking';
    this.attackCooldown = 500; // ms

    return { damage, type };
  }

  update(delta: number): void {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 0;
        if (this.state === 'attacking') {
          this.state = 'combat';
        }
      }
    }
  }
}
