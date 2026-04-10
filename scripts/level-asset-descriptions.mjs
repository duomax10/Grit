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

// Lighting context — this level is at twilight/night
const LIGHTING = 'twilight night scene, low light, muted shadows, no bright highlights, dark atmospheric lighting';

// When objects need to blend with the grass, use this exact grass color
const GRASS_COLOR = '#183018 #203820 #284028 (very dark forest green, not bright)';

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
    description: `very dark forest green grass ground, exact colors ${GRASS_COLOR}, short mowed cemetery lawn with subtle blade texture, ${LIGHTING}, seamless tileable, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  gravel: {
    description: `dark gray stone gravel pathway, colors #303030 #404040 #505050, small tightly packed crushed pebbles, ${LIGHTING}, seamless tileable, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  dirt: {
    description: `dark brown packed dirt earth path, colors #583828 #684028 #785038, worn compacted earth with small stones, ${LIGHTING}, seamless tileable, ${PIXEL_STYLE}, top-down view`,
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
    description: `simple rounded-top gravestone, dark weathered gray stone #383838 #484848 #585858, small carved text lines, old cemetery, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Cross-top headstone',
    description: `gravestone with small cross on top, dark weathered gray stone #383838 #484848, old cemetery, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Tall cross headstone',
    description: `tall gravestone with large carved cross on face, dark weathered gray stone #383838 #484848, old worn cemetery marker, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Ornate Victorian headstone',
    description: `ornate Victorian gravestone with decorative carved arch top, dark weathered gray stone #383838 #484848, old cemetery, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Cross-shaped marker',
    description: `cross-shaped stone grave marker, dark gray stone #383838 #484848, simple cemetery cross, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Occult symbol stone',
    description: `gravestone with mysterious carved symbol or rune on face, dark gray stone #303030 #484848, eerie old cemetery, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Small mausoleum crypt',
    description: `small stone mausoleum crypt entrance with dark iron door, dark gray stone #383838 #484848, gothic style, dark moss on sides, old cemetery, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 48, height: 48 },
  },
  {
    name: 'Short worn headstone',
    description: `short simple rectangular gravestone, dark weathered gray stone #303030 #484848, old faded text, old cemetery, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 32 },
  },
];

// ===========================================================
// TREES (various sizes, transparent bg)
// ===========================================================
export const TREES = {
  oak: {
    description: `large oak tree with full round leafy canopy in dark green at night, dark canopy colors #284028 #305028 #386028, dark brown trunk #402818 #604020, NO bright green, tree base blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 64, height: 64 },
  },
  dead: {
    description: `dead leafless gnarled tree at night, near-black bark #201008 #302018, bare twisted branches, spooky atmosphere, tree base blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 48, height: 64 },
  },
  evergreen: {
    description: `tall dark pine cypress tree at night, very dark green needles #182818 #203820 #284028, dark brown trunk, tree base blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 48, height: 64 },
  },
};

// ===========================================================
// BUSHES (32x32, transparent bg)
// ===========================================================
export const BUSHES = {
  large: {
    description: `dark green rounded hedge bush at night, very dark green leaves #182818 #203820 #284028, dense foliage, blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 32 },
  },
  small: {
    description: `small dark green bush or shrub at night, very dark green #203820 #284028, blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 32, height: 32 },
  },
};

// ===========================================================
// LARGE OBJECTS (transparent bg)
// ===========================================================
export const LARGE_OBJECTS = {
  fountain: {
    description: `old stone water fountain with circular basin at night, dark gray stone #383838 #484848, dark blue water #203048 #304058, base blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 96, height: 96 },
  },
  caretakerHouse: {
    description: `small old stone and wood cottage house at night, dark walls #303030 #383838, dark shingled roof #201818, small chimney, single warm lit window amber glow #604020, dark wooden door, base blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, 3/4 top-down view`,
    size: { width: 96, height: 96 },
  },
};

// ===========================================================
// FENCE (transparent bg)
// ===========================================================
export const FENCE = {
  section: {
    description: `wrought iron cemetery fence section with pointed spear-tip bars, near-black metal #000000 #101010 #181818, vertical bars with horizontal rails, base blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, front view`,
    size: { width: 32, height: 48 },
  },
  post: {
    description: `wrought iron cemetery fence post, thick near-black metal pillar #000000 #101010 with decorative cap, base blends into dark grass ${GRASS_COLOR}, ${LIGHTING}, ${PIXEL_STYLE}, front view`,
    size: { width: 32, height: 48 },
  },
};

// ===========================================================
// SMALL DETAILS (32x32, transparent bg)
// ===========================================================
export const DETAILS = {
  rocks: {
    description: `small scattered dark gray rocks and pebbles, gray #303030 #484848, transparent background, ${LIGHTING}, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  grassTufts: {
    description: `small tufts of tall dark grass blades, very dark green ${GRASS_COLOR}, a few blades sticking up, transparent background, ${LIGHTING}, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
  fallenLeaves: {
    description: `scattered dark brown fallen dead leaves, dark brown #382818 #483018, autumn dead leaves on ground, transparent background, ${LIGHTING}, ${PIXEL_STYLE}, top-down view`,
    size: { width: 32, height: 32 },
  },
};
