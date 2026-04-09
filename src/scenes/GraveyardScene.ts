import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { InteractiveObject } from '../entities/InteractiveObject';
import { InteractionSystem } from '../systems/InteractionSystem';
import { DialogSystem } from '../systems/DialogSystem';
import { StateManager } from '../systems/StateManager';
import * as Dialogs from '../data/dialogs';

// Map dimensions in tiles — larger for a real graveyard feel
const MAP_COLS = 36;
const MAP_ROWS = 28;
const TILE = 32;
const MAP_W = MAP_COLS * TILE;
const MAP_H = MAP_ROWS * TILE;

// Layout cell types
const G = 0; // grass
const D = 1; // dirt path
const F = 2; // fence
const P = 3; // fence post

function buildLayout(): number[][] {
  const L: number[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    L[r] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      L[r][c] = G;

      // Fence border
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        const isCorner = (r === 0 || r === MAP_ROWS - 1) && (c === 0 || c === MAP_COLS - 1);
        const isHPost = (r === 0 || r === MAP_ROWS - 1) && c % 5 === 0;
        const isVPost = (c === 0 || c === MAP_COLS - 1) && r % 5 === 0;
        L[r][c] = (isCorner || isHPost || isVPost) ? P : F;
      }

      // Main entrance path (bottom center, going north)
      if (c >= 16 && c <= 19 && r >= 24 && r <= MAP_ROWS - 2) L[r][c] = D;
      if (c >= 16 && c <= 19 && r >= 10 && r <= 23) L[r][c] = D;
      if (c >= 16 && c <= 19 && r >= 7 && r <= 10) L[r][c] = D;

      // East-west cross paths
      if (r >= 14 && r <= 15 && c >= 3 && c <= 32) L[r][c] = D;
      if (r >= 7 && r <= 8 && c >= 3 && c <= 32) L[r][c] = D;

      // Side paths
      if (c >= 7 && c <= 8 && r >= 3 && r <= 24) L[r][c] = D;
      if (c >= 27 && c <= 28 && r >= 3 && r <= 24) L[r][c] = D;

      // Fountain plaza
      if (r >= 12 && r <= 17 && c >= 14 && c <= 21) L[r][c] = D;

      // Path to caretaker's house
      if (r >= 3 && r <= 4 && c >= 3 && c <= 8) L[r][c] = D;
    }
  }
  return L;
}

const LAYOUT = buildLayout();

// Flat grave markers — decorative, in rows
interface FlatGrave { c: number; r: number; variant: number; }

function generateFlatGraves(): FlatGrave[] {
  const graves: FlatGrave[] = [];
  const isGoodSpot = (c: number, r: number) => {
    if (c <= 1 || c >= MAP_COLS - 2 || r <= 1 || r >= MAP_ROWS - 2) return false;
    if (LAYOUT[r][c] !== G) return false;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (LAYOUT[r + dr]?.[c + dc] === D) return false;
      }
    }
    return true;
  };

  // Grave sections between paths
  const sections = [
    { rMin: 9, rMax: 13, cMin: 3, cMax: 14 },
    { rMin: 9, rMax: 13, cMin: 21, cMax: 32 },
    { rMin: 17, rMax: 23, cMin: 3, cMax: 14 },
    { rMin: 17, rMax: 23, cMin: 21, cMax: 32 },
    { rMin: 3, rMax: 6, cMin: 10, cMax: 32 },
  ];
  for (const s of sections) {
    for (let r = s.rMin; r <= s.rMax; r += 2) {
      for (let c = s.cMin; c <= s.cMax; c += 2) {
        if (isGoodSpot(c, r)) graves.push({ c, r, variant: (c + r) % 4 });
      }
    }
  }
  return graves;
}

const FLAT_GRAVES = generateFlatGraves();

// Monument positions (interactive)
const MONUMENTS = [
  { c: 5, r: 10, idx: 0, label: 'Angel Statue' },
  { c: 26, r: 10, idx: 1, label: 'Obelisk Monument' },
  { c: 12, r: 20, idx: 2, label: 'Celtic Cross' },
  { c: 24, r: 20, idx: 3, label: 'Ornate Headstone' },
  { c: 17, r: 4, idx: 4, label: 'Stone Crypt' },
];

// Decorations
interface Deco { c: number; r: number; tex: string; collide?: boolean; colW?: number; colH?: number; depth?: number; }
const DECORATIONS: Deco[] = [
  // Oak trees
  { c: 4, r: 5, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 24, r: 3, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 11, r: 18, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 31, r: 19, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 33, r: 5, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  // Evergreens
  { c: 2, r: 12, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  { c: 34, r: 12, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  { c: 2, r: 22, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  { c: 34, r: 22, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  // Dead tree
  { c: 30, r: 9, tex: 'dead-tree', collide: true, colW: 10, colH: 8, depth: 8 },
  // Benches
  { c: 14, r: 20, tex: 'bench', collide: true, colW: 28, colH: 8 },
  { c: 21, r: 20, tex: 'bench', collide: true, colW: 28, colH: 8 },
  // Bushes
  { c: 10, r: 14, tex: 'bush', collide: true, colW: 20, colH: 10 },
  { c: 25, r: 14, tex: 'bush', collide: true, colW: 20, colH: 10 },
  { c: 10, r: 8, tex: 'bush', collide: true, colW: 20, colH: 10 },
  { c: 25, r: 8, tex: 'bush', collide: true, colW: 20, colH: 10 },
  { c: 5, r: 15, tex: 'bush' },
  { c: 30, r: 15, tex: 'bush' },
  // Flowers
  { c: 4, r: 10, tex: 'flower-arrangement' },
  { c: 22, r: 10, tex: 'flower-arrangement' },
  { c: 6, r: 18, tex: 'flower-arrangement' },
  { c: 28, r: 22, tex: 'flower-arrangement' },
  { c: 12, r: 4, tex: 'flower-arrangement' },
];

export class GraveyardScene extends Phaser.Scene {
  private player!: Player;
  private interactionSystem!: InteractionSystem;
  private dialogSystem!: DialogSystem;
  private fenceColliders!: Phaser.Physics.Arcade.StaticGroup;
  private objectColliders!: Phaser.Physics.Arcade.StaticGroup;
  private ambientSound: Phaser.Sound.BaseSound | null = null;
  private footstepTimer = 0;
  private introPlayed = false;

  constructor() {
    super({ key: 'GraveyardScene' });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this.fenceColliders = this.physics.add.staticGroup();
    this.objectColliders = this.physics.add.staticGroup();

    this.buildMap();
    this.placeFlatGraves();
    this.placeDecorations();
    this.placeFountain();

    // Player
    this.player = new Player(this, 17 * TILE + TILE / 2, 25 * TILE);
    this.player.play('gabe-idle-down');

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBackgroundColor('#0a0a0a');

    // Dialog system
    this.dialogSystem = new DialogSystem(this);

    // Interaction system
    this.interactionSystem = new InteractionSystem(this.player);
    this.placeMonuments();
    this.placeCareHouse();

    this.interactionSystem.setNearestChangeCallback((obj) => {
      const uiScene = this.scene.get('UIScene') as Phaser.Scene;
      uiScene.events.emit('nearest-interactive-changed', obj);
    });

    // Collisions
    this.physics.add.collider(this.player, this.fenceColliders);
    this.physics.add.collider(this.player, this.objectColliders);

    // Atmosphere
    this.createFogEffects();
    this.createVignette();
    this.startAmbientAudio();

    // Intro dialog
    this.time.delayedCall(800, () => {
      if (!this.introPlayed) {
        this.introPlayed = true;
        this.dialogSystem.showDialog(Dialogs.GRAVEYARD_INTRO);
        StateManager.getInstance().setFlag('graveyard_intro_seen', true);
      }
    });

    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Listen for UI events
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.on('interact-pressed', () => this.handleInteract());
      uiScene.events.on('inventory-pressed', () => this.player.stopMovement());
    }
  }

  private buildMap(): void {
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const x = c * TILE + TILE / 2;
        const y = r * TILE + TILE / 2;
        const cell = LAYOUT[r][c];

        if (cell === G) {
          this.add.image(x, y, 'grass').setDepth(0);
        } else if (cell === D) {
          this.add.image(x, y, 'dirt').setDepth(0);
        } else if (cell === F) {
          this.add.image(x, y, 'grass').setDepth(0);
          this.add.image(x, y, 'fence').setDepth(1);
          const z = this.add.zone(x, y, TILE, TILE);
          this.physics.add.existing(z, true);
          this.fenceColliders.add(z);
        } else if (cell === P) {
          this.add.image(x, y, 'grass').setDepth(0);
          this.add.image(x, y, 'fence-post').setDepth(1);
          const z = this.add.zone(x, y, TILE, TILE);
          this.physics.add.existing(z, true);
          this.fenceColliders.add(z);
        }
      }
    }
  }

  private placeFlatGraves(): void {
    for (const g of FLAT_GRAVES) {
      const x = g.c * TILE + TILE / 2;
      const y = g.r * TILE + TILE / 2;
      this.add.image(x, y, `flat-grave-${g.variant}`).setDepth(1);
    }
  }

  private placeDecorations(): void {
    for (const d of DECORATIONS) {
      const x = d.c * TILE + TILE / 2;
      const y = d.r * TILE + TILE / 2;
      this.add.image(x, y, d.tex).setDepth(d.depth ?? 2);
      if (d.collide) {
        const z = this.add.zone(x, y + 6, d.colW ?? 20, d.colH ?? 10);
        this.physics.add.existing(z, true);
        this.objectColliders.add(z);
      }
    }
  }

  private placeFountain(): void {
    const x = 17.5 * TILE;
    const y = 14.5 * TILE;
    this.add.image(x, y, 'fountain').setDepth(4);
    const z = this.add.zone(x, y, 48, 48);
    this.physics.add.existing(z, true);
    this.objectColliders.add(z);
  }

  private placeMonuments(): void {
    const gravestoneDialogs = [
      Dialogs.GRAVESTONE_INSPECT_1,
      Dialogs.GRAVESTONE_INSPECT_2,
      Dialogs.GRAVESTONE_INSPECT_3,
      Dialogs.GRAVESTONE_INSPECT_4,
      Dialogs.GRAVESTONE_INSPECT_5,
    ];

    for (const m of MONUMENTS) {
      const x = m.c * TILE + TILE / 2;
      const y = m.r * TILE + TILE / 2;

      this.add.image(x, y, `monument-${m.idx}`).setDepth(4);

      const cz = this.add.zone(x, y + 6, 24, 14);
      this.physics.add.existing(cz, true);
      this.objectColliders.add(cz);

      const obj = new InteractiveObject({
        scene: this,
        x, y: y - 10,
        texture: `monument-${m.idx}`,
        interactionType: 'inspect',
        interactionRadius: 50,
        label: m.label,
        inspectData: { texture: `monument-${m.idx}` },
        onInteract: () => {
          this.player.stopMovement();
          this.dialogSystem.showDialog(gravestoneDialogs[m.idx]);
        },
      });
      obj.setVisible(false);
      this.interactionSystem.addObject(obj);
    }
  }

  private placeCareHouse(): void {
    const houseX = 5 * TILE;
    const houseY = 3 * TILE;
    this.add.image(houseX, houseY, 'caretaker-house').setDepth(3);

    const cz = this.add.zone(houseX, houseY + 10, TILE * 2.5, TILE * 2.5);
    this.physics.add.existing(cz, true);
    this.objectColliders.add(cz);

    const obj = new InteractiveObject({
      scene: this,
      x: houseX,
      y: houseY + TILE * 1.8,
      texture: 'caretaker-house',
      interactionType: 'dialog',
      interactionRadius: 60,
      label: "Caretaker's House",
      onInteract: () => {
        this.player.stopMovement();
        this.dialogSystem.showDialog(Dialogs.CARETAKER_HOUSE_DIALOG);
      },
    });
    obj.setVisible(false);
    this.interactionSystem.addObject(obj);
  }

  private createFogEffects(): void {
    for (let i = 0; i < 8; i++) {
      const fog = this.add.graphics();
      fog.setDepth(15);
      fog.setAlpha(0.04 + Math.random() * 0.04);
      const startX = Math.random() * MAP_W;
      const startY = Math.random() * MAP_H;
      fog.setPosition(startX, startY);
      fog.fillStyle(0xb0c0d0, 1);
      fog.fillEllipse(0, 0, 60 + Math.random() * 80, 20 + Math.random() * 20);

      this.tweens.add({
        targets: fog,
        x: startX + 200 + Math.random() * 300,
        y: startY + (Math.random() - 0.5) * 60,
        alpha: { from: fog.alpha, to: 0 },
        duration: 12000 + Math.random() * 8000,
        repeat: -1,
        onRepeat: () => {
          fog.setPosition(-100, Math.random() * MAP_H);
          fog.setAlpha(0.04 + Math.random() * 0.04);
        },
      });
    }
  }

  private createVignette(): void {
    const vignette = this.add.graphics();
    vignette.setDepth(20);
    vignette.setScrollFactor(0);

    const drawVignette = () => {
      const { width, height } = this.scale;
      vignette.clear();
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const alpha = (1 - i / steps) * 0.15;
        const inset = i * Math.min(width, height) * 0.05;
        vignette.fillStyle(0x000000, alpha);
        vignette.fillRect(0, 0, width, inset);
        vignette.fillRect(0, height - inset, width, inset);
        vignette.fillRect(0, 0, inset, height);
        vignette.fillRect(width - inset, 0, inset, height);
      }
    };
    drawVignette();
    this.scale.on('resize', drawVignette);
  }

  private startAmbientAudio(): void {
    this.time.delayedCall(500, () => {
      try {
        this.ambientSound = this.sound.add('night-ambient', { loop: true, volume: 0.3 });
        this.ambientSound.play();
      } catch (_e) { /* audio may not be ready */ }
    });
    this.scheduleOwlHoot();
  }

  private scheduleOwlHoot(): void {
    const delay = 8000 + Math.random() * 15000;
    this.time.delayedCall(delay, () => {
      try { this.sound.play('owl-hoot', { volume: 0.15 + Math.random() * 0.1 }); } catch (_e) { /* */ }
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
          this.sound.play(Math.random() > 0.5 ? 'footstep' : 'footstep-alt', { volume: 0.08 + Math.random() * 0.04 });
        } catch (_e) { /* */ }
      }
    } else {
      this.footstepTimer = 300;
    }
  }
}
