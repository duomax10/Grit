/**
 * Level 1 (Graveyard) Asset Descriptions
 *
 * All descriptions and hex codes derived from reference image:
 *   public/assets/1775767237336.png
 *
 * Character sprites are 64x64. Tiles are 32x32.
 * Objects are sized relative to the 32px tile grid.
 *
 * COLOR PALETTE (from reference):
 *   Grass:      #183018, #203820, #284028 (very dark forest green)
 *   Gravel:     #404040, #505050, #686868 (medium-dark gray)
 *   Dirt:       #987048, #986840, #a07048 (muted brown-tan)
 *   Stone:      #505050, #585858, #686868 (medium gray)
 *   Fence:      #000000, #080808, #181818 (near-black iron)
 *   Tree trunk: #805838, #604020 (dark brown)
 *   Canopy:     #386020, #386820, #589030 (medium-dark green)
 *   Water:      #406080, #4070a0 (steel blue)
 */

// Shared style applied to all prompts
const PIXEL_STYLE = 'pixel art, 16-bit retro style';

// When objects need to blend with the grass, use this exact grass color
const GRASS_HEX = '#183018 #203820 #284028';

// PixelLab API settings for tiles (no outline, seamless)
export const TILE_API_SETTINGS = {
  outline: 'lineless',
  shading: 'detailed shading',
  detail: 'highly detailed',
  view: 'high top-down',
};

// PixelLab API settings for objects (selective outline, straight-down view)
export const OBJECT_API_SETTINGS = {
  outline: 'selective outline',
  shading: 'detailed shading',
  detail: 'highly detailed',
  view: 'high top-down',
};

// ===========================================================
// GROUND TILES (32x32, seamless, no outline)
// ===========================================================
export const TILES = {
  grass: {
    description: `very dark forest green grass ground, exact colors ${GRASS_HEX}, short mowed cemetery lawn with subtle blade texture, seamless tileable, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  gravel: {
    description: `dark gray stone gravel pathway, colors #303030 #404040 #505050, small tightly packed crushed pebbles, seamless tileable, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
};

// ===========================================================
// GRAVESTONES / MONUMENTS (32x48, transparent bg)
// 8 variants of increasing elaborateness
// ===========================================================
// Every grass mention in a sprite prompt includes the hex codes
const GRASS_AT_BASE = `small tufts of dark forest green grass ${GRASS_HEX} at the base`;

export const GRAVESTONES = [
  {
    name: 'Simple rounded headstone',
    description: `isolated gravestone object on pure transparent background, simple rounded-top tombstone, dark weathered gray stone #383838 #484848 #585858, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Cross-top headstone',
    description: `isolated gravestone object on pure transparent background, tombstone with small cross on top, dark weathered gray stone #383838 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Tall cross headstone',
    description: `isolated gravestone object on pure transparent background, tall tombstone with large carved cross on face, dark weathered gray stone #383838 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Ornate Victorian headstone',
    description: `isolated gravestone object on pure transparent background, ornate Victorian tombstone with decorative carved arch top, dark weathered gray stone #383838 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Cross-shaped marker',
    description: `isolated cross-shaped stone grave marker on pure transparent background, dark gray stone #383838 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Occult symbol stone',
    description: `isolated gravestone object on pure transparent background, tombstone with mysterious carved symbol or rune on face, dark gray stone #303030 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Small mausoleum crypt',
    description: `isolated stone mausoleum crypt entrance on pure transparent background, dark gray stone #383838 #484848, gothic style with dark iron door, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 48, height: 48 },
  },
  {
    name: 'Short worn headstone',
    description: `isolated short tombstone on pure transparent background, simple rectangular worn stone, dark weathered gray #303030 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },
];

// ===========================================================
// TREES (various sizes, transparent bg)
// ===========================================================
export const TREES = {
  oak: {
    description: `isolated oak tree object on pure transparent background, large tree with full round leafy canopy, VERY DARK canopy colors #182818 #203020 #283820, dark brown trunk #201810 #302818, MUTED and DARK not bright, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 64, height: 64 },
  },
  dead: {
    description: `isolated dead tree object on pure transparent background, leafless gnarled tree, near-black bark #201008 #302018, bare twisted branches, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 48, height: 64 },
  },
  evergreen: {
    description: `isolated pine tree object on pure transparent background, tall dark cypress tree, very dark green needles #182818 #203820 #284028, dark brown trunk, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 48, height: 64 },
  },
};

// ===========================================================
// BUSHES (32x32, transparent bg)
// ===========================================================
export const BUSHES = {
  large: {
    description: `isolated bush object on pure transparent background, dark green rounded hedge bush, very dark green leaves #182818 #203820 #284028, dense foliage, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },
  small: {
    description: `isolated small bush object on pure transparent background, dark green shrub, very dark green #203820 #284028, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },
};

// ===========================================================
// LARGE OBJECTS (transparent bg)
// ===========================================================
export const LARGE_OBJECTS = {
  fountain: {
    description: `isolated stone fountain object on pure transparent background, old stone water fountain with circular basin, dark gray stone #383838 #484848, dark blue water #203048 #304058, ${PIXEL_STYLE}`,
    size: { width: 96, height: 96 },
  },
};

// ===========================================================
// FENCE (transparent bg)
// ===========================================================
export const FENCE = {
  section: {
    description: `isolated fence section on pure transparent background, wrought iron cemetery fence with pointed spear-tip bars, near-black metal #000000 #101010 #181818, vertical bars with horizontal rails, ${PIXEL_STYLE}, front view`,
    size: { width: 32, height: 48 },
  },
  post: {
    description: `isolated fence post on pure transparent background, wrought iron pillar with decorative cap, near-black metal #000000 #101010, ${PIXEL_STYLE}, front view`,
    size: { width: 32, height: 48 },
  },
};

// ===========================================================
// SMALL DETAILS (32x32, transparent bg)
// ===========================================================
export const DETAILS = {
  rocks: {
    description: `isolated small scattered dark gray rocks and pebbles on pure transparent background, gray #303030 #484848, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },
  grassTufts: {
    description: `isolated small tufts of tall dark grass blades on pure transparent background, very dark forest green grass color ${GRASS_HEX}, a few blades sticking up, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },
};
