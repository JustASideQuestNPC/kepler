# kepler.engine Reference
***Note:** This is a language reference, not a tutorial. For a tutorial, see the
readme.*

# Contents
- [**Kepler.Engine:**](#keplerengine) Main class that handles rendering and
  updates for entities.
- [**Kepler.Entity:**](#keplerentity) Abstract superclass that provides
  boilerplate methods for entities.

# Kepler.Engine
## Description
A class that handles rendering and updates for all entities.

## Fields
- `numEntities`: (readonly `number`) The number of entities currently being
  managed by the engine.
- `deltaTimeRaw`: (readonly `number`) The time between the last 2 ticks, in
  seconds.
- `deltaTime`: (readonly `number`) The time between the last 2 ticks, in
  seconds, multiplied by `deltaTimeMultiplier`.
- `deltaTimeMultiplier`: (`number`) The current delta time multiplier or "speed
  of time". When entities are updated, their `update()` method is passed the
  current delta time multiplied by this unless the entity has the
  `Kepler.USES_RAW_DELTA_TIME` tag. A multiplier of 1 (the default) keeps the
  same speed, a multiplier > 1 increases speed, and a multiplier < 1 lowers
  speed. The multiplier *must* be > 0!
- `tickRate`: (`number`) The current tick rate in ticks per second. The tick rate
  determines how often the engine updates (it's like frame rate, but for
  updates), and defaults to the frame rate of the sketch passed to the engine's
  constructor. A tick rate of at least 50-60 tps is recommended, and the tick
  rate *must* be > 0!
- `renderTarget`: (`object`) The screen that is passed to each entity's 
  `render()` method during the engine's `render()` method, and that is used for
  tracking the camera. The render target can be any object that mirrors the
  normal p5 drawing API, such as `p5.Graphics` or `p5.Framebuffer`. The default 
  render target is the sketch passed to the engine's constructor. *Note:
  changing the render target will reset `cameraAnchor`, `cameraPos`,
  `worldWidth`, and `worldHeight` to their default values.*
- `renderWidth`: (readonly `number`) The width of the current render target.
- `renderHeight`: (readonly `number`) The height of the current render target.
- `cameraPos`: (`p5.Vector`) The position of the camera in world space. *Note:*
  Setting `cameraPos` will also set `cameraTarget` to the same position - this 
  prevents unwanted camera movement next time the engine updates.
- `cameraTarget`: (`p5.Vector`) The position the camera is currently attempting
  to reach.
- `cameraAnchor`: (`p5.Vector`) What point on the screen `cameraPos` corresponds
  to. An anchor of `(0, 0)` places the camera at the top left corner of the
  screen, an anchor of `(width, height)` places the camera at the bottom right
  corner, and so on. The default anchor is `(width / 2, height / 2)`, which
  places the camera at the center of the screen.
- `cameraTightness`: (`number`) Determines how closely `cameraPos` follows
  `cameraTarget`. A tightness of 1 (the default) causes the camera to always be
  locked to the target, a tightness of 0 prevents the camera from moving at all,
  and a tightness between 0 and 1 causes the camera to move toward the target
  over multiple ticks. Setting tightness < 0 or > 1 produces undefined behavior!
- `useCameraBoundary`: (`boolean`) Enables or disables the camera boundary,
  which is disabled by default. When the camera boundary is enabled, `cameraPos`
  is constrained so that nothing outside of the world is ever rendered. The
  world is a rectangle with its top left corner at `(0, 0)`, a width of
  `worldWidth`, and a height of `worldHeight`.
- `worldWidth`: (`number`) The width of the world, defaults to the width of the
  current render target.
- `worldHeight`: (`number`) The height of the world, defaults to the height of
  the current render target.

## Methods
- [Constructor](#constructor)
- [`addEntity()`](#addentity)
- [`update()`](#update)
- [`render()`](#render)
- [`removeIf()`](#removeif)
- [`removeTagged()`](#removetagged)
- [`removeAll()`](#removeall)
- [`getIf()`](#getif)
- [`getTagged()`](#gettagged)
- [`screenPosToWorldPos()`](#screenpostoworldpos)
- [`worldPosToScreenPos()`](#worldpostoscreenpos)

### Constructor
#### Description
Creates a new `Kepler.Engine` instance. Like most constructors in Kepler, this
takes a configuration object, which can have up to eight properties. The only
required property, `sketch`, is the sketch or window that the engine is being
created in. The remaining properties are optional and can be used to set the
engine's `renderTarget`, `tickRate`, `cameraAnchor`, `cameraPos`,
`useCameraBoundary`, `worldWidth`, and `worldHeight` properties.

Note that to keep the parameter list a bit cleaner, the `cameraAnchor` and 
`cameraPos` are passed as objects with x and y properties, *not* as Vectors.

#### Examples
```js
let engine;
let rt;

function setup() {
  rt = new p5.Graphics(600, 400);

  engine = new Kepler.Engine({
    sketch: window,
    renderTarget: rt,
    tickRate: 60,
    cameraAnchor: { x: 0, y: 0 },
    cameraPos: { x: 200, y: 100 },
    useCameraBoundary: true,
    worldWidth: 1200,
    worldHeight: 800
  });
}
```

#### Syntax
`new Kepler.Engine({sketch, [renderTarget], [tickRate], [cameraAnchor],
  [cameraPos], [useCameraBoundary], [worldWidth], [worldHeight]})`

#### Parameters
- `sketch`: (`p5` | `Window`) The sketch (or window if in global mode) that
  the engine is being constructed in.
- `renderTarget`: optional `object`
- `tickRate`: optional `number`
- `cameraAnchor`: optional `object`
- `cameraPos`: optional `object`
- `useCameraBoundary`: optional `boolean`
- `worldWidth`: optional `number`
- `worldHeight`: optional `number`

### addEntity()
#### Description
Adds an entity to the engine. An entity is any object that can be anything and
have any function, as long as it extends [`Kepler.Entity`](#keplerentity).

This method also returns a reference to the added entity. In most cases this
can (and should) be safely ignored, but it can be useful for storing an entity
that other entities will need to access frequently.

#### Examples
```js
// Note: This example assumes that ExampleEntity extends Kepler.Entity
let engine, entity;

function setup() {
  engine = new Kepler.Engine({ sketch: window });
  entity = engine.addEntity(new ExampleEntity());
}
```

#### Syntax
`addEntity(entity)`

#### Parameters
- `entity`: (`object`) The entity to add to the engine; this can be any object
  as long as it extends [`Kepler.Entity`](#keplerentity).

#### Returns
- `object`: A reference to the entity added to the engine.

### update()
#### Description
Calls the `update()` method of every entity currently in the engine, and passes
it the current delta time, multiplied by `deltaTimeMultiplier`. If the entity
has the `Kepler.USES_RAW_DELTA_TIME` tag, its `update()` method will be passed
the "true" delta time instead.

Once all entities have been updated, any entities that have been marked for
deletion will be removed, and the camera position will be updated if needed.

This method should be called once in your `draw()` loop, even if the tick rate
is lower than the sketch's frame rate.

#### Examples
```js
let engine;

function setup() {
  engine = new Kepler.Engine({ sketch: window });
}

function draw() {
  engine.update();
}
```

#### Syntax
`update()`

### render()
#### Description
Calls the `render()` method of every entity currently in the engine, and passes
it the current `renderTarget`. This method should be called once in your
`draw()` loop, after calling `update()`.

#### Examples
```js
let engine;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
}

function draw() {
  engine.update();
  
  // render() *does not* clear the canvas
  background(255);
  engine.render();
}
```

#### Syntax
`render()`

### removeIf()
#### Description
Deletes all entities that a predicate function returns `true` for.

#### Examples
```js
let engine;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
}

function draw() {
  engine.update();

  // delete all entities that are off the right edge of the screen
  engine.removeIf((e) => e.xPos > 800);
}
```

#### Syntax
`removeIf(predicate)`

#### Parameters
- `predicate`: (`function(Entity): boolean`) A function that takes a single
  entity, and returns `true` if the entity should be deleted.

### removeTagged()
#### Description
Deletes all entities that have a certain tag.

#### Examples
```js
let engine;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
}

function draw() {
  engine.update();

  engine.removeTagged("please delete me");
}
```

#### Syntax
`removeTagged(tag)`

#### Parameters
- `tag`: (`any`) The tag to search for.

### removeAll()
#### Description
Deletes all entities.

#### Examples
```js
let engine;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });

  engine.removeAll();
}
```

#### Syntax
`removeAll()`

### getIf()
#### Description
Returns an array containing that a predicate function returns `true` for.

#### Examples
```js
let engine, offscreenEntities;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
}

function draw() {
  engine.update();

  // get all entities that are off the right edge of the screen
  offscreenEntities = engine.getIf((e) => e.xPos > 800);
}
```

#### Syntax
`getIf(predicate)`

#### Parameters
- `predicate`: (`function(Entity): boolean`) A function that takes a single
  entity, and returns `true` if the entity should be included in the list.

#### Returns
- `Entity[]`: All entities the predicate function returned `true` for.

### getTagged()
#### Description
Returns an array containing all entities that have a certain tag.

#### Examples
```js
let engine, entityList;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
}

function draw() {
  engine.update();

  entityList = engine.getTagged("please include me");
}
```

#### Syntax
`getTagged(tag)`

#### Parameters
- `tag`: (`any`) The tag to search for.

#### Returns
- `Entity[]`: All entities that have the specified tag.

### screenPosToWorldPos()
#### Description
Converts a position in screen space to a position in world space. Note that this
method will return the same position if the engine's camera has not been moved.

This method can take the x and y coordinates as either a single `p5.Vector`, or
as 2 numbers. The overload that takes a Vector returns another Vector, and the
overload that takes 2 numbers returns an array containing the new x and y
coordinates.

#### Examples
```js
let engine, worldPos;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
}

function draw() {
  engine.update();

  let mPos = createVector(mouseX, mouseY);
  worldPos = engine.screenPosToWorldPos(mPos);
}
```

```js
let engine, worldX, worldY;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
}

function draw() {
  engine.update();

  let buffer = engine.screenPosToWorldPos(mouseX, mouseY);
  worldX = buffer[0];
  worldY = buffer[1];

  // alternate syntax with destructuring assignment
  [worldX, worldY] = engine.screenPosToWorldPos(mouseX, mouseY);
}
```
#### Syntax
- `screenPosToWorldPos(pos)`

- `screenPosToWorldPos(x, y)`

#### Parameters
- `pos`: (`p5.Vector`) X and Y coordinates as a Vector
- `x`: (`number`)
- `y`: (`number`)

#### Returns
- `p5.Vector` (if the position was passed as a Vector)
- `[number, number]` (if the position was passed as separate coordinates)

### worldPosToScreenPos()
#### Description
Converts a position in world space to a position in screen space. Note that this
method will return the same position if the engine's camera has not been moved.

This method can take the x and y coordinates as either a single `p5.Vector`, or
as 2 numbers. The overload that takes a Vector returns another Vector, and the
overload that takes 2 numbers returns an array containing the new x and y
coordinates.

#### Examples
```js
let engine, entity, screenPos;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
  entity = engine.addEntity(new ExampleEntity());
}

function draw() {
  engine.update();

  screenPos = engine.worldPosToScreenPos(entity.position);
}
```

```js
let engine, entity, screenX, screenY;

function setup() {
  createCanvas(800, 800);
  engine = new Kepler.Engine({ sketch: window });
  entity = engine.addEntity(new ExampleEntity());
}

function draw() {
  engine.update();

  let buffer = engine.worldPosToScreenPos(entity.xPos, entity.yPos);
  screenX = buffer[0];
  screenY = buffer[1];

  // alternate syntax with destructuring assignment
  [screenX, screenY] = engine.worldPosToScreenPos(entity.xPos, entity.yPos);
}
```
#### Syntax
- `worldPosToScreenPos(pos)`

- `worldPosToScreenPos(x, y)`

#### Parameters
- `pos`: (`p5.Vector`) X and Y coordinates as a Vector
- `x`: (`number`)
- `y`: (`number`)

#### Returns
- `p5.Vector` (if the position was passed as a Vector)
- `[number, number]` (if the position was passed as separate coordinates)

# Kepler.Entity
## Description
A virtual superclass that provides boilerplate methods for entities.
`Kepler.Entity` objects cannot (and should not) be instantiated directly, but
any entities you add to an engine *must* be from classes that extend it.

## Fields
- `tags`: (`any[]`) An array containing all of the entity's tags. See the "tags"
  section in the readme for an explanation of the tag system.
- `engine`: (`Kepler.Engine`) A reference to the engine currently holding the
  entity - this is useful for modifying things like the camera position. *Note:
  this is automatically set by the engine when the entity is added to it. Don't
  change it manually unless you know what you're doing.*
- `markForDelete`: (`boolean`) If `true`, the entity will be removed from the
  engine at the end of the next update cycle.

## Methods
- [Constructor](#constructor-1)
- [`update()` (virtual)](#update-1)
- [`render()` (virtual)](#render-1)
- [`hasTag()`](#hastag)

### Constructor
#### Description
Constructs a new instance of the entity. The basic constructor does nothing and
should be overridden to add functionality.

Note that even though the base `Kepler.Entity` constructor does nothing, any
custom constructors still need to call it for technical reasons. This is done
using `super();` and must be the first line of the constructor.

#### Examples
```js
class ExampleEntity extends Kepler.Entity {
  position;

  constructor(x, y) {
    super(); // does nothing but is still required
    this.position = createVector(x, y);
  }
}
```

### update()
#### Description
Updates the entity. This is a virtual method, so it can be ignored if the entity
will never need to update (the base `update()` method does nothing).

This method is passed the engine's current delta time, multiplied by the current multiplier (unless the entity has the `Kepler.USES_RAW_DELTA_TIME` tag).
Multiplying time-dependent values like velocity by delta time is recommended, but not required.

The engine holding the entity will automatically call `update()` each time it
updates. Don't call `update()` yourself unless you know what you're doing.

#### Examples
```js
class ExampleEntity extends Kepler.Entity {
  position;

  MOVE_SPEED = 600; // pixels per second

  constructor(x, y) {
    super(); // does nothing but is still required
    this.position = createVector(x, y);
  }

  update(dt) {
    position.x += MOVE_SPEED * dt;
  }
}
```

#### Syntax
`update(dt)`

#### Parameters
- `dt`: (`number`) The current delta time, multiplied by the current multiplier 
(unless the entity has the `Kepler.USES_RAW_DELTA_TIME` tag).

### render()
#### Description
Renders the entity. This is a virtual method, so it can be ignored if the entity
will never need to render (the base `render()` method does nothing).

This method is passed the engine's current render target. Calling any drawing functions on the render target is recommended, but not required.

The engine holding the entity will automatically call `render()` each time it
renders to the screen. Don't call `render()` yourself unless you know what
you're doing.

#### Examples
```js
class ExampleEntity extends Kepler.Entity {
  position;

  constructor(x, y) {
    super(); // does nothing but is still required
    this.position = createVector(x, y);
  }

  render(rt) {
    rt.rect(position.x - 25, position.y - 25, 50, 50);
  }
}
```

#### Syntax
`render(rt)`

#### Parameters
- `rt`: (`object`) The engine's current render target.

### hasTag()
#### Description
Returns whether the entity has a certain tag. This is not a virtual method, and
you should not override it unless you know what you're doing.

#### Examples
```js
function setup() {
  let entity = new ExampleEntity();
  console.log(entity.hasTag("foo")); // true
  console.log(entity.hasTag("bar")); // false
}

class ExampleEntity extends Kepler.Entity {
  tags = ["foo"];
}
```

#### Syntax
`hasTag(tag)`

#### Parameters
- `tag`: (`any`) The tag to search for.

#### Returns
- `boolean`