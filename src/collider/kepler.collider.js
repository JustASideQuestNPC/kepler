/*
 *   _                 _                         _  _  _      _             
 *  | | __ ___  _ __  | |  ___  _ __  ___  ___  | || |(_)  __| |  ___  _ __ 
 *  | |/ // _ \| '_ \ | | / _ \| '__|/ __|/ _ \ | || || | / _` | / _ \| '__|
 *  |   <|  __/| |_) || ||  __/| | _| (__| (_) || || || || (_| ||  __/| |   
 *  |_|\_\\___|| .__/ |_| \___||_|(_)\___|\___/ |_||_||_| \__,_| \___||_|   
 *             |_|                                                          
 * 
 *  Part of Kepler, a 2d game engine for p5.js
 *  https://github.com/JustASideQuestNPC/kepler
 */

// add collider stuff to the Kepler namespace using a "self-executing anonymous
// function" and associated black magic
(function (Kepler) {
  Kepler.COLLIDER_INCLUDED = true;

  /** @typedef Collider */
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

    intersectsBBox(other) {
      return !(
        other.x > this.x + this.w ||
        other.x + other.w < this.x ||
        other.y > this.y + this.h ||
        other.y + other.h < this.y
      );
    }

    copy() {
      return new BoundingRect(this.x, this.y, this.w, this.h);
    }
  }

  /**
   * A point collider.
   * @class
   */
  Kepler.PointCollider = class {
    /**
     * @private
     * @type {Window | p5}
     */
    #sketch;

    /** @type {p5.Vector} */
    position;

    /** @type {number} */
    get x() {
      return this.position.x;
    }
    set x(value) {
      this.position.x = value;
    }

    /** @type {number} */
    get y() {
      return this.position.y;
    }
    set y(value) {
      this.position.y = value;
    }

    /**
     * Constructs a new PointCollider.
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {Window | p5} sketch The sketch to use for collision
     *    calculations.
     */
    constructor({ x, y, sketch }) {
      this.#sketch = sketch;
      this.position = this.#sketch.createVector(x, y);
    }

    /**
     * Renders the point to the given canvas, or to the default window if no
     * canvas is provided.
     * @method
     * @param {Renderable} [rt]
     */
    render(rt = this.#sketch) {
      rt.point(this.position.x, this.position.y);
    }

    /**
     * Returns whether the point is inside another collider.
     * @method
     * @param {Collider} other
     * @returns {boolean}
     */
    isColliding(other) {
      if (other instanceof Kepler.PointCollider) {
        // integer comparison so this might actually return true sometimes
        return (
          Math.floor(this.position.x) === Math.floor(other.position.x) &&
          Math.floor(this.position.y) === Math.floor(other.position.y)
        );
      } else if (other instanceof Kepler.LineCollider) {
        return pointOnLine(this, other);
      } else if (other instanceof Kepler.CircleCollider) {
        return pointInCircle(this, other);
      } else if (other instanceof Kepler.PolygonCollider) {
        return pointInPolygon(this.position, other);
      } else {
        throw new Error(`"${typeof other}" is not a valid collider type!`);
      }
    }
  };

  /**
   * A line collider.
   * @class
   */
  Kepler.LineCollider = class {
    /**
     * @private
     * @type {Window | p5}
     */
    #sketch;

    /** @type {p5.Vector} */
    start;

    /** @type {p5.Vector} */
    end;

    /**
     * Constructs a new LineCollider.
     * @constructor
     * @param {{x: number, y: number}} start
     * @param {{x: number, y: number}} end
     * @param {Window | p5} sketch The sketch to use for collision
     *    calculations.
     */
    constructor({ start, end, sketch }) {
      this.#sketch = sketch;
      this.start = sketch.createVector(start.x, start.y);
      this.end = sketch.createVector(end.x, end.y);
    }

    /**
     * Sets the collider's position in world space.
     * @overload
     * @param {number} x
     * @param {number} y
     *
     * @overload
     * @param {p5.Vector} vec
     */
    setPos(x, y) {
      if (x instanceof p5.Vector) {
        let delta = p5.Vector.sub(this.end, this.start);
        this.start.set(x);
        this.end.set(p5.Vector.add(this.start, delta));
      } else {
        let dx = this.end.x - this.start.x;
        let dy = this.end.y - this.start.y;
        this.start.set(x, y);
        this.end.set(x + dx, y + dy);
      }
    }

    /**
     * Moves the collider in world space.
     * @overload
     * @param {number} x
     * @param {number} y
     *
     * @overload
     * @param {p5.Vector} vec
     */
    modPos(x, y) {
      if (x instanceof p5.Vector) {
        this.start.add(x);
        this.end.add(x);
      } else {
        this.start.add(x, y);
        this.end.add(x, y);
      }
    }

    /**
     * Renders the collider to the given canvas, or to the default window if no
     * canvas is provided.
     * @method
     * @param {Renderable} [rt]
     */
    render(rt = this.#sketch) {
      rt.line(this.start.x, this.start.y, this.end.x, this.end.y);
    }

    /**
     * Returns whether the line is inside another collider.
     * @method
     * @param {Collider} other
     * @returns {boolean}
     */
    isColliding(other) {
      if (other instanceof Kepler.PointCollider) {
        return pointOnLine(other, this);
      } else if (other instanceof Kepler.LineCollider) {
        return lineIntersection(
          this.start,
          this.end,
          other.start,
          other.end,
          this.#sketch
        );
      } else if (other instanceof Kepler.CircleCollider) {
        // lineInCircle requires a reference to a Vector for technical reasons
        let throwaway = this.#sketch.createVector();
        return lineInCircle(
          this.start,
          this.end,
          other.position,
          other.radius,
          throwaway,
          this.#sketch
        );
      } else if (other instanceof Kepler.PolygonCollider) {
        return lineInPolygon(this, other);
      } else {
        throw new Error(`"${typeof other}" is not a valid collider type!`);
      }
    }
  };

  /**
   * A circle collider.
   * @class
   */
  Kepler.CircleCollider = class {
    /**
     * @private
     * @type {Window | p5}
     */
    #sketch;

    /** @type {number} */
    get radius() {
      return this.#radius;
    }
    set radius(r) {
      this.#radius = r;
      this.#radiusSq = r * r;
    }

    /** @type {number} */
    get radiusSq() {
      return this.#radiusSq;
    }

    /**
     * @type {p5.Vector}
     */
    position;

    /** @type {number} */
    get x() {
      return this.position.x;
    }
    set x(value) {
      this.position.x = value;
    }

    /** @type {number} */
    get y() {
      return this.position.y;
    }
    set y(value) {
      this.position.y = value;
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
     * Constructs a new CircleCollider.
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {Window | p5} sketch The sketch to use for collision
     *    calculations.
     */
    constructor({ x, y, radius, sketch }) {
      this.#sketch = sketch;
      this.position = sketch.createVector(x, y);
      this.radius = radius;
    }

    /**
     * Renders the collider to the given canvas, or to the default window if no
     * canvas is provided.
     * @method
     * @param {Renderable} [rt]
     */
    render(rt = this.#sketch) {
      rt.ellipse(
        this.position.x,
        this.position.y,
        this.#radius * 2,
        this.#radius * 2
      );
    }

    /**
     * Returns whether the circle is inside another collider; can also set a
     * translation vector.
     * @method
     * @param {Collider} other
     * @param {p5.Vector} [transVec] A reference to a translation vector. If the
     *    other collider is a circle or polygon and it is colliding with this
     *    circle, the translation vector will be set to the shortest vector that
     *    will move this collider out of of the other one.
     * @returns {boolean}
     */
    isColliding(other, transVec = null) {
      if (other instanceof Kepler.PointCollider) {
        return pointInCircle(other, this);
      } else if (other instanceof Kepler.LineCollider) {
        // lineInCircle requires a reference to a Vector for technical reasons
        let throwaway = this.#sketch.createVector();
        return lineInCircle(
          other.start,
          other.end,
          this.position,
          this.radius,
          throwaway,
          this.#sketch
        );
      } else if (other instanceof Kepler.CircleCollider) {
        return circleToCircleCollide(this, other, transVec, this.#sketch);
      } else if (other instanceof Kepler.PolygonCollider) {
        return circleToPolygonCollide(
          this,
          other,
          transVec,
          false,
          this.#sketch
        );
      } else {
        throw new Error(`"${typeof other}" is not a valid collider type!`);
      }
    }
  };

  /**
   * A polygon collider.
   * @class
   */
  Kepler.PolygonCollider = class {
    /**
     * @private
     * @type {Window | p5}
     */
    #sketch;

    /** @type {number} */
    get points() {
      return this.#points;
    }

    /** @type {BoundingRect} */
    get bbox() {
      return this.#bbox;
    }

    /** @type {p5.Vector} */
    #position;

    /** @type {p5.Vector} */
    get position() {
      return this.#position.copy();
    }

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

    /** @type {number} */
    #angle;
    
    /** @type {number} */
    get angle() {
      return this.#angle;
    }

    /**
     * Constructs a new PolygonCollider.
     * @constructor
     * @param {object} args
     * @param {[number,number][]} args.points
     * @param {number} [args.x]
     * @param {number} [args.y]
     * @param {Window | p5} sketch The sketch to use for collision
     *    calculations.
     */
    constructor({ points, x = 0, y = 0, sketch }) {
      this.#sketch = sketch;
      this.#position = this.#sketch.createVector();
      if (points.length < 3) {
        throw new Error("Polygon colliders must have at least 3 points!");
      }

      for (let p of points) {
        this.#points.push(sketch.createVector(p[0], p[1]));
        this.#absolutePoints.push(sketch.createVector(p[0], p[1]));
        this.#rotatedPoints.push(sketch.createVector(p[0], p[1]));
      }

      this.#rotatedBBox = getBBox(this.#rotatedPoints);
      this.#bbox = this.#rotatedBBox.copy();

      this.setPos(x, y);
      this.#angle = 0;
    }

    /**
     * Sets the collider's position in world space.
     * @overload
     * @param {number} x
     * @param {number} y
     *
     * @overload
     * @param {p5.Vector} vec
     */
    setPos(x, y) {
      if (x instanceof p5.Vector) this.#position.set(x);
      else this.#position.set(x, y);

      for (let i = 0; i < this.#rotatedPoints.length; ++i) {
        this.#points[i].set(
          this.#rotatedPoints[i].x + this.#position.x,
          this.#rotatedPoints[i].y + this.#position.y
        );
      }

      // also move the bounding box
      this.#bbox.x = this.#rotatedBBox.x + this.#position.x;
      this.#bbox.y = this.#rotatedBBox.y + this.#position.y;
    }

    /**
     * Moves the collider in world space.
     * @overload
     * @param {number} x
     * @param {number} y
     *
     * @overload
     * @param {p5.Vector} vec
     */
    modPos(x, y) {
      if (x instanceof p5.Vector) {
        y = x.y;
        x = x.x;
      }

      for (let p of this.#points) {
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
      this.#angle = angle;
      for (let i = 0; i < this.#absolutePoints.length; ++i) {
        this.#rotatedPoints[i].set(
          p5.Vector.rotate(this.#absolutePoints[i], angle)
        );
      }
      this.#rotatedBBox = getBBox(this.#rotatedPoints);
      this.#bbox = this.#rotatedBBox.copy();
      this.setPos(this.#position.x, this.#position.y);
    }

    /**
     * Rotates the polygon by a specific angle relative to its current angle.
     * @method
     * @param {number} angle
     */
    modAngle(angle) {
      this.#angle += angle;
      for (let p of this.#rotatedPoints) {
        p.rotate(angle);
      }
      this.#rotatedBBox = getBBox(this.#rotatedPoints);
      this.#bbox = this.#rotatedBBox.copy();
      this.setPos(this.#position.x, this.#position.y);
    }

    /**
     * Renders the collider to the given canvas, or to the default window if no
     * canvas is provided.
     * @method
     * @param {Renderable} [rt]
     */
    render(rt = this.#sketch) {
      rt.rect(this.#bbox.x, this.#bbox.y, this.#bbox.w, this.#bbox.h);
      rt.beginShape();
      for (let p of this.#points) {
        rt.vertex(p.x, p.y);
      }
      rt.endShape(CLOSE);
    }

    /**
     * Returns whether the polygon is inside another collider; can also set a
     * translation vector.
     * @method
     * @param {Collider} other
     * @param {p5.Vector} [transVec] A reference to a translation vector. If the
     *    other collider is a circle or polygon and it is colliding with this
     *    polygon, the translation vector will be set to the shortest vector
     *    that will move this collider out of of the other one.
     * @returns {boolean}
     */
    isColliding(other, transVec = null) {
      if (other instanceof Kepler.PointCollider) {
        return pointInPolygon(other.position, this, this.#sketch);
      } else if (other instanceof Kepler.LineCollider) {
        return lineInPolygon(other, this);
      } else if (other instanceof Kepler.CircleCollider) {
        return circleToPolygonCollide(
          other,
          this,
          transVec,
          true,
          this.#sketch
        );
      } else if (other instanceof Kepler.PolygonCollider) {
        return polygonToPolygonCollide(this, other, transVec, this.#sketch);
      } else {
        throw new Error(`"${typeof other}" is not a valid collider type!`);
      }
    }
  };

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

    for (let p of points) {
      if (p.x < minX) {
        minX = p.x;
      }
      if (p.x > maxX) {
        maxX = p.x;
      }
      if (p.y < minY) {
        minY = p.y;
      }
      if (p.y > maxY) {
        maxY = p.y;
      }
    }

    return new BoundingRect(minX, minY, maxX - minX, maxY - minY);
  }

  /**
   * Returns whether a point is on a line.
   * @function
   * @param {Kepler.PointCollider} point
   * @param {Kepler.LineCollider} line
   * @returns {boolean}
   */
  function pointOnLine(point, line) {
    let d1 = p5.Vector.dist(line.start, point.position);
    let d2 = p5.Vector.dist(line.end, point.position);
    return d1 + d2 == p5.Vector.dist(line.start, line.end);
  }

  /**
   * Returns whether a point is inside a circle.
   * @function
   * @param {Kepler.PointCollider} point
   * @param {Kepler.CircleCollider} circle
   * @returns {boolean}
   */
  function pointInCircle(point, circle) {
    let d = p5.Vector.sub(point.position, circle.position).magSq();
    return d < circle.radiusSq;
  }

  /**
   * Returns whether a point is inside a polygon.
   * @function
   * @param {p5.Vector} pos
   * @param {Kepler.PolygonCollider} polygon
   * @returns {boolean}
   */
  function pointInPolygon(pos, polygon) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html
    let inside = false;
    let points = polygon.points;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      let p1 = points[i],
        p2 = points[j];
      if (
        p1.y > pos.y != p2.y > pos.y &&
        pos.x < ((p2.x - p1.x) * (pos.y - p1.y)) / (p2.y - p1.y) + p1.x
      ) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Returns whether two line segments intersect.
   * @function
   * @param {p5.Vector} p0
   * @param {p5.Vector} p1
   * @param {p5.Vector} p2
   * @param {p5.Vector} p3
   * @returns {boolean}
   */
  function lineIntersection(p0, p1, p2, p3) {
    let d1 = p5.Vector.sub(p1, p0);
    let d2 = p5.Vector.sub(p3, p2);

    let s =
      (-d1.y * (p0.x - p2.x) + d1.x * (p0.y - p2.y)) /
      (-d2.x * d1.y + d1.x * d2.y);

    let t =
      (d2.x * (p0.y - p2.y) - d2.y * (p0.x - p2.x)) /
      (-d2.x * d1.y + d1.x * d2.y);

    return s >= 0 && s <= 1 && t >= 0 && t <= 1;
  }

  /**
   * Returns whether a line segment intersects a circle.
   * @function
   * @param {p5.Vector} a The first point of the line.
   * @param {p5.Vector} b The second point of the line.
   * @param {p5.Vector} cPos The position of the circle.
   * @param {number} r The radius of the circle.
   * @param {p5.Vector} closest A reference that the closest point on the line
   *    to the circle is stored in; used for circle-to-circle collisions.
   */
  function lineInCircle(a, b, cPos, r, closest, sketch) {
    closest.set(getClosestPoint(a, b, cPos, sketch));

    // if the closest point is within the circle, the line intersects the circle
    return p5.Vector.sub(closest, cPos).magSq() <= pow(r, 2);
  }

  /**
   * Finds the closest point on a line to a point.
   * @function
   * @param {p5.Vector} a
   * @param {p5.Vector} b
   * @param {p5.Vector} pos
   */
  function getClosestPoint(a, b, pos, sketch) {
    let atp = p5.Vector.sub(pos, a);
    let atb = p5.Vector.sub(b, a);
    let t = sketch.constrain(p5.Vector.dot(atp, atb) / atb.magSq(), 0, 1);

    return sketch.createVector(a.x + atb.x * t, a.y + atb.y * t);
  }

  /**
   * Returns whether a line intersects a polygon.
   * @function
   * @param {Kepler.LineCollider} line
   * @param {Kepler.PolygonCollider} polygon
   * @returns {boolean}
   */
  function lineInPolygon(line, polygon) {
    // check if either endpoint is inside the polygon
    if (
      pointInPolygon(line.start, polygon) ||
      pointInPolygon(line.end, polygon)
    ) {
      return true;
    }

    // loop through each edge of the polygon and check if the line intersects
    // any of them
    for (
      let i = 0, j = polygon.points.length - 1;
      i < polygon.points.length;
      j = i++
    ) {
      if (
        lineIntersection(
          polygon.points[i],
          polygon.points[j],
          line.start,
          line.end
        )
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determines if two circles are colliding.
   * @function
   * @param {Kepler.CircleCollider} c1
   * @param {Kepler.CircleCollider} c2
   * @param {p5.Vector} [transVec] Optional reference to store a translation
   *    vector in if the circles are colliding.
   * @returns {boolean}
   */
  function circleToCircleCollide(c1, c2, transVec, sketch) {
    let distanceVector = sketch.createVector(
      c1.position.x - c2.position.x,
      c1.position.y - c2.position.y
    );

    if (distanceVector.magSq() < pow(c1.radius + c2.radius, 2)) {
      // find a translation vector to move the first circle out of the second
      if (transVec != null) {
        let vec = sketch.createVector(distanceVector.x, distanceVector.y);
        vec.setMag(c1.radius + c2.radius);
        vec.sub(distanceVector);
        transVec.set(vec);
      }
      return true;
    }
    return false;
  }

  /**
   * Determines if a circle is colliding with a polygon.
   * @function
   * @param {Kepler.CircleCollider} circle
   * @param {Kepler.PolygonCollider} polygon
   * @param {p5.Vector} [transVec] Optional reference to store a translation
   *    vector in if the circles are colliding.
   * @param {boolean} invert If `true`, the translation vector moves the polygon
   *    out of the circle. Otherwise, it moves the circle out of the polygon.
   * @returns {boolean}
   */
  function circleToPolygonCollide(circle, polygon, transVec, invert, sketch) {
    // bounding box checks are very fast and will rule out a lot of collisions
    // without having to do precise checks against polygon edges
    let circleBBox = new BoundingRect(
      circle.position.x - circle.radius,
      circle.position.y - circle.radius,
      circle.radius * 2,
      circle.radius * 2
    );
    if (!circleBBox.intersectsBBox(polygon.bbox)) {
      return false;
    }

    // this collision algorithm won't detect a collision if the circle is
    // completely inside the polygon, so we check for that here
    let pos = circle.position.copy();
    if (pointInPolygon(pos, polygon)) {
      let closestPoint = sketch.createVector();
      let closestDistance = Infinity;
      for (
        let i = 0, j = polygon.points.length - 1;
        i < polygon.points.length;
        j = i++
      ) {
        let p1 = polygon.points[i],
          p2 = polygon.points[j];
        let c = getClosestPoint(p1, p2, pos, sketch);
        if (c.dist(pos) < closestDistance) {
          closestDistance = c.dist(pos);
          closestPoint.set(c);
        }
      }

      pos.set(closestPoint);
      if (transVec != null) {
        let delta = sketch.createVector();
        delta.set(p5.Vector.sub(pos, circle.position));
        delta.setMag(delta.mag() + circle.radius);

        if (invert) {
          delta.set(-delta.x, -delta.y);
        }
        transVec.set(delta);
      }
      return true;
    }

    // check if any of the edges on the polygon intersect the circle, and find
    // the closest intersection point
    let closest = sketch.createVector();
    let closestDistance = Infinity;

    // do some black magic in the for loop constructor to use the first and last
    // points on the first iteration
    for (
      let i = 0, j = polygon.points.length - 1;
      i < polygon.points.length;
      j = i++
    ) {
      let p1 = polygon.points[i],
        p2 = polygon.points[j];

      // return true if the edge intersects with the circle, and the
      // intersection point is the closest one found
      let p = sketch.createVector();
      if (lineInCircle(p1, p2, pos, circle.radius, p, sketch)) {
        let d = p.dist(pos);
        if (d < closestDistance) {
          closestDistance = d;
          closest.set(p);
        }
      }
    }

    if (closestDistance < Infinity) {
      // find a translation vector - if invert is true, the vector moves the
      // polygon out of the circle, otherwise it moves the circle out of the
      // polygon
      if (transVec != null) {
        let delta = p5.Vector.sub(closest, circle.position);
        let moveDistance = circle.radius - delta.mag();
        delta.setMag(-moveDistance);

        if (invert) {
          delta.set(-delta.x, -delta.y);
        }
        transVec.set(delta);
      }
      return true;
    }
    return false;
  }

  /**
   * Determines if two polygons are overlapping. This implementation uses the
   * "Separating Axis Theorem", which is really just an overly fancy way of
   * saying "If you can draw a line between two things, they don't overlap."
   * This version also returns the "Minimum Translation Vector", which is how
   * much (and what direction) to move the first polygon so that it no longer
   * overlaps with the second one.
   * @function
   * @param {Kepler.PolygonCollider} poly1
   * @param {Kepler.PolygonCollider} poly2
   * @param {p5.Vector} [transVec] Optional reference to store a translation
   *    vector in if the polygons are colliding.
   * @returns {boolean}
   */
  function polygonToPolygonCollide(poly1, poly2, transVec, sketch) {
    // SAT is really fast relative to other collision algorithms, but "really
    // fast" is still pretty slow in this context. Bounding box checks are
    // *actually* really fast and will rule out a lot of polygons that
    // definitely don't overlap with this one.
    if (!poly1.bbox.intersectsBBox(poly2.bbox)) {
      return false;
    }

    // find the edges of both polygons and merge them into a single array
    let poly1Edges = getEdges(poly1, sketch);
    let poly2Edges = getEdges(poly2, sketch);
    let allEdges = poly1Edges.concat(poly2Edges);

    // used for constructing the MTV (the "minimum translation vector", not the
    // weird tv station)
    let mtvLength = Infinity;
    let mtvAxis = sketch.createVector(0, 0);

    // build all axes (axes? axises?) and project both polygons onto them
    for (let edge of allEdges) {
      let edgeLength = edge.mag();

      // create an axis that is perpendicular to the edge and normalized
      let axis = sketch.createVector(-edge.y / edgeLength, edge.x / edgeLength);

      // project both polygons onto the axis
      let thisProj = projectOntoAxis(poly1, axis);
      let otherProj = projectOntoAxis(poly2, axis);

      // polygons are only overlapping if *all* their projections overlap, so we
      // can immediately return if we find a projection where they don't overlap
      // (this is why SAT is so fast)
      let overlap = intervalDistance(thisProj, otherProj);
      if (overlap > 0) {
        return false;
      } else {
        // update the MTV if this is the smallest overlap found so far
        if (abs(overlap) < mtvLength) {
          mtvLength = abs(overlap);
          if (thisProj[0] < otherProj[0]) {
            mtvAxis.set(-axis.x, -axis.y);
          } else mtvAxis.set(axis.x, axis.y);
        }
      }
    }

    // set transVec to the mtv if it isn't null
    if (transVec != null) {
      transVec.set(p5.Vector.mult(mtvAxis, mtvLength));
    }
    return true;
  }

  /**
   * Projects a polygon onto an axis and returns the interval it creates on that
   * axis - think of this as "squashing" the polygon onto a line, then returning
   * the area it covers.
   * @function
   * @param {PolygonCollider} polygon
   * @param {p5.Vector} axis
   * @returns {[number, number]}
   */
  function projectOntoAxis(polygon, axis) {
    let min = Infinity;
    let max = -Infinity;

    // find the minimum and maximum points in the projection - these are the
    // two endpoints of the squashed line
    for (let point of polygon.points) {
      let projection = point.dot(axis);
      if (projection < min) {
        min = projection;
      }
      if (projection > max) {
        max = projection;
      }
    }

    return [min, max];
  }

  /**
   * Returns the distance/gap between two intervals - if this is < 0, the
   * intervals overlap.
   * @function
   * @param {[number, number]} i1
   * @param {[number, number]} i2
   * @returns {number}
   */
  function intervalDistance(i1, i2) {
    if (i1[0] < i2[0]) {
      return i2[0] - i1[1];
    } else {
      return i1[0] - i2[1];
    }
  }

  /**
   * Converts the vertices of a polygon into edge vectors, used for SAT
   * collision.
   * @function
   * @param {PolygonCollider} poly
   * @returns {p5.Vector[]}
   */
  function getEdges(poly, sketch) {
    let edges = [];
    // do some black magic in the for loop constructor to use the last point and
    // the first point for the first edge
    for (
      let i = 0, j = poly.points.length - 1;
      i < poly.points.length;
      j = i++
    ) {
      let pi = poly.points[i];
      let pj = poly.points[j];
      edges.push(sketch.createVector(pi.x - pj.x, pi.y - pj.y));
    }
    return edges;
  }
})((window.Kepler = window.Kepler || {}));
