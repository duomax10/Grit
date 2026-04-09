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

      // Main path — straight down the center, gate at bottom
      if (c >= 17 && c <= 18 && r >= 2 && r <= MAP_ROWS - 2) L[r][c] = D;

      // Widen path around fountain area (rows 12-16)
      if (c >= 15 && c <= 20 && r >= 12 && r <= 16) L[r][c] = D;

      // Short branch path to caretaker's house (top-left)
      if (r >= 3 && r <= 4 && c >= 4 && c <= 17) L[r][c] = D;

      // Gentle curved side path — left
      if (c >= 9 && c <= 10 && r >= 8 && r <= 22) L[r][c] = D;

      // Gentle curved side path — right
      if (c >= 25 && c <= 26 && r >= 8 && r <= 22) L[r][c] = D;

      // Connect side paths to main at a couple points
      if (r >= 10 && r <= 10 && c >= 10 && c <= 17) L[r][c] = D;
      if (r >= 10 && r <= 10 && c >= 18 && c <= 25) L[r][c] = D;
      if (r >= 20 && r <= 20 && c >= 10 && c <= 17) L[r][c] = D;
      if (r >= 20 && r <= 20 && c >= 18 && c <= 25) L[r][c] = D;
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

  // Organic grave clusters — left and right of main path, varied spacing
  const sections = [
    // Left of main path
    { rMin: 5, rMax: 9, cMin: 3, cMax: 8 },
    { rMin: 12, rMax: 18, cMin: 2, cMax: 8 },
    { rMin: 21, rMax: 25, cMin: 3, cMax: 8 },
    { rMin: 6, rMax: 9, cMin: 12, cMax: 16 },
    { rMin: 17, rMax: 19, cMin: 12, cMax: 15 },
    { rMin: 22, rMax: 25, cMin: 12, cMax: 16 },
    // Right of main path
    { rMin: 5, rMax: 9, cMin: 20, cMax: 24 },
    { rMin: 5, rMax: 8, cMin: 28, cMax: 33 },
    { rMin: 12, rMax: 18, cMin: 28, cMax: 33 },
    { rMin: 17, rMax: 19, cMin: 21, cMax: 24 },
    { rMin: 22, rMax: 25, cMin: 20, cMax: 24 },
    { rMin: 21, rMax: 25, cMin: 28, cMax: 33 },
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

// Monument positions — placed organically among the graves
const MONUMENTS = [
  { c: 5, r: 7, idx: 0, label: 'Angel Statue' },       // left section, among older graves
  { c: 30, r: 7, idx: 1, label: 'Obelisk Monument' },   // right back corner
  { c: 6, r: 15, idx: 2, label: 'Celtic Cross' },        // left mid-section
  { c: 22, r: 22, idx: 3, label: 'Ornate Headstone' },   // right lower
  { c: 14, r: 23, idx: 4, label: 'Stone Crypt' },        // left lower, near edge
];

// Decorations — trees scattered throughout like a real old cemetery
interface Deco { c: number; r: number; tex: string; collide?: boolean; colW?: number; colH?: number; depth?: number; }
const DECORATIONS: Deco[] = [
  // Oak trees — scattered throughout, providing shade
  { c: 7, r: 11, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 28, r: 11, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 13, r: 6, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 23, r: 5, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 4, r: 21, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 31, r: 24, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  // Evergreens — along edges and near house
  { c: 2, r: 6, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  { c: 34, r: 6, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  { c: 2, r: 17, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  { c: 34, r: 17, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  // Dead tree — one for atmosphere
  { c: 32, r: 9, tex: 'dead-tree', collide: true, colW: 10, colH: 8, depth: 8 },
  // Bench — along the main path
  { c: 15, r: 14, tex: 'bench', collide: true, colW: 28, colH: 8 },
  { c: 21, r: 14, tex: 'bench', collide: true, colW: 28, colH: 8 },
  // Flowers near some graves
  { c: 6, r: 8, tex: 'flower-arrangement' },
  { c: 31, r: 8, tex: 'flower-arrangement' },
  { c: 5, r: 16, tex: 'flower-arrangement' },
  { c: 23, r: 23, tex: 'flower-arrangement' },
  { c: 13, r: 24, tex: 'flower-arrangement' },
  { c: 29, r: 15, tex: 'flower-arrangement' },
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
