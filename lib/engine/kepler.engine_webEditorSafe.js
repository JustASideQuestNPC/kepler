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
    get numEntities() {
      return this._entities.length;
    }
    get deltaTimeRaw() {
      return this._lastDt;
    }
    get deltaTime() {
      return this._lastDt * this.deltaTimeMultiplier;
    }
    get tickRate() {
      return this._tickRate;
    }
    set tickRate(rate) {
      if (rate <= 0) {
        throw new Error("Tick rate cannot be <= 0!");
      } else if (rate < 60) {
        console.warn(
          `%cKepler.Engine: ` + `%cTick rate of ${rate} tps is low and may ` +
            `cause a choppy simulation (recommended tick rate is at least ` +
            `50-60).`, "color: #30D6FF", "color: default"
        );
      }
      this._tickRate = rate;
      this._secondsPerTick = 1 / rate;
    }
    get renderTarget() {
      return this._renderTarget;
    }
    set renderTarget(rt) {
      this._renderTarget = rt;
      this._screenWidth = rt.width;
      this._screenHeight = rt.height;
      this.cameraAnchor = createVector(
        this._screenWidth / 2,
        this._screenHeight / 2
      );
      this.cameraPos = this.cameraAnchor;
      this.worldWidth = this._screenWidth;
      this.worldHeight = this._screenHeight;
    }
    get renderWidth() {
      return this._screenWidth;
    }
    get renderHeight() {
      return this._screenHeight;
    }
    get cameraPos() {
      return this._cameraPos;
    }
    set cameraPos(pos) {
      this._cameraPos = pos.copy();
      this.cameraTarget = pos.copy();
    }
    get cameraAnchor() {
      return this._sketch.createVector(
        -this._cameraOffset.x,
        -this._cameraOffset.y
      );
    }
    set cameraAnchor(anchor) {
      this._cameraOffset.x = -anchor.x;
      this._cameraOffset.y = -anchor.y;
    }
    get worldWidth() {
      return this._worldWidth;
    }
    set worldWidth(w) {
      this._worldWidth = w;
      this._maxRenderX = this._worldWidth - this._screenWidth;
    }
    get worldHeight() {
      return this._worldHeight;
    }
    set worldHeight(w) {
      this._worldHeight = w;
      this._maxRenderY = this._worldHeight - this._screenHeight;
    }
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
      this._sketch = sketch;
      this._entities = [];
      this._lastDt = 0;
      this._dtCounter = 0;
      this.deltaTimeMultiplier = 1;
      this._cameraPos = sketch.createVector();
      this.cameraTarget = sketch.createVector();
      this._cameraOffset = sketch.createVector();
      this.cameraTightness = cameraTightness;
      this.useCameraBoundary = false;
      this._renderX = 0;
      this._renderY = 0;
      this.renderTarget = renderTarget || sketch;
      this.tickRate = tickRate || sketch.getTargetFrameRate();
      if (cameraAnchor != null) {
        this.cameraAnchor = this._sketch.createVector(
          cameraAnchor.x,
          cameraAnchor.y
        );
      } else {
        this.cameraAnchor = this._sketch.createVector(
          this._screenWidth / 2,
          this._screenHeight / 2
        );
      }
      if (cameraPos != null) {
        this.cameraPos = this._sketch.createVector(
          cameraPos.x,
          cameraPos.y
        );
      } else {
        this.cameraPos = this.cameraAnchor.copy();
      }
      this.useCameraBoundary = useCameraBoundary;
      this.worldWidth = worldWidth || this._worldWidth;
      this.worldHeight = worldHeight || this._worldHeight;
    }
    addEntity(entity) {
      entity.engine = this;
      // check if these need to be set here to get around the web editor's
      // inability to declare fields outside of a constructor, because it's
      // not like anyone *actually* wants to be able to do that, right?
      entity.tags = entity.tags || [];
      entity.markForDelete = entity.markForDelete || false;
      entity.setup();
      this._entities.push(entity);
      return entity;
    }
    update() {
      this._dtCounter += this._sketch.deltaTime / 1000;
      if (this._dtCounter < this._secondsPerTick) {
        return;
      }
      this._lastDt = this._dtCounter;
      this._dtCounter = 0;
      let dt = this._lastDt * this.deltaTimeMultiplier;
      for (let e of this._entities) {
        if (!e.markForDelete) {
          if (e.hasTag(Kepler.USES_RAW_DELTA_TIME)) {
            e.update(this.deltaTimeRaw);
          } else {
            e.update(dt);
          }
        }
      }
      this._entities = this._entities.filter((e) => !e.markForDelete);
      if (!this._cameraPos.equals(this.cameraTarget)) {
        this._cameraPos.lerp(this.cameraTarget, this.cameraTightness);
      }
    }
    render() {
      this._renderX = this._cameraPos.x + this._cameraOffset.x;
      this._renderY = this._cameraPos.y + this._cameraOffset.y;
      if (this.useCameraBoundary) {
        this._renderX = this._sketch.constrain(
          this._renderX,
          0,
          this._maxRenderX
        );
        this._renderY = this._sketch.constrain(
          this._renderY,
          0,
          this._maxRenderY
        );
      }
      this._renderTarget.push();
      this._renderTarget.translate(-this._renderX, -this._renderY);
      for (let e of this._entities) {
        if (e.hasTag(Kepler.USES_SCREEN_SPACE_COORDS)) {
          this._renderTarget.translate(this._renderX, this._renderY);
          e.render(this._renderTarget);
          this._renderTarget.translate(-this._renderX, -this._renderY);
        } else {
          e.render(this._renderTarget);
        }
      }
      this._renderTarget.pop();
    }
    removeIf(predicate) {
      this._entities = this._entities.filter((e) => predicate(e));
    }
    removeTagged(tag) {
      this.removeIf((e) => e.hasTag(tag));
    }
    removeAll() {
      this._entities = [];
    }
    getIf(predicate) {
      return this._entities.filter((e) => predicate(e));
    }
    getTagged(tag) {
      return this.getIf((e) => e.hasTag(tag));
    }
    screenPosToWorldPos(arg1, arg2) {
      if (arg1.constructor === p5.Vector) {
        return this._sketch.createVector(
          arg1.x + this._renderX,
          arg1.y + this._renderY
        );
      } else {
        return [arg1 + this._renderX, arg2 + this._renderY];
      }
    }
    worldPosToScreenPos(arg1, arg2) {
      if (arg1.constructor === p5.Vector) {
        return this._sketch.createVector(
          arg1.x - this._renderX,
          arg1.y - this._renderY
        );
      } else {
        return [arg1 - this._renderX, arg2 - this._renderY];
      }
    }
  };
  Kepler.Entity = class {
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