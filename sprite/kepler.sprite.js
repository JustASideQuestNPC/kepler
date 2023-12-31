// add sprite stuff to the Kepler namespace using a "self-executing anonymous
// function" and associated black magic
(function(Kepler) {
  // used to hack in private constructors for the sprite
  let SPRITE_CONSTRUCTOR_LOCK = Symbol();

  /**
   * Class that manages sprite loading.
   * @class
   */
  Kepler.SpriteLoader = class {

    /**
     * Internal cache that holds data for sprites to make creating new KSprite
     * instances (hopefully) a lot faster.
     * @private
     */
    #spriteData = {};

    /**
     * All supported extensions for image files. **(TODO: Figure out what other
     * extensions are supported!)**
     * @private
     * @static
     * @type {string[]}
     */
    static #SUPPORTED_FILE_TYPES = ["png", "jpg"]

    /**
     * Sketch object to create sprites with and load images.
     * @private
     * @type {Window|p5}
     */
    #sketch;

    /**
     * Creates a new KSpriteLoader.
     * @constructor
     * @param {Window|p5} [sketch] The sketch object to use for creating sprites
     *    and loading images. If you're running things in global mode, don't pass
     *    anything here (if you want to pass something anyway, pass `window`). 
     */
    constructor(sketch=window) {
      this.#sketch = sketch;
    }

    /**
     * Returns an image-only sprite with no animations. The image *must* have
     * been loaded into the cache using `preload()`!.
     * @method
     * @param {string} name The name of the sprite's cache entry. If you didn't
     *    specify this when preloading it, it's the name of the image file,
     *    minus the extension and the rest of the path (for example, a sprite
     *    with an image at "assets/sprite/my-sprite.png" would have an entry
     *    named "my-sprite").
     * @returns {KSpriteLoader.ImageSprite}
     */
    makeImageSprite(name) {
      if (!this.#spriteData.hasOwnProperty(name)) {
        throw new Error(`The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with KSprite.preload() before ` +
            `calling this method)`);
      }
      if (this.#spriteData[name].animated) {
        throw new Error(`The sprite "${name}" is animated - use ` +
            `KSprite.makeAnimatedSprite() to create it instead.`);
      }

      return new Kepler.ImageSprite(SPRITE_CONSTRUCTOR_LOCK,
          this.#spriteData[name]);
    }

    /**
     * Loads an array of images or animation data files into the internal cache,
     * and breaks up spritesheets into objects that can be used for displaying
     * animations. This should be called once in your sketch's `preload`
     * function with every image/animation you plan to use.
     * @async
     * @method
     * @param {any[]} files A list of the paths to each image (for sprites that
     * are a single image) or .json data file (for sprites that have one or more
     * animations) to preload. Objects can be used instead of strings to set
     * other data such as the sprite's name, display anchor, rotation, etc.
     */
    async preload(files) {
      for (let entry of files) {

        let spriteName, extension;

        // if the entry is just a file path, convert it to an argument object
        // that can be passed to a loader
        let args;
        if (typeof entry === "string") {

          args = {path: entry};
          // the file name minus the path
          spriteName = entry.split("/").pop();
          // remove the file extension using the arcane runes (read: regex)
          spriteName = spriteName.replace(/\.[^/.]+$/, "");

          extension = entry.slice((entry.lastIndexOf(".") - 1 >>> 0) + 2);
        }
        else {
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

        // delegate to the correct loader (or throw an error) - the loader
        // methods are defined as async for technical reasons so they all need
        // to be awaited
        if (Kepler.SpriteLoader.#SUPPORTED_FILE_TYPES.includes(extension)) {
          this.#spriteData[spriteName] = await this.#loadImageSprite(args);
        }
        else {
          throw new Error(`The file "${args.path}" is an invalid file type! ` +
              `(Supported file types are [json] for animated sprites, and ` +
              `[${Kepler.SpriteLoader.#SUPPORTED_FILE_TYPES}] for image ` +
              `sprites)`);
        }
      }
    }
    
    /**
     * Creates a data object for a sprite with a single image.
     * @private
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
     * @param {number} [args.scaleX] Relative scale in the x direction. Negative
     *    values mirror the sprite horizontally.
     * @param {number} [args.scaleY] Relative scale in the y direction. Negative
     *    values mirror the sprite vertically.
     * @param {number} [args.width] Width of the sprite in pixels. Overrides
     *    scaleX if both values are set.
     * @param {number} [args.height] height of the sprite in pixels. Overrides
     *    scaleY if both values are set.
     */
    async #loadImageSprite({path, x=0, y=0, anchorX="center", anchorY="center",
        rotation=0, scaleX=1, scaleY=1, width=null, height=null}) {

      let data = {animated:false};

      await this.#sketch.loadImage(path,
        // success callback
        (img)=>{
          data.image = img;
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
                `"left", "center", "right", or a number, recieved ` +
                `"${anchorX}")`);
          }

          if (typeof anchorY === "number") {
            data.anchor[1] = anchorY;
          }
          else if (anchorY === "left") {
            data.anchor[1] = 0;
          }
          else if (anchorY === "right") {
            data.anchor[1] = data.image.height;
          }
          else if (anchorY === "center") {
            data.anchor[1] = data.image.height / 2;
          }
          else {
            throw new Error("Invalid vertical anchor for sprite (Expected " + 
                `"left", "center", "right", or a number, recieved ` +
                `"${anchorY}")`);
          }

          data.scale = [scaleX, scaleY];
          data.size = [];
          if (width != null) {
            data.size[0] = width;
            data.scale[0] = width / data.image.width;
          }
          else {
            data.size[0] = data.image.width * data.scale[0];
          }

          if (height != null) {
            data.size[1] = height;
            data.scale[1] = height / data.image.height;
          }
          else {
            data.size[1] = data.image.height * data.scale[1];
          }
          data.position = [x, y];
          data.rotation = rotation;
          data.sketch = this.#sketch;
        },
        // failure callback
        (event) => {
          console.error(`The image at "${path}" does not exist!`, event);
        }
      );
      return data;
    }
  }

  /**
   * Class for a sprite that is a single image without animations.
   * @static
   * @class
   */
  Kepler.ImageSprite = class {
    /** @type {p5.image} */
    #image;

    /** @type {Window|p5} */
    #sketch;

    /** @type {p5.Vector} */
    position;

    /** @type {p5.Vector} */
    displayAnchor;

    /** @type {number} */
    #width;
  
    /** @type {number} */
    #height;

    /** @type {number} */
    rotation;

    /** @type {number} */
    #scaleX;

    /** @type {number} */
    #scaleY;
    constructor(key, data) {
      if (key !== SPRITE_CONSTRUCTOR_LOCK) {
        throw new Error("ImageSprites cannot be instantiated directly - use " +
            "KSprite.makeImageSprite() instead!");
      }

      this.#sketch = data.sketch;
      this.#image = data.image;
      this.position = this.#sketch.createVector(data.position[0],
          data.position[1]);
      this.displayAnchor = this.#sketch.createVector(data.anchor[0],
          data.anchor[1]);
      this.#width = data.size[0];
      this.#height = data.size[1];
      this.rotation = data.rotation;
      this.#scaleX = data.scale[0];
      this.#scaleY = data.scale[1];
    }

    /** @type {number} */
    get x() { return this.position.x; }
    set x(value) { this.position.x = value; }

    /** @type {number} */
    get y() { return this.position.y; }
    set y(value) { this.position.y = value; }

    /** @type {number} */
    get anchorX() { return this.displayAnchor.x }
    set anchorX(value) { this.displayAnchor.x = value; }

    /** @type {number} */
    get anchorY() { return this.displayAnchor.y }
    set anchorY(value) { this.displayAnchor.y = value; }

    /** @type {number} */
    get sourceWidth() { return this.#image.width; }

    /** @type {number} */
    get sourceHeight() { return this.#image.height; }

    /** @type {number} */
    get width() { return this.#width; }
    set width(value) {
      this.#width = value;
      this.#scaleX = this.#width / this.#image.width;
    }

    /** @type {number} */
    get height() { return this.#height; }
    set height(value) {
      this.#height = value;
      this.#scaleY = this.#height / this.#image.height;
    }

    /**
     * Renders the sprite to a canvas.
     * @method
     * @param {any} renderTarget The canvas to render to; defaults to the main
     *    canvas for the sketch the sprite was loaded with.
     */
    render(renderTarget=this.#sketch) {
      renderTarget.push();
      renderTarget.translate(this.position.x, this.position.y);
      renderTarget.rotate(this.rotation);
      renderTarget.image(this.#image, -this.displayAnchor.x * this.#scaleX,
          -this.displayAnchor.y * this.#scaleY, this.#width, this.#height);
      renderTarget.pop();
    }

    /**
     * Scales the sprite and the display anchor relative to its current size.
     * @overload
     * @param {number} s
     * 
     * @overload
     * @param {number} x
     * @param {number} Y
     */
    scale(arg1, arg2) {
      if (arg2 == null) {
        this.#scaleX *= arg1;
        this.#scaleY *= arg1;
        this.#width *= arg1;
        this.#height *= arg1;
      }
      else {
        this.#scaleX *= arg1;
        this.#scaleY *= arg2;
        this.#width *= arg1;
        this.#height *= arg2;
      }
    }

    /**
     * Scales the sprite and the display anchor relative to its source size.
     * @overload
     * @param {number} s
     * 
     * @overload
     * @param {number} x
     * @param {number} Y
     */
    scaleAbsolute(arg1, arg2) {
      if (arg2 == null) {
        this.#scaleX = arg1;
        this.#scaleY = arg1;
        this.#width = this.#image.width * arg1;
        this.#height = this.#image.height * arg1;
      }
      else {
        this.#scaleX = arg1;
        this.#scaleY = arg2;
        this.#width = this.#image.width * arg1;
        this.#height = this.#image.height * arg2;
      }
    }
  };

  // delete the external reference to the ctor key to make it private
  tempCtorLock = null;
}(window.Kepler = window.Kepler || {}));