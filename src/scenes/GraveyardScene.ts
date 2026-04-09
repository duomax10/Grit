import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { InteractiveObject } from '../entities/InteractiveObject';
import { InteractionSystem } from '../systems/InteractionSystem';
import { DialogSystem } from '../systems/DialogSystem';
import { StateManager } from '../systems/StateManager';
import * as Dialogs from '../data/dialogs';

// Map dimensions in tiles
const MAP_COLS = 30;
const MAP_ROWS = 22;
const TILE = 32;
const MAP_W = MAP_COLS * TILE;
const MAP_H = MAP_ROWS * TILE;

// Graveyard layout definition
// 0 = grass, 1 = dirt path, 2 = fence, 3 = fence post
const LAYOUT: number[][] = [];

function initLayout() {
  for (let r = 0; r < MAP_ROWS; r++) {
    LAYOUT[r] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      // Fence border
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        // Corners and every 6 tiles get a post
        if ((r === 0 || r === MAP_ROWS - 1) && (c === 0 || c === MAP_COLS - 1 || c % 6 === 0)) {
          LAYOUT[r][c] = 3;
        } else if ((c === 0 || c === MAP_COLS - 1) && r % 6 === 0) {
          LAYOUT[r][c] = 3;
        } else {
          LAYOUT[r][c] = 2;
        }
      }
      // Dirt path (winding from bottom-center upward)
      else if (
        (c >= 14 && c <= 16 && r >= 18 && r <= 20) || // entrance
        (c >= 13 && c <= 15 && r >= 12 && r <= 17) || // main path up
        (c >= 10 && c <= 13 && r >= 9 && r <= 11) ||  // branch left
        (c >= 15 && c <= 20 && r >= 9 && r <= 11) ||  // branch right
        (c >= 13 && c <= 15 && r >= 5 && r <= 9)      // path to house area
      ) {
        LAYOUT[r][c] = 1;
      } else {
        LAYOUT[r][c] = 0;
      }
    }
  }
}
initLayout();

export class GraveyardScene extends Phaser.Scene {
  private player!: Player;
  private interactionSystem!: InteractionSystem;
  private dialogSystem!: DialogSystem;
  private fenceColliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private objectColliders: Phaser.Physics.Arcade.StaticGroup | null = null;
  private fogParticles: Phaser.GameObjects.Graphics[] = [];
  private ambientSound: Phaser.Sound.BaseSound | null = null;
  private owlTimer: Phaser.Time.TimerEvent | null = null;
  private footstepTimer = 0;
  private introPlayed = false;

  constructor() {
    super({ key: 'GraveyardScene' });
  }

  create(): void {
    // Set world bounds
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);

    // Build the tilemap
    this.buildMap();

    // Create player
    this.player = new Player(this, 15 * TILE, 19 * TILE);
    this.player.play('gabe-idle-down');

    // Set up camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);

    // Dark tint overlay for atmosphere
    this.cameras.main.setBackgroundColor('#0a0a0a');

    // Dialog system
    this.dialogSystem = new DialogSystem(this);

    // Interaction system
    this.interactionSystem = new InteractionSystem(this.player);
    this.placeInteractiveObjects();

    // Notify UIScene about interaction system
    this.interactionSystem.setNearestChangeCallback((obj) => {
      const uiScene = this.scene.get('UIScene') as Phaser.Scene;
      uiScene.events.emit('nearest-interactive-changed', obj);
    });

    // Set up collisions
    if (this.fenceColliders) {
      this.physics.add.collider(this.player, this.fenceColliders);
    }
    if (this.objectColliders) {
      this.physics.add.collider(this.player, this.objectColliders);
    }

    // Create fog particles
    this.createFogEffects();

    // Vignette / dark overlay
    this.createVignette();

    // Audio
    this.startAmbientAudio();

    // Intro dialog (delayed)
    this.time.delayedCall(800, () => {
      if (!this.introPlayed) {
        this.introPlayed = true;
        this.dialogSystem.showDialog(Dialogs.GRAVEYARD_INTRO);
        StateManager.getInstance().setFlag('graveyard_intro_seen', true);
      }
    });

    // Camera fade in
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Listen for interaction from UI
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.on('interact-pressed', () => this.handleInteract());
      uiScene.events.on('inventory-pressed', () => {
        // Pause player movement while inventory is open
        this.player.stopMovement();
      });
    }
  }

  private buildMap(): void {
    this.fenceColliders = this.physics.add.staticGroup();
    this.objectColliders = this.physics.add.staticGroup();

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        const cell = LAYOUT[r][c];

        if (cell === 0) {
          // Grass
          const variant = Math.floor(this.noise(c, r) * 3);
          this.add.image(x, y, `grass-${variant}`).setDepth(0);
        } else if (cell === 1) {
          // Dirt path
          const variant = Math.floor(this.noise(c + 100, r + 100) * 2);
          this.add.image(x, y, `dirt-${variant}`).setDepth(0);
        } else if (cell === 2) {
          // Fence
          this.add.image(x, y, 'fence').setDepth(1);
          const collider = this.add.zone(x, y, TILE, TILE);
          this.physics.add.existing(collider, true);
          this.fenceColliders!.add(collider);
        } else if (cell === 3) {
          // Fence post
          this.add.image(x, y, 'fence-post').setDepth(1);
          const collider = this.add.zone(x, y, TILE, TILE);
          this.physics.add.existing(collider, true);
          this.fenceColliders!.add(collider);
        }
      }
    }

    // Place some dead trees and bushes on grass tiles
    const decorations = [
      { c: 4, r: 4, tex: 'dead-tree' },
      { c: 25, r: 3, tex: 'dead-tree' },
      { c: 8, r: 15, tex: 'dead-tree' },
      { c: 22, r: 17, tex: 'dead-bush' },
      { c: 3, r: 10, tex: 'dead-bush' },
      { c: 27, r: 8, tex: 'dead-bush' },
      { c: 6, r: 18, tex: 'dead-bush' },
      { c: 20, r: 4, tex: 'dead-tree' },
    ];

    for (const d of decorations) {
      const x = d.c * TILE + TILE / 2;
      const y = d.r * TILE + TILE / 2;
      this.add.image(x, y, d.tex).setDepth(2);
      if (d.tex === 'dead-tree') {
        const collider = this.add.zone(x, y + 4, 12, 8);
        this.physics.add.existing(collider, true);
        this.objectColliders!.add(collider);
      }
    }

    // Caretaker's house (3x3 tiles, top-left corner area)
    const houseX = 6 * TILE + TILE * 1.5;
    const houseY = 3 * TILE + TILE * 1.5;
    this.add.image(houseX, houseY, 'caretaker-house').setDepth(3);
    // House collision (slightly smaller than full size)
    const houseCollider = this.add.zone(houseX, houseY + 10, TILE * 2.5, TILE * 2.5);
    this.physics.add.existing(houseCollider, true);
    this.objectColliders!.add(houseCollider);
  }

  private placeInteractiveObjects(): void {
    const gravestoneDialogs = [
      Dialogs.GRAVESTONE_INSPECT_1,
      Dialogs.GRAVESTONE_INSPECT_2,
      Dialogs.GRAVESTONE_INSPECT_3,
      Dialogs.GRAVESTONE_INSPECT_4,
      Dialogs.GRAVESTONE_INSPECT_5,
    ];

    // Gravestone positions
    const positions = [
      { c: 10, r: 7 },
      { c: 18, r: 6 },
      { c: 8, r: 13 },
      { c: 22, r: 13 },
      { c: 16, r: 16 },
    ];

    positions.forEach((pos, i) => {
      const x = pos.c * TILE + TILE / 2;
      const y = pos.r * TILE + TILE / 2;

      // Visual gravestone
      this.add.image(x, y, `gravestone-${i}`).setDepth(4);

      // Collision
      const collider = this.add.zone(x, y + 4, 20, 12);
      this.physics.add.existing(collider, true);
      this.objectColliders!.add(collider);

      // Interactive
      const obj = new InteractiveObject({
        scene: this,
        x, y: y - 8,
        texture: `gravestone-${i}`,
        interactionType: 'inspect',
        interactionRadius: 50,
        label: `Gravestone ${i + 1}`,
        inspectData: { gravestoneIndex: i, texture: `gravestone-${i}` },
        onInteract: () => {
          this.player.stopMovement();
          this.dialogSystem.showDialog(gravestoneDialogs[i]);
        },
      });
      obj.setVisible(false); // visual is already placed
      this.interactionSystem.addObject(obj);
    });

    // Caretaker's house interactive zone
    const houseObj = new InteractiveObject({
      scene: this,
      x: 6 * TILE + TILE * 1.5,
      y: 5 * TILE + TILE * 1.5,
      texture: 'caretaker-house',
      interactionType: 'dialog',
      interactionRadius: 60,
      label: "Caretaker's House",
      onInteract: () => {
        this.player.stopMovement();
        this.dialogSystem.showDialog(Dialogs.CARETAKER_HOUSE_DIALOG);
      },
    });
    houseObj.setVisible(false);
    this.interactionSystem.addObject(houseObj);
  }

  private createFogEffects(): void {
    // Subtle fog wisps floating across the graveyard
    for (let i = 0; i < 8; i++) {
      const fog = this.add.graphics();
      fog.setDepth(15);
      fog.setAlpha(0.04 + Math.random() * 0.04);

      const startX = Math.random() * MAP_W;
      const startY = Math.random() * MAP_H;
      fog.setPosition(startX, startY);

      // Draw a soft blob
      fog.fillStyle(0xb0c0d0, 1);
      fog.fillEllipse(0, 0, 60 + Math.random() * 80, 20 + Math.random() * 20);

      this.fogParticles.push(fog);

      // Animate slowly
      this.tweens.add({
        targets: fog,
        x: startX + 200 + Math.random() * 300,
        y: startY + (Math.random() - 0.5) * 60,
        alpha: { from: fog.alpha, to: 0 },
        duration: 12000 + Math.random() * 8000,
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          fog.setPosition(-100, Math.random() * MAP_H);
          fog.setAlpha(0.04 + Math.random() * 0.04);
        },
      });
    }
  }

  private createVignette(): void {
    // Dark vignette around edges of camera
    const vignette = this.add.graphics();
    vignette.setDepth(20);
    vignette.setScrollFactor(0);

    const drawVignette = () => {
      const { width, height } = this.scale;
      vignette.clear();

      // Gradient-like effect using concentric rectangles
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const alpha = (1 - i / steps) * 0.15;
        const inset = i * Math.min(width, height) * 0.05;
        vignette.fillStyle(0x000000, alpha);
        vignette.fillRect(0, 0, width, inset); // top
        vignette.fillRect(0, height - inset, width, inset); // bottom
        vignette.fillRect(0, 0, inset, height); // left
        vignette.fillRect(width - inset, 0, inset, height); // right
      }
    };

    drawVignette();
    this.scale.on('resize', drawVignette);
  }

  private startAmbientAudio(): void {
    // Night ambient loop
    this.time.delayedCall(500, () => {
      try {
        this.ambientSound = this.sound.add('night-ambient', {
          loop: true,
          volume: 0.3,
        });
        this.ambientSound.play();
      } catch (e) {
        // Audio may not be ready yet
      }
    });

    // Random owl hoots
    this.scheduleOwlHoot();
  }

  private scheduleOwlHoot(): void {
    const delay = 8000 + Math.random() * 15000; // 8-23 seconds
    this.owlTimer = this.time.delayedCall(delay, () => {
      try {
        this.sound.play('owl-hoot', { volume: 0.15 + Math.random() * 0.1 });
      } catch (e) {
        // Audio may fail silently
      }
      this.scheduleOwlHoot();
    });
  }

  private handleInteract(): void {
    if (this.dialogSystem.active) {
      this.dialogSystem.advance();
      return;
    }
    this.interactionSystem.interact();
  }

  update(_time: number, delta: number): void {
    // Get input from UIScene's joystick
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      const joyData = (uiScene as { joystickData?: { x: number; y: number } }).joystickData;
      if (joyData && !this.dialogSystem.active) {
        this.player.inputX = joyData.x;
        this.player.inputY = joyData.y;
      } else if (this.dialogSystem.active) {
        this.player.inputX = 0;
        this.player.inputY = 0;
      }
    }

    this.player.update();
    this.interactionSystem.update();

    // Footstep sounds
    if (Math.abs(this.player.body!.velocity.x) > 10 || Math.abs(this.player.body!.velocity.y) > 10) {
      this.footstepTimer += delta;
      if (this.footstepTimer > 350) {
        this.footstepTimer = 0;
        try {
          const sfx = Math.random() > 0.5 ? 'footstep' : 'footstep-alt';
          this.sound.play(sfx, { volume: 0.08 + Math.random() * 0.04 });
        } catch (e) {
          // Audio may not be ready
        }
      }
    } else {
      this.footstepTimer = 300; // Almost ready to play on next movement
    }
  }

  private noise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
}
