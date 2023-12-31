// add engine stuff to the Kepler namespace using a "self-executing anonymous
// function" and associated black magic
(function(Kepler) {
  // reserved entity tags - these are symbols to prevent a user-defined tag from
  // accidentally having the same value
  Kepler.USES_RAW_DELTA_TIME = Symbol();
  Kepler.USES_SCREEN_SPACE_COORDS = Symbol();

  /**
   * Primary game engine class that manages rendering and updates for all entities
   * @class
   */
  Kepler.Engine = class {
    /* jsdoc typedefs */
    /**
     * A user-defined game entity class. Can be literally anything as long as it
     * derives from KEntity.
     * @typedef {Kepler.KEntity} Entity
     */

    /**
     * Any object that the p5 drawing API can be used with.
     * @typedef {(Window | p5 | p5.Graphics | p5.Framebuffer)} Renderable
     */


    /* simulation vars */
    /**
     * The sketch instance containing the engine.
     * @private
     * @type {Window | p5}
     */
    #sketch;

    /**
     * All entities that are currently being managed by the engine.
     * @private
     * @type {Entity[]}
     */
    #entities = [];

    /**
     * The number of entities currently in the engine.
     * @type {number}
     */
    get numEntities() {
      return this.#entities.length;
    }

    /**
     * The time between the last 2 updates, in seconds.
     * @type {number}
     */
    get deltaTimeRaw() {
      return this.#lastDt;
    }

    /**
     * The time between the last 2 updates, in seconds, multiplied by the
     * current delta time multiplier.
     * @type {number}
     */
    get deltaTime() {
      return this.#lastDt * this.deltaTimeMultiplier;
    }

    /**
     * The time between the last 2 updates, in second.
     * @private
     * @type {number}
     */
    #lastDt = 0;

    /**
     * How many seconds have passed since the last update.
     * @private
     * @type {number}
     */
    #dtCounter = 0;

    /**
     * The current delta time multiplier or "speed of time". When entities are
     * updated, their update method is passed the current delta time multiplied
     * by this unless the entity has the USE_RAW_DELTA_TIME tag. A multiplier of
     * 1 (the default) keeps the same speed, a multiplier > 1 increases speed,
     * and a multiplier < 1 lowers speed. Multipliers <= 0 create undefined
     * behavior (in other words, it's probably bad but I don't feel like testing
     * it)!
     * @type {number}
     */
    deltaTimeMultiplier = 1;

    /**
     * The current tick rate, which determines how many times per second the
     * engine updates (it's like frame rate, but for updating instead of
     * drawing). The default tick rate is the sketch's frame rate. Note: The
     * tick rate must be > 0!
     * @type {number}
     */
    get tickRate() {
      return this.#tickRate;
    }
    set tickRate(rate) {
      if (rate <= 0) {
        throw new Error("Tick rate cannot be <= 0!");
      }
      else if (rate < 60) {
        console.warn(`Tick rate of ${rate} tps is low and may cause a choppy ` +
            `simulation (recommended tick rate is at least 50-60).`);
      }
      this.#tickRate = rate;
      this.#secondsPerTick = 1 / rate;
    }

    /**
     * The current tick rate, which determines how many times per second the
     * engine updates (it's like frame rate, but for updating instead of
     * drawing). The default tick rate is the sketch's frame rate.
     * @private
     * @type {number}
     */
    #tickRate;

    /**
     * How long to wait before performing another update cycle, in seconds.
     * @private
     * @type {number}
     */
    #secondsPerTick;


    /* rendering and camera vars */
    /**
     * Where entities are rendered to when the engine's `render` method is
     * called. Note: This only affects what is passed to each entity's `render`
     * method, so it will have no effect unless the entity draws to it.
     * @type {Renderable}
     */
    get renderTarget() {
      return this.#renderTarget;
    }
    set renderTarget(rt) {
      this.#renderTarget = rt;
      this.#screenWidth = rt.width;
      this.#screenHeight = rt.height;
      // changing the render target resets camera settings
      this.cameraAnchor = createVector(this.#screenWidth / 2,
                                        this.#screenHeight / 2);
      this.cameraPos = this.cameraAnchor;
      this.useCameraBoundary = false;
    }

    /**
     * Where entities are rendered to when the engine's `render` method is
     * called. Note: This only affects what is passed to each entity's `render`
     * method, so it will have no effect unless the entity draws to it.
     * @private
     * @type {Renderable}
     */
    #renderTarget;

    /**
     * Width of the canvas the engine is rendering to.
     * @type {number}
     */
    get renderWidth() {
      return this.#screenWidth;
    }

    /**
     * Height of the canvas the engine is rendering to.
     * @type {number}
     */
    get renderHeight() {
      return this.#screenHeight;
    }

    /**
     * @private
     * @type {number}
     */
    #screenWidth;
    /**
    * @private
    * @type {number}
    */
    #screenHeight;

    /**
     * The position of the camera in world space. If `useCameraBoundary` is
     * `true`, the camera position will always be constrained within the world
     * boundary.
     * @type {number}
     */
    get cameraPos() {
      return this.#cameraPos;
    }
    set cameraPos(pos) {
      this.#cameraPos = pos;
      this.cameraTarget = pos;
    }

    /**
     * The current position of the camera.
     * @private
     * @type {p5.Vector}
     */
    #cameraPos = createVector();

    /**
     * The position the camera is attempting to reach.
     * @type {p5.Vector}
     */
    cameraTarget = createVector();

    /**
     * A vector that etermines what point on the screen the camera position
     * corresponds to. An anchor of `(0, 0)` places the camera at the top left
     * corner of the screen, an anchor of `(width, height)` places the camera at
     * the bottom right corner of the screen, and so on. The default camera
     * anchor is `(width / 2, height / 2)`, which places the camera at the
     * center of the screen.
     */
    get cameraAnchor() {
      return createVector(-this.#cameraOffset.x, -this.#cameraOffset.y);
    }
    set cameraAnchor(anchor) {
      // the camera anchor can be set from either a p5.Vector or an array of coords
      if (anchor.constructor === Array) {
        this.#cameraOffset.x = -anchor[0];
        this.#cameraOffset.y = -anchor[1];
      }
      else {
        this.#cameraOffset.x = -anchor.x;
        this.#cameraOffset.y = -anchor.y;
      }
    }

    /**
     * The offset of the camera; defaults to placing the camera at the center of
     * the screen.
     * @private
     * @type {p5.Vector}
     */
    #cameraOffset = createVector();

    /**
     * Determines how closely the camera position follows the target. A
     * tightness of 1 causes the camera to always be at the target position, a
     * tightness of 0 causes the camera to never move regardless of the target
     * position, and a tightness between 0 and 1 causes the camera to move
     * toward the target position over multiple ticks.
     * @type {number}
     */
    cameraTightness = 1;

    /**
     * Enables or disables the camera boundary. If `true`, the position of the
     * camera will be limited to only display areas within the world boundary,
     * which is defined by worldWidth and worldHeight. The default is `false`.
     * @type {boolean}
     */
    useCameraBoundary = false;

    /**
     * The maximum render offset in the x direction (assuming the camera
     * boundary is enabled).
     * @private
     * @type {number}
     */
    #maxRenderX;

    /**
     * The maximum render offset in the y direction (assuming the camera
     * boundary is enabled).
     * @private
     * @type {number}
     */
    #maxRenderY;

    /**
     * Where the canvas is translating to in the x direction; used for
     * coordinate conversions.
     * @private
     * @type {number}
     */
    #renderX = 0;

    /**
     * Where the canvas is translating to in the y direction; used for coordinate
     * conversions.
     * @private
     * @type {number}
     */
    #renderY = 0;


    /* world vars */
    /**
     * The width of the world; used for the camera boundary.
     * @type {number}
     */
    get worldWidth() {
      return this.#worldWidth;
    }
    set worldWidth(w) {
      this.#worldWidth = w;
      this.#maxRenderX = this.#worldWidth - this.#screenWidth;
    }

    /**
     * The width of the world; used for the camera boundary.
     * @private
     * @type {number}
     */
    #worldWidth;

    /**
     * The height of the world; used for the camera boundary.
     * @type {number}
     */
    get worldHeight() {
      return this.#worldHeight;
    }
    set worldHeight(w) {
      this.#worldHeight = w;
      this.#maxRenderY = this.#worldHeight - this.#screenHeight;
    }

    /**
     * The height of the world; used for the camera boundary.
     * @private
     * @type {number}
     */
    #worldHeight;

    /**
     * The size of the world; used for the camera boundary.
     * @param {[number, number]} size
     */
    set worldSize(size) {
      this.worldWidth = size[0];
      this.worldHeight = size[1];
    }


    /**
     * Creates a new KEngine.
     * @constructor
     * @param {Window | p5} sketch The sketch instance the engine is running in.
     *    If you're running your code in global mode, this should be `window`.
     *    If you're running your code in instance mode, this should be the same
     *    object you're defining `setup` and `draw` for.
     */
    constructor(sketch) {
      this.#sketch = sketch;
      this.renderTarget = sketch;
      this.cameraAnchor = createVector(this.#screenWidth / 2,
                                        this.#screenHeight / 2);
      this.cameraPos = this.cameraAnchor;
      this.tickRate = sketch.getTargetFrameRate();
    }

    /**
     * Adds an entity to the engine.
     * @method
     * @param {Entity} entity The entity to add to the engine.
     * @returns {Entity} A reference to the entity that was just added. This can
     *    (and in most cases should) be safely ignored, but if you have an
     *    entity that needs to be accessed often, you can use this to store it
     *    in a variable for easy (and faster) access.
     */
    addEntity(entity) {
      // all entities have a reference to the engine holding them
      entity.engine = this;
      this.#entities.push(entity);
      // return a reference to the entity in case you want to store it somewhere
      return entity;
    }

    /**
     * Updates all active entities with the current time delta - call this once
     * at the top of your `draw` loop.
     * @method
     */
    update() {
      // increment the dt counter and stop execution if we don't need to update
      this.#dtCounter += this.#sketch.deltaTime / 1000;
      if (this.#dtCounter < this.#secondsPerTick) return;

      this.#lastDt = this.#dtCounter;
      this.#dtCounter = 0;

      // save the multiplied delta time to prevent any weirdness if something
      // changes the multiplier midway through the update cycle
      let dt = this.#lastDt * this.deltaTimeMultiplier;
      for (let e of this.#entities) {
        if (!e.markForDelete) {
          if (e.hasTag(Kepler.USES_RAW_DELTA_TIME)) e.update(this.deltaTimeRaw);
          else e.update(dt);
        }
      }

      // remove deleted entities
      this.#entities = this.#entities.filter((e) => !e.markForDelete);

      // update the camera position if necessary
      if (!this.#cameraPos.equals(this.cameraTarget)) {
        this.#cameraPos.lerp(this.cameraTarget, this.cameraTightness);
      }
    }

    /**
     * Renders all active entities - call this once somewhere in your `draw`
     * loop.
     * @method
     */
    render() {
      // calculate camera position
      this.#renderX = this.#cameraPos.x + this.#cameraOffset.x;
      this.#renderY = this.#cameraPos.y + this.#cameraOffset.y;

      // apply camera boundary
      if (this.useCameraBoundary) {
        this.#renderX = this.#sketch.constrain(this.#renderX, 0,
            this.#maxRenderX);
        this.#renderY = this.#sketch.constrain(this.#renderY, 0,
            this.#maxRenderY);
      }

      this.#renderTarget.push();
      this.#renderTarget.translate(-this.#renderX, -this.#renderY);
        for (let e of this.#entities) {
          if (e.hasTag(Kepler.USES_SCREEN_SPACE_COORDS)) {
            // translate back to (0, 0) and render the entity
            this.#renderTarget.translate(this.#renderX, this.#renderY);
            e.render(this.#renderTarget);
            this.#renderTarget.translate(-this.#renderX, -this.#renderY);
          }
          else {
            e.render(this.#renderTarget);
          }
        }
      this.#renderTarget.pop();
    }

    /**
     * Deletes all entities that a predicate function returns `true` for.
     * @method
     * @param {function(Entity): boolean} predicate A predicate function that
     *    takes an entity as a parameter, and returns a boolean based on whether
     *    the entity should be deleted.
     */
    removeIf(predicate) {
      this.#entities = this.#entities.filter((e) => predicate(e));
    }

    /**
     * Deletes all entities that have the specified tag.
     * @method
     * @param {any} tag
     */
    removeTagged(tag) {
      this.removeIf((e) => e.hasTag(tag));
    }

    /**
     * Deletes all entities.
     * @method
     */
    removeAll() {
      this.#entities = [];
    }

    /**
     * Returns a list containing all entities that a predicate function returns
     * `true` for.
     * @method
     * @param {function(Entity): boolean} predicate A predicate function that
     *    takes an entity as a parameter, and returns a boolean based on whether
     *    the entity should be included in the list.
     * @returns {Entity[]}
     */
    getIf(predicate) {
      return this.#entities.filter((e) => predicate(e));
    }

    /**
     * Returns a list containing all entities with the specified tag.
     * @param {any} tag 
     * @returns {Entity[]}
     */
    getTagged(tag) {
      return this.getIf((e) => e.hasTag(tag));
    }

    /**
     * Converts a position in screen space to a position in world space.
     * @overload
     * @param {p5.Vector} arg1
     * @returns {p5.Vector}
     *
     * @overload
     * @param {number} arg1 x coordinate in screen space
     * @param {number} arg2 y coordinate in screen space
     * @returns {[number, number]}
     */
    screenPosToWorldPos(arg1, arg2) {
      if (arg1.constructor === p5.Vector) {
        return this.#sketch.createVector(arg1.x + this.#renderX,
            arg1.y + this.#renderY);
      }
      else {
        return [arg1 + this.#renderX, arg2 + this.#renderY]
      }
    }

    /**
     * Converts a position in world space to a position in screen space.
     * @overload
     * @param {p5.Vector} arg1
     * @returns {p5.Vector}
     *
     * @overload
     * @param {number} arg1 x coordinate in world space
     * @param {number} arg2 y coordinate in world space
     * @returns {[number, number]}
     */
    worldPosToScreenPos(arg1, arg2) {
      if (arg1.constructor === p5.Vector) {
        return this.#sketch.createVector(arg1.x - this.#renderX,
            arg1.y - this.#renderY);
      }
      else {
        return [arg1 - this.#renderX, arg2 - this.#renderY]
      }
    }
  }

  /**
   * Abstract base class that all entities should inherit from.
   * @class
   */
  Kepler.Entity = class {
    /**
     * Tags can be used to indicate what entities are (i.e., a wall) and what
     * they can do (i.e., collide with the player). Entities can have any number
     * of tags or none at all, but it's typically a good idea to at least give
     * them a tag indicating what they are. 
     * 
     * Tags can be whatever you want (strings are typically easiest, but the
     * built-in ones are Symbols), but there are a few built-in tags with
     * reserved names:
     * - Entities with the `Kepler.USES_RAW_DELTA_TIME` tag will always have the
     *   "true" delta time passed to their `update` method.
     * - Entities with the `Kepler.USES_SCREEN_SPACE_COORDS` tag will ignore
     *   camera position when being rendered - (0, 0) in their `render` method
     *   will always be at the top left corner of the screen.
     * @type {any[]}
     */
    tags = [];

    /**
     * A reference to the engine holding the entity - this is very useful for
     * changing engine settings from inside an entity's `update` method. The
     * engine will set this for you when the entity is added - don't set it
     * manually unless you know what you're doing.
     * @type {Kepler.Engine}
     */
    engine;

    /**
     * If `true`, the entity will be removed from the engine at the end of the
     * current update cycle.
     * @type {boolean}
     */
    markForDelete = false;

    /**
     * Updates the entity; called in `Engine.update()`. Only does something if
     * you override it in your entity class.
     * @method
     * @param {number} dt - The time between the previous 2 updates, in seconds.
     *    Multiplying things like velocity by this allows you to run them at the
     *    same speed, regardless of framerate.
     */
    update(dt) {}

    /**
     * Renders the entity; called in `Engine.render()`. Only does something if
     * you override it in your entity class.
     * @method
     * @param {Renderable} rt The sketch/graphics/etc. that the engine is
     *    is currently rendering (or attempting to render) everything to. If you
     *    only plan on drawing directly to the main sketch, you can ignore this.
     */
    render(rt) {}

    /**
     * Returns whether the entity has the specified tag.
     * @method
     * @param {any} tag The tag to check for.
     * @returns {boolean}
     */
    hasTag(tag) {
      return this.tags.includes(tag);
    }

    // abstract classes that can't be instantiantiated and must be extended
    // don't exist because this is javascript...but this is javascript, so we
    // can just hack them in anyway :)
    constructor() {
      if (new.target === Kepler.Entity) {
        throw new Error("Kepler.Entity is an abstract class and cannot " +
            "be instantiated directly (extend it instead)!");
      }
    }
  }
}(window.Kepler = window.Kepler || {}));