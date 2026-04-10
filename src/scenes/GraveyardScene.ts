import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { InteractiveObject } from '../entities/InteractiveObject';
import { InteractionSystem } from '../systems/InteractionSystem';
import { DialogSystem } from '../systems/DialogSystem';
import { StateManager } from '../systems/StateManager';
import * as Dialogs from '../data/dialogs';

// Map layout matching the reference image
// Proportional to 32px tiles, 64px character
const MAP_COLS = 24;
const MAP_ROWS = 30;
const TILE = 32;
const MAP_W = MAP_COLS * TILE;
const MAP_H = MAP_ROWS * TILE;

const G = 0;  // grass
const V = 1;  // gravel (main path)
const F = 3;  // fence
const P = 4;  // fence post

function buildLayout(): number[][] {
  const L: number[][] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    L[r] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      L[r][c] = G;

      // Fence border with gate opening at bottom center
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        // Gate opening: bottom row, center 2 tiles
        if (r === MAP_ROWS - 1 && c >= 11 && c <= 12) {
          L[r][c] = V; // gate opening is gravel
        } else {
          const isCorner = (r === 0 || r === MAP_ROWS - 1) && (c === 0 || c === MAP_COLS - 1);
          const isHPost = (r === 0 || r === MAP_ROWS - 1) && c % 5 === 0;
          const isVPost = (c === 0 || c === MAP_COLS - 1) && r % 5 === 0;
          L[r][c] = (isCorner || isHPost || isVPost) ? P : F;
        }
      }

      // === CENTRAL GRAVEL PATH (2 tiles wide, full length) ===
      if (c >= 11 && c <= 12 && r >= 1 && r <= MAP_ROWS - 1) L[r][c] = V;

      // === CIRCULAR AREA around fountain (center at r=14, c=11.5) ===
      const fcr = 14, fcc = 11.5;
      const dx = c - fcc, dy = r - fcr;
      if (Math.sqrt(dx * dx + dy * dy) <= 3.2) L[r][c] = V;
    }
  }
  return L;
}

const LAYOUT = buildLayout();

// ============================================================
// GRAVESTONE ROWS — organized like a real cemetery
// Left side and right side of the main path
// ============================================================
interface GravePos { c: number; r: number; variant: number; interactive?: boolean; dialogIdx?: number; }

// Deterministic pseudo-random (so layout is stable across reloads)
function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 1) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ============================================================
// ORGANIC GRAVESTONE PLACEMENT
// Cemeteries have row structure but with variation:
// - Rows are offset and wobbly
// - Some gaps for trees/decoration
// - Some stones tilted/missing
// ============================================================
function buildGravePositions(): GravePos[] {
  const graves: GravePos[] = [];
  const rand = seededRand(12345);

  // Helper: check if a grid cell is valid for a grave
  const isValid = (c: number, r: number) => {
    if (c < 2 || c >= MAP_COLS - 2 || r < 2 || r >= MAP_ROWS - 2) return false;
    // Not on path
    if (LAYOUT[r][c] !== G) return false;
    // Not adjacent to path (1-tile buffer)
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (LAYOUT[r + dr]?.[c + dc] !== G) return false;
      }
    }
    // Not too close to other graves (min distance 1.5 tiles)
    for (const g of graves) {
      const dx = g.c - c, dy = g.r - r;
      if (dx * dx + dy * dy < 2.2) return false;
    }
    return true;
  };

  // Place graves in loose rows — left section
  // Row positions with slight wobble, spacing 2-3 tiles
  const leftRows = [6, 9, 12, 18, 21, 24, 27];
  for (const baseR of leftRows) {
    // Loose column positions — not perfectly aligned
    const cols = [3, 5, 7, 9];
    for (const baseC of cols) {
      // Wobble: small random offset
      const r = baseR + (rand() < 0.3 ? (rand() < 0.5 ? -1 : 1) : 0);
      const c = baseC + (rand() < 0.25 ? (rand() < 0.5 ? -1 : 1) : 0);
      // Gaps: 15% chance to skip
      if (rand() < 0.15) continue;
      if (isValid(c, r)) {
        graves.push({ c, r, variant: Math.floor(rand() * 8) });
      }
    }
  }

  // Right section
  const rightRows = [6, 9, 12, 18, 21, 24, 27];
  for (const baseR of rightRows) {
    const cols = [14, 16, 18, 20];
    for (const baseC of cols) {
      const r = baseR + (rand() < 0.3 ? (rand() < 0.5 ? -1 : 1) : 0);
      const c = baseC + (rand() < 0.25 ? (rand() < 0.5 ? -1 : 1) : 0);
      if (rand() < 0.15) continue;
      if (isValid(c, r)) {
        graves.push({ c, r, variant: Math.floor(rand() * 8) });
      }
    }
  }

  // Pick 5 interactive gravestones spread across the map
  const wellSpread: number[] = [];
  const minDist = 8;
  for (let i = 0; i < graves.length && wellSpread.length < 5; i++) {
    let ok = true;
    for (const j of wellSpread) {
      const dx = graves[i].c - graves[j].c;
      const dy = graves[i].r - graves[j].r;
      if (dx * dx + dy * dy < minDist * minDist) { ok = false; break; }
    }
    if (ok) wellSpread.push(i);
  }
  for (let i = 0; i < wellSpread.length; i++) {
    graves[wellSpread[i]].interactive = true;
    graves[wellSpread[i]].dialogIdx = i;
  }

  return graves;
}

const GRAVE_POSITIONS = buildGravePositions();

// ============================================================
// ORGANIC DECORATION PLACEMENT
// Trees in loose clusters (2-3 per cluster), bushes denser,
// details scattered everywhere with minimum spacing.
// ============================================================
interface Deco {
  c: number; r: number; tex: string;
  collide?: boolean; colW?: number; colH?: number;
  depth?: number; scale?: number;
}

function buildDecorations(): Deco[] {
  const decos: Deco[] = [];
  const rand = seededRand(54321);

  // Collect all occupied cells (paths, fence, graves)
  const occupied = new Set<string>();
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      if (LAYOUT[r][c] !== G) occupied.add(`${c},${r}`);
    }
  }
  // Add fountain area
  for (let dr = -3; dr <= 3; dr++) {
    for (let dc = -3; dc <= 3; dc++) {
      occupied.add(`${Math.round(11.5 + dc)},${14 + dr}`);
    }
  }
  for (const g of GRAVE_POSITIONS) {
    occupied.add(`${g.c},${g.r}`);
  }

  // Poisson-like placement with minimum distance
  const placeWithMinDist = (
    candidates: Array<{ c: number; r: number }>,
    minDist: number,
    tex: string,
    props: Partial<Deco> = {},
  ): number => {
    let placed = 0;
    for (const cand of candidates) {
      if (occupied.has(`${cand.c},${cand.r}`)) continue;
      // Check min distance to existing decorations
      let ok = true;
      for (const d of decos) {
        const dx = d.c - cand.c, dy = d.r - cand.r;
        if (dx * dx + dy * dy < minDist * minDist) { ok = false; break; }
      }
      if (ok) {
        decos.push({ c: cand.c, r: cand.r, tex, ...props });
        occupied.add(`${cand.c},${cand.r}`);
        placed++;
      }
    }
    return placed;
  };

  // TREE CLUSTERS — 2-3 loose clusters of trees
  // Cluster 1: upper-left
  const oakCluster1 = [
    { c: 3, r: 6 },
    { c: 4, r: 8 },
    { c: 2, r: 10 },
  ];
  // Cluster 2: upper-right
  const oakCluster2 = [
    { c: 21, r: 7 },
    { c: 20, r: 10 },
    { c: 22, r: 14 },
  ];
  // Cluster 3: lower-right (dead tree area)
  const oakCluster3 = [
    { c: 21, r: 22 },
    { c: 20, r: 25 },
  ];

  placeWithMinDist([...oakCluster1, ...oakCluster2, ...oakCluster3], 2.5,
    'tree-oak', { collide: true, colW: 16, colH: 12, depth: 8 });

  // Evergreens — along edges, flanking gate
  const evergreens = [
    { c: 2, r: 14 },
    { c: 21, r: 18 },
    { c: 9, r: 28 },
    { c: 14, r: 28 },
    { c: 3, r: 27 },
  ];
  placeWithMinDist(evergreens, 2.5,
    'tree-evergreen', { collide: true, colW: 12, colH: 10, depth: 8 });

  // Dead tree — atmospheric
  placeWithMinDist([{ c: 18, r: 6 }, { c: 6, r: 25 }], 2,
    'tree-dead', { collide: true, colW: 12, colH: 10, depth: 8 });

  // BUSHES — denser, minimum distance 2 tiles, clustered near trees
  const bushCandidates: Array<{ c: number; r: number }> = [];
  for (let r = 3; r < MAP_ROWS - 3; r++) {
    for (let c = 2; c < MAP_COLS - 2; c++) {
      if (rand() < 0.08) bushCandidates.push({ c, r });
    }
  }
  // Shuffle
  for (let i = bushCandidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [bushCandidates[i], bushCandidates[j]] = [bushCandidates[j], bushCandidates[i]];
  }
  // Place up to 12 large bushes
  let largeBushCount = 0;
  for (const cand of bushCandidates) {
    if (largeBushCount >= 12) break;
    if (occupied.has(`${cand.c},${cand.r}`)) continue;
    let ok = true;
    for (const d of decos) {
      const dx = d.c - cand.c, dy = d.r - cand.r;
      if (dx * dx + dy * dy < 9) { ok = false; break; }
    }
    if (ok) {
      decos.push({ c: cand.c, r: cand.r, tex: 'bush-large', collide: true, colW: 20, colH: 12 });
      occupied.add(`${cand.c},${cand.r}`);
      largeBushCount++;
    }
  }
  // Small bushes fill gaps
  let smallBushCount = 0;
  for (const cand of bushCandidates) {
    if (smallBushCount >= 10) break;
    if (occupied.has(`${cand.c},${cand.r}`)) continue;
    let ok = true;
    for (const d of decos) {
      const dx = d.c - cand.c, dy = d.r - cand.r;
      if (dx * dx + dy * dy < 4) { ok = false; break; }
    }
    if (ok) {
      decos.push({ c: cand.c, r: cand.r, tex: 'bush-small' });
      occupied.add(`${cand.c},${cand.r}`);
      smallBushCount++;
    }
  }

  // DETAILS — rocks, grass tufts, fallen leaves (small, non-colliding)
  const detailTextures = ['rocks', 'grassTufts', 'fallenLeaves'];
  const detailCandidates: Array<{ c: number; r: number; tex: string }> = [];
  for (let r = 2; r < MAP_ROWS - 2; r++) {
    for (let c = 2; c < MAP_COLS - 2; c++) {
      if (rand() < 0.06) {
        detailCandidates.push({ c, r, tex: detailTextures[Math.floor(rand() * 3)] });
      }
    }
  }
  let detailCount = 0;
  for (const cand of detailCandidates) {
    if (detailCount >= 25) break;
    if (occupied.has(`${cand.c},${cand.r}`)) continue;
    let ok = true;
    for (const d of decos) {
      const dx = d.c - cand.c, dy = d.r - cand.r;
      if (dx * dx + dy * dy < 3) { ok = false; break; }
    }
    if (ok) {
      decos.push({ c: cand.c, r: cand.r, tex: cand.tex });
      occupied.add(`${cand.c},${cand.r}`);
      detailCount++;
    }
  }

  return decos;
}

const DECORATIONS: Deco[] = buildDecorations();

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

    // Player — spawns at the gate (bottom center)
    this.player = new Player(this, 11.5 * TILE, 28 * TILE);
    this.player.play('gabe-idle-down');

    // Dialog
    this.dialogSystem = new DialogSystem(this);

    // Interaction
    this.interactionSystem = new InteractionSystem(this.player);
    this.interactionSystem.setNearestChangeCallback((obj) => {
      const uiScene = this.scene.get('UIScene') as Phaser.Scene;
      uiScene.events.emit('nearest-interactive-changed', obj);
    });

    // Build the map and place objects
    this.buildMap();
    this.placeGravestones();
    this.placeDecorations();
    this.placeFountain();

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBackgroundColor('#0a0a0a');

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

    // UI events
    const uiScene = this.scene.get('UIScene');
    if (uiScene) {
      uiScene.events.on('interact-pressed', () => this.handleInteract());
      uiScene.events.on('inventory-pressed', () => this.player.stopMovement());
    }
  }

  private buildMap(): void {
    const canvas = document.createElement('canvas');
    canvas.width = MAP_W;
    canvas.height = MAP_H;
    const ctx = canvas.getContext('2d')!;

    const getImage = (key: string) =>
      this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;

    const grassImg = getImage('grass');
    const gravelImg = getImage('gravel');

    // Pattern fill the entire map with grass
    const grassPat = ctx.createPattern(grassImg, 'repeat')!;
    ctx.fillStyle = grassPat;
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    // Paint gravel paths
    const gravelPat = ctx.createPattern(gravelImg, 'repeat')!;

    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const cell = LAYOUT[r][c];
        if (cell === V) {
          const x = c * TILE;
          const y = r * TILE;
          ctx.fillStyle = gravelPat;
          ctx.fillRect(x, y, TILE, TILE);

          // Feather edges where path meets grass
          const feather = 6;
          for (const [dr, dc, side] of [[-1,0,'top'],[1,0,'bottom'],[0,-1,'left'],[0,1,'right']] as const) {
            const neighbor = LAYOUT[r + dr]?.[c + dc];
            if (neighbor === G || neighbor === F || neighbor === P) {
              ctx.save();
              let grad: CanvasGradient;
              if (side === 'top') {
                grad = ctx.createLinearGradient(x, y, x, y + feather);
                ctx.globalCompositeOperation = 'destination-out';
                grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad; ctx.fillRect(x, y, TILE, feather);
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = grassPat; ctx.fillRect(x, y, TILE, TILE);
              } else if (side === 'bottom') {
                grad = ctx.createLinearGradient(x, y+TILE, x, y+TILE-feather);
                ctx.globalCompositeOperation = 'destination-out';
                grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad; ctx.fillRect(x, y+TILE-feather, TILE, feather);
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = grassPat; ctx.fillRect(x, y, TILE, TILE);
              } else if (side === 'left') {
                grad = ctx.createLinearGradient(x, y, x+feather, y);
                ctx.globalCompositeOperation = 'destination-out';
                grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad; ctx.fillRect(x, y, feather, TILE);
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = grassPat; ctx.fillRect(x, y, TILE, TILE);
              } else {
                grad = ctx.createLinearGradient(x+TILE, y, x+TILE-feather, y);
                ctx.globalCompositeOperation = 'destination-out';
                grad.addColorStop(0, 'rgba(0,0,0,1)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad; ctx.fillRect(x+TILE-feather, y, feather, TILE);
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = grassPat; ctx.fillRect(x, y, TILE, TILE);
              }
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

  private placeGravestones(): void {
    const gravestoneDialogs = [
      Dialogs.GRAVESTONE_INSPECT_1,
      Dialogs.GRAVESTONE_INSPECT_2,
      Dialogs.GRAVESTONE_INSPECT_3,
      Dialogs.GRAVESTONE_INSPECT_4,
      Dialogs.GRAVESTONE_INSPECT_5,
    ];

    for (const g of GRAVE_POSITIONS) {
      const x = g.c * TILE + TILE / 2;
      const y = g.r * TILE + TILE / 2;
      const texKey = `gravestone-${g.variant}`;

      // Visual sprite
      const img = this.add.image(x, y, texKey).setDepth(4);
      // Scale non-interactive ones slightly smaller for variety
      if (!g.interactive) img.setScale(0.8);

      // Collision
      const cz = this.add.zone(x, y + 4, 20, 12);
      this.physics.add.existing(cz, true);
      this.objectColliders.add(cz);

      // Interactive ones get dialog
      if (g.interactive && g.dialogIdx !== undefined) {
        const obj = new InteractiveObject({
          scene: this,
          x, y: y - 10,
          texture: texKey,
          interactionType: 'inspect',
          interactionRadius: 50,
          label: `Gravestone`,
          inspectData: { texture: texKey },
          onInteract: () => {
            this.player.stopMovement();
            this.dialogSystem.showDialog(gravestoneDialogs[g.dialogIdx!]);
          },
        });
        obj.setVisible(false);
        this.interactionSystem.addObject(obj);
      }
    }
  }

  private placeDecorations(): void {
    for (const d of DECORATIONS) {
      const x = d.c * TILE + TILE / 2;
      const y = d.r * TILE + TILE / 2;
      const img = this.add.image(x, y, d.tex).setDepth(d.depth ?? 2);
      if (d.scale) img.setScale(d.scale);
      if (d.collide) {
        const z = this.add.zone(x, y + 6, d.colW ?? 20, d.colH ?? 10);
        this.physics.add.existing(z, true);
        this.objectColliders.add(z);
      }
    }
  }

  private placeFountain(): void {
    const x = 11.5 * TILE;
    const y = 14 * TILE;
    this.add.image(x, y, 'fountain').setDepth(4);
    const z = this.add.zone(x, y, 64, 64);
    this.physics.add.existing(z, true);
    this.objectColliders.add(z);
  }

  private createFogEffects(): void {
    for (let i = 0; i < 6; i++) {
      const fog = this.add.graphics();
      fog.setDepth(15);
      fog.setAlpha(0.03 + Math.random() * 0.03);
      const startX = Math.random() * MAP_W;
      const startY = Math.random() * MAP_H;
      fog.setPosition(startX, startY);
      fog.fillStyle(0xb0c0d0, 1);
      fog.fillEllipse(0, 0, 50 + Math.random() * 60, 15 + Math.random() * 15);

      this.tweens.add({
        targets: fog,
        x: startX + 150 + Math.random() * 200,
        y: startY + (Math.random() - 0.5) * 40,
        alpha: { from: fog.alpha, to: 0 },
        duration: 10000 + Math.random() * 6000,
        repeat: -1,
        onRepeat: () => {
          fog.setPosition(-80, Math.random() * MAP_H);
          fog.setAlpha(0.03 + Math.random() * 0.03);
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
      const steps = 5;
      for (let i = 0; i < steps; i++) {
        const alpha = (1 - i / steps) * 0.12;
        const inset = i * Math.min(width, height) * 0.04;
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
      } catch (_e) { /* */ }
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
