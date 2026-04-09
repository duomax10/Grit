import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { InteractiveObject } from '../entities/InteractiveObject';
import { InteractionSystem } from '../systems/InteractionSystem';
import { DialogSystem } from '../systems/DialogSystem';
import { StateManager } from '../systems/StateManager';
// Wang tiles system available but not used with sliced sprite sheet
import * as Dialogs from '../data/dialogs';

// Map — old small-town cemetery proportions
const MAP_COLS = 28;
const MAP_ROWS = 32;
const TILE = 32;
const MAP_W = MAP_COLS * TILE;
const MAP_H = MAP_ROWS * TILE;

const G = 0;  // grass
const V = 1;  // gravel (main path)
const D = 2;  // dirt (side paths)
const F = 3;  // fence
const P = 4;  // fence post

function buildLayout(): number[][] {
  const L: number[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    L[r] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      L[r][c] = G;

      // Fence border
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        const isCorner = (r === 0 || r === MAP_ROWS - 1) && (c === 0 || c === MAP_COLS - 1);
        const isHPost = (r === 0 || r === MAP_ROWS - 1) && c % 6 === 0;
        const isVPost = (c === 0 || c === MAP_COLS - 1) && r % 6 === 0;
        L[r][c] = (isCorner || isHPost || isVPost) ? P : F;
      }

      // Central gravel path — from gate (bottom) up to fountain
      if (c >= 13 && c <= 14 && r >= 18 && r <= MAP_ROWS - 2) L[r][c] = V;

      // Circular gravel around fountain (rows 14-17, centered on col 13-14)
      const fcr = 15.5, fcc = 13.5; // fountain center
      const dx = c - fcc, dy = r - fcr;
      if (Math.sqrt(dx * dx + dy * dy) <= 2.8) L[r][c] = V;

      // Gravel continues north from fountain
      if (c >= 13 && c <= 14 && r >= 2 && r <= 13) L[r][c] = V;

      // Gravel path from main path upper-right to groundskeeper's house
      if (r >= 3 && r <= 4 && c >= 14 && c <= 24) L[r][c] = V;
      if (r >= 2 && r <= 3 && c >= 23 && c <= 25) L[r][c] = V;

      // Dirt side paths — branch off to grave clusters
      // Left cluster paths
      if (r === 10 && c >= 7 && c <= 13) L[r][c] = D;
      if (r === 22 && c >= 5 && c <= 13) L[r][c] = D;
      if (c === 7 && r >= 8 && r <= 12) L[r][c] = D;

      // Right cluster paths
      if (r === 10 && c >= 14 && c <= 21) L[r][c] = D;
      if (r === 22 && c >= 14 && c <= 22) L[r][c] = D;
      if (c === 21 && r >= 8 && r <= 12) L[r][c] = D;

      // Short dirt path to back-left cluster
      if (r === 6 && c >= 3 && c <= 10) L[r][c] = D;
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

  // Grave clusters in distinct areas
  const sections = [
    // Left of path, upper area
    { rMin: 7, rMax: 12, cMin: 2, cMax: 6 },
    { rMin: 7, rMax: 9, cMin: 8, cMax: 12 },
    // Left of path, lower area
    { rMin: 19, rMax: 25, cMin: 2, cMax: 6 },
    { rMin: 20, rMax: 24, cMin: 8, cMax: 12 },
    // Right of path, upper area
    { rMin: 7, rMax: 12, cMin: 16, cMax: 20 },
    { rMin: 7, rMax: 9, cMin: 22, cMax: 25 },
    // Right of path, lower area
    { rMin: 19, rMax: 25, cMin: 16, cMax: 20 },
    { rMin: 20, rMax: 24, cMin: 22, cMax: 25 },
    // Back-left cluster
    { rMin: 3, rMax: 5, cMin: 3, cMax: 9 },
    // Near top right (not blocking house path)
    { rMin: 6, rMax: 8, cMin: 18, cMax: 22 },
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

// Monuments — spread throughout the cemetery among grave clusters
const MONUMENTS = [
  { c: 4, r: 9, idx: 0, label: 'Angel Statue' },       // left upper cluster
  { c: 19, r: 8, idx: 1, label: 'Obelisk Monument' },   // right upper
  { c: 5, r: 22, idx: 2, label: 'Celtic Cross' },        // left lower
  { c: 22, r: 23, idx: 3, label: 'Ornate Headstone' },   // right lower
  { c: 6, r: 4, idx: 4, label: 'Stone Crypt' },          // back-left
];

// Decorations — tree clusters and scattered trees, natural feel
interface Deco { c: number; r: number; tex: string; collide?: boolean; colW?: number; colH?: number; depth?: number; }
const DECORATIONS: Deco[] = [
  // Tree cluster — left side, between grave groups
  { c: 3, r: 15, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 5, r: 16, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 2, r: 17, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },

  // Tree cluster — right side
  { c: 24, r: 14, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 26, r: 15, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },

  // Scattered individual trees
  { c: 10, r: 7, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 22, r: 26, tex: 'tree-oak', collide: true, colW: 14, colH: 10, depth: 8 },
  { c: 8, r: 25, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },

  // Dead tree near back
  { c: 25, r: 8, tex: 'dead-tree', collide: true, colW: 10, colH: 8, depth: 8 },

  // Entrance evergreens flanking the gate
  { c: 11, r: 30, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },
  { c: 16, r: 30, tex: 'tree-evergreen', collide: true, colW: 10, colH: 8, depth: 8 },

  // Small details scattered around
  { c: 3, r: 10, tex: 'grass-tufts' },
  { c: 18, r: 9, tex: 'rocks' },
  { c: 4, r: 23, tex: 'fallen-leaves' },
  { c: 21, r: 24, tex: 'grass-tufts' },
  { c: 7, r: 5, tex: 'rocks' },
  { c: 15, r: 26, tex: 'fallen-leaves' },
  { c: 9, r: 16, tex: 'grass-tufts' },
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
    // Spawn near the gate (bottom of central gravel path)
    this.player = new Player(this, 13.5 * TILE, 30 * TILE);
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

  private noise(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  private buildMap(): void {
    const canvas = document.createElement('canvas');
    canvas.width = MAP_W;
    canvas.height = MAP_H;
    const ctx = canvas.getContext('2d')!;

    const getImage = (key: string) =>
      this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;

    const grassImg = getImage('grass-base');
    const gravelImg = getImage('gravel-base');

    // Fill entire map with grass using pattern fill (119x118 tile = barely repeats)
    const grassPat = ctx.createPattern(grassImg, 'repeat')!;
    ctx.fillStyle = grassPat;
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    // Paint gravel and dirt paths
    const gravelPat = ctx.createPattern(gravelImg, 'repeat')!;

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const cell = LAYOUT[r][c];
        if (cell === V || cell === D) {
          const x = c * TILE;
          const y = r * TILE;
          ctx.fillStyle = cell === V ? gravelPat : gravelPat; // using gravel for both for now
          ctx.fillRect(x, y, TILE, TILE);

          // Draw transition tiles on edges where path meets grass
          const neighbors = [
            { dr: -1, dc: 0, pos: 'top' },
            { dr: 1, dc: 0, pos: 'bottom' },
            { dr: 0, dc: -1, pos: 'left' },
            { dr: 0, dc: 1, pos: 'right' },
          ];

          for (const n of neighbors) {
            const nr = r + n.dr;
            const nc = c + n.dc;
            const neighbor = LAYOUT[nr]?.[nc];
            if (neighbor === G || neighbor === F || neighbor === P) {
              // This edge borders grass — feather it
              const feather = 8;
              ctx.save();
              let grad: CanvasGradient;
              if (n.pos === 'top') {
                grad = ctx.createLinearGradient(x, y, x, y + feather);
              } else if (n.pos === 'bottom') {
                grad = ctx.createLinearGradient(x, y + TILE, x, y + TILE - feather);
              } else if (n.pos === 'left') {
                grad = ctx.createLinearGradient(x, y, x + feather, y);
              } else {
                grad = ctx.createLinearGradient(x + TILE, y, x + TILE - feather, y);
              }
              grad.addColorStop(0, 'rgba(0,0,0,1)');
              grad.addColorStop(1, 'rgba(0,0,0,0)');
              ctx.globalCompositeOperation = 'destination-out';
              ctx.fillStyle = grad;
              if (n.pos === 'top') ctx.fillRect(x, y, TILE, feather);
              else if (n.pos === 'bottom') ctx.fillRect(x, y + TILE - feather, TILE, feather);
              else if (n.pos === 'left') ctx.fillRect(x, y, feather, TILE);
              else ctx.fillRect(x + TILE - feather, y, feather, TILE);
              // Fill back with grass underneath
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = grassPat;
              ctx.fillRect(x, y, TILE, TILE);
              ctx.restore();
            }
          }
        }
      }
    }

    this.textures.addCanvas('ground-map', canvas);
    this.add.image(MAP_W / 2, MAP_H / 2, 'ground-map').setDepth(0);

    // Fence sprites + colliders
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const cell = LAYOUT[r][c];
        if (cell === F || cell === P) {
          const x = c * TILE + TILE / 2;
          const y = r * TILE + TILE / 2;
          this.add.image(x, y, cell === P ? 'fence-post' : 'fence').setDepth(1);
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
      // Use monument sprites scaled down as decorative row graves
      const variant = 4 + (g.variant % 4);
      const gImg = this.add.image(x, y, `monument-${variant}`);
      gImg.setDepth(1);
      gImg.setScale(0.35);
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
    // Fountain on the central gravel path
    const x = 13.5 * TILE;
    const y = 15.5 * TILE; // center of the circular gravel area
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
    // Groundskeeper's house — upper-right, off the gravel path
    const houseX = 24 * TILE;
    const houseY = 2.5 * TILE;
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
