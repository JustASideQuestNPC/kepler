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

/**
 * Automatically runs once when the webpage is loaded.
 * @function
 */
function setup() {
  createCanvas(600, 600);

  input = KInput.makeNew(window);
  input.addAction({
    name: "move up",
    keys: [Key.W, Key.UP]
  });
  input.addAction({
    name: "move down",
    keys: [Key.S, Key.DOWN]
  });
  input.addAction({
    name: "move left",
    keys: [Key.A, Key.LEFT]
  });
  input.addAction({
    name: "move right",
    keys: [Key.D, Key.RIGHT]
  });

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
  if (input.isActive(name)) fill("#59fa4b");
  else fill("#f74639");
}

/**
 * A very basic custom entity.
 */
class DemoEntity extends KEntity {
  /** @type {string[]} */
  tags = ["demo"];

  /** @type {p5.Vector} */
  position;

  /** @type {number} */
  moveSpeed = 300;

  /**
   * Constructs a new DemoEntity.
   * @constructor
   * @param {number} x The entity's starting X coordinate.
   * @param {number} y The entity's starting Y coordinate.
   */
  constructor(x, y) {
    super();
    this.position = new p5.Vector(x, y);
  }

  /**
   * Updates the entity.
   * @method
   * @override
   * @param {number} dt The time between the previous 2 updates, in seconds.
   */
  update(dt) {
    // determine movement
    let moveStep = new p5.Vector();
    if (input.isActive("move up"))    --moveStep.y;
    if (input.isActive("move down"))  ++moveStep.y;
    if (input.isActive("move left"))  --moveStep.x;
    if (input.isActive("move right")) ++moveStep.x;

    // scale movement to speed
    moveStep.normalize();
    moveStep.mult(this.moveSpeed);

    // scale movement to delta time and move the entity
    moveStep.mult(dt);
    this.position.add(moveStep);


    // delete if offscreen
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