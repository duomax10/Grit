/**
 * Mission definitions for each level.
 *
 * Missions are keyed by level ID. Each has a title and one or more
 * objectives. Objectives can be marked complete at runtime via
 * MissionSystem.
 *
 * State-driven objectives: set `requires` to a list of StateManager
 * flag keys that must all be truthy. MissionSystem subscribes to
 * 'flag-changed' and auto-completes matching objectives.
 */

export interface Objective {
  id: string;
  text: string;
  /** If true, the objective starts already completed (shown crossed out). */
  completed?: boolean;
  /** StateManager flag keys that must all be set to complete this objective. */
  requires?: string[];
}

export interface Mission {
  id: string;
  title: string;
  objectives: Objective[];
}

export const MISSIONS: Record<string, Mission> = {
  graveyard_intro: {
    id: 'graveyard_intro',
    title: 'Graveyard Fun',
    objectives: [
      { id: 'dry_cleaning', text: 'Pick up dry cleaning', completed: true },
      {
        id: 'soil_samples',
        text: 'Collect soil samples from graves of Vera Thorne and Rebecca Johnson',
        requires: ['sample_vera', 'sample_rebecca'],
      },
    ],
  },
};
