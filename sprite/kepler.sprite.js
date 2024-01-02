// add sprite stuff to the Kepler namespace using a "self-executing anonymous
// function" and associated black magic
(function(Kepler) {
  // used to hack in private constructors for the sprite
  let SPRITE_CONSTRUCTOR_LOCK = Symbol();

  /* "enums" - these check if they're already defined so that nothing breaks if
   * i use the same keywords in a different kepler module */
  // sprite alignments
  Kepler.TOP = Kepler.TOP || Symbol();
  Kepler.BOTTOM = Kepler.BOTTOM || Symbol();
  Kepler.LEFT = Kepler.LEFT || Symbol();
  Kepler.RIGHT = Kepler.RIGHT || Symbol();
  Kepler.CENTER = Kepler.CENTER || Symbol();
  
  // animation playback modes
  Kepler.PLAY_ONCE = Kepler.PLAY_ONCE || Symbol();
  Kepler.PING_PONG = Kepler.PING_PONG || Symbol();
  Kepler.LOOP = Kepler.LOOP || Symbol();

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
     * @param {Window|p5} [sketch] The sketch object to use for creating sprites
     *    and loading images. If you're running things in global mode, don't
     *    pass anything here (if you want to pass something anyway, pass
     *    `window`). 
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
     *    with an image at "assets/sprites/my-sprite.png" would have an entry
     *    named "my-sprite").
     * @returns {Kepler.ImageSprite}
     */
    makeImageSprite(name) {
      if (!this.#spriteData.hasOwnProperty(name)) {
        throw new Error(`The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with KSprite.preload() before ` +
            `calling this method)`);
      }
      if (this.#spriteData[name].animated) {
        throw new Error(`The sprite "${name}" is animated - use ` +
            `SpriteLoader.makeAnimatedSprite() to create it instead.`);
      }

      return new Kepler.ImageSprite(SPRITE_CONSTRUCTOR_LOCK,
          this.#spriteData[name]);
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
        throw new Error(`The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with KSprite.preload() before ` +
            `calling this method)`);
      }
      if (!this.#spriteData[name].animated) {
        throw new Error(`The sprite "${name}" is not animated - use ` +
            `SpriteLoader.makeImageSprite() to create it instead.`);
      }

      return new Kepler.AnimatedSprite(SPRITE_CONSTRUCTOR_LOCK,
          this.#spriteData[name]);
    }

    /**
     * Loads an array of images or animation data files into the internal cache,
     * and breaks up spritesheets into objects that can be used for displaying
     * animations. This should be called once in your sketch's `preload`
     * function with every image/animation you plan to use.
     * @async
     * @method
     * @param {string|Object} files A list of the paths to each image (for
     * sprites that are a single image) or .json data file (for sprites that
     * have one or more animations) to preload. Objects can be used instead of
     * strings to set other data such as the sprite's name, display anchor,
     * rotation, etc.
     */
    async preload(files) {
      for (let entry of files) {

        let spriteName, extension;

        // if the entry is just a file path, convert it to an argument object
        // that can be passed to a loader
        let args;
        if (typeof entry === "string") {

          args = {path: entry};
          let buffer = entry;
          // the file name minus the path
          spriteName = buffer.split("/").pop();
          // the path minus the file name; used for loading json files
          args.folderPath = buffer.join("/") + "/";
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
          // the path minus the file name; used for loading json files
          let buffer = entry.path.split("/");
          buffer.pop();
          args.folderPath = buffer.join("/") + "/";
          extension = entry.path.slice(
              (entry.path.lastIndexOf(".") - 1 >>> 0) + 2);
        }

        // delegate to the correct loader (or throw an error) - the loader
        // methods are defined as async for technical reasons so they all need
        // to be awaited
        if (extension === "png" || extension === "jpg") {
          await this.#loadImageSprite(spriteName, args);
        }
        else if (extension === "json") {
          await this.#loadAnimatedSprite(spriteName, args);
        }
        else {
          throw new Error(`The file "${args.path}" has an invalid file type! ` +
              `(Supported file types are .json for animated sprites, and ` +
              `.png or .jpg for image sprites)`);
        }
      }
    }
    
    /**
     * Creates a data object for a sprite with a single image.
     * @private
     * @async
     * @param {SpriteConfig} args
     */
    async #loadImageSprite(spriteName, {path, position={x:0,y:0},
        anchor={x:Kepler.CENTER,y:Kepler.CENTER}, rotation=0, scale={x:1,y:1},
        size={width:null, height:null}}) {

      await this.#sketch.loadImage(path,
        // success callback
        (img) => {
          let data = {animated:false, sketch:this.#sketch};
          data.image = img;
          data.anchor = [];
          if (typeof anchor.x === "number") {
            data.anchor[0] = anchor.x;
          }
          else if (anchor.x === Kepler.LEFT) {
            data.anchor[0] = 0;
          }
          else if (anchor.x === Kepler.RIGHT) {
            data.anchor[0] = data.image.width;
          }
          else if (anchor.x === Kepler.CENTER) {
            data.anchor[0] = data.image.width / 2;
          }
          else {
            throw new Error(`Invalid horizontal anchor for sprite ` +
                `"${spriteName}" (Expected Kepler.LEFT, Kepler.CENTER, ` +
                `Kepler.RIGHT, or a number, recieved "${anchor.x}")`);
          }

          if (typeof anchor.y === "number") {
            data.anchor[1] = anchor.y;
          }
          else if (anchor.y === Kepler.TOP) {
            data.anchor[1] = 0;
          }
          else if (anchor.y === Kepler.BOTTOM) {
            data.anchor[1] = data.image.height;
          }
          else if (anchor.y === Kepler.CENTER) {
            data.anchor[1] = data.image.height / 2;
          }
          else {
            throw new Error(`Invalid vertical anchor for sprite ` +
                `"${spriteName}" (Expected Kepler.TOP, Kepler.CENTER, ` +
                `Kepler.BOTTOM, or a number, recieved "${anchor.y}")`);
          }

          data.scale = [scale.x, scale.y];
          data.size = [];
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
      await this.#sketch.loadJSON(args.path,
        // success callback
        async (json) => {
          await this.#sketch.loadImage(args.folderPath + json.meta.image,
            // success callback
            async (img) => {
              await this.#parseSpriteSheet(spriteName, json, img, args);
            },
            // failure callback
            (event) => {
              console.error(`The image at "${args.folderPath +
                  json.meta.image}" does not exist!`, event);
            }
          );
        },
        // failure callback
        (event) => {
          console.error(`The animation data file at "${args.path}" does not exist!`,
              event);
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
    async #parseSpriteSheet(spriteName, json, img, {position={x:0,y:0},
        anchor={x:Kepler.CENTER,y:Kepler.CENTER}, frameRate=20,
        playbackMode=Kepler.LOOP, playbackSpeed=1, paused=false}) {

      let data = {
        animated: true,
        sketch: this.#sketch,
        position: [position.x, position.y],
        frameRate: frameRate,
        playbackSpeed: playbackSpeed,
        paused: paused
      };

      if (playbackMode !== Kepler.PLAY_ONCE && playbackMode !== Kepler.PING_PONG
          && playbackMode !== Kepler.LOOP) {
        throw new Error(`Invalid playback mode for sprite "${spriteName}" ` 
            + `(expected Kepler.PLAY_ONCE, Kepler.PING_PONG, or ` 
            + `Kepler.LOOP, recieved "${playbackMode}")`);
      }
      data.playbackMode = playbackMode;

      let frames = json.frames;

      if (Object.keys(frames).length === 0) {
        throw new Error(`Sprite "${spriteName}" has no frames!`);
      }

      // find the sprite size using the data in the first frame, because the
      // "size" property in the metadata is the size of the sprite sheet
      let sourceWidth = frames[Object.keys(frames)[0]].sourceSize.w;
      let sourceHeight = frames[Object.keys(frames)[0]].sourceSize.h;

      // calculate display anchor
      data.anchor = [];
      if (typeof anchor.x === "number") {
        data.anchor[0] = anchor.x;
      }
      else if (anchor.x === Kepler.LEFT) {
        data.anchor[0] = 0;
      }
      else if (anchor.x === Kepler.RIGHT) {
        data.anchor[0] = sourceWidth;
      }
      else if (anchor.x === Kepler.CENTER) {
        data.anchor[0] = sourceWidth / 2;
      }
      else {
        throw new Error(`Invalid horizontal anchor for sprite ` +
            `"${spriteName}" (Expected Kepler.LEFT, Kepler.CENTER, ` +
            `Kepler.RIGHT, or a number, recieved "${anchor.x}")`);
      }

      if (typeof anchor.y === "number") {
        data.anchor[1] = anchor.y;
      }
      else if (anchor.y === Kepler.TOP) {
        data.anchor[1] = 0;
      }
      else if (anchor.y === Kepler.BOTTOM) {
        data.anchor[1] = sourceHeight;
      }
      else if (anchor.y === Kepler.CENTER) {
        data.anchor[1] = sourceHeight / 2;
      }
      else {
        throw new Error(`Invalid vertical anchor for sprite ` +
            `"${spriteName}" (Expected Kepler.TOP, Kepler.CENTER, ` +
            `Kepler.BOTTOM, or a number, recieved "${anchor.y}")`);
      }

      // break the spritesheet into a seperate image for each frame
      data.frames = [];
      for (let key of Object.keys(frames)) {
        let f = frames[key];
        if (f.trimmed) {
          // if the frame is trimmed, create a buffer image of the correct size
          // and copy the trimmed frame into it
          let buffer = this.#sketch.createImage(sourceWidth, sourceHeight);
          buffer.copy(img, f.frame.x, f.frame.y, f.frame.w, f.frame.h,
            f.spriteSourceSize.x, f.spriteSourceSize.y, f.spriteSourceSize.w,
            f.spriteSourceSize.h);
          data.frames.push(buffer);
        }
        else {
          // otherwise, just copy it directly
          data.frames.push(img.get(f.frame.x, f.frame.y, f.frame.w, f.frame.h));
        }
      }
      this.#spriteData[spriteName] = data;
    }
  }

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
    get width() { return this.#image.width * this.#scale.x; }
    set width(value) {
      this.#scale.x = value / this.#image.width;
    }

    /** @type {number} */
    get height() { return this.#image.height * this.#scale.y; }
    set height(value) {
      this.#scale.y = value / this.#image.height;
    }

    constructor(key, data) {
      if (key !== SPRITE_CONSTRUCTOR_LOCK) {
        throw new Error("ImageSprites cannot be instantiated directly - use " +
            "SpriteLoader.makeImageSprite() instead!");
      }

      this.#sketch = data.sketch;
      this.#image = data.image;
      this.position = this.#sketch.createVector(data.position[0],
          data.position[1]);
      this.displayAnchor = this.#sketch.createVector(data.anchor[0],
          data.anchor[1]);
      this.rotation = data.rotation;
      this.#scale = this.#sketch.createVector(data.scale[0], data.scale[1]);
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
      renderTarget.scale(this.#scale.x, this.#scale.y);
      renderTarget.rotate(this.rotation);
      renderTarget.image(this.#image, -this.displayAnchor.x,
          -this.displayAnchor.y);
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
      }
      else {
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
      }
      else {
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
     * @type {number}
     */
    #numFrames;

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

    /** @type {p5.Vector} */
    position;

    /** @type {p5.Vector} */
    displayAnchor;

    /** @type {number} */
    rotation;

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

    /** @type {Kepler.PLAY_ONCE|Kepler.PING_PONG|Kepler.LOOP} */
    playbackMode;

    /** @type {number} */
    playbackSpeed;

    /** @type {boolean} */
    paused;

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
    get sourceWidth() { return this.#frames[0].width; }

    /** @type {number} */
    get sourceHeight() { return this.#frames[0].height; }

    /** @type {number} */
    get width() { return this.#frames[0].width * this.#scale.x; }
    set width(value) {
      this.#scale.x = value / this.#frames[0].width;
    }

    /** @type {number} */
    get height() { return this.#frames[0].height * this.#scale.y; }
    set height(value) {
      this.#scale.y = value / this.#frames[0].height;
    }

    /** @type {number} */
    get frameRate() { return 1 / this.#frameDelay; }
    set frameRate(value) {
      this.#frameDelay = 1 / value;
    }

    constructor(key, data) {
      if (key !== SPRITE_CONSTRUCTOR_LOCK) {
        throw new Error("AnimatedSprites cannot be instantiated directly - " +
            "use SpriteLoader.makeAnimatedSprite() instead!");
      }

      this.#sketch = data.sketch;
      this.#frames = data.frames;
      this.#frameIndex = 0;
      this.#numFrames = data.frames.length;
      this.frameRate = data.frameRate;
      this.#frameTimer = this.#frameDelay;
      this.playbackMode = data.playbackMode;
      this.playbackSpeed = data.playbackSpeed;
      this.paused = data.paused;
      this.position = this.#sketch.createVector(data.position[0],
          data.position[1]);
      this.displayAnchor = this.#sketch.createVector(data.anchor[0],
          data.anchor[1]);
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
      if (this.playbackMode === Kepler.LOOP) {
        // someday i'll find a language where the modulus works correctly...
        this.#frameIndex = (((this.#frameIndex) % this.#numFrames) +
            this.#numFrames) % this.#numFrames;
      }
      else if (this.playbackMode === Kepler.PING_PONG) {
        if (this.#frameIndex < 0) {
          this.#frameIndex = 0;
          this.playbackSpeed *= -1;
        }
        else if (this.#frameIndex >= this.#numFrames) {
          this.#frameIndex = this.#numFrames - 1;
          this.playbackSpeed *= -1;
        }
      }
      else {
        if (this.#frameIndex < 0) {
          this.#frameIndex = 0;
          this.paused = true;
        }
        else if (this.#frameIndex >= this.#numFrames) {
          this.#frameIndex = this.#numFrames - 1;
          this.paused = true;
        }
      }
    }

    /**
     * Restarts the animation.
     * @method
     * @param {boolean} [startPaused]
     */
    restart(startPaused=false) {
      this.paused = startPaused;
      if (this.playbackSpeed < 0) this.#frameIndex = this.#numFrames - 1;
      else this.#frameIndex = 0;
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
    render(renderTarget=this.#sketch) {
      renderTarget.push();
      renderTarget.translate(this.position.x, this.position.y);
      renderTarget.scale(this.#scale.x, this.#scale.y);
      renderTarget.rotate(this.rotation);
      renderTarget.image(this.#frames[this.#frameIndex], -this.displayAnchor.x,
          -this.displayAnchor.y);
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
      }
      else {
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
      }
      else {
        this.#scale.x = arg1;
        this.#scale.y = arg2;
      }
    }
  }

}(window.Kepler = window.Kepler || {}));