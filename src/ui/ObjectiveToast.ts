/**
 * Objective completion toast.
 * Slides down from the top of the screen, holds briefly, fades out.
 * Listens for 'objective-completed' and 'mission-completed' events
 * on MissionSystem.
 */

import Phaser from 'phaser';
import { MissionSystem } from '../systems/MissionSystem';
import { Mission, Objective } from '../data/missions';

const W = 300;
const H = 62;
const MARGIN_TOP = 140; // below dialog box and notch

export class ObjectiveToast {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private titleText!: Phaser.GameObjects.Text;
  private bodyText!: Phaser.GameObjects.Text;
  private queue: Array<{ title: string; body: string }> = [];
  private showing = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();

    const mission = MissionSystem.getInstance();
    mission.on('objective-completed', (objectiveId: string) => {
      const obj = mission.getObjective(objectiveId);
      if (!obj) return;
      // Skip any pre-completed objectives (e.g. dry_cleaning starts done)
      if (obj.completed) return;
      this.enqueue(this.formatObjective(obj));
    });
    mission.on('mission-completed', (m: Mission) => {
      this.enqueue({
        title: 'MISSION COMPLETE',
        body: m.title,
      });
    });
  }

  private formatObjective(obj: Objective): { title: string; body: string } {
    return { title: 'OBJECTIVE COMPLETE', body: obj.text };
  }

  private createUI(): void {
    const { width } = this.scene.scale;

    this.container = this.scene.add.container(width / 2, MARGIN_TOP);
    this.container.setDepth(9000); // above HUD, below dialog
    this.container.setScrollFactor(0);
    this.container.setVisible(false);

    this.bg = this.scene.add.graphics();
    this.drawBg(0xc0a060);
    this.container.add(this.bg);

    this.titleText = this.scene.add.text(0, -H / 2 + 12, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#e8d8a8',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.container.add(this.titleText);

    this.bodyText = this.scene.add.text(0, -H / 2 + 30, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#f0e0b8',
      fontStyle: 'italic',
      wordWrap: { width: W - 24 },
      align: 'center',
    }).setOrigin(0.5, 0);
    this.container.add(this.bodyText);

    this.scene.scale.on('resize', () => {
      const { width: w } = this.scene.scale;
      this.container.setX(w / 2);
    });
  }

  private drawBg(borderColor: number): void {
    this.bg.clear();
    this.bg.fillStyle(0x14120a, 0.95);
    this.bg.fillRoundedRect(-W / 2, -H / 2, W, H, 6);
    this.bg.lineStyle(2, borderColor, 0.95);
    this.bg.strokeRoundedRect(-W / 2, -H / 2, W, H, 6);
    // Inner bevel
    this.bg.lineStyle(1, 0x2a2418, 0.8);
    this.bg.strokeRoundedRect(-W / 2 + 3, -H / 2 + 3, W - 6, H - 6, 4);
  }

  private enqueue(item: { title: string; body: string }): void {
    this.queue.push(item);
    if (!this.showing) this.playNext();
  }

  private playNext(): void {
    const item = this.queue.shift();
    if (!item) {
      this.showing = false;
      return;
    }
    this.showing = true;

    const isMission = item.title === 'MISSION COMPLETE';
    this.drawBg(isMission ? 0xe8d080 : 0xc0a060);
    this.titleText.setText(item.title);
    this.titleText.setColor(isMission ? '#fff0c0' : '#e8d8a8');
    this.bodyText.setText(item.body);

    // Slide in from above
    this.container.setY(MARGIN_TOP - 40);
    this.container.setAlpha(0);
    this.container.setVisible(true);

    this.scene.tweens.add({
      targets: this.container,
      y: MARGIN_TOP,
      alpha: 1,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.scene.time.delayedCall(isMission ? 3200 : 2200, () => {
          this.scene.tweens.add({
            targets: this.container,
            y: MARGIN_TOP - 20,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeIn',
            onComplete: () => {
              this.container.setVisible(false);
              // Small gap between toasts
              this.scene.time.delayedCall(200, () => this.playNext());
            },
          });
        });
      },
    });

    // Subtle chime
    try {
      this.scene.sound.play(isMission ? 'chime-hi' : 'chime', { volume: 0.25 });
    } catch (_e) { /* audio optional */ }
  }
}
