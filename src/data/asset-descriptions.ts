/**
 * Central asset description config for PixelLab generation.
 *
 * Edit these descriptions and re-run the appropriate workflow target
 * to regenerate assets. All prompts are here so the visual style
 * stays consistent across all assets.
 *
 * STYLE GUIDE:
 * - Dark, muted palette. No neon or bright colors.
 * - Arcane adventure feel — gritty but not oppressively dark
 * - This is the first level, so moderate darkness
 * - Grass: dark olive/forest green with some yellowing/browning
 * - Stone: weathered gray with moss
 * - Wood: dark aged timber
 * - Metal: dark wrought iron, rust
 * - Overall mood: dusk/overcast, not pitch black night
 */

// Shared style keywords appended to all prompts
export const GLOBAL_STYLE = 'pixel art, muted dark color palette, no bright or neon colors, low saturation, gritty fantasy style';

// View used for ground tiles (straight down)
export const TILE_VIEW = 'high top-down';

// View used for objects and characters (3/4 perspective)
export const OBJECT_VIEW = 'low top-down';

// =============================================
// WANG TILESET DESCRIPTIONS
// These feed into create_topdown_tileset MCP calls
// =============================================

export const WANG_TILESETS = {
  grassToGravel: {
    lower: `dark olive-green cemetery grass, short mowed, muted forest green with subtle yellow-brown patches, low contrast, ${GLOBAL_STYLE}, ${TILE_VIEW}`,
    upper: `gray-brown gravel pathway, small crushed pebbles, muted gray and tan tones, flat ground texture, worn and old, ${GLOBAL_STYLE}, ${TILE_VIEW}`,
  },
  grassToDirt: {
    lower: `dark olive-green cemetery grass, short mowed, muted forest green with subtle yellow-brown patches, low contrast, ${GLOBAL_STYLE}, ${TILE_VIEW}`,
    upper: `dark brown packed dirt path, worn earth, muted brown tones, flat ground texture, some small pebbles and twigs, ${GLOBAL_STYLE}, ${TILE_VIEW}`,
  },
};

// =============================================
// CHARACTER DESCRIPTIONS
// =============================================

export const CHARACTER = {
  gabeBase: `pixel art character, white male, medium build, short brown messy hair, facial scruff stubble, worn brown leather jacket, blue jeans, dark boots, modern day, ${GLOBAL_STYLE}`,
  gabeWalkAction: 'walk cycle',
};

// =============================================
// MONUMENT / GRAVESTONE DESCRIPTIONS
// Interactive objects the player can inspect
// =============================================

export const MONUMENTS = [
  {
    name: 'Angel statue',
    description: `weathered stone angel statue grave monument, dark gray stone, moss at base, wings folded, praying pose, old cemetery, grass tufts around base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  },
  {
    name: 'Obelisk',
    description: `tall dark stone obelisk grave monument, weathered and cracked, pointed top, old cemetery, moss near base, grass tufts around base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  },
  {
    name: 'Celtic cross',
    description: `ornate celtic cross gravestone, dark weathered stone, moss covered base, old cemetery monument, grass tufts at bottom, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  },
  {
    name: 'Ornate headstone',
    description: `large ornate Victorian headstone, dark weathered stone, carved decorations, old graveyard, grass tufts at base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  },
  {
    name: 'Stone crypt',
    description: `small stone crypt mausoleum entrance, dark stone, iron door with rust, gothic style, old cemetery, grass and weeds at base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  },
];

// =============================================
// FLAT GRAVE MARKERS (decorative, non-interactive)
// =============================================

export const FLAT_GRAVE = {
  description: `small flat rectangular stone grave marker flush with ground, dark gray weathered stone, subtle text, grass growing around edges, top-down view, ${GLOBAL_STYLE}, ${TILE_VIEW}`,
};

// =============================================
// TREES
// =============================================

export const TREES = {
  oak: `large old oak tree, thick dark trunk, full canopy of dark green leaves, some yellowing leaves, casting shadow, grass tufts at trunk base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  evergreen: `tall dark cypress or pine tree, narrow conical shape, very dark green needles, old cemetery tree, grass at base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  dead: `dead leafless gnarled tree, dark bark, bare twisted branches, spooky atmosphere, grass and weeds at base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
};

// =============================================
// ENVIRONMENT OBJECTS
// =============================================

export const ENVIRONMENT = {
  fountain: `old weathered stone water fountain, circular basin, dark stone with moss and aging, old cemetery garden feature, grass around base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  bench: `old dark wood and wrought iron park bench, weathered and worn, cemetery seating, grass around legs, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  bush: `dark green rounded hedge bush, muted color, some dead patches, old cemetery landscaping, blending into grass at base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  flowerArrangement: `small wilting flower bouquet on ground, muted colors, memorial tribute, sitting on grass, ${GLOBAL_STYLE}, ${TILE_VIEW}`,
  fence: `wrought iron cemetery fence section, dark metal pointed bars, rust spots and aging, old iron fence, grass at base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
  fencePost: `wrought iron cemetery fence post, dark metal thick pillar with decorative cap, rust and aging, grass at base, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
};

// =============================================
// BUILDINGS
// =============================================

export const BUILDINGS = {
  caretakerHouse: `old stone groundskeeper cottage, dark stone walls, worn shingled roof, single dim warm light in window, dark wooden door, small chimney, overgrown with some ivy, old cemetery building, grass and weeds around foundation, ${GLOBAL_STYLE}, ${OBJECT_VIEW}`,
};

// =============================================
// PIXELLAB API STYLE SETTINGS
// =============================================

// For characters and objects (outline helps them stand out)
export const SPRITE_STYLE = {
  outline: 'selective outline' as const,
  shading: 'detailed shading' as const,
  detail: 'highly detailed' as const,
  view: OBJECT_VIEW as 'low top-down',
};

// For ground tiles (NO outline — must tile seamlessly)
export const TILE_STYLE = {
  outline: 'lineless' as const,
  shading: 'detailed shading' as const,
  detail: 'highly detailed' as const,
  view: TILE_VIEW as 'high top-down',
};
