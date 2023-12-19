/** @typedef {(POINT | LINE | CIRCLE | POLYGON)} Shape */
const POINT = Symbol();
const LINE = Symbol();
const CIRCLE = Symbol();
const POLYGON = Symbol();


/**
 * A rectangular bounding box; used for polygon collisions
 * @class
 */
class BoundingRect {
  /** @type {number} */
  x;

  /** @type {number} */
  y;

  /** @type {number} */
  w;

  /** @type {number} */
  h;

  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

/**
 * A point collider.
 * @class
 */
class PointCollider {
  /**
   * Collider shape, used for determining the correct collision algorithm.
   * @type {Shape}
   */
  get shape() {
    return POINT;
  }

  /** @type {p5.Vector} */
  position;

  /**
   * Constructs a new PointCollider using a config object.
   * @constructor
   * @param {Object} config
   * @param {[number, number]} position
   */
  constructor({position}) {
    this.position = createVector(position[0], position[1]);
  }

  /**
   * Renders the collider to the given canvas, or to the default window if no
   * canvas is provided.
   * @method
   * @param {Renderable} [rt]
   */
  render(rt=window) {
    rt.point(this.position.x, this.position.y);
  }
}

/**
 * A line collider.
 * @class
 */
class LineCollider {
  /**
   * Collider shape, used for determining the correct collision algorithm.
   * @type {Shape}
   */
  get shape() {
    return LINE;
  }

  /** @type {p5.Vector} */
  start;

  /** @type {p5.Vector} */
  end;

  /**
   * Constructs a new PointCollider using a config object.
   * @constructor
   * @param {Object} config
   * @param {[number, number]} config.start
   * @param {[number, number]} config.end
   */
  constructor({start, end}) {
    this.start = createVector(start[0], start[1]);
    this.end = createVector(end[0], end[1]);
  }

  /**
   * Renders the collider to the given canvas, or to the default window if no
   * canvas is provided.
   * @method
   * @param {Renderable} [rt]
   */
  render(rt=window) {
    rt.line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}

/**
 * A circle collider.
 * @class
 */
class CircleCollider {
  /**
   * Collider shape, used for determining the correct collision algorithm.
   * @type {Shape}
   */
  get shape() {
    return CIRCLE;
  }

  /** @type {p5.Vector} */
  position;

  /** @type {number} */
  get radius() {
    return this.#radius;
  }
  set radius(r) {
    this.#radius = r;
    this.#radiusSq = r * r;
  }

  /** 
   * @private
   * @type {number}
   */
  #radius;

  /** 
   * Radius squared, used for speeding up certain calculations.
   * @private
   * @type {number}
   */
  #radiusSq;

  /**
   * Constructs a new PointCollider using a config object.
   * @constructor
   * @param {Object} config
   * @param {[number, number]} config.position
   * @param {number} config.radius
   */
  constructor({position, radius}) {
    this.position = createVector(position[0], position[1]);
    this.radius = radius;
  }

  /**
   * Renders the collider to the given canvas, or to the default window if no
   * canvas is provided.
   * @method
   * @param {Renderable} [rt]
   */
  render(rt=window) {
    rt.ellipse(this.position.x, this.position.y,
        this.#radius * 2, this.#radius * 2);
  }
}

/**
 * A polygon collider.
 * @class
 */
class PolygonCollider {
  /**
   * Collider shape, used for determining the correct collision algorithm.
   * @type {Shape}
   */
  get shape() {
    return POLYGON;
  }

  /** @type {p5.Vector} */
  #position = createVector(0, 0);

  /** @type {p5.Vector[]} */
  #points = [];

  /** @type {p5.Vector[]} */
  #absolutePoints = [];

  /** @type {p5.Vector[]} */
  #rotatedPoints = [];

  /** @type {BoundingRect} */
  #bbox;

  /** @type {BoundingRect} */
  #rotatedBBox;

  /**
   * Constructs a new PointCollider using a config object.
   * @constructor
   * @param {Object} config
   * @param {[number, number][]} config.points
   * @param {[number, number]} [config.position]
   */
  constructor({points, position=[0,0]}) {
    if (points.length < 3) {
      throw new Error("Polygon colliders must have at least 3 points!");
    }

    for (let p of points) {
      this.#points.push(createVector(p[0], p[1]));
      this.#absolutePoints.push(createVector(p[0], p[1]));
      this.#rotatedPoints.push(createVector(p[0], p[1]));
    }

    this.#bbox = getBBox(this.#points);
    this.#rotatedBBox = getBBox(this.#points);

    this.setPos(position[0], position[1]);
  }

  /**
   * Sets the collider's position in world space.
   * @method
   * @param {number} x
   * @param {number} y
   */
  setPos(x, y) {
    this.#position.set(x, y);
    for (let i = 0; i < this.#rotatedPoints.length; ++i) {
      this.#points[i].set(this.#rotatedPoints[i].x + x,
          this.#rotatedPoints[i].y + y);
    }

    // also move the bounding box
    this.#bbox.x = this.#rotatedBBox.x + x;
    this.#bbox.y = this.#rotatedBBox.y + y;
  }

  /**
   * Moves the collider in world space
   * @method
   * @param {number} x
   * @param {number} y
   */
  modPos(x, y) {
    for (let p in this.#points) {
      p.x += x;
      p.y += y;
    }

    // also move the bounding box
    this.#bbox.x += x;
    this.#bbox.y += y;
  }

  /**
   * Rotates the polygon to a specific angle.
   * @method
   * @param {number} angle
   */
  setAngle(angle) {
    for (let i = 0; i < this.#absolutePoints.length; ++i) {
      this.#rotatedPoints[i].set(
          p5.Vector.rotate(this.#absolutePoints[i], angle)
      );
    }
    this.setPos(this.#position.x, this.#position.y);
  }

  /**
   * Rotates the polygon by a specific angle relative to its current angle.
   * @method
   * @param {number} angle
   */
  modAngle(angle) {
    for (let p of this.#rotatedPoints) {
      p.rotate(angle);
    }
    this.setPos(this.#position.x, this.#position.y);
  }

  /**
   * Renders the collider to the given canvas, or to the default window if no
   * canvas is provided.
   * @method
   * @param {Renderable} [rt]
   */
  render(rt=window) {
    rt.beginShape();
    for (let p of this.#points) {
      rt.vertex(p.x, p.y);
    }
    rt.endShape(CLOSE);
  }
}

/**
 * Returns whether a point is on a line.
 */

/**
 * Returns the axis-aligned bounding box for a polygon - this is the smallest
 * non-rotated rectangle that it will completely fit inside.
 * @function
 * @param {p5.Vector[]} points
 * @returns {BoundingRect}
 */
function getBBox(points) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let p in points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  return new BoundingRect(minX, minY, maxX - minX, maxY - minY);
}