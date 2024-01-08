# kepler.collider Reference
***Note:** This is a language reference, not a tutorial. For a tutorial, see the
readme.*

# Contents
- [**Kepler.PointCollider:**](#keplerpointcollider) Class that handles
  collisions for a single point.
- [**Kepler.LineCollider:**](#keplerlinecollider) Class that handles collisions
  for a line between any 2 points.
- [**Kepler.CircleCollider:**](#keplercirclecollider) Class that handles
  collisions for circles.
- [**Kepler.PolygonCollider:**](#keplerpolygoncollider) Class that handles
  collisions for a convex polygon.

# Kepler.PointCollider
## Description
A class that handles collisions for a single point.

## Fields
- `position`: (`p5.Vector`) The position of the point. *Note: changing
  `position.x` and/or `position.y` will also change `x` and/or `y`, and vice
  versa.*
- `x`: (`number`) X coordinate of the point. *Note: Changing this value will
  also change `position.x`, and vice versa.*
- `y`: (`number`) Y coordinate of the point. *Note: Changing this value will
  also change `position.y`, and vice versa.*

## Methods
- [Constructor](#constructor)
- [`render()`](#render)
- [`isColliding()`](#iscolliding)

### Constructor
#### Description
Constructs a new `Kepler.PointCollider`. Like most constructors in Kepler, this
takes a configuration object, which has three properties. The first two, `x` and
`y`, are the position of the collider. The third, `sketch`, is the sketch or
window that the collider is being created in.

#### Examples
```js
let collider;
function setup() {
  collider = new Kepler.PointCollider({
    x: 200,
    y: 200,
    sketch: window
  });
}
```

#### Syntax
`new Kepler.PointCollider({x, y, sketch})`

#### Parameters
- `x`: (`number`)
- `y`: (`number`)
- `sketch`: (`object`)

### render()
#### Description
Renders the collider to a canvas - this is often useful for debugging. The
`renderTarget` parameter is optional and can be used to draw the collider to an
alternate canvas. The default render target is the sketch object passed to
the constructor.

#### Examples
```js
let collider, rt;
function setup() {
  createCanvas(400, 400);
  rt = createGraphics(400, 400);

  collider = new Kepler.PointCollider({
    x: 200,
    y: 200,
    sketch: window
  });

  rt.stroke(255, 0, 0);
  rt.strokeWeight(5);
  collider.render(rt);
  image(rt, 0, 0);
}
```

#### Syntax
`render([renderTarget])`

#### Parameters
- `renderTarget`: (optional `object`)

### isColliding()
#### Description
Returns whether the point is colliding with another collider object:
- If the other collider is a `Kepler.PointCollider`, it returns whether both
  points are at the same integer coordinates.
- If the other collider is a `Kepler.LineCollider`, it returns whether the point
  is on the line.
- If the other collider is a `Kepler.CircleCollider` or a
  `Kepler.PolygonCollider`, it returns whether the point is inside the circle or
  polygon.

#### Examples
```js
let pointCollider, circleCollider;

function setup() {
  createCanvas(400, 400);

  pointCollider = new Kepler.PointCollider({
    x: 0,
    y: 0,
    sketch: window
  });
  circleCollider = new Kepler.CircleCollider({
    x: 200,
    y: 200,
    radius: 100,
    sketch: window
  });
  
  noFill();
  strokeWeight(5);
}

function draw() {
  pointCollider.x = mouseX;
  pointCollider.y = mouseY;
  background(255);  
  if (pointCollider.isColliding(circleCollider)) {
    stroke(255, 0, 0);
  } else {
    stroke(0, 255, 0);
  }
  pointCollider.render();
  circleCollider.render();
}
```

#### Syntax
`isColliding(other)`

#### Parameters
- `other`: (`object`) The collider to check for a collision with.

#### Returns
- `boolean`

# Kepler.LineCollider
## Description
A class that handles collisions for a line between 2 points.

## Fields
- `start`: (`p5.Vector`) The position of the first point of the line.
- `end`: (`p5.Vector`) The position of the second point of the line.

## Methods
- [Constructor](#constructor-1)
- [`setPos()`](#setpos)
- [`modPos()`](#modpos)
- [`render()`](#render-1)
- [`isColliding()`](#iscolliding-1)

### Constructor
#### Description
Constructs a new `Kepler.LineCollider`. Like most constructors in Kepler, this
takes a configuration object, which has three properties. The first two, `start`
and `end`, define both endpoints of the line. The third, `sketch`, is the sketch
or window that the collider is being created in.

#### Examples
```js
let collider;
function setup() {
  collider = new Kepler.LineCollider({
    start: { x: 100, y: 100 },
    end: { x: 300, y: 300 },
    sketch: window
  });
}
```

#### Syntax
`new Kepler.LineCollider({start, end, sketch})`

#### Parameters
- `start`: (`object`)
- `end`: (`object`)
- `sketch`: (`object`)

### setPos()
#### Description
Sets the position of the collider. The position passed to this method will be
the new position of the line's start point. The position can be passed as either
a single `p5.Vector`, or as 2 separate numbers.

#### Examples
```js
let collider;
function setup() {
  createCanvas(400, 400);
  collider = new Kepler.LineCollider({
    start: { x: 100, y: 100 },
    end: { x: 300, y: 300 },
    sketch: window
  });

  let vec = createVector(50, 50);
  collider.setPos(vec);
  collider.render();

  collider.setPos(0, 200);
  collider.render();
}
```

#### Syntax
- `setPos(pos)`
- `setPos(x, y)`

#### Parameters
- `pos`: (`p5.Vector`)
- `x`: (`number`)
- `y`: (`number`)

### modPos()
#### Description
Moves the collider relative to its current position. Negative x and y values
move the collider left and up; positive x and y values move it right and down.
The x and y values can be passed as either a `p5.Vector` or as 2 separate
numbers.

#### Examples
```js
let collider;
function setup() {
  createCanvas(400, 400);
  collider = new Kepler.LineCollider({
    start: { x: 100, y: 100 },
    end: { x: 300, y: 300 },
    sketch: window
  });

  let vec = createVector(-50, -50);
  collider.modPos(vec);
  collider.render();

  collider.modPos(-50, 150);
  collider.render();
}
```

#### Syntax
- `modPos(pos)`
- `modPos(x, y)`

#### Parameters
- `pos`: (`p5.Vector`)
- `x`: (`number`)
- `y`: (`number`)

### render()
#### Description
Renders the collider to a canvas - this is often useful for debugging. The
`renderTarget` parameter is optional and can be used to draw the collider to an
alternate canvas. The default render target is the sketch object passed to
the constructor.

#### Examples
```js
let collider, rt;
function setup() {
  createCanvas(400, 400);
  rt = createGraphics(400, 400);

  collider = new Kepler.LineCollider({
    start: { x: 100, y: 100 },
    end: { x: 300, y: 300 },
    sketch: window
  });

  rt.stroke(255, 0, 0);
  rt.strokeWeight(5);
  collider.render(rt);
  image(rt, 0, 0);
}
```

#### Syntax
`render([renderTarget])`

#### Parameters
- `renderTarget`: (optional `object`)

### isColliding()
#### Description
Returns whether the point is colliding with another collider object:
- If the other collider is a `Kepler.PointCollider`, it returns whether the
  point is on the line.
- If the other collider is a `Kepler.LineCollider`, it returns whether the lines
  intersect.
- If the other collider is a `Kepler.CircleCollider` or a
  `Kepler.PolygonCollider`, it returns whether the any part of the line
  intersects with the circle or polygon.

#### Examples
```js
let lineCollider, circleCollider;

function setup() {
  createCanvas(400, 400);
  
  lineCollider = new Kepler.LineCollider({
    start: { x: 100, y: 100 },
    end: { x: 300, y: 300 },
    sketch: window
  });
  circleCollider = new Kepler.CircleCollider({
    x: 200,
    y: 200,
    radius: 100,
    sketch: window
  });
  
  noFill();
  strokeWeight(5);
}

function draw() {
  lineCollider.setPos(mouseX, mouseY);
  background(255);  
  if (lineCollider.isColliding(circleCollider)) {
    stroke(255, 0, 0);
  } else {
    stroke(0, 255, 0);
  }
  lineCollider.render();
  circleCollider.render();
}
```

#### Syntax
`isColliding(other)`

#### Parameters
- `other`: (`object`) The collider to check for a collision with.

#### Returns
- `boolean`


# Kepler.CircleCollider
## Description
A class that handles collisions for a circle.

## Fields
- `position`: (`p5.Vector`) The position of the circle. *Note: changing
  `position.x` and/or `position.y` will also change `x` and `y`, and vice
  versa.*
- `x`: (`number`) X coordinate of the circle. *Note: Changing this value will
  also change `position.x`, and vice versa.*
- `y`: (`number`) Y coordinate of the circle. *Note: Changing this value will
  also change `position.y`, and vice versa.*
- `radius`: (`number`) The radius of the circle.

## Methods
- [Constructor](#constructor-2)
- [`render()`](#render-2)
- [`isColliding()`](#iscolliding-2)

### Constructor
#### Description
Constructs a new `Kepler.CircleCollider`. Like most constructors in Kepler, this
takes a configuration object, which has four properties. The first two, `x` and
`y`, are the position of the circle. The third, `radius`, is the radius of the
circle. The fourth, `sketch`, is the sketch or window that the collider is being
created in.

#### Examples
```js
let collider;
function setup() {
  collider = new Kepler.PointCollider({
    x: 200,
    y: 200,
    radius: 100,
    sketch: window
  });
}
```

#### Syntax
`new Kepler.CircleCollider({x, y, radius, sketch})`

#### Parameters
- `x`: (`number`)
- `y`: (`number`)
- `radius`: (`radius`)
- `sketch`: (`object`)

### render()
#### Description
Renders the collider to a canvas - this is often useful for debugging. The
`renderTarget` parameter is optional and can be used to draw the collider to an
alternate canvas. The default render target is the sketch object passed to
the constructor.

#### Examples
```js
let collider, rt;
function setup() {
  createCanvas(400, 400);
  rt = createGraphics(400, 400);

  collider = new Kepler.PointCollider({
    x: 200,
    y: 200,
    radius: 100,
    sketch: window
  });

  rt.noFill();
  rt.stroke(255, 0, 0);
  rt.strokeWeight(5);
  collider.render(rt);
  image(rt, 0, 0);
}
```

#### Syntax
`render([renderTarget])`

#### Parameters
- `renderTarget`: (optional `object`)

### isColliding()
#### Description
Returns whether the circle is colliding with another collider object:
- If the other collider is a `Kepler.PointCollider`, it returns whether the
  point is inside the circle.
- If the other collider is a `Kepler.LineCollider`, it returns whether any part
  the line intersects with the circle.
- If the other collider is a `Kepler.CircleCollider` or a
  `Kepler.PolygonCollider`, it returns whether the circle overlaps with the
  circle or polygon.

A `p5.Vector` can also be passed to this method. If the other collider is a
circle or polygon, and the circle is colliding with it, that vector will be set
to the "minimum translation vector", which is the shortest vector that will move
the circle out of the other collider.

#### Examples
```js
let circle1, circle2;

function setup() {
  createCanvas(400, 400);

  circle1 = new Kepler.CircleCollider({
    x: 0,
    y: 0,
    radius: 50,
    sketch: window
  });
  circle2 = new Kepler.CircleCollider({
    x: 200,
    y: 200,
    radius: 100,
    sketch: window
  });
  
  noFill();
  strokeWeight(5);
}

function draw() {
  circle1.x = mouseX;
  circle1.y = mouseY;
  background(255);  
  let transVec = createVector(0, 0);
  if (circle1.isColliding(circle2, transVec)) {
    stroke(255, 0, 0);
    circle1.x += transVec.x;
    circle1.y += transVec.y;
  } else {
    stroke(0, 255, 0);
  }
  circle1.render();
  circle2.render();
}
```

#### Syntax
`isColliding(other, [transVec])`

#### Parameters
- `other`: (`object`) The collider to check for a collision with.
- `transVec`: (optional `p5.Vector`) The vector to store a translation vector in
  (assuming one exists)

#### Returns
- `boolean`

# Kepler.PolygonCollider
## Description
A class that handles collisions for a convex polygon.

## Fields
- `position`: (readonly `p5.Vector`) The current position of the polygon.
- `angle`: (readonly `number`) The current rotation angle of the polygon.

## Methods
- [Constructor](#constructor-3)
- [`setPos()`](#setpos-1)
- [`modPos()`](#modpos-1)
- [`setAngle()`](#setangle)
- [`modAngle()`](#modangle)
- [`render()`](#render-3)
- [`isColliding()`](#iscolliding-3)

### Constructor
#### Description
Constructs a new `Kepler.PolygonCollider`. Like most constructors in Kepler,
this takes a configuration object, which can have up to four properties. The
first two, `points`, is an array containing each vertex of the polygon. The
vertices should be defined relative to where the polygon should rotate around
(i.e., vertices to the left of it should have negative x coordinates, and
vertices above it should have negative y coordinates). The second, `sketch`, is
the sketch or window that the collider is being created in. `x` and `y`
properties can also be used to set the position of the collider when it is
created - if these are not set, the polygon will be positioned at (0, 0).

#### Examples
```js
let collider;
function setup() {
  collider = new Kepler.PolygonCollider({
    points: [
      [   0, -100],
      [ 100,   50],
      [-100,   50]
    ],
    x: 200,
    y: 200,
    sketch: window
  });
}
```

#### Syntax
`new Kepler.PolygonCollider({points, sketch, [x], [y]})`

#### Parameters
- `points`: (`number[][]`)
- `sketch`: (`object`)
- `x`: (optional `number`)
- `y`: (optional `number`)

### setPos()
#### Description
Sets the position of the collider. The position can be passed as either
a single `p5.Vector`, or as 2 separate numbers.

#### Examples
```js
let collider;
function setup() {
  createCanvas(400, 400);
  collider = new Kepler.PolygonCollider({
    points: [
      [   0, -100],
      [ 100,   50],
      [-100,   50]
    ],
    x: 200,
    y: 200,
    sketch: window
  });

  noFill();
  let vec = createVector(50, 50);
  collider.setPos(vec);
  collider.render();

  collider.setPos(0, 200);
  collider.render();
}
```

#### Syntax
- `setPos(pos)`
- `setPos(x, y)`

#### Parameters
- `pos`: (`p5.Vector`)
- `x`: (`number`)
- `y`: (`number`)

### modPos()
#### Description
Moves the collider relative to its current position. The position can be passed
as either a single `p5.Vector`, or as 2 separate numbers.

#### Examples
```js
let collider;
function setup() {
  createCanvas(400, 400);
  collider = new Kepler.PolygonCollider({
    points: [
      [   0, -100],
      [ 100,   50],
      [-100,   50]
    ],
    x: 200,
    y: 200,
    sketch: window
  });

  noFill();
  let vec = createVector(-50, -50);
  collider.modPos(vec);
  collider.render();

  collider.modPos(-50, 150);
  collider.render();
}
```

#### Syntax
- `modPos(pos)`
- `modPos(x, y)`

#### Parameters
- `pos`: (`p5.Vector`)
- `x`: (`number`)
- `y`: (`number`)

### setAngle()
#### Description
Sets the rotation angle of the polygon.

#### Examples
```js
let collider;
function setup() {
  createCanvas(400, 400);
  collider = new Kepler.PolygonCollider({
    points: [
      [   0, -100],
      [ 100,   50],
      [-100,   50]
    ],
    x: 200,
    y: 200,
    sketch: window
  });

  noFill();
  collider.render();

  collider.setAngle(PI / 2);
  collider.render();
}
```

#### Syntax
`setAngle(angle)`

#### Parameters
- `angle`: (`number`)

### modAngle()
#### Description
Rotates the polygon relative to its current angle.

#### Examples
```js
let collider;
function setup() {
  createCanvas(400, 400);
  collider = new Kepler.PolygonCollider({
    points: [
      [   0, -100],
      [ 100,   50],
      [-100,   50]
    ],
    x: 200,
    y: 200,
    sketch: window
  });

  noFill();
  collider.render();

  collider.modAngle(PI / 4);
  collider.render();

  collider.modAngle(PI / 4);
  collider.render();
}
```

#### Syntax
`modAngle(angle)`

#### Parameters
- `angle`: (`number`)

### render()
#### Description
Renders the collider and its bounding box to a canvas - this is often useful for
debugging. The `renderTarget` parameter is optional and can be used to draw the
collider to an alternate canvas. The default render target is the sketch object
passed to the constructor.

#### Examples
```js
let collider, rt;
function setup() {
  createCanvas(400, 400);
  rt = createGraphics(400, 400);

  collider = new Kepler.PolygonCollider({
    points: [
      [   0, -100],
      [ 100,   50],
      [-100,   50]
    ],
    x: 200,
    y: 200,
    sketch: window
  });

  rt.noFill();
  rt.stroke(255, 0, 0);
  rt.strokeWeight(5);
  collider.render(rt);
  image(rt, 0, 0);
}
```

#### Syntax
`render([renderTarget])`

#### Parameters
- `renderTarget`: (optional `object`)

### isColliding()
#### Description
Returns whether the polygon is colliding with another collider object:
- If the other collider is a `Kepler.PointCollider`, it returns whether the
  point is inside the polygon.
- If the other collider is a `Kepler.LineCollider`, it returns whether any part
  the line intersects with the polygon.
- If the other collider is a `Kepler.CircleCollider` or a
  `Kepler.PolygonCollider`, it returns whether the polygon overlaps with the
  circle or polygon.

A `p5.Vector` can also be passed to this method. If the other collider is a
circle or polygon, and the polygon is colliding with it, that vector will be set
to the "minimum translation vector", which is the shortest vector that will move
the polygon out of the other collider.

#### Examples
```js
let poly, circle;

function setup() {
  createCanvas(400, 400);

  poly = new Kepler.PolygonCollider({
    points: [
      [   0, -100],
      [ 100,   50],
      [-100,   50]
    ],
    sketch: window
  });
  circle = new Kepler.CircleCollider({
    x: 200,
    y: 200,
    radius: 100,
    sketch: window
  });
  
  noFill();
  strokeWeight(5);
}

function draw() {
  poly.setPos(mouseX, mouseY);
  background(255);  
  let transVec = createVector(0, 0);
  if (poly.isColliding(circle, transVec)) {
    stroke(255, 0, 0);
    poly.x += transVec.x;
    poly.y += transVec.y;
  } else {
    stroke(0, 255, 0);
  }
  poly.render();
  circle.render();
}
```

#### Syntax
`isColliding(other, [transVec])`

#### Parameters
- `other`: (`object`) The collider to check for a collision with.
- `transVec`: (optional `p5.Vector`) The vector to store a translation vector in
  (assuming one exists)

#### Returns
- `boolean`