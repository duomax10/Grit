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
  /** If true, the objective starts already completed (shown crossed out). */
  completed?: boolean;
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
      { id: 'dry_cleaning', text: 'Pick up dry cleaning', completed: true },
      {
        id: 'soil_samples',
        text: 'Collect soil samples from graves of Vera Thorne and Rebecca Johnson',
      },
    ],
  },
};
