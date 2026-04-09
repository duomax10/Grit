/**
 * Wang tile autotile system.
 *
 * Loads a 4x4 Wang tileset (16 tiles, 16x16 each) and its metadata,
 * then renders terrain maps with proper corner-based transitions.
 *
 * Each Wang tile is identified by its 4 corners (NW, NE, SW, SE),
 * each being "upper" (path terrain) or "lower" (grass terrain).
 */

export interface WangCorners {
  NW: string;
  NE: string;
  SW: string;
  SE: string;
}

export interface WangTile {
  id: string;
  name: string;
  corners: WangCorners;
  bounding_box: { x: number; y: number; width: number; height: number };
}

export interface WangTilesetData {
  tileset_data: {
    tiles: WangTile[];
    tile_size: { width: number; height: number };
  };
}

/**
 * Builds a lookup map from corner key -> bounding box in the tileset image.
 * Key format: "NW_NE_SW_SE" where each is "upper" or "lower"
 */
export function buildWangLookup(data: WangTilesetData): Map<string, WangTile> {
  const lookup = new Map<string, WangTile>();
  for (const tile of data.tileset_data.tiles) {
    const key = `${tile.corners.NW}_${tile.corners.NE}_${tile.corners.SW}_${tile.corners.SE}`;
    lookup.set(key, tile);
  }
  return lookup;
}

/**
 * Given a terrain grid and a position, determine the Wang tile corners
 * for a 16x16 sub-tile at a specific quadrant of a 32x32 cell.
 *
 * Since Wang tiles are 16x16 and our grid cells are 32x32, each cell
 * is rendered as a 2x2 block of Wang tiles. The quadrant (0-3) determines
 * which sub-tile we're resolving:
 *   0 = top-left, 1 = top-right, 2 = bottom-left, 3 = bottom-right
 *
 * @param grid - 2D terrain grid (0 = grass/lower, 1+ = path/upper)
 * @param cellR - row in the grid
 * @param cellC - column in the grid
 * @param quadrant - 0=TL, 1=TR, 2=BL, 3=BR
 * @param pathType - which terrain value counts as "upper"
 */
export function resolveCorners(
  grid: number[][],
  cellR: number,
  cellC: number,
  quadrant: number,
  pathType: number,
): WangCorners {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const isUpper = (r: number, c: number): string => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return 'lower';
    return grid[r][c] === pathType ? 'upper' : 'lower';
  };

  const here = isUpper(cellR, cellC);
  const up = isUpper(cellR - 1, cellC);
  const down = isUpper(cellR + 1, cellC);
  const left = isUpper(cellR, cellC - 1);
  const right = isUpper(cellR, cellC + 1);
  const upLeft = isUpper(cellR - 1, cellC - 1);
  const upRight = isUpper(cellR - 1, cellC + 1);
  const downLeft = isUpper(cellR + 1, cellC - 1);
  const downRight = isUpper(cellR + 1, cellC + 1);

  // For each quadrant, the corners are determined by this cell and its neighbors
  switch (quadrant) {
    case 0: // Top-left sub-tile
      return {
        NW: (up === 'upper' && left === 'upper' && upLeft === 'upper') ? 'upper' : (up === 'upper' && left === 'upper') ? here : (up !== here || left !== here) ? here : here === 'upper' && upLeft !== 'upper' ? 'lower' : here,
        NE: up === here ? here : here,
        SW: left === here ? here : here,
        SE: here,
      };
    case 1: // Top-right sub-tile
      return {
        NW: up === here ? here : here,
        NE: (up === 'upper' && right === 'upper' && upRight === 'upper') ? 'upper' : (up === 'upper' && right === 'upper') ? here : (up !== here || right !== here) ? here : here === 'upper' && upRight !== 'upper' ? 'lower' : here,
        SW: here,
        SE: right === here ? here : here,
      };
    case 2: // Bottom-left sub-tile
      return {
        NW: left === here ? here : here,
        NE: here,
        SW: (down === 'upper' && left === 'upper' && downLeft === 'upper') ? 'upper' : (down === 'upper' && left === 'upper') ? here : (down !== here || left !== here) ? here : here === 'upper' && downLeft !== 'upper' ? 'lower' : here,
        SE: down === here ? here : here,
      };
    case 3: // Bottom-right sub-tile
      return {
        NW: here,
        NE: right === here ? here : here,
        SW: down === here ? here : here,
        SE: (down === 'upper' && right === 'upper' && downRight === 'upper') ? 'upper' : (down === 'upper' && right === 'upper') ? here : (down !== here || right !== here) ? here : here === 'upper' && downRight !== 'upper' ? 'lower' : here,
      };
    default:
      return { NW: here, NE: here, SW: here, SE: here };
  }
}

/**
 * Simpler approach: for cells that are fully one terrain or adjacent to
 * same terrain on all sides, use the solid tile. For edge cells, compute
 * the transition based on which neighbors differ.
 */
export function resolveSimpleCorners(
  grid: number[][],
  cellR: number,
  cellC: number,
  pathType: number,
): { tl: WangCorners; tr: WangCorners; bl: WangCorners; br: WangCorners } {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  const t = (r: number, c: number): string => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return 'lower';
    return grid[r][c] === pathType ? 'upper' : 'lower';
  };

  const c = t(cellR, cellC);          // center
  const n = t(cellR - 1, cellC);      // north
  const s = t(cellR + 1, cellC);      // south
  const w = t(cellR, cellC - 1);      // west
  const e = t(cellR, cellC + 1);      // east
  const nw = t(cellR - 1, cellC - 1);
  const ne = t(cellR - 1, cellC + 1);
  const sw = t(cellR + 1, cellC - 1);
  const se = t(cellR + 1, cellC + 1);

  // Each 32x32 cell = 2x2 of 16x16 Wang tiles
  // Corner of a Wang sub-tile is determined by adjacent terrain
  return {
    tl: {
      NW: (c === 'upper' && n === 'upper' && w === 'upper' && nw === 'upper') ? 'upper' : (c === 'lower' || n === 'lower' || w === 'lower') ? 'lower' : nw,
      NE: (c === 'upper' && n === 'upper') ? 'upper' : (c === 'lower' || n === 'lower') ? 'lower' : c,
      SW: (c === 'upper' && w === 'upper') ? 'upper' : (c === 'lower' || w === 'lower') ? 'lower' : c,
      SE: c,
    },
    tr: {
      NW: (c === 'upper' && n === 'upper') ? 'upper' : (c === 'lower' || n === 'lower') ? 'lower' : c,
      NE: (c === 'upper' && n === 'upper' && e === 'upper' && ne === 'upper') ? 'upper' : (c === 'lower' || n === 'lower' || e === 'lower') ? 'lower' : ne,
      SW: c,
      SE: (c === 'upper' && e === 'upper') ? 'upper' : (c === 'lower' || e === 'lower') ? 'lower' : c,
    },
    bl: {
      NW: (c === 'upper' && w === 'upper') ? 'upper' : (c === 'lower' || w === 'lower') ? 'lower' : c,
      NE: c,
      SW: (c === 'upper' && s === 'upper' && w === 'upper' && sw === 'upper') ? 'upper' : (c === 'lower' || s === 'lower' || w === 'lower') ? 'lower' : sw,
      SE: (c === 'upper' && s === 'upper') ? 'upper' : (c === 'lower' || s === 'lower') ? 'lower' : c,
    },
    br: {
      NW: c,
      NE: (c === 'upper' && e === 'upper') ? 'upper' : (c === 'lower' || e === 'lower') ? 'lower' : c,
      SW: (c === 'upper' && s === 'upper') ? 'upper' : (c === 'lower' || s === 'lower') ? 'lower' : c,
      SE: (c === 'upper' && s === 'upper' && e === 'upper' && se === 'upper') ? 'upper' : (c === 'lower' || s === 'lower' || e === 'lower') ? 'lower' : se,
    },
  };
}

export function cornersToKey(corners: WangCorners): string {
  return `${corners.NW}_${corners.NE}_${corners.SW}_${corners.SE}`;
}
