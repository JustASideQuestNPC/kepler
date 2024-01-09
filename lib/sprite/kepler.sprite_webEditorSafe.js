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
    constructor(sketch) {
      this._sketch = sketch;
      this._spriteData = {};
    }
    makeImageSprite(name) {
      if (!this._spriteData.hasOwnProperty(name)) {
        throw new Error(
          `The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with SpriteLoader.preload() before ` +
            `calling this method)`
        );
      }
      if (this._spriteData[name].animated) {
        throw new Error(
          `The sprite "${name}" is animated - use ` +
            `SpriteLoader.makeAnimatedSprite() to create it instead.`
        );
      }
      return new Kepler.ImageSprite(
        SPRITE_CONSTRUCTOR_LOCK,
        this._spriteData[name]
      );
    }
    makeAnimatedSprite(name) {
      if (!this._spriteData.hasOwnProperty(name)) {
        throw new Error(
          `The sprite "${name}" does not exist! (If it should, ` +
            `make sure you've loaded it with SpriteLoader.preload() before ` +
            `calling this method)`
        );
      }
      if (!this._spriteData[name].animated) {
        throw new Error(
          `The sprite "${name}" is not animated - use ` +
            `SpriteLoader.makeImageSprite() to create it instead.`
        );
      }
      return new Kepler.AnimatedSprite(
        SPRITE_CONSTRUCTOR_LOCK,
        this._spriteData[name]
      );
    }
    loadSprite(file) {
      let spriteName, extension;
      let args;
      if (typeof file === "string") {
        args = { path: file };
        let buffer = file;
        spriteName = buffer.split("/").pop();
        args.folderPath = buffer.substring(0, buffer.lastIndexOf('/')) + "/";
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
        extension = file.path.slice(-4);
      }
      if (extension === ".png" || extension === ".jpg") {
        this._loadImageSprite(spriteName, args);
      } else if (extension === "json") {
        this._loadAnimatedSprite(spriteName, args);
      } else {
        throw new Error(
          `The file "${args.path}" has an invalid file type! ` +
            `(Supported file types are .json for animated sprites, and ` +
            `.png or .jpg for image sprites)`
        );
      }
    }
    loadSpriteList(path, verboseLogging = true) {
      let startTime;
      if (verboseLogging) {
        console.log(
          "%cKepler.SpriteLoader: " + `%cLoading sprites from ${path}`,
            "color: #30D6FF", "color: default"
        );
        startTime = window.performance.now();
      }
      this._sketch.loadJSON(
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
    _loadImageSprite(
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
      this._sketch.loadImage(
        path,
        (img) => {
          let data = { animated: false, sketch: this._sketch };
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
          this._spriteData[spriteName] = data;
        },
        (event) => {
          console.error(`The image at "${path}" does not exist!`, event);
        }
      );
    }
    _loadAnimatedSprite(spriteName, args) {
      this._sketch.loadJSON(
        args.path,
        (json) => {
          this._sketch.loadImage(
            args.folderPath + json.meta.image,
            (img) => {
              this._parseSpriteSheet(spriteName, json, img, args);
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
    _parseSpriteSheet(
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
        sketch: this._sketch,
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
          let buffer = this._sketch.createImage(sourceWidth, sourceHeight);
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
      this._spriteData[spriteName] = data;
    }
  };
  Kepler.ImageSprite = class {
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
      return this._image.width;
    }
    get sourceHeight() {
      return this._image.height;
    }
    get width() {
      return this._image.width * this._scale.x;
    }
    set width(value) {
      this._scale.x = value / this._image.width;
    }
    get height() {
      return this._image.height * this._scale.y;
    }
    set height(value) {
      this._scale.y = value / this._image.height;
    }
    constructor(key, data) {
      if (key !== SPRITE_CONSTRUCTOR_LOCK) {
        throw new Error(
          "ImageSprites cannot be instantiated directly - use " +
            "SpriteLoader.makeImageSprite() instead!"
        );
      }
      this._sketch = data.sketch;
      this._image = data.image;
      this.position = this._sketch.createVector(
        data.position[0],
        data.position[1]
      );
      this.displayAnchor = this._sketch.createVector(
        data.anchor[0],
        data.anchor[1]
      );
      this.rotation = data.rotation;
      this._scale = this._sketch.createVector(data.scale[0], data.scale[1]);
    }
    render(renderTarget = this._sketch) {
      renderTarget.push();
      renderTarget.translate(this.position.x, this.position.y);
      renderTarget.scale(this._scale.x, this._scale.y);
      renderTarget.rotate(this.rotation);
      renderTarget.image(
        this._image,
        -this.displayAnchor.x,
        -this.displayAnchor.y
      );
      renderTarget.pop();
    }
    scale(arg1, arg2) {
      if (arg2 == null) {
        this._scale.x *= arg1;
        this._scale.y *= arg1;
      } else {
        this._scale.x *= arg1;
        this._scale.y *= arg2;
      }
    }
    scaleAbsolute(arg1, arg2) {
      if (arg2 == null) {
        this._scale.x = arg1;
        this._scale.y = arg1;
      } else {
        this._scale.x = arg1;
        this._scale.y = arg2;
      }
    }
  };
  Kepler.AnimatedSprite = class {
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
      return this._frames[0].width;
    }
    get sourceHeight() {
      return this._frames[0].height;
    }
    get width() {
      return this._frames[0].width * this._scale.x;
    }
    set width(value) {
      this._scale.x = value / this._frames[0].width;
    }
    get height() {
      return this._frames[0].height * this._scale.y;
    }
    set height(value) {
      this._scale.y = value / this._frames[0].height;
    }
    get frameRate() {
      return 1 / this._frameDelay;
    }
    set frameRate(value) {
      this._frameDelay = 1 / value;
    }
    get numFrames() {
      return this._endIndex - this._startIndex;
    }
    get tagNames() {
      return Object.keys(this._tags);
    }
    get currentFrame() {
      return this._frameIndex - this._startIndex;
    }
    get currentTag() {
      return this._currentTag;
    }
    constructor(key, data) {
      if (key !== SPRITE_CONSTRUCTOR_LOCK) {
        throw new Error(
          "AnimatedSprites cannot be instantiated directly - use " +
            "SpriteLoader.makeAnimatedSprite() instead!"
        );
      }
      this._sketch = data.sketch;
      this._frames = data.frames;
      this.frameRate = data.frameRate;
      this._frameTimer = this._frameDelay;
      this.playbackMode = data.playbackMode;
      this.playbackSpeed = data.playbackSpeed;
      this.paused = data.paused;
      this._tags = data.tags;
      this.changeTag(data.startTag);
      this.position = this._sketch.createVector(
        data.position[0],
        data.position[1]
      );
      this.displayAnchor = this._sketch.createVector(
        data.anchor[0],
        data.anchor[1]
      );
      this._scale = this._sketch.createVector(1, 1);
      this.rotation = 0;
    }
    advanceFrame(n) {
      this._frameIndex += n;
      if (this.playbackMode === "loop") {
        this._frameIndex =
          ((((this._frameIndex - this._startIndex) % this.numFrames) +
            this.numFrames) %
            this.numFrames) +
          this._startIndex;
      } else if (this.playbackMode === "ping pong") {
        if (this._frameIndex < this._startIndex) {
          this._frameIndex = this._startIndex;
          this.playbackSpeed *= -1;
        } else if (this._frameIndex > this._endIndex) {
          this._frameIndex = this._endIndex;
          this.playbackSpeed *= -1;
        }
      } else {
        if (this._frameIndex < this._startIndex) {
          this._frameIndex = this._startIndex;
          this.paused = true;
        } else if (this._frameIndex > this._endIndex) {
          this._frameIndex = this._endIndex;
          this.paused = true;
        }
      }
    }
    restart(startPaused = false) {
      this.paused = startPaused;
      if (this.playbackSpeed < 0) {
        this._frameIndex = this._endIndex;
      } else {
        this._frameIndex = this._startIndex;
      }
    }
    changeTag(tagname) {
      if (!this._tags.hasOwnProperty(tagname)) {
        throw new Error(`The animation tag "${tagname}" does not exist!`);
      }
      this._currentTag = tagname;
      this._startIndex = this._tags[this._currentTag].start;
      this._endIndex = this._tags[this._currentTag].end;
      if (this.playbackSpeed < 0) {
        this._frameIndex = this._endIndex;
      } else {
        this._frameIndex = this._startIndex;
      }
    }
    update(dt) {
      if (!this.paused) {
        this._frameTimer -= dt;
        if (this._frameTimer <= 0) {
          this.advanceFrame(this.playbackSpeed / Math.abs(this.playbackSpeed));
          this._frameTimer = this._frameDelay / Math.abs(this.playbackSpeed);
        }
      }
    }
    render(renderTarget = this._sketch) {
      renderTarget.push();
      renderTarget.translate(this.position.x, this.position.y);
      renderTarget.scale(this._scale.x, this._scale.y);
      renderTarget.rotate(this.rotation);
      renderTarget.image(
        this._frames[this._frameIndex],
        -this.displayAnchor.x,
        -this.displayAnchor.y
      );
      renderTarget.pop();
    }
    scale(arg1, arg2) {
      if (arg2 == null) {
        this._scale.x *= arg1;
        this._scale.y *= arg1;
      } else {
        this._scale.x *= arg1;
        this._scale.y *= arg2;
      }
    }
    scaleAbsolute(arg1, arg2) {
      if (arg2 == null) {
        this._scale.x = arg1;
        this._scale.y = arg1;
      } else {
        this._scale.x = arg1;
        this._scale.y = arg2;
      }
    }
  };
})((window.Kepler = window.Kepler || {}));
