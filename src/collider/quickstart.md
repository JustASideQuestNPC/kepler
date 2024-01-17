# kepler.collider Quickstart Guide
***Note:** This is a tutorial for how to quickly get kepler.input up and
running. If you're looking for a list of all the functionality in this module,
see the language reference.*

# Contents
- [Overview](#overview)
- [Installation](#installation)
- [Creating Colliders](#creating-colliders)
- [Using Colliders](#using-colliders)

# Overview
Although Kepler is not a physics engine, kepler.collider still provides a
system for basic 2d collision checks. It's easy to set up, and it supports
points, lines, circles, and polygons.

# Installation
To start using kepler.input, start by downloading `kepler.collider.zip` from
the [latest release](https://github.com/JustASideQuestNPC/kepler/releases/latest),
and unzip it to whatever folder you feel like. If you're using the
[web editor](https://editor.p5js.org/), add `kepler.collider_webEditorSafe.js`
to your project - it's a modified version that plays nice with the library
(everything else is the same, though). Otherwise, add `kepler.collider.js` to
whatever you're using to write your code.

Don't worry about the `.min.js` versions of each file - these are minified
versions that will load extremely quickly, but don't have any of the helpful
error checks that the normal files do.

Finally, just add another JavaScript file to write your code in (if you're
the web editor, there's already one there), and make sure both of them are added
to your project's `index.html`. To check if kepler.input is working, run this
code from your main file (if you're not using the web editor, you'll also need
to [install p5.js](https://p5js.org/get-started/#settingUp)):
```js
function setup() {
  console.log(Kepler.COLLIDER_INCLUDED);
}
```
If you see `true` in the debug console, congratulations!

# Creating Colliders
Kepler has 4 collider classes: `Kepler.PointCollider`, `Kepler.LineCollider`,
`Kepler.CircleCollider`, and `Kepler.PolygonCollider`. They all have the same
basic functionality, but their constructors and some of their properties are
different depending on the type.

### Kepler.PointCollider
PointColliders handle collisions for a single point. Like almost all
constructors in Kepler, the PointCollider constructor takes a configuration
object. In this case, it has three properties: the x and y coordinates of the
point, and the sketch (or window) that it's being created in:
```js
let pointCollider;
function setup() {
  pointCollider = new Kepler.PointCollider({
    x: 0,
    y: 0,
    sketch: window
  });
}
```
To change the position of a PointCollider, you can use its `position` vector or
its `x` and `y` properties. Note that these properties are linked, so changing
one will also update the other:
```js
let pointCollider;
function setup() {
  pointCollider = new Kepler.PointCollider({
    x: 0,
    y: 0,
    sketch: window
  });

  pointCollider.position.set(100, 100);
  // does the same thing as setting the position vector
  pointCollider.x = 100;
  pointCollider.y = 100;

  // moves the collider to (200, 200)
  pointCollider.position.add(createVector(50, 50));
  pointCollider.x += 50;
  pointCollider.y += 50;
}
```

### Kepler.LineCollider
LineColliders handle collisions for a line segment between 2 points. Like almost
all constructors in Kepler, the LineCollider constructor takes a configuration
object. In this case, it has three properties: the start and end points of the
line (which are objects themselves), and the sketch (or window) that it's being
created in:
```js
let lineCollider;
function setup() {
  lineCollider = new Kepler.LineCollider({
    start: { x: 0, y: 0 },
    end: { x: 100, y: 200 },
    sketch: window
  });
}
```
To change the position of a LineCollider, you can modify its `start` and `end`
vectors, or use its `setPos()` and `modPos()` methods to move both points
together: 
```js
let lineCollider;
function setup() {
  lineCollider = new Kepler.LineCollider({
    start: { x: 0, y: 0 },
    end: { x: 100, y: 200 },
    sketch: window
  });

  lineCollider.start.set(0, 100);
  lineCollider.end.set(100, 0);

  // pass the new position of the start point to setPos()
  lineCollider.setPos(100, 100);

  // moves the start point to (150, 150)
  lineCollider.modPos(50, 50);
}
```

### Kepler.CircleCollider
CircleColliders handle collisions for a circle with a certain radius. Like
almost all constructors in Kepler, the CircleCollider constructor takes a
configuration object. In this case, it has four properties: the x and y
coordinates of the circle, the radius of the circle, and the sketch (or window)
that it's being created in:
```js
let circleCollider;
function setup() {
  circleCollider = new Kepler.CircleCollider({
    x: 0,
    y: 0,
    radius: 50,
    sketch: window
  });
}
```
To change the position of a CircleCollider, you can use its `position` vector or
its `x` and `y` properties. Note that these properties are linked, so changing
one will also update the other. To change the circle's radius, you can modify
its `radius` property:
```js
let circleCollider;
function setup() {
  circleCollider = new Kepler.CircleCollider({
    x: 0,
    y: 0,
    radius: 50,
    sketch: window
  });

  circleCollider.position.set(100, 100);
  // does the same thing as setting the position vector
  circleCollider.x = 100;
  circleCollider.y = 100;

  // moves the collider to (200, 200)
  circleCollider.position.add(createVector(50, 50));
  circleCollider.x += 50;
  circleCollider.y += 50;

  circleCollider.radius = 100;
}
```

### Kepler.PolygonCollider
PolygonColliders handle collisions for a polygon that has any number of points,
and are the most complex of the four colliders. Like almost all constructors in
Kepler, the PolygonCollider constructor takes a configuration object. In this
case, it has up to four properties. The two required properties are the sketch
(or window) that the collider is being created in, and an array containing each
vertex of the polygon. These vertices should be relative to the point the
polygon rotates around (i.e., vertices to the left of it should have negative
x coordinates). Note that polygons *must* be convex for collisions to work
correctly!

In addition to the sketch and vertices, the configuration object can also
specify the x and y position of the polygon. If these properties aren't
included, the polygon is positioned at (0, 0):
```js
let polygonCollider;
function setup() {
  polygonCollider = new Kepler.PolygonCollider({
    points: [
      [  0, -50],
      [-50,  25],
      [ 50,  25]
    ],
    x: 100,
    y: 100,
    sketch: window
  });
}
```

To move a PolygonCollider, use its `setPos()` method to set its position, and
use its `modPos()` method to move it relative to its current position:
```js
let polygonCollider;
function setup() {
  polygonCollider = new Kepler.PolygonCollider({
    points: [
      [  0, -50],
      [-50,  25],
      [ 50,  25]
    ],
    sketch: window
  });

  polygonCollider.setPos(100, 100);

  // moves the collider to (150, 150)
  polygonCollider.modPos(50, 50);
}
```
To get the collider's current position, you can check its `position` property.
Note that this property is read-only, so it can't be changed directly.

PolygonColliders also have `setAngle()` and `modAngle()` methods, which rotate
them around their current position:
```js
let polygonCollider;
function setup() {
  polygonCollider = new Kepler.PolygonCollider({
    points: [
      [  0, -50],
      [-50,  25],
      [ 50,  25]
    ],
    sketch: window
  });

  // angles are in radians by default
  polygonCollider.setAngle(PI / 2);
  polygonCollider.modAngle(PI / 4);
}
```
To get the collider's current angle, you can check its `angle` property. Note
that this property is read-only, so it can't be changed directly.

All colliders have a `render()` method that will display their shape for easy
debugging. It can be passed a drawable canvas to display to, but will default to
the sketch passed to the constructor. Note that `render()` does not set the fill
or stroke colors before drawing the collider:
```js
let collider, pg;
function setup() {
  // construct any collider type and assign it to the collider variable...
  pg = createGraphics(200, 200);
  noFill();
  strokeWeight(5);
  collider.render(pg);
  image(pg, 0, 0);
}
```

# Using Colliders
To check if two colliders are colliding, just call the first collider's
`isColliding()` method, and pass it the second collider. This works regardless
of which shape each collider is, and returns a boolean based on whether the
colliders overlap with each other.
```js
let dynamicCollider, staticCollider;
function setup() {
  // construct any collider type and assign it to the staticCollider variable...
  dynamicColldier = new Kepler.LineCollider({
    start: { x: 0, y: 0 },
    end: { x: 100, y: 200 },
    sketch: window
  });

  noFill();
  strokeWeight(5);
}
function draw() {
  dynamicCollider.setPos(mouseX, mouseY);

  background(255);
  if (dynamicCollider.isColliding(staticCollider)) {
    stroke(255, 0, 0);
  } else {
    stroke(0, 255, 0)
  }
  dynamicCollider.render();
  staticCollider.render();
}
```

If the first collider is a CircleCollider or a PolygonCollider, a p5.Vector can
also be passed to `isColliding()`. If the second collider is also a
CircleCollider or a PolygonCollider (and both colliders overlap), that vector
will be set to the "minimum translation vector", which is the shortest vector
that will move the first collider out of the second collider:
```js
let dynamicCollider, staticCollider;

function setup() {
  // construct a CircleCollider or PolygonCollider and assign it to the
  // staticCollider variable...
  dynamicColldier = new Kepler.CircleCollider({
    x: 0,
    y: 0,
    radius: 50,
    sketch: window
  });
  noFill();
  strokeWeight(5);
}
function draw() {
  dynamicCollider.x = mouseX;
  dynamicCollider.y = mouseY;
  let transVec = createVector(0, 0);
  if (dynamicCollider.isColliding(staticCollider, transVec)) {
    dynamicCollider.x += transVec.x;
    dynamicCollider.y += transVec.y;
  }

  background(255);
  dynamicCollider.render();
  staticCollider.render();
}
```