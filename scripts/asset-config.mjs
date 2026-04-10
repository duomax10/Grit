/**
 * Central asset description config for PixelLab generation.
 *
 * Edit these descriptions and re-run the appropriate workflow target.
 * All prompts are here so the visual style stays consistent.
 *
 * STYLE GUIDE:
 * - Dark, muted palette. No neon or bright colors.
 * - Arcane adventure feel — gritty but not oppressively dark
 * - First level, so moderate darkness (dusk/overcast, not pitch black)
 * - Grass: dark olive/forest green with some yellowing/browning
 * - Stone: weathered dark gray with moss
 * - Wood: dark aged timber
 * - Metal: dark wrought iron with rust
 * - "Grit" is the name of the game
 */

const GLOBAL = 'pixel art, muted dark color palette, no bright or neon colors, low saturation, gritty fantasy style';
const TILE_VIEW = 'high top-down';
const OBJ_VIEW = 'low top-down';

// =============================================
// WANG TILESETS
// =============================================
export const WANG_TILESETS = [
  {
    name: 'grass-to-gravel',
    lower_description: `dark olive-green cemetery grass, short and slightly unkempt, muted forest green with subtle yellow-brown patches and bare spots, low contrast between shades, ${GLOBAL}, ${TILE_VIEW}`,
    upper_description: `gray-brown gravel pathway, small crushed pebbles, muted gray and tan tones, flat worn ground texture, old and weathered, ${GLOBAL}, ${TILE_VIEW}`,
  },
  {
    name: 'grass-to-dirt',
    lower_description: `dark olive-green cemetery grass, short and slightly unkempt, muted forest green with subtle yellow-brown patches and bare spots, low contrast between shades, ${GLOBAL}, ${TILE_VIEW}`,
    upper_description: `dark brown packed dirt path, worn compacted earth, muted brown tones, flat ground texture, some small stones and dried grass, ${GLOBAL}, ${TILE_VIEW}`,
  },
];

// =============================================
// CHARACTER
// =============================================
export const CHARACTER = {
  description: `pixel art character, white male, medium build, short brown messy hair, facial scruff stubble, worn brown leather jacket, blue jeans, dark boots, modern day, ${GLOBAL}`,
  walkAction: 'walk cycle',
};

// =============================================
// MONUMENTS (interactive gravestones)
// =============================================
export const MONUMENTS = [
  {
    name: 'Angel statue',
    description: `weathered stone angel statue grave monument, dark gray stone with age stains, moss at base, wings folded, praying pose, old cemetery, dark olive grass tufts growing around base, ${GLOBAL}, ${OBJ_VIEW}`,
  },
  {
    name: 'Obelisk',
    description: `tall dark stone obelisk grave monument, weathered and cracked surface, pointed top, old cemetery, dark moss near base, olive grass tufts around base, ${GLOBAL}, ${OBJ_VIEW}`,
  },
  {
    name: 'Celtic cross',
    description: `ornate celtic cross gravestone, dark weathered stone, moss and lichen on surface, old cemetery monument, dark olive grass tufts at bottom edge, ${GLOBAL}, ${OBJ_VIEW}`,
  },
  {
    name: 'Ornate headstone',
    description: `large ornate Victorian headstone, dark weathered gray stone, faded carved decorations, old graveyard, dark olive grass tufts at base, ${GLOBAL}, ${OBJ_VIEW}`,
  },
  {
    name: 'Stone crypt',
    description: `small stone crypt mausoleum entrance, dark aged stone, iron door with heavy rust, gothic style, old cemetery, grass and weeds creeping at base, ${GLOBAL}, ${OBJ_VIEW}`,
  },
];

// =============================================
// FLAT GRAVE MARKERS (decorative)
// =============================================
export const FLAT_GRAVE = `small flat rectangular stone grave marker flush with ground, dark gray weathered stone, subtle worn text, dark olive grass growing around edges and partially covering, ${GLOBAL}, ${TILE_VIEW}`;

// =============================================
// TREES
// =============================================
export const TREES = {
  oak: {
    description: `large old oak tree, thick dark trunk, full canopy of dark muted green leaves with some yellowing, casting shadow on ground, dark olive grass tufts at trunk base, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 64, height: 64 },
  },
  evergreen: {
    description: `tall dark cypress or pine tree, narrow conical shape, very dark green needles, old cemetery tree, dark olive grass and fallen needles at base, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 32, height: 64 },
  },
  dead: {
    description: `dead leafless gnarled tree, dark bark nearly black, bare twisted branches, ominous atmosphere, dark olive grass and dead leaves at base, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 48, height: 64 },
  },
};

// =============================================
// ENVIRONMENT OBJECTS
// =============================================
export const ENVIRONMENT = {
  fountain: {
    description: `old weathered stone water fountain, circular basin, dark stone with heavy moss and aging patina, stagnant water, old cemetery garden feature, dark olive grass around base, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 64, height: 64 },
  },
  bench: {
    description: `old dark wood and wrought iron park bench, weathered and worn, cemetery seating, dark olive grass around legs, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 48, height: 32 },
  },
  bush: {
    description: `dark green rounded hedge bush, muted deep green, some brown dead patches, old cemetery landscaping, blending into dark olive grass at base, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 32, height: 32 },
  },
  flowerArrangement: {
    description: `small wilting flower bouquet on ground, muted faded colors, memorial tribute resting on dark olive grass, ${GLOBAL}, ${TILE_VIEW}`,
    size: { width: 32, height: 32 },
  },
  fence: {
    description: `wrought iron cemetery fence section, dark metal pointed bars, rust spots and heavy aging patina, old iron fence, dark olive grass tufts at base, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 32, height: 32 },
  },
  fencePost: {
    description: `wrought iron cemetery fence post pillar, dark metal with decorative cap, rust and aging, dark olive grass at base, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 32, height: 32 },
  },
};

// =============================================
// INVENTORY ITEMS
// Small icons shown in the inventory panel. Top-down / flat-lay
// composition, transparent background, tight framing so they read
// well at ~32px.
// =============================================
export const ITEMS = [
  {
    name: 'Spade',
    file: 'item-spade',
    description: `small folding hand spade tool, dark wood T-shaped handle, weathered steel blade, diagonal angle across frame, centered on transparent background, single isolated item flat lay, inventory icon, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 32, height: 32 },
  },
  {
    name: 'Sample Container',
    file: 'item-container',
    description: `small glass sample vial with cork stopper, partially filled with dark soil or liquid, centered on transparent background, single isolated item flat lay, inventory icon, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 32, height: 32 },
  },
];

// =============================================
// BUILDINGS
// =============================================
export const BUILDINGS = {
  caretakerHouse: {
    description: `old stone groundskeeper cottage, dark stone walls stained with age, worn dark shingled roof, single dim warm amber light in window, dark wooden door, small chimney, partially overgrown with ivy, old cemetery building, dark olive grass and weeds around foundation, ${GLOBAL}, ${OBJ_VIEW}`,
    size: { width: 96, height: 96 },
  },
};

// =============================================
// PIXELLAB API STYLE SETTINGS
// =============================================
export const SPRITE_STYLE = {
  outline: 'selective outline',
  shading: 'detailed shading',
  detail: 'highly detailed',
  view: OBJ_VIEW,
};

export const TILE_STYLE = {
  outline: 'lineless',
  shading: 'detailed shading',
  detail: 'highly detailed',
  view: TILE_VIEW,
};
