/**
 * Class that manages animations for sprites.
 * @class
 */
class KSprite {
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
  static spriteData = {};

  /**
   * All supported extensions for image files. **(TODO: Figure out what other
   * extensions are supported!)**
   * @private
   * @static
   * @type {string[]}
   */
  static #SUPPORTED_FILE_TYPES = ["png", "jpg"]

  /**
   * Loads an array of images or animation data files into the internal cache,
   * and breaks up spritesheets into objects that can be used by KSprite objects
   * for displaying animations. This should be called once in your sketch's
   * `preload` function with every image/animation you plan to use.
   * @static
   * @async
   * @method
   * @param {string[]} files A list of all images (for sprites that are a single
   * image) and animation data files (for sprites that have one or more
   * animations) to preload.
   */
  static async preload(files) {
    console.log(`Preloading ${files.length} sprites...`);
    let startTime = window.performance.now();

    for (let path of files) {
      // the file name minus the path
      let filename = path.split("/").pop();
      let extension = path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2);
      filename = filename.replace(/\.[^/.]+$/, ""); // more runes
      console.log(filename);

      // delegate to the correct loader (or throw an error) - the loader methods
      // are defined as async for technical reasons so they all need to be
      // awaited
      if (this.#SUPPORTED_FILE_TYPES.includes(extension)) {
        this.spriteData[filename] = await this.#loadImageSprite(path)
      }
    }

    console.log(`Sprite loading completed in ` +
        `${window.performance.now() - startTime} ms`);
  }
  

  /**
   * Creates data object for a sprite with a single image.
   * @private
   * @static
   * @async
   * @param {string} path
   * @returns {object}
   */
  static async #loadImageSprite(path) {
    return await loadImage(path);
  }
}