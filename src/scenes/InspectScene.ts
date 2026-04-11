import Phaser from 'phaser';

/**
 * First-person inspection view.
 * Shows a close-up of the inspected object with a "Done" button.
 * Future: will support item pickup, reading text, examining clues.
 */

export interface InspectData {
  texture: string;
  label?: string;
  description?: string;
  /**
   * Scene key of the gameplay scene to resume when the inspect
   * overlay closes. Defaults to 'GraveyardScene' for backwards
   * compatibility with the first level.
   */
  parentSceneKey?: string;
}

export class InspectScene extends Phaser.Scene {
  private container!: Phaser.GameObjects.Container;
  private inspectData: InspectData | null = null;
  private parentSceneKey = 'GraveyardScene';

  constructor() {
    super({ key: 'InspectScene' });
  }

  init(data: InspectData): void {
    this.inspectData = data;
    this.parentSceneKey = data.parentSceneKey ?? 'GraveyardScene';
  }

  create(): void {
    const { width, height } = this.scale;

    this.container = this.add.container(0, 0);
    this.container.setDepth(0);

    // Dark background
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0a, 0.95);
    bg.fillRect(0, 0, width, height);
    this.container.add(bg);

    // Object display (centered, scaled up)
    if (this.inspectData?.texture && this.textures.exists(this.inspectData.texture)) {
      const sprite = this.add.image(width / 2, height / 2 - 40, this.inspectData.texture);
      sprite.setScale(3);
      this.container.add(sprite);
    }

    // Label
    if (this.inspectData?.label) {
      const label = this.add.text(width / 2, height / 2 + 40, this.inspectData.label, {
        fontFamily: 'Georgia, serif',
        fontSize: '14px',
        color: '#c0a880',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.container.add(label);
    }

    // Description
    if (this.inspectData?.description) {
      const desc = this.add.text(width / 2, height / 2 + 60, this.inspectData.description, {
        fontFamily: 'Georgia, serif',
        fontSize: '10px',
        color: '#8a8a90',
        wordWrap: { width: width - 40 },
        align: 'center',
      }).setOrigin(0.5);
      this.container.add(desc);
    }

    // "Done" button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x3a3a40, 0.8);
    btnBg.fillRoundedRect(width / 2 - 40, height - 60, 80, 36, 6);
    btnBg.lineStyle(1, 0x5a5a60, 0.8);
    btnBg.strokeRoundedRect(width / 2 - 40, height - 60, 80, 36, 6);
    this.container.add(btnBg);

    const btnText = this.add.text(width / 2, height - 42, 'Done', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#c0c0c0',
    }).setOrigin(0.5);
    this.container.add(btnText);

    const btnZone = this.add.zone(width / 2, height - 42, 100, 50)
      .setInteractive()
      .setOrigin(0.5);
    this.container.add(btnZone);

    btnZone.on('pointerdown', () => this.closeInspect());

    // Keyboard shortcut
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.closeInspect());
      this.input.keyboard.on('keydown-E', () => this.closeInspect());
    }

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private closeInspect(): void {
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume(this.parentSceneKey);
      this.scene.resume('UIScene');
    });
  }
}
