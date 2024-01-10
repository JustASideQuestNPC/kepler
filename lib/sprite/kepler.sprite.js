/*
 *   _                 _                                _  _        
 *  | | __ ___  _ __  | |  ___  _ __  ___  _ __   _ __ (_)| |_  ___ 
 *  | |/ // _ \| '_ \ | | / _ \| '__|/ __|| '_ \ | '__|| || __|/ _ \
 *  |   <|  __/| |_) || ||  __/| | _ \__ \| |_) || |   | || |_|  __/
 *  |_|\_\\___|| .__/ |_| \___||_|(_)|___/| .__/ |_|   |_| \__|\___|
 *             |_|                        |_|                       
 * 
 *  Part of Kepler, a 2d game engine for p5.js
 *  https://github.com/JustASideQuestNPC/kepler
 */
(function (Kepler) {
  Kepler.SPRITE_INCLUDED = true;
  const SPRITE_CONSTRUCTOR_LOCK = Symbol();
  Kepler.SpriteLoader = class {
    #spriteData = {};
    #sketch;
    constructor(sketch) {
      this.#sketch = sketch;
    }
    makeImageSprite(name) {
      if (!this.#spriteData.hasOwnProperty(name)) {
        throw new Error(
          `The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with SpriteLoader.preload() before ` +
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
    makeAnimatedSprite(name) {
      if (!this.#spriteData.hasOwnProperty(name)) {
        throw new Error(
          `The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with SpriteLoader.preload() before ` +
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
    async loadSprite(file) {
      let spriteName, extension;
      let args;
      if (typeof file === "string") {
        args = { path: file };
        let buffer = file;
        spriteName = buffer.split("/").pop();
        args.folderPath = buffer.join("/") + "/";
        spriteName = spriteName.replace(/\.[^/.]+$/, "");
        extension = file.slice(((file.lastIndexOf(".") - 1) >>> 0) + 2);
      } else {
        args = file;
        if (file.hasOwnProperty("name")) {
          spriteName = file.name;
        } else {
          spriteName = file.path.split("/").pop();
          spriteName = spriteName.replace(/\.[^/.]+$/, "");
        }
        let buffer = file.path.split("/");
        buffer.pop();
        args.folderPath = buffer.join("/") + "/";
        extension = file.path.slice(
          ((file.path.lastIndexOf(".") - 1) >>> 0) + 2
        );
      }
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
    async loadSpriteList(path, verboseLogging = true) {
      let startTime;
      if (verboseLogging) {
        console.log(
          "%cKepler.SpriteLoader: " + `%cLoading sprites from ${path}`,
            "color: #30D6FF", "color: default"
        );
        startTime = window.performance.now();
      }
      await this.#sketch.loadJSON(
        path,
        (json) => {
          if (json.constructor === Array) {
            throw new Error("Sprite list must be an object!");
          }
          for (let [name, sprite] of Object.entries(json)) {
            sprite.name = name;
            this.loadSprite(sprite);
            if (verboseLogging) {
              console.log(
                "%cKepler.SpriteLoader: " + `%cLoaded sprite "${name}"`,
                  "color: #30D6FF", "color: default"
              );
            }
          }
          if (verboseLogging) {
            let duration = window.performance.now() - startTime;
            console.log(
              "%cKepler.SpriteLoader: " + `%cLoaded ` +
                `${Object.values(json).length} sprite(s) in ${duration} ms`,
                "color: #30D6FF", "color: #23D18B"
            );
          }
        },
        (event) => {
          console.error(`The sprite list at "${path}" does not exist!`, event);
        }
      );
    }
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
        (event) => {
          console.error(`The image at "${path}" does not exist!`, event);
        }
      );
    }
    async #loadAnimatedSprite(spriteName, args) {
      await this.#sketch.loadJSON(
        args.path,
        async (json) => {
          await this.#sketch.loadImage(
            args.folderPath + json.meta.image,
            async (img) => {
              await this.#parseSpriteSheet(spriteName, json, img, args);
            },
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
        (event) => {
          console.error(
            `The animation data file at "${args.path}" does not ` + `exist!`,
            event
          );
        }
      );
    }
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
      let sourceWidth = frames[Object.keys(frames)[0]].sourceSize.w;
      let sourceHeight = frames[Object.keys(frames)[0]].sourceSize.h;
      if (size.width != null) {
        data.scale[0] = size.width / sourceWidth;
      }
      if (size.height != null) {
        data.scale[1] = size.height / sourceHeight;
      }
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
      data.frames = [];
      for (let key of Object.keys(frames)) {
        let f = frames[key];
        if (f.trimmed) {
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
          data.frames.push(img.get(f.frame.x, f.frame.y, f.frame.w, f.frame.h));
        }
      }
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
  Kepler.ImageSprite = class {
    #image;
    #sketch;
    position;
    displayAnchor;
    rotation;
    #scale;
    get x() {
      return this.position.x;
    }
    set x(value) {
      this.position.x = value;
    }
    get y() {
      return this.position.y;
    }
    set y(value) {
      this.position.y = value;
    }
    get anchorX() {
      return this.displayAnchor.x;
    }
    set anchorX(value) {
      this.displayAnchor.x = value;
    }
    get anchorY() {
      return this.displayAnchor.y;
    }
    set anchorY(value) {
      this.displayAnchor.y = value;
    }
    get sourceWidth() {
      return this.#image.width;
    }
    get sourceHeight() {
      return this.#image.height;
    }
    get width() {
      return this.#image.width * this.#scale.x;
    }
    set width(value) {
      this.#scale.x = value / this.#image.width;
    }
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
    scale(arg1, arg2) {
      if (arg2 == null) {
        this.#scale.x *= arg1;
        this.#scale.y *= arg1;
      } else {
        this.#scale.x *= arg1;
        this.#scale.y *= arg2;
      }
    }
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
  Kepler.AnimatedSprite = class {
    #frames;
    #sketch;
    #frameIndex;
    #scale;
    #tags;
    #currentTag;
    #startIndex;
    #endIndex;
    #frameDelay;
    #frameTimer;
    playbackMode;
    playbackSpeed;
    paused;
    position;
    displayAnchor;
    rotation;
    get x() {
      return this.position.x;
    }
    set x(value) {
      this.position.x = value;
    }
    get y() {
      return this.position.y;
    }
    set y(value) {
      this.position.y = value;
    }
    get anchorX() {
      return this.displayAnchor.x;
    }
    set anchorX(value) {
      this.displayAnchor.x = value;
    }
    get anchorY() {
      return this.displayAnchor.y;
    }
    set anchorY(value) {
      this.displayAnchor.y = value;
    }
    get sourceWidth() {
      return this.#frames[0].width;
    }
    get sourceHeight() {
      return this.#frames[0].height;
    }
    get width() {
      return this.#frames[0].width * this.#scale.x;
    }
    set width(value) {
      this.#scale.x = value / this.#frames[0].width;
    }
    get height() {
      return this.#frames[0].height * this.#scale.y;
    }
    set height(value) {
      this.#scale.y = value / this.#frames[0].height;
    }
    get frameRate() {
      return 1 / this.#frameDelay;
    }
    set frameRate(value) {
      this.#frameDelay = 1 / value;
    }
    get numFrames() {
      return this.#endIndex - this.#startIndex;
    }
    get tagNames() {
      return Object.keys(this.#tags);
    }
    get currentFrame() {
      return this.#frameIndex - this.#startIndex;
    }
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
    advanceFrame(n) {
      this.#frameIndex += n;
      if (this.playbackMode === "loop") {
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
    restart(startPaused = false) {
      this.paused = startPaused;
      if (this.playbackSpeed < 0) {
        this.#frameIndex = this.#endIndex;
      } else {
        this.#frameIndex = this.#startIndex;
      }
    }
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
    update(dt) {
      if (!this.paused) {
        this.#frameTimer -= dt;
        if (this.#frameTimer <= 0) {
          this.advanceFrame(this.playbackSpeed / Math.abs(this.playbackSpeed));
          this.#frameTimer = this.#frameDelay / Math.abs(this.playbackSpeed);
        }
      }
    }
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
    scale(arg1, arg2) {
      if (arg2 == null) {
        this.#scale.x *= arg1;
        this.#scale.y *= arg1;
      } else {
        this.#scale.x *= arg1;
        this.#scale.y *= arg2;
      }
    }
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
