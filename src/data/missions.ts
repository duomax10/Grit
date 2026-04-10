/**
 * Mission definitions for each level.
 *
 * Missions are keyed by level ID. Each has a title and one or more
 * objectives. Objectives can be marked complete at runtime via
 * MissionSystem.
 */

export interface Objective {
  id: string;
  text: string;
}

export interface Mission {
  id: string;
  title: string;
  objectives: Objective[];
}

export const MISSIONS: Record<string, Mission> = {
  graveyard_intro: {
    id: 'graveyard_intro',
    title: 'Mission',
    objectives: [
      { id: 'sample', text: 'Get a sample' },
    ],
  },
};
