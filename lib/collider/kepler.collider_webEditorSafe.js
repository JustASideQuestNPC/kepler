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
(function (Kepler) {
  Kepler.COLLIDER_INCLUDED = true;
  class BoundingRect {
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
  Kepler.PointCollider = class {
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
    constructor({ x, y, sketch }) {
      this._sketch = sketch;
      this.position = this._sketch.createVector(x, y);
    }
    render(rt = this._sketch) {
      rt.point(this.position.x, this.position.y);
    }
    isColliding(other) {
      if (other instanceof Kepler.PointCollider) {
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
  Kepler.LineCollider = class {
    constructor({ start, end, sketch }) {
      this._sketch = sketch;
      this.start = sketch.createVector(start.x, start.y);
      this.end = sketch.createVector(end.x, end.y);
    }
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
    modPos(x, y) {
      if (x instanceof p5.Vector) {
        this.start.add(x);
        this.end.add(x);
      } else {
        this.start.add(x, y);
        this.end.add(x, y);
      }
    }
    render(rt = this._sketch) {
      rt.line(this.start.x, this.start.y, this.end.x, this.end.y);
    }
    isColliding(other) {
      if (other instanceof Kepler.PointCollider) {
        return pointOnLine(other, this);
      } else if (other instanceof Kepler.LineCollider) {
        return lineIntersection(
          this.start,
          this.end,
          other.start,
          other.end,
          this._sketch
        );
      } else if (other instanceof Kepler.CircleCollider) {
        let throwaway = this._sketch.createVector();
        return lineInCircle(
          this.start,
          this.end,
          other.position,
          other.radius,
          throwaway,
          this._sketch
        );
      } else if (other instanceof Kepler.PolygonCollider) {
        return lineInPolygon(this, other);
      } else {
        throw new Error(`"${typeof other}" is not a valid collider type!`);
      }
    }
  };
  Kepler.CircleCollider = class {
    get radius() {
      return this._radius;
    }
    set radius(r) {
      this._radius = r;
      this._radiusSq = r * r;
    }
    get radiusSq() {
      return this._radiusSq;
    }
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
    constructor({ x, y, radius, sketch }) {
      this._sketch = sketch;
      this.position = sketch.createVector(x, y);
      this.radius = radius;
    }
    render(rt = this._sketch) {
      rt.ellipse(
        this.position.x,
        this.position.y,
        this._radius * 2,
        this._radius * 2
      );
    }
    isColliding(other, transVec = null) {
      if (other instanceof Kepler.PointCollider) {
        return pointInCircle(other, this);
      } else if (other instanceof Kepler.LineCollider) {
        let throwaway = this._sketch.createVector();
        return lineInCircle(
          other.start,
          other.end,
          this.position,
          this.radius,
          throwaway,
          this._sketch
        );
      } else if (other instanceof Kepler.CircleCollider) {
        return circleToCircleCollide(this, other, transVec, this._sketch);
      } else if (other instanceof Kepler.PolygonCollider) {
        return circleToPolygonCollide(
          this,
          other,
          transVec,
          false,
          this._sketch
        );
      } else {
        throw new Error(`"${typeof other}" is not a valid collider type!`);
      }
    }
  };
  Kepler.PolygonCollider = class {
    get points() {
      return this._points;
    }
    get bbox() {
      return this._bbox;
    }
    _position = createVector(0, 0);
    get position() {
      return this._position.copy();
    }
    get angle() {
      return this._angle;
    }
    constructor({ points, x = 0, y = 0, sketch }) {
      this._sketch = sketch;
      if (points.length < 3) {
        throw new Error("Polygon colliders must have at least 3 points!");
      }
      this._points = [];
      this._absolutePoints = [];
      this._rotatedPoints = [];
      for (let p of points) {
        this._points.push(sketch.createVector(p[0], p[1]));
        this._absolutePoints.push(sketch.createVector(p[0], p[1]));
        this._rotatedPoints.push(sketch.createVector(p[0], p[1]));
      }
      this._rotatedBBox = getBBox(this._rotatedPoints);
      this._bbox = this._rotatedBBox.copy();
      this.setPos(x, y);
      this._angle = 0;
    }
    setPos(x, y) {
      if (x instanceof p5.Vector) this._position.set(x);
      else this._position.set(x, y);

      for (let i = 0; i < this._rotatedPoints.length; ++i) {
        this._points[i].set(
          this._rotatedPoints[i].x + x,
          this._rotatedPoints[i].y + y
        );
      }
      this._bbox.x = this._rotatedBBox.x + x;
      this._bbox.y = this._rotatedBBox.y + y;
    }
    modPos(x, y) {
      if (x instanceof p5.Vector) {
        y = x.y;
        x = x.x;
      }
      for (let p of this._points) {
        p.x += x;
        p.y += y;
      }
      this._bbox.x += x;
      this._bbox.y += y;
    }
    setAngle(angle) {
      this._angle = angle;
      for (let i = 0; i < this._absolutePoints.length; ++i) {
        this._rotatedPoints[i].set(
          p5.Vector.rotate(this._absolutePoints[i], angle)
        );
      }
      this._rotatedBBox = getBBox(this._rotatedPoints);
      this._bbox = this._rotatedBBox.copy();
      this.setPos(this._position.x, this._position.y);
    }
    modAngle(angle) {
      this._angle += angle;
      for (let p of this._rotatedPoints) {
        p.rotate(angle);
      }
      this._rotatedBBox = getBBox(this._rotatedPoints);
      this._bbox = this._rotatedBBox.copy();
      this.setPos(this._position.x, this._position.y);
    }
    render(rt = this._sketch) {
      rt.rect(this._bbox.x, this._bbox.y, this._bbox.w, this._bbox.h);
      rt.beginShape();
      for (let p of this._points) {
        rt.vertex(p.x, p.y);
      }
      rt.endShape(CLOSE);
    }
    isColliding(other, transVec = null) {
      if (other instanceof Kepler.PointCollider) {
        return pointInPolygon(other.position, this, this._sketch);
      } else if (other instanceof Kepler.LineCollider) {
        return lineInPolygon(other, this);
      } else if (other instanceof Kepler.CircleCollider) {
        return circleToPolygonCollide(
          other,
          this,
          transVec,
          true,
          this._sketch
        );
      } else if (other instanceof Kepler.PolygonCollider) {
        return polygonToPolygonCollide(this, other, transVec, this._sketch);
      } else {
        throw new Error(`"${typeof other}" is not a valid collider type!`);
      }
    }
  };
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
  function pointOnLine(point, line) {
    let d1 = p5.Vector.dist(line.start, point.position);
    let d2 = p5.Vector.dist(line.end, point.position);
    return d1 + d2 == p5.Vector.dist(line.start, line.end);
  }
  function pointInCircle(point, circle) {
    let d = p5.Vector.sub(point.position, circle.position).magSq();
    return d < circle.radiusSq;
  }
  function pointInPolygon(pos, polygon) {
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
  function lineInCircle(a, b, cPos, r, closest, sketch) {
    closest.set(getClosestPoint(a, b, cPos, sketch));
    return p5.Vector.sub(closest, cPos).magSq() <= pow(r, 2);
  }
  function getClosestPoint(a, b, pos, sketch) {
    let atp = p5.Vector.sub(pos, a);
    let atb = p5.Vector.sub(b, a);
    let t = sketch.constrain(p5.Vector.dot(atp, atb) / atb.magSq(), 0, 1);

    return sketch.createVector(a.x + atb.x * t, a.y + atb.y * t);
  }
  function lineInPolygon(line, polygon) {
    if (
      pointInPolygon(line.start, polygon) ||
      pointInPolygon(line.end, polygon)
    ) {
      return true;
    }
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
  function circleToCircleCollide(c1, c2, transVec, sketch) {
    let distanceVector = sketch.createVector(
      c1.position.x - c2.position.x,
      c1.position.y - c2.position.y
    );
    if (distanceVector.magSq() < pow(c1.radius + c2.radius, 2)) {
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
  function circleToPolygonCollide(circle, polygon, transVec, invert, sketch) {
    let circleBBox = new BoundingRect(
      circle.position.x - circle.radius,
      circle.position.y - circle.radius,
      circle.radius * 2,
      circle.radius * 2
    );
    if (!circleBBox.intersectsBBox(polygon.bbox)) {
      return false;
    }
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
    let closest = sketch.createVector();
    let closestDistance = Infinity;
    for (
      let i = 0, j = polygon.points.length - 1;
      i < polygon.points.length;
      j = i++
    ) {
      let p1 = polygon.points[i],
        p2 = polygon.points[j];
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
  function polygonToPolygonCollide(poly1, poly2, transVec, sketch) {
    if (!poly1.bbox.intersectsBBox(poly2.bbox)) {
      return false;
    }
    let poly1Edges = getEdges(poly1, sketch);
    let poly2Edges = getEdges(poly2, sketch);
    let allEdges = poly1Edges.concat(poly2Edges);
    let mtvLength = Infinity;
    let mtvAxis = sketch.createVector(0, 0);
    for (let edge of allEdges) {
      let edgeLength = edge.mag();
      let axis = sketch.createVector(-edge.y / edgeLength, edge.x / edgeLength);
      let thisProj = projectOntoAxis(poly1, axis);
      let otherProj = projectOntoAxis(poly2, axis);
      let overlap = intervalDistance(thisProj, otherProj);
      if (overlap > 0) {
        return false;
      } else {
        if (abs(overlap) < mtvLength) {
          mtvLength = abs(overlap);
          if (thisProj[0] < otherProj[0]) {
            mtvAxis.set(-axis.x, -axis.y);
          } else mtvAxis.set(axis.x, axis.y);
        }
      }
    }
    if (transVec != null) {
      transVec.set(p5.Vector.mult(mtvAxis, mtvLength));
    }
    return true;
  }
  function projectOntoAxis(polygon, axis) {
    let min = Infinity;
    let max = -Infinity;
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
  function intervalDistance(i1, i2) {
    if (i1[0] < i2[0]) {
      return i2[0] - i1[1];
    } else {
      return i1[0] - i2[1];
    }
  }
  function getEdges(poly, sketch) {
    let edges = [];
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
