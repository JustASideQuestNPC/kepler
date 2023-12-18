// reserved entity tags - these are symbols to prevent a user-defined tag from
// accidentally having the same value
const USE_RAW_DELTA_TIME = Symbol();

/**
 * Primary game engine class that manages rendering and updates for all entities
 * @class
 */
class KEngine {
  /**
   * A user-defined game entity class. Can be literally anything as long as it
   * derives from KEntity.
   * @typedef {KEntity} Entity
   */

  /**
   * Any object that the p5 drawing API can be used with.
   * @typedef {(Window | p5 | p5.Graphics | p5.Framebuffer)} Renderable
   */

  /**
   * All entities that are currently being managed by the engine.
   * @private
   * @type {Entity[]}
   */
  #entities = [];

  /**
   * The sketch instance containing the engine.
   * @private
   * @type {Window | p5}
   */
  #sketch;

  // public getter/setter for the render target
  get renderTarget() {
    return this.#renderTarget;
  }
  set renderTarget(rt) {
    this.#renderTarget = rt;
    this.#screenWidth = rt.width;
    this.#screenHeight = rt.height;
  }

  /**
   * Where entities are rendered to when the engine's `render` method is called.
   * Note: This only affects what is passed to each entity's `render` method, so
   * it will have no effect unless the entity draws to it.
   * @private
   * @type {!Renderable}
   */
  #renderTarget;

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

  // public getter/setter for camera position
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
  #cameraPos = new p5.Vector;

  /**
   * The position the camera is attempting to reach.
   * @type {p5.Vector}
   */
  cameraTarget = new p5.Vector;

  // getter/setter for camera anchor
  get cameraAnchor() {
    return new p5.Vector(-this.#cameraOffset.x, -this.#cameraOffset.y);
  }
  set cameraAnchor(anchor) {
    this.#cameraOffset.x = -anchor.x;
    this.#cameraOffset.y = -anchor.y;
  }

  /**
   * The offset of the camera; defaults to placing the camera at the center of
   * the screen.
   * @private
   * @type {p5.Vector}
   */
  #cameraOffset = new p5.Vector;

  /**
   * Determines how closely the camera position follows the target. A tightness
   * of 1 causes the camera to always be at the target position, a tightness of
   * 0 causes the camera to never move regardless of the target position, and a
   * tightness between 0 and 1 causes the camera to move toward the target
   * position over multiple frames.
   * 
   * Note: Camera speeds are currently framerate-dependent for performance
   * reasons (also, trying to fix it is confusing and it makes my brain hurt).
   * @type {number}
   */
  cameraTightness = 1;

  /**
   * The time between the last 2 updates, in seconds.
   * @type {number}
   */
  get deltaTimeRaw() {
    return this.#sketch.deltaTime / 1000;
  }

  /**
   * The time between the last 2 updates, in seconds, multiplied by the current
   * delta time multiplier.
   * @type {number}
   */
  get deltaTime() {
    return this.#sketch.deltaTime / 1000 * this.deltaTimeMultiplier;
  }

  /**
   * The number of entities currently in the engine.
   * @type {number}
   */
  get numEntities() {
    return this.#entities.length;
  }

  /**
   * The current delta time multiplier or "speed of time". When entities are
   * updated, their update method is passed the current delta time multiplied
   * by this unless the entity has the USE_RAW_DELTA_TIME tag. A multiplier of 1
   * (the default) keeps the same speed, a multiplier > 1 increases speed, and 
   * a multiplier < 1 lowers speed. Multipliers <= 0 create undefined behavior
   * (in other words, it's probably bad but I don't feel like testing it)!
   * @type {number}
   */
  deltaTimeMultiplier = 1;

  /**
   * Creates a new KEngine.
   * @constructor
   * @param {Window | p5} sketch The sketch instance to define input listeners
   *    for. If you're running your code in global mode, this should be
   *    `window`. If you're running your code in instance mode, this should be
   *    the same object you're defining `setup` and `draw` for.
   */
  constructor(sketch) {
    this.#sketch = sketch;
    this.renderTarget = sketch;
    this.cameraAnchor = new p5.Vector(this.#screenWidth / 2,
                                      this.#screenHeight / 2);
    this.cameraPos = this.cameraAnchor;
  }

  /**
   * Adds an entity to the engine.
   * @method
   * @param {Entity} entity The entity to add to the engine.
   * @returns {Entity} A reference to the entity that was just added. This can
   *    (and in most cases should) be safely ignored, but if you have an entity
   *    that needs to be accessed often, you can use this to store it in a
   *    variable for easy (and faster) access.
   */
  addEntity(entity) {
    // all entities have a reference to the engine holding them
    entity.engine = this;
    this.#entities.push(entity);
    // return a reference to the entity in case you want to store it somewhere
    return entity;
  }

  /**
   * Updates all active entities with the current time delta - call this once at
   * the top of your `draw` loop.
   * @method
   */
  update() {
    // save the multiplied delta time to prevent any weirdness if something
    // changes the multiplier midway through the update cycle
    let dt = this.deltaTime;

    for (let e of this.#entities) {
      if (!e.disableUpdate && !e.markForDelete) {
        if (e.hasTag(USE_RAW_DELTA_TIME)) e.update(this.deltaTimeRaw);
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
   * Renders all active entities - call this once somewhere in your `draw` loop.
   * @method
   */
  render() {
    let renderOffset = p5.Vector.add(this.#cameraPos, this.#cameraOffset);

    this.#renderTarget.push();
    this.#renderTarget.translate(-renderOffset.x, -renderOffset.y);
      for (let e of this.#entities) {
        if (!e.disableRender) e.render(this.#renderTarget);
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
  clearEntityList() {
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
}

/**
 * Base class that custom entities should inherit from.
 * @class
 */
class KEntity {
  /**
   * Tags can be used to indicate what entities are (i.e., a wall) and what they
   * can do (i.e., collide with the player). Entities can have any number of
   * tags or none at all, but it's a good idea to at least give them a tag
   * indicating what they are. 
   * 
   * Tags can be whatever you want (strings are typically easiest, but the
   * built-in ones are Symbols), but there are a few built-in tags with reserved
   * names:
   * - Entities with the `USE_RAW_DELTA_TIME` tag will have the "true" delta
   *   time passed to their `update` method, regardless of multiplier.
   * @type {any[]}
   */
  tags = [];

  /**
   * A reference to the engine holding the entity - this is very useful for
   * changing engine settings from inside an entity's `update` method. The
   * engine will set this for you when the entity is added - don't set it
   * manually unless you know what you're doing.
   * @type {KEngine}
   */
  engine;

  /**
   * If `true`, the entity will be removed from the engine at the end of the
   * current update cycle.
   * @type {boolean}
   */
  markForDelete = false;

  /**
   * If `true`, the entity will be skipped when the engine updates all entities.
   * This should only be used to *temporarily* disable entities as the entity is
   * still using memory and being checked in the loop - if you want to remove
   * an entity permanently, use `entity.markForDelete` instead.
   * @type {boolean}
   */
  disableUpdate = false;

  /**
   * If `true`, the entity will be skipped when the engine renders all entities.
   * This should only be used to *temporarily* disable entities as the entity is
   * still using memory and being checked in the loop - if you want to remove
   * an entity permanently, use `entity.markForDelete` instead.
   * @type {boolean}
   */
  disableRender = false;

  /**
   * Updates the entity, called by `KEngine.update()`. Only does something if
   * you override it in your entity class.
   * @method
   * @param {number} dt - The time between the previous 2 updates, in seconds.
   *    Multiplying things like velocity by this allows you to run them at the
   *    same speed, regardless of framerate.
   */
  update(dt) {}

  /**
   * Renders the entity, called by `KEngine.render()`. Only does something if
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

  // abstract classes that can't be instantiantiated and must be extended don't
  // exist because this is javascript...but this is javascript, so we can just
  // hack them in anyway :)
  constructor() {
    if (new.target === KEntity) {
      throw new Error("KEntity is an abstract class and cannot " +
          "be instantiated directly (extend it instead)!");
    }
  }
}