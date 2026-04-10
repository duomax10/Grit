/**
 * Tracks the current mission and objective completion state.
 * Emits events when state changes so UI can react.
 */

import Phaser from 'phaser';
import { Mission, MISSIONS } from '../data/missions';

export class MissionSystem extends Phaser.Events.EventEmitter {
  private static _instance: MissionSystem | null = null;
  private currentMission: Mission | null = null;
  private completedObjectives: Set<string> = new Set();

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
    this.emit('mission-changed', mission);
  }

  getCurrentMission(): Mission | null {
    return this.currentMission;
  }

  isCompleted(objectiveId: string): boolean {
    return this.completedObjectives.has(objectiveId);
  }

  completeObjective(objectiveId: string): void {
    if (!this.currentMission) return;
    if (this.completedObjectives.has(objectiveId)) return;
    this.completedObjectives.add(objectiveId);
    this.emit('objective-completed', objectiveId);
  }

  getCompletedCount(): number {
    return this.completedObjectives.size;
  }

  getTotalCount(): number {
    return this.currentMission?.objectives.length ?? 0;
  }
}
