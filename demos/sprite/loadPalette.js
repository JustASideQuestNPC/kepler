/**
 * Loads the official-ish Kepler color palette, which is actually just the
 * Sweetie 16 palette by GraphxKid (https://lospec.com/palette-list/sweetie-16).
 */

let WHITE, LIGHT_GRAY, MIDDLE_GRAY, DARK_GRAY, BLACK, RED, ORANGE, YELLOW, LIME,
    GREEN, TEAL, CYAN, BLUE, LIGHT_BLUE, DARK_BLUE, PURPLE;

// used as a callback in loadJSON
function loadPalette(palette) {
  WHITE = palette["white"];
  LIGHT_GRAY = palette["light gray"];
  MIDDLE_GRAY = palette["middle gray"];
  DARK_GRAY = palette["dark gray"];
  BLACK = palette["black"];
  RED = palette["red"];
  ORANGE = palette["orange"];
  YELLOW = palette["yellow"];
  LIME = palette["lime"];
  GREEN = palette["green"];
  TEAL = palette["teal"];
  CYAN = palette["cyan"];
  BLUE = palette["blue"];
  LIGHT_BLUE = palette["light blue"];
  DARK_BLUE = palette["dark blue"];
  PURPLE = palette["purple"];
  TRUE_WHITE = "#ffffffff";
  TRANSPARENT = "#00000000";
}