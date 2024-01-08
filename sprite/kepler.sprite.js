// add sprite stuff to the Kepler namespace using a "self-executing anonymous
// function" and associated black magic
(function (Kepler) {
  Kepler.SPRITE_INCLUDED = true;

  // used to hack in private constructors for the sprite
  const SPRITE_CONSTRUCTOR_LOCK = Symbol();

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
     * Sketch object to create sprites with and load images.
     * @private
     * @type {Window|p5}
     */
    #sketch;

    /**
     * Creates a new KSpriteLoader.
     * @constructor
     * @param {Window|p5} sketch The sketch object to use for creating sprites
     *    and loading images. If you're running things in global mode, don't
     *    pass anything here (if you want to pass something anyway, pass
     *    `window`).
     */
    constructor(sketch) {
      this.#sketch = sketch;
    }

    /**
     * Returns an image-only sprite with no animations. The image *must* have
     * been loaded into the cache using `preload()`!.
     * @method
     * @param {string} name The name of the sprite's cache entry. If you didn't
     *    specify this when preloading it, it's the name of the image file,
     *    minus the extension and the rest of the path (for example, a sprite
     *    with an image at "assets/sprites/my-sprite.png" would have an entry
     *    named "my-sprite").
     * @returns {Kepler.ImageSprite}
     */
    makeImageSprite(name) {
      if (!this.#spriteData.hasOwnProperty(name)) {
        throw new Error(
          `The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with KSprite.preload() before ` +
            `calling this method)`
        );
      }
      if (this.#spriteData[name].animated) {
        throw new Error(
          `The sprite "${name}" is animated - use ` +
            `SpriteLoader.makeAnimatedSprite() to create it instead.`
        );
      }

      return new Kepler.ImageSprite(
        SPRITE_CONSTRUCTOR_LOCK,
        this.#spriteData[name]
      );
    }

    /**
     * Returns a sprite with one or more animations. The image *must* have been
     * loaded into the cache using `preload()`!.
     * @method
     * @param {string} name The name of the sprite's cache entry. If you didn't
     *    specify this when preloading it, it's the name of the animation data
     *    file, minus the extension and the rest of the path (for example, a
     *    sprite with a data file at "assets/sprites/my-sprite.json" would have
     *    an entry named "my-sprite").
     * @returns {Kepler.AnimatedSprite}
     */
    makeAnimatedSprite(name) {
      if (!this.#spriteData.hasOwnProperty(name)) {
        throw new Error(
          `The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with KSprite.preload() before ` +
            `calling this method)`
        );
      }
      if (!this.#spriteData[name].animated) {
        throw new Error(
          `The sprite "${name}" is not animated - use ` +
            `SpriteLoader.makeImageSprite() to create it instead.`
        );
      }

      return new Kepler.AnimatedSprite(
        SPRITE_CONSTRUCTOR_LOCK,
        this.#spriteData[name]
      );
    }

    /**
     * Loads an image or animation data file into the internal cache, and breaks
     * up spritesheets into objects that can be used for displaying animations
     * This should be called in your sketch's `preload` function.
     * @async
     * @method
     * @param {string|Object} file The path to the image (for sprites that are a
     * single image) or .json data file (for sprites that have one or more
     * animations) to load. Objects can be used instead of strings to set other
     * data such as the sprite's name, display anchor, rotation, etc.
     */
    async loadSprite(file) {
      let spriteName, extension;

      // if the entry is just a file path, convert it to an argument object
      // that can be passed to a loader
      let args;
      if (typeof file === "string") {
        args = { path: file };
        let buffer = file;
        // the file name minus the path
        spriteName = buffer.split("/").pop();
        // the path minus the file name; used for loading json files
        args.folderPath = buffer.join("/") + "/";
        // remove the file extension using the arcane runes (read: regex)
        spriteName = spriteName.replace(/\.[^/.]+$/, "");

        extension = entry.slice(((file.lastIndexOf(".") - 1) >>> 0) + 2);
      } else {
        args = file;
        if (file.hasOwnProperty("name")) {
          spriteName = file.name;
        } else {
          // the file name minus the path
          spriteName = file.path.split("/").pop();
          // remove the file extension using the arcane runes (read: regex)
          spriteName = spriteName.replace(/\.[^/.]+$/, "");
        }
        // the path minus the file name; used for loading json files
        let buffer = file.path.split("/");
        buffer.pop();
        args.folderPath = buffer.join("/") + "/";
        extension = file.path.slice(
          ((file.path.lastIndexOf(".") - 1) >>> 0) + 2
        );
      }

      // delegate to the correct loader (or throw an error) - the loader
      // methods are defined as async for technical reasons so they all need
      // to be awaited
      if (extension === "png" || extension === "jpg") {
        await this.#loadImageSprite(spriteName, args);
      } else if (extension === "json") {
        await this.#loadAnimatedSprite(spriteName, args);
      } else {
        throw new Error(
          `The file "${args.path}" has an invalid file type! ` +
            `(Supported file types are .json for animated sprites, and ` +
            `.png or .jpg for image sprites)`
        );
      }
    }

    /**
     * Loads multiple sprites from a json file.
     * @method
     * @async
     * @param {string} path
     * @param {boolean} [verboseLogging] If `true`, prints status updates to the
     *    console. Does nothing in the minified version of the library.
     */
    async loadSpriteList(path, verboseLogging = true) {
      let startTime;
      if (verboseLogging) {
        console.log(
          "%cKepler.SpriteLoader: " + `%cLoading sprites from ${path}`,
            "color: #d45eff", "color: default"
        );
        startTime = window.performance.now();
      }

      await this.#sketch.loadJSON(
        path,
        // success callback
        (json) => {
          // the root of a json file can only be an object or an array
          if (json.constructor === Array) {
            throw new Error("Sprite list must be an object!");
          }

          for (let [name, sprite] of Object.entries(json)) {
            sprite.name = name;
            this.loadSprite(sprite);
            if (verboseLogging) {
              console.log(
                "%cKepler.SpriteLoader: " + `%cLoaded sprite "${name}"`,
                  "color: #d45eff", "color: default"
              );
            }
          }

          if (verboseLogging) {
            let duration = window.performance.now() - startTime;
            console.log(
              "%cKepler.SpriteLoader: " + `%cLoaded ` +
                `${Object.values(json).length} sprite(s) in ${duration} ms`,
                "color: #d45eff", "color: #23D18B"
            );
          }
        },
        // failure callback
        (event) => {
          console.error(`The sprite list at "${path}" does not exist!`, event);
        }
      );
    }

    /**
     * Creates a data object for a sprite with a single image.
     * @private
     * @async
     * @param {SpriteConfig} args
     */
    async #loadImageSprite(
      spriteName,
      {
        path,
        position = { x: 0, y: 0 },
        anchor = { x: "center", y: "center" },
        rotation = 0,
        scale = { x: 1, y: 1 },
        size = { width: null, height: null },
      }
    ) {
      await this.#sketch.loadImage(
        path,
        // success callback
        (img) => {
          let data = { animated: false, sketch: this.#sketch };
          data.image = img;
          data.anchor = [];
          if (typeof anchor.x === "number") {
            data.anchor[0] = anchor.x;
          } else if (anchor.x === "left") {
            data.anchor[0] = 0;
          } else if (anchor.x === "right") {
            data.anchor[0] = data.image.width;
          } else if (anchor.x === "center") {
            data.anchor[0] = data.image.width / 2;
          } else {
            throw new Error(
              `Invalid horizontal anchor for sprite ` +
                `"${spriteName}" (Expected "left", "center", ` +
                `"right", or a number, recieved "${anchor.x}")`
            );
          }

          if (typeof anchor.y === "number") {
            data.anchor[1] = anchor.y;
          } else if (anchor.y === "top") {
            data.anchor[1] = 0;
          } else if (anchor.y === "bottom") {
            data.anchor[1] = data.image.height;
          } else if (anchor.y === "center") {
            data.anchor[1] = data.image.height / 2;
          } else {
            throw new Error(
              `Invalid vertical anchor for sprite ` +
                `"${spriteName}" (Expected "top", "center", ` +
                `"bottom", or a number, recieved "${anchor.y}")`
            );
          }

          data.scale = [scale.x, scale.y];
          if (size.width != null) {
            data.scale[0] = size.width / data.image.width;
          }
          if (size.height != null) {
            data.scale[1] = size.height / data.image.height;
          }
          data.position = [position.x, position.y];
          data.rotation = rotation;
          this.#spriteData[spriteName] = data;
        },
        // failure callback
        (event) => {
          console.error(`The image at "${path}" does not exist!`, event);
        }
      );
    }

    /**
     * Creates a data object for a sprite with one or more animations. Animated
     * sprites use a .json file along with a sprite sheet. The format for the
     * data file is very specific for technical reasons, but there's at least a
     * few tools that can generate them automatically. At some point I'll
     * probably put together something that can generate them as well.
     * @private
     * @async
     * @param {SpriteConfig} args
     * @returns {Object}
     */
    async #loadAnimatedSprite(spriteName, args) {
      await this.#sketch.loadJSON(
        args.path,
        // success callback
        async (json) => {
          await this.#sketch.loadImage(
            args.folderPath + json.meta.image,
            // success callback
            async (img) => {
              await this.#parseSpriteSheet(spriteName, json, img, args);
            },
            // failure callback
            (event) => {
              console.error(
                `The image at "${
                  args.folderPath + json.meta.image
                }" does not exist!`,
                event
              );
            }
          );
        },
        // failure callback
        (event) => {
          console.error(
            `The animation data file at "${args.path}" does not ` + `exist!`,
            event
          );
        }
      );
    }

    /**
     * Parses a sprite sheet and returns a data object for a sprite.
     * @private
     * @async
     * @param {SpriteConfig} args
     * @param {Object} json
     * @param {p5.Image} img
     * @returns {Object}
     */
    async #parseSpriteSheet(
      spriteName,
      json,
      img,
      {
        position = { x: 0, y: 0 },
        anchor = { x: "center", y: "center" },
        frameRate = 20,
        playbackMode = "loop",
        playbackSpeed = 1,
        paused = false,
        startTag = null,
        rotation = 0,
        scale = { x: 1, y: 1 },
        size = { width: null, height: null },
      }
    ) {
      let data = {
        animated: true,
        sketch: this.#sketch,
        position: [position.x, position.y],
        frameRate: frameRate,
        playbackSpeed: playbackSpeed,
        paused: paused,
        rotation: rotation,
        scale: [scale.x, scale.y]
      };

      if (
        playbackMode !== "play once" &&
        playbackMode !== "ping pong" &&
        playbackMode !== "loop"
      ) {
        throw new Error(
          `Invalid playback mode for sprite "${spriteName}" (expected ` +
            `"play once", "ping pong", or "loop", recieved ` +
            `"${playbackMode}")`
        );
      }
      data.playbackMode = playbackMode;

      let frames = json.frames;
      let meta = json.meta;

      if (Object.keys(frames).length === 0) {
        throw new Error(`Sprite "${spriteName}" has no frames!`);
      }

      // find the sprite size using the data in the first frame, because the
      // "size" property in the metadata is the size of the sprite sheet
      let sourceWidth = frames[Object.keys(frames)[0]].sourceSize.w;
      let sourceHeight = frames[Object.keys(frames)[0]].sourceSize.h;

      if (size.width != null) {
        data.scale[0] = size.width / sourceWidth;
      }
      if (size.height != null) {
        data.scale[1] = size.height / sourceHeight;
      }

      // calculate display anchor
      data.anchor = [];
      if (typeof anchor.x === "number") {
        data.anchor[0] = anchor.x;
      } else if (anchor.x === "left") {
        data.anchor[0] = 0;
      } else if (anchor.x === "right") {
        data.anchor[0] = sourceWidth;
      } else if (anchor.x === "center") {
        data.anchor[0] = sourceWidth / 2;
      } else {
        throw new Error(
          `Invalid horizontal anchor for sprite "${spriteName}" (Expected ` +
            `"left", "center", "right", or a number, recieved ` +
            `"${anchor.x}")`
        );
      }

      if (typeof anchor.y === "number") {
        data.anchor[1] = anchor.y;
      } else if (anchor.y === "top") {
        data.anchor[1] = 0;
      } else if (anchor.y === "bottom") {
        data.anchor[1] = sourceHeight;
      } else if (anchor.y === "center") {
        data.anchor[1] = sourceHeight / 2;
      } else {
        throw new Error(
          `Invalid vertical anchor for sprite "${spriteName}" (Expected ` +
            `"top", "center", "bottom", or a number, ` +
            `recieved "${anchor.y}")`
        );
      }

      // break the spritesheet into a seperate image for each frame
      data.frames = [];
      for (let key of Object.keys(frames)) {
        let f = frames[key];
        if (f.trimmed) {
          // if the frame is trimmed, create a buffer image of the correct size
          // and copy the trimmed frame into it
          let buffer = this.#sketch.createImage(sourceWidth, sourceHeight);
          buffer.copy(
            img,
            f.frame.x,
            f.frame.y,
            f.frame.w,
            f.frame.h,
            f.spriteSourceSize.x,
            f.spriteSourceSize.y,
            f.spriteSourceSize.w,
            f.spriteSourceSize.h
          );
          data.frames.push(buffer);
        } else {
          // otherwise, just copy it directly
          data.frames.push(img.get(f.frame.x, f.frame.y, f.frame.w, f.frame.h));
        }
      }

      // tags are used to separate animations
      if (!meta.hasOwnProperty("frameTags") || meta.frameTags.length === 0) {
        data.tags = {
          main: { start: 0, end: data.frames.length - 1 },
        };
        data.startTag = "main";
      } else {
        data.tags = {};
        for (let tag of meta.frameTags) {
          data.tags[tag.name] = { start: tag.from, end: tag.to };
        }

        data.startTag = startTag || Object.keys(data.tags)[0];
      }

      this.#spriteData[spriteName] = data;
    }
  };

  /**
   * Class for a sprite that is a single image without animations.
   * @static
   * @class
   */
  Kepler.ImageSprite = class {
    /**
     * @private
     * @type {p5.Image}
     */
    #image;

    /**
     * @private
     * @type {Window|p5}
     */
    #sketch;

    /** @type {p5.Vector} */
    position;

    /** @type {p5.Vector} */
    displayAnchor;

    /** @type {number} */
    rotation;

    /**
     * @private
     * @type {p5.Vector}
     */
    #scale;

    /** @type {number} */
    get x() {
      return this.position.x;
    }
    set x(value) {
      this.position.x = value;
    }

    /** @type {number} */
    get y() {
      return this.position.y;
    }
    set y(value) {
      this.position.y = value;
    }

    /** @type {number} */
    get anchorX() {
      return this.displayAnchor.x;
    }
    set anchorX(value) {
      this.displayAnchor.x = value;
    }

    /** @type {number} */
    get anchorY() {
      return this.displayAnchor.y;
    }
    set anchorY(value) {
      this.displayAnchor.y = value;
    }

    /** @type {number} */
    get sourceWidth() {
      return this.#image.width;
    }

    /** @type {number} */
    get sourceHeight() {
      return this.#image.height;
    }

    /** @type {number} */
    get width() {
      return this.#image.width * this.#scale.x;
    }
    set width(value) {
      this.#scale.x = value / this.#image.width;
    }

    /** @type {number} */
    get height() {
      return this.#image.height * this.#scale.y;
    }
    set height(value) {
      this.#scale.y = value / this.#image.height;
    }

    constructor(key, data) {
      if (key !== SPRITE_CONSTRUCTOR_LOCK) {
        throw new Error(
          "ImageSprites cannot be instantiated directly - use " +
            "SpriteLoader.makeImageSprite() instead!"
        );
      }

      this.#sketch = data.sketch;
      this.#image = data.image;
      this.position = this.#sketch.createVector(
        data.position[0],
        data.position[1]
      );
      this.displayAnchor = this.#sketch.createVector(
        data.anchor[0],
        data.anchor[1]
      );
      this.rotation = data.rotation;
      this.#scale = this.#sketch.createVector(data.scale[0], data.scale[1]);
    }

    /**
     * Renders the sprite to a canvas.
     * @method
     * @param {any} renderTarget The canvas to render to; defaults to the main
     *    canvas for the sketch the sprite was loaded with.
     */
    render(renderTarget = this.#sketch) {
      renderTarget.push();
      renderTarget.translate(this.position.x, this.position.y);
      renderTarget.scale(this.#scale.x, this.#scale.y);
      renderTarget.rotate(this.rotation);
      renderTarget.image(
        this.#image,
        -this.displayAnchor.x,
        -this.displayAnchor.y
      );
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
        this.#scale.x *= arg1;
        this.#scale.y *= arg1;
      } else {
        this.#scale.x *= arg1;
        this.#scale.y *= arg2;
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
        this.#scale.x = arg1;
        this.#scale.y = arg1;
      } else {
        this.#scale.x = arg1;
        this.#scale.y = arg2;
      }
    }
  };

  /**
   * Class for a sprite that has one or more animations.
   * @static
   * @class
   */
  Kepler.AnimatedSprite = class {
    /**
     * @private
     * @type {p5.Image[]}
     */
    #frames;

    /**
     * @private
     * @type {Window|p5}
     */
    #sketch;

    /**
     * @private
     * @type {number}
     */
    #frameIndex;

    /**
     * @private
     * @type {p5.Vector}
     */
    #scale;

    /**
     * @private
     * @type {Object[]}
     */
    #tags;

    /**
     * @private
     * @type {string}
     */
    #currentTag;

    /**
     * The first frame in the current tag.
     * @private
     * @type {number}
     */
    #startIndex;

    /**
     * The last frame in the current tag.
     * @private
     * @type {number}
     */
    #endIndex;

    /**
     * The time between frames in seconds.
     * @private
     * @type {number}
     */
    #frameDelay;

    /**
     * @private
     * @type {number}
     */
    #frameTimer;

    /** @type {"play once"|"ping pong"|"loop"} */
    playbackMode;

    /** @type {number} */
    playbackSpeed;

    /** @type {boolean} */
    paused;

    /** @type {p5.Vector} */
    position;

    /** @type {p5.Vector} */
    displayAnchor;

    /** @type {number} */
    rotation;

    /** @type {number} */
    get x() {
      return this.position.x;
    }
    set x(value) {
      this.position.x = value;
    }

    /** @type {number} */
    get y() {
      return this.position.y;
    }
    set y(value) {
      this.position.y = value;
    }

    /** @type {number} */
    get anchorX() {
      return this.displayAnchor.x;
    }
    set anchorX(value) {
      this.displayAnchor.x = value;
    }

    /** @type {number} */
    get anchorY() {
      return this.displayAnchor.y;
    }
    set anchorY(value) {
      this.displayAnchor.y = value;
    }

    /** @type {number} */
    get sourceWidth() {
      return this.#frames[0].width;
    }

    /** @type {number} */
    get sourceHeight() {
      return this.#frames[0].height;
    }

    /** @type {number} */
    get width() {
      return this.#frames[0].width * this.#scale.x;
    }
    set width(value) {
      this.#scale.x = value / this.#frames[0].width;
    }

    /** @type {number} */
    get height() {
      return this.#frames[0].height * this.#scale.y;
    }
    set height(value) {
      this.#scale.y = value / this.#frames[0].height;
    }

    /** @type {number} */
    get frameRate() {
      return 1 / this.#frameDelay;
    }
    set frameRate(value) {
      this.#frameDelay = 1 / value;
    }

    /**
     * The number of frames in the current animation tag.
     * @type {number}
     */
    get numFrames() {
      return this.#endIndex - this.#startIndex;
    }

    /**
     * An array containing the names of all tags.
     * @type {string[]}
     */
    get tagNames() {
      return Object.keys(this.#tags);
    }

    /**
     * The frame index in the current tag.
     * @type {number}
     */
    get currentFrame() {
      return this.#frameIndex - this.#startIndex;
    }

    /** @type {string} */
    get currentTag() {
      return this.#currentTag;
    }

    constructor(key, data) {
      if (key !== SPRITE_CONSTRUCTOR_LOCK) {
        throw new Error(
          "AnimatedSprites cannot be instantiated directly - use " +
            "SpriteLoader.makeAnimatedSprite() instead!"
        );
      }

      this.#sketch = data.sketch;
      this.#frames = data.frames;
      this.frameRate = data.frameRate;
      this.#frameTimer = this.#frameDelay;

      this.playbackMode = data.playbackMode;
      this.playbackSpeed = data.playbackSpeed;
      this.paused = data.paused;

      this.#tags = data.tags;
      this.changeTag(data.startTag);

      this.position = this.#sketch.createVector(
        data.position[0],
        data.position[1]
      );
      this.displayAnchor = this.#sketch.createVector(
        data.anchor[0],
        data.anchor[1]
      );
      this.#scale = this.#sketch.createVector(1, 1);
      this.rotation = 0;
    }

    /**
     * Moves the animation forward (if n is positive) or backward (if n is
     * negative) by n frames.
     * @param {number} n
     */
    advanceFrame(n) {
      this.#frameIndex += n;
      if (this.playbackMode === "loop") {
        // overly complicated math to make the frame index always positive,
        // because apparently no one knows how modular arithmetic actually works
        this.#frameIndex =
          ((((this.#frameIndex - this.#startIndex) % this.numFrames) +
            this.numFrames) %
            this.numFrames) +
          this.#startIndex;
      } else if (this.playbackMode === "ping pong") {
        if (this.#frameIndex < this.#startIndex) {
          this.#frameIndex = this.#startIndex;
          this.playbackSpeed *= -1;
        } else if (this.#frameIndex > this.#endIndex) {
          this.#frameIndex = this.#endIndex;
          this.playbackSpeed *= -1;
        }
      } else {
        if (this.#frameIndex < this.#startIndex) {
          this.#frameIndex = this.#startIndex;
          this.paused = true;
        } else if (this.#frameIndex > this.#endIndex) {
          this.#frameIndex = this.#endIndex;
          this.paused = true;
        }
      }
    }

    /**
     * Restarts the animation.
     * @method
     * @param {boolean} [startPaused]
     */
    restart(startPaused = false) {
      this.paused = startPaused;
      if (this.playbackSpeed < 0) {
        this.#frameIndex = this.#endIndex;
      } else {
        this.#frameIndex = this.#startIndex;
      }
    }

    /**
     * Changes to the named tag. Names are case-sensitive, and an invalid name
     * throws an error.
     * @method
     * @param {string} tagname
     */
    changeTag(tagname) {
      if (!this.#tags.hasOwnProperty(tagname)) {
        throw new Error(`The animation tag "${tagname}" does not exist!`);
      }
      this.#currentTag = tagname;
      this.#startIndex = this.#tags[this.#currentTag].start;
      this.#endIndex = this.#tags[this.#currentTag].end;
      if (this.playbackSpeed < 0) {
        this.#frameIndex = this.#endIndex;
      } else {
        this.#frameIndex = this.#startIndex;
      }
    }

    /**
     * Updates the animation using the current delta time in seconds.
     * @method
     * @param {number} dt
     */
    update(dt) {
      if (!this.paused) {
        this.#frameTimer -= dt;
        if (this.#frameTimer <= 0) {
          this.advanceFrame(this.playbackSpeed / Math.abs(this.playbackSpeed));
          this.#frameTimer = this.#frameDelay / Math.abs(this.playbackSpeed);
        }
      }
    }

    /**
     * Renders the sprite to a canvas.
     * @method
     * @param {any} renderTarget The canvas to render to; defaults to the main
     *    canvas for the sketch the sprite was loaded with.
     */
    render(renderTarget = this.#sketch) {
      renderTarget.push();
      renderTarget.translate(this.position.x, this.position.y);
      renderTarget.scale(this.#scale.x, this.#scale.y);
      renderTarget.rotate(this.rotation);
      renderTarget.image(
        this.#frames[this.#frameIndex],
        -this.displayAnchor.x,
        -this.displayAnchor.y
      );
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
        this.#scale.x *= arg1;
        this.#scale.y *= arg1;
      } else {
        this.#scale.x *= arg1;
        this.#scale.y *= arg2;
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
        this.#scale.x = arg1;
        this.#scale.y = arg1;
      } else {
        this.#scale.x = arg1;
        this.#scale.y = arg2;
      }
    }
  };
})((window.Kepler = window.Kepler || {}));
