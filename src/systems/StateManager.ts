/**
 * Manages game state: progress, flags, and future save/load.
 *
 * Extends Phaser.Events.EventEmitter so other systems (e.g.
 * MissionSystem) can react to flag changes and evaluate level
 * objectives whenever state changes.
 *
 * Events:
 *   - 'flag-changed' (key, value)  — emitted on setFlag
 */

import Phaser from 'phaser';

export class StateManager extends Phaser.Events.EventEmitter {
  private static instance: StateManager;

  private levelsCompleted: Set<string> = new Set();
  private flags: Map<string, boolean | string> = new Map();

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  // --- Level progress ---
  markLevelComplete(levelId: string): void {
    this.levelsCompleted.add(levelId);
  }

  isLevelComplete(levelId: string): boolean {
    return this.levelsCompleted.has(levelId);
  }

  // --- Flags ---
  setFlag(key: string, value: boolean | string): void {
    const prev = this.flags.get(key);
    if (prev === value) return;
    this.flags.set(key, value);
    this.emit('flag-changed', key, value);
  }

  getFlag(key: string): boolean | string | undefined {
    return this.flags.get(key);
  }

  getBoolFlag(key: string): boolean {
    return this.flags.get(key) === true;
  }

  getStringFlag(key: string): string {
    const val = this.flags.get(key);
    return typeof val === 'string' ? val : '';
  }

  // --- Serialization (for future save/load) ---
  serialize(): string {
    return JSON.stringify({
      levelsCompleted: Array.from(this.levelsCompleted),
      flags: Object.fromEntries(this.flags),
    });
  }

  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.levelsCompleted = new Set(parsed.levelsCompleted ?? []);
    this.flags = new Map(Object.entries(parsed.flags ?? {}));
  }
}
