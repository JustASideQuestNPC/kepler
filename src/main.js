/**
 * Global handler for the input system.
 * @type {KInput}
 */
let input;

/**
 * Global game engine.
 * @type {KEngine}
 */
let engine;

/** @type {DemoEntity} */
let testEntity;

/** @type {number} */
let timesClicked = 0;

/**
 * Automatically runs once when the webpage is loaded.
 * @function
 */
function setup() {
  createCanvas(600, 600);

  input = KInput.makeNew(window);

  engine = new KEngine(window);
  testEntity = engine.addEntity(new DemoEntity(width / 2, height / 2));

  textSize(18);
  textAlign(LEFT, TOP);
}


/**
 * Automatically runs once per frame after `setup` finishes.
 * @function
 */
function draw() {
  // update input handler and engine
  input.update();
  engine.update();

  background(255);
  engine.render();
}


/**
 * Sets the fill color to green if the named input action is active, and red if
 * it is inactive.
 * @function
 * @param {string} name - The name of the input action.
 */
function setFillColor(name) {
  if (input.isActive(name)) fill(64, 237, 64);
  else fill(250, 50, 50);
}

/**
 * A very basic custom entity.
 */
class DemoEntity extends KEntity {
  /** @type {string[]} */
  tags = ["demo"];

  /** @type {p5.Vector} */
  position;

  /** @type {p5.Vector} */
  velocity;

  /**
   * Constructs a new DemoEntity.
   * @constructor
   * @param {number} x The entity's starting X coordinate.
   * @param {number} y The entity's starting Y coordinate.
   */
  constructor(x, y) {
    super();
    this.position = new p5.Vector(x, y);
    this.velocity = p5.Vector.random2D();
    this.velocity.mult(450);
  }

  /**
   * Updates the entity.
   * @method
   * @override
   * @param {number} dt The time between the previous 2 updates, in seconds.
   */
  update(dt) {
    let moveStep = p5.Vector.mult(this.velocity, dt);
    this.position.add(moveStep);

    if (this.position.x < 0 || this.position.x > width ||
        this.position.y < 0 || this.position.y > height) {
      this.engine.addEntity(new DemoEntity(width / 2, height / 2));
      this.markForDelete = true;
    }
  }

  /**
   * Renders the entity to the canvas.
   * @method
   * @override
   */
  render() {
    noStroke();
    fill(255, 0, 0);
    ellipse(this.position.x, this.position.y, 70, 70);
  }
}