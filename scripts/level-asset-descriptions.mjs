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
// NOTE: grass.png is user-supplied and should NOT be regenerated
// ===========================================================
export const TILES = {
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
  // --- Original 8 ---
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

  // --- 10 new variants ---
  // Larger / taller
  {
    name: 'Tall obelisk',
    description: `isolated stone obelisk grave monument on pure transparent background, tall pointed four-sided pillar tapering to a point, dark weathered gray stone #383838 #484848 #585858, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 64 },
  },
  {
    name: 'Angel statue',
    description: `isolated stone angel statue grave monument on pure transparent background, standing weeping angel with wings folded, dark weathered gray stone #383838 #484848 #585858, detailed carved angel figure, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 48, height: 64 },
  },
  {
    name: 'Large family plot stone',
    description: `isolated large family plot gravestone on pure transparent background, wide rectangular monument with multiple carved names, dark weathered gray stone #383838 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 48, height: 48 },
  },
  {
    name: 'Ornate tall headstone with urn',
    description: `isolated tall ornate gravestone with decorative stone urn on top, dark weathered gray stone #383838 #484848 #585858, Victorian style, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 64 },
  },

  // Smaller / flat
  {
    name: 'Small flat marker',
    description: `isolated small flat rectangular grave marker on pure transparent background, set low to the ground, dark weathered gray stone #383838 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },
  {
    name: 'Tiny child grave marker',
    description: `isolated very small child's grave marker on pure transparent background, tiny rounded stone with simple carving, dark weathered gray stone #383838 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },
  {
    name: 'Worn stone slab',
    description: `isolated old flat stone grave slab on pure transparent background, weather-worn smooth rectangular stone, dark weathered gray #303030 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },

  // Cracked / broken (3)
  {
    name: 'Cracked leaning headstone',
    description: `isolated cracked and leaning gravestone on pure transparent background, tombstone tilted to one side with visible cracks running across its surface, dark weathered gray stone #383838 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 48 },
  },
  {
    name: 'Broken toppled gravestone',
    description: `isolated broken gravestone on pure transparent background, stone cracked and fallen partially over, broken top lying nearby, dark weathered gray stone #303030 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 48, height: 32 },
  },
  {
    name: 'Shattered gravestone stump',
    description: `isolated shattered gravestone stump on pure transparent background, only the broken base of a tombstone remaining, jagged broken edge, dark weathered gray stone #303030 #484848, ${GRASS_AT_BASE}, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
  },
];

// ===========================================================
// TREES (various sizes, transparent bg)
// ===========================================================
// Small grass tufts at tree base for natural blending.
// Must match the grass tile hex codes exactly.
const TREE_BASE = `small uneven tufts of grass blades scattered around the base (very dark forest green #183018 #203820 #284028), irregular organic shape at the bottom that fades into grass, NOT a round circle base, tufts stick out irregularly in different directions`;

export const TREES = {
  oak: {
    description: `isolated oak tree object on pure transparent background, large tree with full round leafy canopy, highly detailed trunk bark texture, VERY DARK canopy colors #182818 #203020 #283820, dark brown trunk #201810 #302818, MUTED and DARK not bright, ${TREE_BASE}, ${PIXEL_STYLE}`,
    size: { width: 112, height: 112 },
  },
  dead: {
    description: `isolated dead tree object on pure transparent background, leafless gnarled tree, detailed twisted bark texture, near-black bark #201008 #302018, bare twisted branches, ${TREE_BASE}, ${PIXEL_STYLE}`,
    size: { width: 80, height: 112 },
  },
  evergreen: {
    description: `isolated pine tree object on pure transparent background, tall dark cypress tree, detailed needle texture, very dark green needles #182818 #203820 #284028, dark brown trunk, ${TREE_BASE}, ${PIXEL_STYLE}`,
    size: { width: 80, height: 112 },
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
    // Horizontal fence section — used on top/bottom edges of the cemetery
    description: `isolated fence section on pure transparent background, wrought iron cemetery fence with pointed spear-tip bars pointing up, near-black metal #000000 #101010 #181818, vertical bars with horizontal rails, ${PIXEL_STYLE}, front view, no posts`,
    size: { width: 32, height: 48 },
  },
  vertical: {
    // Vertical fence section for left/right cemetery edges.
    // Top-down perspective: the fence runs north-to-south along the
    // side of the map, so from above you only see the narrow top edge
    // with spike tips. It should look like a thin column of spike
    // points running vertically down the sprite, not a side view of
    // a tall fence.
    description: `top-down view of a wrought iron fence running north to south, sprite is a thin narrow vertical strip showing only the top of the fence as seen from directly above, column of 4 small pointed iron spear tips running down the middle of the sprite, near-black metal #000000 #101010 #181818, the rest is pure transparent background, isolated fence top row, no ground, no side view, bird's eye view, ${PIXEL_STYLE}`,
    size: { width: 32, height: 32 },
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
