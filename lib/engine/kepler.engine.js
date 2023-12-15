/** @typedef {number} float - A floating-point number. */
/** @typedef {number} int - An integer number. */

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
   * All entities that are currently being managed by the engine.
   * @type {Entity[]}
   */
  #entities = [];

  /**
   * The sketch instance containing the engine.
   * @private
   * @type {Window | p5}
   */
  #sketch;

  /**
   * The time between the last 2 updates, in seconds.
   * @type {float}
   */
  get deltaTime() {
    return this.#sketch.deltaTime / 1000;
  }

  /**
   * The number of entities currently in the engine.
   * @type {int}
   */
  get numEntities() {
    return this.#entities.length;
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
    for (let e of this.#entities) {
      if (!e.disableUpdate) e.update(this.deltaTime);
    }

    // remove deleted entities
    this.#entities = this.#entities.filter((e) => !e.markForDelete);
  }

  /**
   * Renders all active entities - call this once somewhere in your `draw` loop.
   * @method
   */
  render() {
    for (let e of this.#entities) {
      if (!e.disableRender) e.render();
    }
  }

  /**
   * Creates a new KEngine.
   * @constructor
   * @param {Window | p5} sketch - The sketch instance to define input listeners
   *    for. If you're running your code in **global mode**, this should be
   *    `window`. If you're running your code in **instance mode**, this should
   *    be the same object you're defining `setup` and `draw` for.
   */
  constructor(sketch) {
    this.#sketch = sketch;
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
   * Tags can be whatever you want and you don't have to define them anywhere,
   * but there are a few that are reserved by Kepler and have special behavior:
   * @type {string[]}
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
   * @param {float} dt - The time between the previous 2 updates, in seconds.
   *    Multiplying things like velocity by this allows you to run them at the
   *    same speed, regardless of framerate.
   */
  update(dt) {}

  /**
   * Renders the entity, called by `KEngine.render()`. Only does something if
   * you override it in your entity class.
   * @method
   */
  render() {}

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