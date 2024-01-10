/*
 *   _                 _                                 _              
 *  | | __ ___  _ __  | |  ___  _ __  ___  _ __    __ _ (_) _ __    ___ 
 *  | |/ // _ \| '_ \ | | / _ \| '__|/ _ \| '_ \  / _` || || '_ \  / _ \
 *  |   <|  __/| |_) || ||  __/| | _|  __/| | | || (_| || || | | ||  __/
 *  |_|\_\\___|| .__/ |_| \___||_|(_)\___||_| |_| \__, ||_||_| |_| \___|
 *             |_|                                |___/                 
 * 
 *  Part of Kepler, a 2d game engine for p5.js
 *  https://github.com/JustASideQuestNPC/kepler
 */
(function (Kepler) {
  Kepler.ENGINE_INCLUDED = true;
  Kepler.USES_RAW_DELTA_TIME = Symbol();
  Kepler.USES_SCREEN_SPACE_COORDS = Symbol();
  Kepler.Engine = class {
    #sketch;
    #entities = [];
    get numEntities() {
      return this.#entities.length;
    }
    get deltaTimeRaw() {
      return this.#lastDt;
    }
    get deltaTime() {
      return this.#lastDt * this.deltaTimeMultiplier;
    }
    #lastDt = 0;
    #dtCounter = 0;
    deltaTimeMultiplier = 1;
    get tickRate() {
      return this.#tickRate;
    }
    set tickRate(rate) {
      if (rate <= 0) {
        throw new Error("Tick rate cannot be <= 0!");
      } else if (rate < 60) {
        console.warn(
          `Tick rate of ${rate} tps is low and may cause a choppy ` +
            `simulation (recommended tick rate is at least 50-60).`
        );
      }
      this.#tickRate = rate;
      this.#secondsPerTick = 1 / rate;
    }
    #tickRate;
    #secondsPerTick;
    get renderTarget() {
      return this.#renderTarget;
    }
    set renderTarget(rt) {
      this.#renderTarget = rt;
      this.#screenWidth = rt.width;
      this.#screenHeight = rt.height;
      this.cameraAnchor = this.#sketch.createVector(
        this.#screenWidth / 2,
        this.#screenHeight / 2
      );
      this.cameraPos = this.cameraAnchor;
      this.worldWidth = this.#screenWidth;
      this.worldHeight = this.#screenHeight;
    }
    #renderTarget;
    get renderWidth() {
      return this.#screenWidth;
    }
    get renderHeight() {
      return this.#screenHeight;
    }
    #screenWidth;
    #screenHeight;
    get cameraPos() {
      return this.#cameraPos;
    }
    set cameraPos(pos) {
      this.#cameraPos = pos.copy();
      this.cameraTarget = pos.copy();
    }
    #cameraPos;
    cameraTarget;
    get cameraAnchor() {
      return this.#sketch.createVector(
        -this.#cameraOffset.x,
        -this.#cameraOffset.y
      );
    }
    set cameraAnchor(anchor) {
      this.#cameraOffset.x = -anchor.x;
      this.#cameraOffset.y = -anchor.y;
    }
    #cameraOffset;
    cameraTightness = 1;
    useCameraBoundary = false;
    #maxRenderX;
    #maxRenderY;
    #renderX = 0;
    #renderY = 0;
    get worldWidth() {
      return this.#worldWidth;
    }
    set worldWidth(w) {
      this.#worldWidth = w;
      this.#maxRenderX = this.#worldWidth - this.#screenWidth;
    }
    #worldWidth;
    get worldHeight() {
      return this.#worldHeight;
    }
    set worldHeight(w) {
      this.#worldHeight = w;
      this.#maxRenderY = this.#worldHeight - this.#screenHeight;
    }
    #worldHeight;
    constructor({
      sketch,
      renderTarget = null,
      tickRate = null,
      cameraAnchor = null,
      cameraPos = null,
      useCameraBoundary = false,
      cameraTightness = 1,
      worldWidth = null,
      worldHeight = null,
    } = {}) {
      if (sketch == null) {
        throw new Error(
          "Kepler.Engine requires a sketch! (if you're running in global " +
            'mode, use "window")'
        );
      }
      this.#sketch = sketch;
      this.#cameraPos = sketch.createVector();
      this.cameraTarget = sketch.createVector();
      this.#cameraOffset = sketch.createVector();
      this.cameraTightness = cameraTightness;
      this.renderTarget = renderTarget || sketch;
      this.tickRate = tickRate || sketch.getTargetFrameRate();
      if (cameraAnchor != null) {
        this.cameraAnchor = this.#sketch.createVector(
          cameraAnchor.x,
          cameraAnchor.y
        );
      } else {
        this.cameraAnchor = this.#sketch.createVector(
          this.#screenWidth / 2,
          this.#screenHeight / 2
        );
      }
      if (cameraPos != null) {
        this.cameraPos = this.#sketch.createVector(
          cameraPos.x,
          cameraPos.y
        );
      } else {
        this.cameraPos = this.cameraAnchor.copy();
      }
      this.useCameraBoundary = useCameraBoundary;
      this.worldWidth = worldWidth || this.#worldWidth;
      this.worldHeight = worldHeight || this.#worldHeight;
    }
    addEntity(entity) {
      entity.engine = this;
      this.#entities.push(entity);
      return entity;
    }
    update() {
      this.#dtCounter += this.#sketch.deltaTime / 1000;
      if (this.#dtCounter < this.#secondsPerTick) {
        return;
      }
      this.#lastDt = this.#dtCounter;
      this.#dtCounter = 0;
      let dt = this.#lastDt * this.deltaTimeMultiplier;
      for (let e of this.#entities) {
        if (!e.markForDelete) {
          if (e.hasTag(Kepler.USES_RAW_DELTA_TIME)) {
            e.update(this.deltaTimeRaw);
          } else {
            e.update(dt);
          }
        }
      }
      this.#entities = this.#entities.filter((e) => !e.markForDelete);
      if (!this.#cameraPos.equals(this.cameraTarget)) {
        this.#cameraPos.lerp(this.cameraTarget, this.cameraTightness);
      }
    }
    render() {
      this.#renderX = this.#cameraPos.x + this.#cameraOffset.x;
      this.#renderY = this.#cameraPos.y + this.#cameraOffset.y;
      if (this.useCameraBoundary) {
        this.#renderX = this.#sketch.constrain(
          this.#renderX,
          0,
          this.#maxRenderX
        );
        this.#renderY = this.#sketch.constrain(
          this.#renderY,
          0,
          this.#maxRenderY
        );
      }
      this.#renderTarget.push();
      this.#renderTarget.translate(-this.#renderX, -this.#renderY);
      for (let e of this.#entities) {
        if (e.hasTag(Kepler.USES_SCREEN_SPACE_COORDS)) {
          this.#renderTarget.translate(this.#renderX, this.#renderY);
          e.render(this.#renderTarget);
          this.#renderTarget.translate(-this.#renderX, -this.#renderY);
        } else {
          e.render(this.#renderTarget);
        }
      }
      this.#renderTarget.pop();
    }
    removeIf(predicate) {
      this.#entities = this.#entities.filter((e) => predicate(e));
    }
    removeTagged(tag) {
      this.removeIf((e) => e.hasTag(tag));
    }
    removeAll() {
      this.#entities = [];
    }
    getIf(predicate) {
      return this.#entities.filter((e) => predicate(e));
    }
    getTagged(tag) {
      return this.getIf((e) => e.hasTag(tag));
    }
    screenPosToWorldPos(arg1, arg2) {
      if (arg1.constructor === p5.Vector) {
        return this.#sketch.createVector(
          arg1.x + this.#renderX,
          arg1.y + this.#renderY
        );
      } else {
        return [arg1 + this.#renderX, arg2 + this.#renderY];
      }
    }
    worldPosToScreenPos(arg1, arg2) {
      if (arg1.constructor === p5.Vector) {
        return this.#sketch.createVector(
          arg1.x - this.#renderX,
          arg1.y - this.#renderY
        );
      } else {
        return [arg1 - this.#renderX, arg2 - this.#renderY];
      }
    }
  };
  Kepler.Entity = class {
    tags = [];
    engine;
    markForDelete = false;
    update(dt) {}
    render(rt) {}
    setup() {}
    hasTag(tag) {
      return this.tags.includes(tag);
    }
    constructor() {
      if (new.target === Kepler.Entity) {
        throw new Error(
          "Kepler.Entity is an abstract class and cannot be instantiated " +
            "directly (extend it instead)!"
        );
      }
    }
  };
})((window.Kepler = window.Kepler || {}));