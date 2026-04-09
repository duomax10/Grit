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

// PixelLab API settings for tiles (no outline, seamless)
export const TILE_API_SETTINGS = {
  outline: 'lineless',
  shading: 'detailed shading',
  detail: 'highly detailed',
  view: 'high top-down',
};

// PixelLab API settings for objects (selective outline for clarity)
export const OBJECT_API_SETTINGS = {
  outline: 'selective outline',
  shading: 'detailed shading',
  detail: 'highly detailed',
  view: 'low top-down',
};

// ===========================================================
// GROUND TILES (32x32, seamless, no outline)
// ===========================================================
export const TILES = {
  grass: {
    description: `dark forest green grass ground, colors #183018 #203820 #284028, short mowed cemetery lawn with subtle blade texture, seamless tileable, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  gravel: {
    description: `gray stone gravel pathway, colors #404040 #505050 #686868, small tightly packed crushed pebbles, seamless tileable, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  dirt: {
    description: `brown-tan packed dirt earth path, colors #987048 #986840 #a07048, worn compacted earth with small stones, seamless tileable, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
};

// ===========================================================
// GRAVESTONES / MONUMENTS (32x48, transparent bg)
// 8 variants of increasing elaborateness
// ===========================================================
export const GRAVESTONES = [
  {
    name: 'Simple rounded headstone',
    description: `simple rounded-top gravestone, dark gray stone colors #505050 #585858 #686868, small carved text lines, old cemetery, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Cross-top headstone',
    description: `gravestone with small cross on top, dark gray stone colors #505050 #686868, weathered surface, old cemetery, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Tall cross headstone',
    description: `tall gravestone with large carved cross on face, dark gray stone #505050 #585858, old worn cemetery marker, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Ornate Victorian headstone',
    description: `ornate Victorian gravestone with decorative carved arch top, dark gray stone #585858 #686868, old cemetery, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Cross-shaped marker',
    description: `cross-shaped stone grave marker, dark gray stone #505050 #606060, simple cemetery cross, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Occult symbol stone',
    description: `gravestone with mysterious carved symbol or rune on face, dark gray stone #484848 #585858, eerie old cemetery, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Small mausoleum crypt',
    description: `small stone mausoleum crypt entrance with dark iron door, gray stone #505050 #686868, gothic style, green moss on sides, old cemetery, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 48, height: 48 },
  },
  {
    name: 'Short worn headstone',
    description: `short simple rectangular gravestone, dark gray worn stone #484848 #585858, old faded text, old cemetery, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 32 },
  },
];

// ===========================================================
// TREES (various sizes, transparent bg)
// ===========================================================
export const TREES = {
  oak: {
    description: `large green oak tree with full round leafy canopy, canopy colors #386020 #386820 #589030, thick brown trunk #805838, green bushes/grass at base, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 64, height: 64 },
  },
  dead: {
    description: `dead leafless gnarled tree, dark brown bark #604020 #805838, bare twisted branches against sky, spooky atmosphere, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 48, height: 64 },
  },
  evergreen: {
    description: `tall dark green pine/cypress tree, narrow conical shape, dark green needles #203828 #284030, brown trunk, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 48, height: 64 },
  },
};

// ===========================================================
// BUSHES (32x32, transparent bg)
// ===========================================================
export const BUSHES = {
  large: {
    description: `green rounded hedge bush, dark green leaves #284028 #386020, dense foliage, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 32 },
  },
  small: {
    description: `small green bush or shrub, dark green #284028 #386028, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 32 },
  },
};

// ===========================================================
// LARGE OBJECTS (transparent bg)
// ===========================================================
export const LARGE_OBJECTS = {
  fountain: {
    description: `old stone water fountain with circular basin, dark gray stone #484848 #585858, blue water #406080, water flowing, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 96, height: 96 },
  },
  caretakerHouse: {
    description: `small old stone and wood cottage house, dark walls #383838 #484848, dark shingled roof, chimney, warm lit window amber glow, wooden door, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 96, height: 96 },
  },
};

// ===========================================================
// FENCE (transparent bg)
// ===========================================================
export const FENCE = {
  section: {
    description: `wrought iron cemetery fence section with pointed spear-tip bars, near-black metal #000000 #181818, vertical bars with horizontal rails, ${PIXEL_STYLE}, front view`,
    size: { width: 32, height: 48 },
  },
  post: {
    description: `wrought iron cemetery fence post, thick near-black metal pillar #000000 #181818 with decorative cap on top, ${PIXEL_STYLE}, front view`,
    size: { width: 32, height: 48 },
  },
};

// ===========================================================
// SMALL DETAILS (32x32, transparent bg)
// ===========================================================
export const DETAILS = {
  rocks: {
    description: `small scattered gray rocks and pebbles, gray #404040 #585858, on transparent background, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  grassTufts: {
    description: `small tufts of tall grass blades, dark green #284028 #386020, a few blades sticking up, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  fallenLeaves: {
    description: `scattered brown fallen dead leaves, brown #806040 #986848, autumn dead leaves on ground, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
};
