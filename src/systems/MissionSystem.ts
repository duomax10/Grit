/**
 * Tracks the current mission and objective completion state.
 * Emits events when state changes so UI can react.
 *
 * State-driven objectives: whenever a StateManager flag changes,
 * any objective whose `requires` flags are all truthy gets marked
 * complete automatically. When all objectives of a mission are
 * complete, a 'mission-completed' event fires so the UI can show
 * a toast and update the sticky note.
 */

import Phaser from 'phaser';
import { Mission, MISSIONS, Objective } from '../data/missions';
import { StateManager } from './StateManager';

export class MissionSystem extends Phaser.Events.EventEmitter {
  private static _instance: MissionSystem | null = null;
  private currentMission: Mission | null = null;
  private completedObjectives: Set<string> = new Set();
  private stateListener: ((key: string, value: boolean | string) => void) | null = null;

  static getInstance(): MissionSystem {
    if (!MissionSystem._instance) {
      MissionSystem._instance = new MissionSystem();
    }
    return MissionSystem._instance;
  }

  /**
   * Set the current mission by ID. Resets completion state.
   */
  setMission(missionId: string): void {
    const mission = MISSIONS[missionId];
    if (!mission) {
      console.warn(`Unknown mission: ${missionId}`);
      return;
    }
    this.currentMission = mission;
    this.completedObjectives.clear();
    // Pre-mark any objectives flagged as completed in the data.
    for (const obj of mission.objectives) {
      if (obj.completed) this.completedObjectives.add(obj.id);
    }
    this.subscribeToState();
    this.evaluateObjectives();
    this.emit('mission-changed', mission);
  }

  /**
   * Subscribe to StateManager flag changes so we can auto-complete
   * objectives that depend on state. Re-entrant: safe to call on
   * each setMission.
   */
  private subscribeToState(): void {
    const state = StateManager.getInstance();
    if (this.stateListener) {
      state.off('flag-changed', this.stateListener);
    }
    this.stateListener = () => this.evaluateObjectives();
    state.on('flag-changed', this.stateListener);
  }

  /**
   * Walk every objective in the current mission; complete any whose
   * `requires` flags are all truthy in the StateManager.
   */
  private evaluateObjectives(): void {
    if (!this.currentMission) return;
    const state = StateManager.getInstance();

    for (const obj of this.currentMission.objectives) {
      if (this.completedObjectives.has(obj.id)) continue;
      if (!obj.requires || obj.requires.length === 0) continue;
      const allMet = obj.requires.every((k) => state.getBoolFlag(k));
      if (allMet) {
        this.completedObjectives.add(obj.id);
        this.emit('objective-completed', obj.id);
      }
    }

    // Check whole-mission completion
    if (
      this.currentMission.objectives.length > 0 &&
      this.currentMission.objectives.every((o) => this.completedObjectives.has(o.id))
    ) {
      this.emit('mission-completed', this.currentMission);
    }
  }

  getCurrentMission(): Mission | null {
    return this.currentMission;
  }

  getObjective(objectiveId: string): Objective | undefined {
    return this.currentMission?.objectives.find((o) => o.id === objectiveId);
  }

  isCompleted(objectiveId: string): boolean {
    return this.completedObjectives.has(objectiveId);
  }

  completeObjective(objectiveId: string): void {
    if (!this.currentMission) return;
    if (this.completedObjectives.has(objectiveId)) return;
    this.completedObjectives.add(objectiveId);
    this.emit('objective-completed', objectiveId);
    // A manual completion can also finish the mission.
    if (
      this.currentMission.objectives.length > 0 &&
      this.currentMission.objectives.every((o) => this.completedObjectives.has(o.id))
    ) {
      this.emit('mission-completed', this.currentMission);
    }
  }

  getCompletedCount(): number {
    return this.completedObjectives.size;
  }

  getTotalCount(): number {
    return this.currentMission?.objectives.length ?? 0;
  }
}
