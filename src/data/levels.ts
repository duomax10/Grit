/**
 * Central registry of playable levels.
 *
 * Each level entry is a small metadata record pointing at the Phaser
 * scene key and the MissionSystem mission that pairs with it. Game
 * entry points (BootScene, LevelPickerScene) drive from this list so
 * adding a new level is just:
 *
 *   1) implement the Phaser.Scene subclass
 *   2) register it in main.ts's `scene:` array
 *   3) add an entry here
 *
 * Note: intentionally no `import` of the scene classes themselves —
 * the Phaser game config is the single place that owns their
 * constructors, and this file just refers to them by key.
 */

export interface Level {
  /** Stable ID used in URLs, save data, and state flags. */
  id: string;
  /** Display title for menus/pickers. */
  title: string;
  /** Short teaser for the picker list. */
  subtitle?: string;
  /** Phaser scene key (must match the scene's `super({ key })`). */
  sceneKey: string;
  /** Mission definition this level uses (from data/missions.ts). */
  missionId: string;
  /** Play order — lower numbers appear first in the picker. */
  order: number;
}

export const LEVELS: Level[] = [
  {
    id: 'graveyard',
    title: 'Monday',
    subtitle: 'Soil samples at the cemetery.',
    sceneKey: 'GraveyardScene',
    missionId: 'graveyard_intro',
    order: 1,
  },
];

/** The level shown when the game boots normally (no dev picker). */
export const DEFAULT_LEVEL_ID = 'graveyard';

export function getLevel(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function getLevelBySceneKey(sceneKey: string): Level | undefined {
  return LEVELS.find((l) => l.sceneKey === sceneKey);
}

export function getDefaultLevel(): Level {
  const lvl = getLevel(DEFAULT_LEVEL_ID);
  if (!lvl) throw new Error(`Default level "${DEFAULT_LEVEL_ID}" is not registered in LEVELS`);
  return lvl;
}

export function listLevelsInOrder(): Level[] {
  return [...LEVELS].sort((a, b) => a.order - b.order);
}
