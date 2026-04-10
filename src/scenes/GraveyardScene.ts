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
          L[r][c] = F;
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
// ============================================================
// STRUCTURED GRAVE PLACEMENT
// Organized rows and columns with occasional gaps for trees/bushes.
// Small variety in column offset keeps it from feeling mechanical.
// ============================================================
// Tree positions are shared between grave placement and decoration placement
// so graves can avoid tree positions
const TREE_POSITIONS: Array<{ c: number; r: number }> = [
  // Oak trees — edges and interior
  { c: 2, r: 4 }, { c: 2, r: 8 }, { c: 2, r: 13 }, { c: 2, r: 17 }, { c: 2, r: 22 }, { c: 2, r: 26 },
  { c: 21, r: 4 }, { c: 21, r: 8 }, { c: 21, r: 13 }, { c: 21, r: 17 }, { c: 21, r: 22 }, { c: 21, r: 26 },
  { c: 6, r: 2 }, { c: 12, r: 2 }, { c: 17, r: 2 },
  { c: 11, r: 8 }, { c: 14, r: 20 },
  // Evergreens
  { c: 9, r: 28 }, { c: 14, r: 28 }, { c: 4, r: 28 }, { c: 19, r: 28 },
  { c: 5, r: 2 }, { c: 18, r: 2 }, { c: 2, r: 11 }, { c: 21, r: 11 },
  // Dead trees
  { c: 15, r: 5 }, { c: 5, r: 16 }, { c: 19, r: 19 },
];

function buildGravePositions(): GravePos[] {
  const graves: GravePos[] = [];
  const rand = seededRand(12345);

  const isValid = (c: number, r: number) => {
    if (c < 2 || c >= MAP_COLS - 2 || r < 2 || r >= MAP_ROWS - 2) return false;
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
    // Not too close to trees — trees are bigger now so need more buffer
    for (const t of TREE_POSITIONS) {
      const dx = t.c - c, dy = t.r - r;
      if (dx * dx + dy * dy < 6) return false; // ~2.5 tile buffer
    }
    return true;
  };

  // Structured rows — every 2 rows, with cleaner columns
  // Columns are at fixed positions for each side
  const leftCols = [3, 5, 7, 9];
  const rightCols = [14, 16, 18, 20];

  // Row bands — skip rows around fountain (rows 12-17) and gate (rows 28-29)
  const rowBands = [
    { from: 3, to: 11 },   // upper graves
    { from: 18, to: 26 },  // lower graves
  ];

  for (const band of rowBands) {
    for (let r = band.from; r <= band.to; r += 2) {
      // Left columns
      for (const c of leftCols) {
        // 12% chance to leave a gap (for tree/bush placement later)
        if (rand() < 0.12) continue;
        if (isValid(c, r)) {
          graves.push({ c, r, variant: Math.floor(rand() * 18) });
        }
      }
      // Right columns
      for (const c of rightCols) {
        if (rand() < 0.12) continue;
        if (isValid(c, r)) {
          graves.push({ c, r, variant: Math.floor(rand() * 18) });
        }
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

// Helper: is this cell on a stone/gravel path?
function isOnPath(c: number, r: number): boolean {
  return LAYOUT[r]?.[c] === V;
}

// Helper: is this cell adjacent to a stone path (within a radius)?
function isNearPath(c: number, r: number, radius: number = 1): boolean {
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (LAYOUT[r + dr]?.[c + dc] === V) return true;
    }
  }
  return false;
}

function buildDecorations(): Deco[] {
  const decos: Deco[] = [];
  const rand = seededRand(54321);

  // Collect all occupied cells (paths, fence, graves)
  // Mark the path AND adjacent cells as occupied so no decorations
  // are placed on or directly bordering the stone path
  const occupied = new Set<string>();
  for (let r = 0; r < MAP_ROWS; r++) {
    for (let c = 0; c < MAP_COLS; c++) {
      // Non-grass tiles (path, fence) — fully blocked
      if (LAYOUT[r][c] !== G) {
        occupied.add(`${c},${r}`);
        continue;
      }
      // Grass cells adjacent to path — blocked for decorations
      // (path is only for the fountain)
      if (isNearPath(c, r, 1)) {
        occupied.add(`${c},${r}`);
      }
    }
  }
  // Add fountain area (fountain goes on the path — that's the exception)
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

  // TREES — lots of trees around the edges, some scattered inside
  // OAK TREES — lining the outer edges
  const oakTrees = [
    // Left edge
    { c: 2, r: 4 },
    { c: 2, r: 8 },
    { c: 2, r: 13 },
    { c: 2, r: 17 },
    { c: 2, r: 22 },
    { c: 2, r: 26 },
    // Right edge
    { c: 21, r: 4 },
    { c: 21, r: 8 },
    { c: 21, r: 13 },
    { c: 21, r: 17 },
    { c: 21, r: 22 },
    { c: 21, r: 26 },
    // Top edge
    { c: 6, r: 2 },
    { c: 12, r: 2 },
    { c: 17, r: 2 },
    // A few interior ones breaking up grave rows
    { c: 11, r: 8 },
    { c: 14, r: 20 },
  ];
  placeWithMinDist(oakTrees, 2.5,
    'tree-oak', { collide: true, colW: 24, colH: 16, depth: 8 });

  // EVERGREENS — flanking the gate and scattered on edges
  const evergreens = [
    { c: 9, r: 28 },     // left of gate
    { c: 14, r: 28 },    // right of gate
    { c: 4, r: 28 },     // outer left at gate
    { c: 19, r: 28 },    // outer right at gate
    { c: 5, r: 2 },      // top edge
    { c: 18, r: 2 },     // top edge
    { c: 2, r: 11 },     // left edge
    { c: 21, r: 11 },    // right edge
  ];
  placeWithMinDist(evergreens, 2.5,
    'tree-evergreen', { collide: true, colW: 18, colH: 14, depth: 8 });

  // DEAD TREES — atmospheric spots
  placeWithMinDist([
    { c: 15, r: 5 },
    { c: 5, r: 16 },
    { c: 19, r: 19 },
  ], 2, 'tree-dead', { collide: true, colW: 18, colH: 14, depth: 8 });

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
  const detailTextures = ['rocks', 'grassTufts'];
  const detailCandidates: Array<{ c: number; r: number; tex: string }> = [];
  for (let r = 2; r < MAP_ROWS - 2; r++) {
    for (let c = 2; c < MAP_COLS - 2; c++) {
      if (rand() < 0.06) {
        detailCandidates.push({ c, r, tex: detailTextures[Math.floor(rand() * detailTextures.length)] });
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
    this.scatterGrassTufts();
    this.placeFountain();
    this.placeEntranceLight();

    // Camera
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBackgroundColor('#0a0a0a');

    // Collisions
    this.physics.add.collider(this.player, this.fenceColliders);
    this.physics.add.collider(this.player, this.objectColliders);

    // Atmosphere
    this.createFogEffects();
    this.createTwilightOverlay();
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
            if (neighbor === G || neighbor === F) {
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
    // Top/bottom rows use horizontal fence sprite
    // Left/right columns use vertical fence sprite
    for (let r = 0; r < MAP_ROWS; r++) {
      for (let c = 0; c < MAP_COLS; c++) {
        const cell = LAYOUT[r][c];
        if (cell === F) {
          const x = c * TILE + TILE / 2;
          const y = r * TILE + TILE / 2;
          // Determine orientation based on edge
          const isTopOrBottom = (r === 0 || r === MAP_ROWS - 1);
          // Use vertical fence sprite if available, else fall back to horizontal
          const sprite = isTopOrBottom
            ? 'fence'
            : this.textures.exists('fence-vertical') ? 'fence-vertical' : 'fence';
          this.add.image(x, y, sprite).setDepth(1);
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

    // Find which gravestone textures are actually available
    const availableVariants: number[] = [];
    for (let i = 0; i < 18; i++) {
      if (this.textures.exists(`gravestone-${i}`)) availableVariants.push(i);
    }
    if (availableVariants.length === 0) {
      console.warn('No gravestone textures loaded');
      return;
    }

    for (const g of GRAVE_POSITIONS) {
      const x = g.c * TILE + TILE / 2;
      const y = g.r * TILE + TILE / 2;
      // Map the precomputed variant to an available one
      const variantIdx = availableVariants[g.variant % availableVariants.length];
      const texKey = `gravestone-${variantIdx}`;

      // Visual sprite — Y-sorted depth
      const img = this.add.image(x, y, texKey).setDepth(1000 + y);
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

      // For trees, draw a subtle shadow underneath to seat them on the ground
      if (d.tex.startsWith('tree-')) {
        const shadow = this.add.graphics();
        shadow.setDepth(1000 + y - 2);
        shadow.fillStyle(0x0a1808, 0.35);
        shadow.fillEllipse(x, y + 24, 44, 14);
      }

      const img = this.add.image(x, y, d.tex);
      // Y-sorted depth: objects further down the screen draw on top
      if (d.tex.startsWith('tree-')) {
        // Tree base = y + half height; sort above ground but below player
        img.setDepth(1000 + y + (img.height / 2));
      } else {
        img.setDepth(1000 + y);
      }
      if (d.scale) img.setScale(d.scale);
      if (d.collide) {
        const z = this.add.zone(x, y + 6, d.colW ?? 20, d.colH ?? 10);
        this.physics.add.existing(z, true);
        this.objectColliders.add(z);
      }
    }
  }

  private scatterGrassTufts(): void {
    if (!this.textures.exists('grassTufts')) return;
    // Deterministic seeded scatter of grass tuft sprites across the map.
    // Placed on grass tiles only, with some density variation.
    const rand = seededRand(99999);
    const placed: Array<{ x: number; y: number }> = [];
    const MIN_SPACING = 24; // minimum pixels between tufts

    for (let attempt = 0; attempt < 400; attempt++) {
      // Random position inside the map bounds
      const c = Math.floor(rand() * (MAP_COLS - 4)) + 2;
      const r = Math.floor(rand() * (MAP_ROWS - 4)) + 2;
      const cell = LAYOUT[r]?.[c];
      if (cell !== G) continue;

      // Random sub-tile offset so tufts aren't grid-aligned
      const px = c * TILE + TILE / 2 + (rand() - 0.5) * TILE;
      const py = r * TILE + TILE / 2 + (rand() - 0.5) * TILE;

      // Check min spacing from other tufts
      let ok = true;
      for (const p of placed) {
        const dx = p.x - px, dy = p.y - py;
        if (dx * dx + dy * dy < MIN_SPACING * MIN_SPACING) { ok = false; break; }
      }
      if (!ok) continue;

      placed.push({ x: px, y: py });

      const tuft = this.add.image(px, py, 'grassTufts');
      // Slight scale and alpha variation for natural look
      const scale = 0.45 + rand() * 0.3;
      tuft.setScale(scale);
      tuft.setAlpha(0.7 + rand() * 0.3);
      tuft.setDepth(1000 + py);
    }
  }

  private placeFountain(): void {
    // Fountain sits on the right half of the stone path
    const x = 12 * TILE;
    const y = 14 * TILE;
    const fountainImg = this.add.image(x, y, 'fountain').setDepth(1000 + y);
    const z = this.add.zone(x, y, 64, 64);
    this.physics.add.existing(z, true);
    this.objectColliders.add(z);

    // === Animated water ===
    // Create a small 4x4 white circle texture for water particles
    if (!this.textures.exists('water-drop')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0xa8c8e0, 1);
      g.fillCircle(2, 2, 2);
      g.generateTexture('water-drop', 4, 4);
      g.destroy();
    }

    // Particle emitter — water comes from the top of the fountain sprite
    const spoutY = y - fountainImg.height / 2 + 8;
    const emitter = this.add.particles(x, spoutY, 'water-drop', {
      speed: { min: 30, max: 55 },
      angle: { min: -110, max: -70 }, // upward spray
      gravityY: 180,
      lifespan: 900,
      quantity: 2,
      frequency: 60,
      scale: { start: 1, end: 0.6 },
      alpha: { start: 0.9, end: 0 },
      blendMode: 'ADD',
    });
    emitter.setDepth(1000 + y + 1); // above fountain sprite

    // Gentle basin ripple — a subtle pulsing circle to imply water movement
    const ripple = this.add.graphics();
    ripple.setDepth(1000 + y - 1);
    this.tweens.add({
      targets: { scale: 0.5 },
      scale: 1.3,
      duration: 2000,
      repeat: -1,
      ease: 'Sine.easeOut',
      onUpdate: (_tween, target) => {
        ripple.clear();
        ripple.lineStyle(1, 0xa8c8e0, 0.3 * (1.3 - target.scale));
        ripple.strokeCircle(x, y + 6, 10 * target.scale);
      },
    });
  }

  private placeEntranceLight(): void {
    // Position at the entrance, just to the SIDE of the stone path
    // Stone path is columns 11-12, lamp goes on column 13 (right side)
    const lampX = 13.5 * TILE;
    const lampY = (MAP_ROWS - 2) * TILE;

    // Draw a simple lamp post (pixel art style) as graphics
    const lamp = this.add.graphics();
    lamp.setDepth(1000 + lampY);
    // Post (dark iron)
    lamp.fillStyle(0x1a1a1a, 1);
    lamp.fillRect(lampX - 2, lampY - 24, 4, 24);
    // Base
    lamp.fillStyle(0x0a0a0a, 1);
    lamp.fillRect(lampX - 5, lampY, 10, 3);
    // Lamp housing (top)
    lamp.fillStyle(0x2a2a2a, 1);
    lamp.fillRect(lampX - 6, lampY - 32, 12, 8);
    // Warm glow bulb
    lamp.fillStyle(0xffd88a, 1);
    lamp.fillRect(lampX - 4, lampY - 30, 8, 4);
    // Top cap
    lamp.fillStyle(0x0a0a0a, 1);
    lamp.fillRect(lampX - 7, lampY - 34, 14, 2);

    // Circular radial glow around the lamp
    const glowRadius = 90;
    const glow = this.add.graphics();
    glow.setDepth(8500); // above world/fog, below twilight overlay
    glow.setBlendMode(Phaser.BlendModes.ADD);

    // Draw concentric circles for a radial falloff effect
    const steps = 20;
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const r = glowRadius * t;
      const alpha = (1 - t) * 0.08; // max ~8% opacity, fades with radius
      glow.fillStyle(0xffb060, alpha);
      glow.fillCircle(lampX, lampY - 28, r);
    }

    // Subtle pulse animation for the bulb brightness
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.9, to: 1.1 },
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Collider so player can't walk through the lamp post
    const z = this.add.zone(lampX, lampY, 10, 8);
    this.physics.add.existing(z, true);
    this.objectColliders.add(z);
  }

  private createFogEffects(): void {
    for (let i = 0; i < 6; i++) {
      const fog = this.add.graphics();
      fog.setDepth(8000);
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

  private createTwilightOverlay(): void {
    // Full-screen overlay for a gentle twilight cast.
    // MULTIPLY + lighter color = subtle darkening and tint.
    const overlay = this.add.graphics();
    overlay.setDepth(9000);
    overlay.setScrollFactor(0);
    overlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

    const draw = () => {
      const { width, height } = this.scale;
      overlay.clear();
      // Lighter blue-purple — less intense than before
      overlay.fillStyle(0x8878a0, 1);
      overlay.fillRect(0, 0, width, height);
    };
    draw();
    this.scale.on('resize', draw);
  }

  private createVignette(): void {
    const vignette = this.add.graphics();
    vignette.setDepth(9010);
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
