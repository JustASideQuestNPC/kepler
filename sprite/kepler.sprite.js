// this is used to hack in private constructors for the internal sprite classes
// we can't define it as a private member because the internal classes can't
// access access them, so we define a temporary one here, give KSprite and the
// internal classes copies of it, and then delete it when we're done so that no
// one can access it externally.
let tempCtorLock = Symbol();

/**
 * Class that manages animations for sprites.
 * @class
 */
class KSprite {
  static #CONSTRUCTOR_KEY = tempCtorLock;

  /**
   * If `true`, prints out a bunch of extra debug info while preloading sprites.
   * This will *probably* be unavailable in the minified version (assuming a
   * minified version exists when you're reading this).
   * @static
   * @type {boolean}
   */
  static VERBOSE_LOGGING = true;

  /**
   * Internal cache that holds data for sprites to make creating new KSprite
   * instances (hopefully) a lot faster.
   * @private
   * @static
   */
  static #spriteData = {};

  /**
   * All supported extensions for image files. **(TODO: Figure out what other
   * extensions are supported!)**
   * @private
   * @static
   * @type {string[]}
   */
  static #SUPPORTED_FILE_TYPES = ["png", "jpg"]

  /**
   * Returns an image-only sprite with no animations. The image *must* have been
   * loaded into the cache using `KSprite.preload()`!.
   * @static
   * @method
   * @param {string} name The name of the sprite's cache entry. If you didn't
   *    specify this when preloading it, it's the name of the image file, minus
   *    the extension and the rest of the path (for example, a sprite with an
   *    image at "assets/sprite/my-sprite.png" would have an entry named
   *    "my-sprite").
   * @returns {KSprite.ImageSprite}
   */
  static makeImageSprite(name) {
    if (!KSprite.#spriteData.hasOwnProperty(name)) {
      throw new Error(`The sprite "${name}" does not exist! (If it should, ` +
          `make sure you've loaded it with KSprite.preload() before calling ` +
          "this method)");
    }
    if (KSprite.#spriteData[name].animated) {
      throw new Error(`The sprite "${name}" is animated - use ` +
          "KSprite.makeAnimatedSprite() to create it instead.");
    }

    return new KSprite.ImageSprite(KSprite.#CONSTRUCTOR_KEY,
        KSprite.#spriteData[name]);
  }

  /**
   * Loads an array of images or animation data files into the internal cache,
   * and breaks up spritesheets into objects that can be used by KSprite objects
   * for displaying animations. This should be called once in your sketch's
   * `preload` function with every image/animation you plan to use.
   * @static
   * @async
   * @method
   * @param {any[]} files A list of the paths to each image (for sprites that
   * are a single image) or .json data file (for sprites that have one or more
   * animations) to preload. Objects can be used instead of strings to set other
   * data such as the sprite's name, display anchor, rotation, etc.
   */
  static async preload(files) {
    console.log(`Preloading ${files.length} sprite(s)...`);
    let startTime = window.performance.now();

    for (let entry of files) {
      let currentTime = window.performance.now();

      let spriteName, extension;

      // if the entry is just a file path, convert it to an argument object that
      // can be passed to a loader
      let args;
      if (typeof entry === "string") {
        if (KSprite.VERBOSE_LOGGING) {
          console.log("┃ Loading " + `%c${entry}...`, "color:#30D6FF");
          console.log("┃ ┃ Creating config object");
        }

        args = {path: entry};
        // the file name minus the path
        spriteName = entry.split("/").pop();
        // remove the file extension using the arcane runes (read: regex)
        spriteName = spriteName.replace(/\.[^/.]+$/, "");

        extension = entry.slice((entry.lastIndexOf(".") - 1 >>> 0) + 2);
      }
      else {
        if (KSprite.VERBOSE_LOGGING) {
          console.log(`┃ Loading ${entry.path}...`);
          console.log("┃ ┃ Parsing config object");
        }
        args = entry;
        if (entry.hasOwnProperty("name")) spriteName = entry.name;
        else {
          // the file name minus the path
          spriteName = entry.path.split("/").pop();
          // remove the file extension using the arcane runes (read: regex)
          spriteName = spriteName.replace(/\.[^/.]+$/, "");
        }

        extension = entry.path.slice(
            (entry.path.lastIndexOf(".") - 1 >>> 0) + 2);
      }
      if (KSprite.VERBOSE_LOGGING) {
        console.log("┃ ┃ Creating cache entry " + `%c"${spriteName}"`,
            "color:#30D6FF");
      }

      if (KSprite.#spriteData.hasOwnProperty(spriteName)) {
        console.warn(`The sprite "${spriteName}" already exists, did you ` +
            "mean to overwrite it?");
      }

      // delegate to the correct loader (or throw an error) - the loader methods
      // are defined as async for technical reasons so they all need to be
      // awaited
      if (KSprite.#SUPPORTED_FILE_TYPES.includes(extension)) {
        KSprite.#spriteData[spriteName] = await KSprite.#loadImageSprite(args);
      }
      else {
        throw new Error(`The file "${args.path}" is an invalid file type! ` +
            `(Supported file types are [json] for animated sprites, and ` +
            `[${KSprite.#SUPPORTED_FILE_TYPES}] for image sprites)`);
      }

      if (KSprite.VERBOSE_LOGGING) {
        console.log("┃ ┗ " + "%cSprite loaded in " +
            `${window.performance.now() - currentTime} ms`, "color:#23D18B");
      }
    }

    console.log("┗ " +"%cSprite loading completed in " +
        `${window.performance.now() - startTime} ms`, "color:#23D18B");
  }
  
  /**
   * Creates a data object for a sprite with a single image.
   * @private
   * @static
   * @async
   * @param {Object} args
   * @param {string} args.path The path to the image.
   * @param {number} [args.x] X coordinate of the sprite. The default position
   *    of the sprite is (0, 0).
   * @param {number} [args.y] Y coordinate of the sprite. The default position
   *    of the sprite is (0, 0).
   * @param {("left"|"center"|"right"|number)} [args.anchorX] X coordinate or
   *    alignment mode of the sprite's anchor, which determines what point it
   *    rotates around. The default anchor is the center of the sprite.
   * @param {("left"|"center"|"right"|number)} [args.anchorY] Y coordinate or
   *    alignment mode of the sprite's anchor, which determines what point it
   *    rotates around. The default anchor is the center of the sprite.
   * @param {number} [args.rotation] Initial rotation of the sprite.
   * @param {number} [scaleX] Relative scale in the x direction. Negative values
   *    mirror the sprite horizontally.
   * @param {number} [scaleY] Relative scale in the y direction. Negative values
   *    mirror the sprite vertically.
   * @param {number} [width] Width of the sprite in pixels. Overrides scaleX if
   *    both values are set.
   * @param {number} [height] height of the sprite in pixels. Overrides scaleY
   *    if both values are set.
   */
  static async #loadImageSprite({path, x=0, y=0, anchorX="center",
      anchorY="center", rotation=0, scaleX=0, scaleY=0, width=null,
      height=null}) {

    let data = {animated:false};

    if (KSprite.VERBOSE_LOGGING) console.log("┃ ┃ Loading image from file");

    // setting data.image in the success callback somehow makes the error even
    // messier if the image doesn't exist, but we still need to pass one if we
    // want to use the failure callback
    data.image = await loadImage(path, ()=>{},
      (event) => {
        console.error(`The image at "${path}" does not exist!`, event);
      }
    );

    if (KSprite.VERBOSE_LOGGING) console.log("┃ ┃ Calculating display anchor");
    data.anchor = [];
    if (typeof anchorX === "number") {
      data.anchor[0] = anchorX;
    }
    else if (anchorX === "left") {
      data.anchor[0] = 0;
    }
    else if (anchorX === "right") {
      data.anchor[0] = data.image.width;
    }
    else if (anchorX === "center") {
      data.anchor[0] = data.image.width / 2;
    }
    else {
      throw new Error("Invalid horizontal anchor for sprite (Expected " + 
          `"left", "center", "right", or a number, recieved "${anchorX}")`);
    }

    if (typeof anchorY === "number") {
      data.anchor[0] = anchorY;
    }
    else if (anchorY === "left") {
      data.anchor[0] = 0;
    }
    else if (anchorY === "right") {
      data.anchor[0] = data.image.height;
    }
    else if (anchorY === "center") {
      data.anchor[0] = data.image.height / 2;
    }
    else {
      throw new Error("Invalid vertical anchor for sprite (Expected " + 
          `"left", "center", "right", or a number, recieved "${anchorY}")`);
    }
    
    if (KSprite.VERBOSE_LOGGING) console.log("┃ ┃ Calculating display size");

    data.sourceSize = [data.image.width, data.image.height];
    data.scale = [scaleX, scaleY];
    data.size = [];
    if (width != null) {
      data.size[0] = width;
    }
    else {
      data.size[0] = data.sourceSize[0] * data.scale[0];
    }

    if (height != null) {
      data.size[1] = height;
    }
    else {
      data.size[1] = data.sourceSize[1] * data.scale[1];
    }

    if (KSprite.VERBOSE_LOGGING) console.log("┃ ┃ Setting miscellaneous data");
    data.position = [x, y];
    data.rotation = rotation;

    return data;
  }
}

/**
 * Internal-ish class for a sprite that is a single image without animations.
 * @static
 * @class
 */
KSprite.ImageSprite = class {
  static #CONSTRUCTOR_LOCK = tempCtorLock;
  constructor(key, data) {
    if (key !== KSprite.ImageSprite.#CONSTRUCTOR_LOCK) {
      throw new Error("ImageSprites cannot be instantiated directly - use " +
          "KSprite.makeImageSprite() instead!");
    }
  }

  test() {
    console.log("this is a test");
  }
};

// delete the external reference to the ctor key to make it private
tempCtorLock = null;