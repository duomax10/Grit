/**
 * Detects proximity between player and interactive objects.
 * Manages the interact button visibility and triggering.
 */

import { Player } from '../entities/Player';
import { InteractiveObject } from '../entities/InteractiveObject';

export class InteractionSystem {
  private player: Player;
  private objects: InteractiveObject[] = [];
  private nearestObject: InteractiveObject | null = null;
  private onNearestChange?: (obj: InteractiveObject | null) => void;

  constructor(player: Player) {
    this.player = player;
  }

  addObject(obj: InteractiveObject): void {
    this.objects.push(obj);
  }

  setNearestChangeCallback(cb: (obj: InteractiveObject | null) => void): void {
    this.onNearestChange = cb;
  }

  update(): void {
    let closest: InteractiveObject | null = null;
    let closestDist = Infinity;

    for (const obj of this.objects) {
      if (obj.isPlayerInRange(this.player.x, this.player.y)) {
        const dx = obj.x - this.player.x;
        const dy = obj.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closest = obj;
        }
      }
    }

    if (closest !== this.nearestObject) {
      this.nearestObject = closest;
      this.onNearestChange?.(closest);
    }
  }

  getNearest(): InteractiveObject | null {
    return this.nearestObject;
  }

  interact(): boolean {
    if (this.nearestObject) {
      this.nearestObject.onInteract?.();
      return true;
    }
    return false;
  }
}
