# kepler.sprite Reference
***Note:** This is a language reference, not a tutorial. For a tutorial, see the
readme.*

# Contents:
- [**Kepler.SpriteLoader:**](#keplerspriteloader) Class for loading images and
  animations into sprite objects.
- [**Kepler.ImageSprite:**](#keplerimagesprite) Class for a sprite that is a
  single image without animations.
- [**Kepler.AnimatedSprite:**](#kepleranimatedsprite) Class for a sprite that
  has one or more animations.
- [**Animation Data Formatting:**](#animation-data-formatting) Formatting rules
  for animation data files.

# Kepler.SpriteLoader
## Description
A class that handles loading images and animations so that they can be used in
sprite objects. A sprite loader should be created at the top of your sketch and
then used to load the data for every sprite that will be used.

## Methods
- [Constructor](#constructor)
- [`loadSprite()`](#loadsprite)
- [`loadSpriteList()`](#loadspritelist)
- [`makeImageSprite()`](#makeimagesprite)
- [`makeAnimatedSprite()`](#makeanimatedsprite)

### Constructor
#### Description
Constructs a new `Kepler.SpriteLoader`. The constructor takes a single
parameter, which is the window or sketch object the sprite loader is being
created in.

#### Examples
```js
let spriteLoader;

function preload() {
  spriteLoader = new Kepler.SpriteLoader(window);
}
```

#### Syntax
`new Kepler.SpriteLoader(sketch)`

#### Parameters
- `sketch`: (`object`)

### loadSprite()
#### Description
Loads an image or animation and processes it into an object that can later be
used in sprite objects. This method takes a configuration object that describes
the sprite and can have many properties:
- `path` is the only required property, and is the path to the source file for
  the sprite. For sprites that are a single image, this is just the path to that
  image. For sprites with animations, this is the path to a .json file with the
  animation data (see [this section](#animation-data-formatting) for details on
  how data files are formatted).
- `name` is the name of the sprite, which is used when creating sprite objects
  for it. If no name is provided, the name is the name of the source file, minus
  the extension and the rest of the path (for example, a sprite with a source
  file at `sprites/my-sprite.png` would be named `my-sprite`).
- `position` is the starting position of the sprite, and is an object with `x`
  and `y` properties. The default position for a sprite is (0, 0).
- `anchor` determines what point the sprite rotates around, and is an object
  with `x` and `y` properties. These properties can be numbers or strings. If
  they are numbers, they set the position of the anchor in pixels, relative to
  the top left corner of the sprite. If they are strings, the sprite loader
  automatically finds the correct anchor. Valid strings are `"left"`, `"right"`,
  and `"center"` for `x`, and `"top"`, `"bottom"`, or `"center"` for `y`. The
  default anchor is the center of the sprite.
- `rotation` is the starting rotation of the sprite. The default rotation is 0.
- `scale` is the starting scale of the sprite, and is an object with `x`
  and `y` properties. The default scale is (1, 1), which is the original size
  of the sprite.
- `size` is the starting size of the sprite in pixels, and is an object with `x`
  and `y` properties. The default size is the original size of the sprite.
  *Note: If both `scale` and `size` are present, `size` will override `scale`.*

There are also a few properties that are exclusive to animations:
- `frameRate` is the starting frame rate of the sprite. The default frame rate
  is 20.
- `playbackMode` determines what happens when the sprite finishes playing, and
  can be either `"loop"`, `"ping pong"`, or `"play once"`. The default playback
  mode is `"loop"`.
- `paused` is a boolean that determines whether the sprite starts paused. The
  default value is `false`.
- `startTag` is the starting tag of the sprite. This is only useful if the
  sprite has multiple animations.

This method is asynchronous, meaning it may not finish before the next line of
your sketch is executed. To prevent this from causing problems, create the
sprite loader and load any sprites in `preload()`.

#### Examples
```js
let spriteLoader;

function preload() {
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example sprite",
    path: "sprites/example-sprite.json",
    position: { x: 400, y: 400 },
    anchor: { x: "left", y: "top" },
    rotation: PI / 2,
    scale: { x: 0.5, y: 2 }, // scale is actually redundant if size is present
    size: { x: 100, y: 400 },
    frameRate: 30,
    playbackMode: "ping pong",
    paused: true,
    startTag: "example tag"
  });
}
```

#### Syntax
`loadSprite({path, [name], [position], [anchor], [rotation], [scale], [size],
    [frameRate], [playbackMode], [paused], [startTag]})`

#### Parameters
- `path`: (`string`)
- `name`: (optional `string`)
- `position`: (optional `object`)
- `anchor`: (optional `object`)
- `rotation`: (optional `number`)
- `scale`: (optional `object`)
- `size`: (optional `object`)
- `frameRate`: (optional `number`)
- `playbackMode`: (optional `string`)
- `paused`: (optional `boolean`)
- `startTag`: (optional `string`)

### loadSpriteList()
#### Description
Loads one or more sprites from a .json file. This method is asynchronous,
meaning it may not finish before the next line of your sketch is executed. To
prevent this from causing problems, create the sprite loader and load any
sprites in `preload()`.

An optional second parameter, `verboseLogging`, is a boolean that enables or
disables logging, which prints some status updates to the console while loading
each sprite. Logging is enabled by default. Note that for performance reasons,
logging is disabled in the minified files for kepler.sprite.

An example of how to format the .json file can be found below.

#### Examples
```js
let spriteLoader;

function preload() {
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSpriteList("sprite-list.json");
}
```
##### `sprite-list.json`
```json
{
  "example sprite": {
    "path": "sprites/example-sprite.json",
    "position": { "x": 400, "y": 400 },
    "playbackMode": "ping pong",
    "paused": true
  }
}
```

#### Syntax
`loadSpriteList(path, [verboseLogging])`

#### Parameters
- `path`: (`string`) The path to the .json file.
- `verboseLogging`: (optional `boolean`) Enables or disables logging.

### makeImageSprite()
#### Description
Constructs and returns a new `Kepler.ImageSprite` from a sprite that was
previously loaded using `loadSprite()` or `loadSpriteList()`.

#### Examples
```js
let spriteLoader, imageSprite;

function preload() {
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example image",
    path: "sprites/image.png",
  });

  imageSprite = spriteLoader.makeImageSprite("example image");
}
```

#### Syntax
`makeImageSprite(name)`

#### Parameters
- `name`: (`string`)

#### Returns
- `Kepler.ImageSprite`

### makeAnimatedSprite()
#### Description
Constructs and returns a new `Kepler.AnimatedSprite` from a sprite that was
previously loaded using `loadSprite()` or `loadSpriteList()`.

#### Examples
```js
let spriteLoader, animatedSprite;

function preload() {
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example animation",
    path: "sprites/animation.json",
  });

  animatedSprite = spriteLoader.makeAnimatedSprite("example animation");
}
```

#### Syntax
`makeAnimatedSprite(name)`

#### Parameters
- `name`: (`string`)

#### Returns
- `Kepler.AnimatedSprite`

# Kepler.ImageSprite
## Description
A sprite that is a single image and has no animations.

## Fields
- `position`: (`p5.Vector`) The position of the sprite. *Note: changing
  `position.x` and/or `position.y` will also change `x` and.or `y`, and vice
  versa.*
- `x`: (`number`) X coordinate of the sprite. *Note: Changing this value will
  also change `position.x`, and vice versa.*
- `y`: (`number`) Y coordinate of the sprite. *Note: Changing this value will
  also change `position.y`, and vice versa.*
- `displayAnchor`: (`p5.Vector`) The display anchor of the sprite, measured in
  pixels from the sprite's upper left corner. *Note: changing `displayAnchor.x`
  and/or `displayAnchor.y` will also change `anchorX` and/or `anchorY`, and vice
  versa.*
- `anchorX`: (`number`) X coordinate of the sprite's display anchor. *Note:
  Changing this value will also change `displayAnchor.x`, and vice versa.*
- `anchorY`: (`number`) Y coordinate of the sprite's display anchor. *Note:
  Changing this value will also change `displayAnchor.y`, and vice versa.*
- `sourceWidth`: (readonly `number`) Width of the sprite's source image.
- `sourceHeight`: (readonly `number`) Height of the sprite's source image.
- `width`: (`number`) Current width of the sprite.
- `height`: (`number`) Current height of the sprite.
- `rotation`: (`number`) Current rotation angle of the sprite.

## Methods
- [`render()`](#render)
- [`scale()`](#scale)
- [`scaleAbsolute()`](#scaleabsolute)

### render()
#### Description
Renders the sprite to a canvas. The `renderTarget` parameter is optional and can
be used to draw the collider to an alternate canvas. The default render target
is the sketch object passed to the constructor.

#### Examples
```js
let spriteLoader, imageSprite, rt;

function preload() {
  createCanvas(800, 800);
  rt = createGraphics(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example image",
    path: "sprites/image.png",
  });

  imageSprite = spriteLoader.makeImageSprite("example image");
  imageSprite.render(rt);
  image(rt, 0, 0);
}
```

#### Syntax
`render(renderTarget)`

#### Parameters
- `renderTarget`: (optional `object`)

### scale()
#### Description
Scales the sprite relative to its current size. If a single parameter is passed,
it scales the sprite vertically and horizontally by the same amound.

#### Examples
```js
let spriteLoader, imageSprite;

function preload() {
  createCanvas(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example image",
    path: "sprites/image.png",
  });

  imageSprite = spriteLoader.makeImageSprite("example image");
  imageSprite.scale(0.5, 2);
  imageSprite.scale(2);
  imageSprite.render();
}
```

#### Syntax
- `scale(s)`
- `scale(x, y)`

#### Parameters
- `s`: (`number`)
- `x`: (`number`)
- `y`: (`number`)

### scaleAbsolute()
#### Description
Scales the sprite relative to its original size. If a single parameter is
passed, it scales the sprite vertically and horizontally by the same amound.

#### Examples
```js
let spriteLoader, imageSprite;

function preload() {
  createCanvas(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example image",
    path: "sprites/image.png",
  });

  imageSprite = spriteLoader.makeImageSprite("example image");
  imageSprite.scaleAbsolute(0.5, 2);
  imageSprite.render();
}
```

#### Syntax
- `scaleAbsolute(s)`
- `scaleAbsolute(x, y)`

#### Parameters
- `s`: (`number`)
- `x`: (`number`)
- `y`: (`number`)

# Kepler.AnimatedSprite
## Description
A sprite that has one or more animations.

## Fields
- `position`: (`p5.Vector`) The position of the sprite. *Note: changing
  `position.x` and/or `position.y` will also change `x` and.or `y`, and vice
  versa.*
- `x`: (`number`) X coordinate of the sprite. *Note: Changing this value will
  also change `position.x`, and vice versa.*
- `y`: (`number`) Y coordinate of the sprite. *Note: Changing this value will
  also change `position.y`, and vice versa.*
- `displayAnchor`: (`p5.Vector`) The display anchor of the sprite, measured in
  pixels from the sprite's upper left corner. *Note: changing `displayAnchor.x`
  and/or `displayAnchor.y` will also change `anchorX` and/or `anchorY`, and vice
  versa.*
- `anchorX`: (`number`) X coordinate of the sprite's display anchor. *Note:
  Changing this value will also change `displayAnchor.x`, and vice versa.*
- `anchorY`: (`number`) Y coordinate of the sprite's display anchor. *Note:
  Changing this value will also change `displayAnchor.y`, and vice versa.*
- `sourceWidth`: (readonly `number`) Width of the sprite's source image.
- `sourceHeight`: (readonly `number`) Height of the sprite's source image.
- `width`: (`number`) Current width of the sprite.
- `height`: (`number`) Current height of the sprite.
- `rotation`: (`number`) Current rotation angle of the sprite.
- `playbackMode`: (`string`) The sprite's current playback mode, which
  determines what happens when it reaches the end of the current animation:
  - `"loop"` causes the sprite to return to the first frame.
  - `"ping pong"` causes the sprite to play in reverse back to the first frame.
  - `"play once"` causes the sprite to pause on the last frame.
- `playbackSpeed`: (`number`) The sprite's current playback speed. This is a
  multiplier, so a value of 1 plays at the current speed, and value of 0.5 plays
  at half speed, and so on. If the playback speed is negative, the animation
  plays in reverse.
- `paused`: (`boolean`) Whether the sprite is currently paused.
- `frameRate`: (`number`) The sprite's current frame rate. This can be changed,
  but changing `playbackSpeed` is typically a better way to control speed.
- `currentTag`: (readonly `string`) The animation tag that is currently being
  played. Animation tags are specified in the sprite's data file, and are used
  to give a sprite multiple animations.
- `tagNames`: (constant `string[]`) An array containing the names of all the
  animation's tags.
- `numFrames`: (readonly `number`) The number of frames in the current animation
  tag.
- `currentFrame`: (readonly `number`) Which frame in the current tag is being
  displayed.

## Methods
- [`advanceFrame()`](#advanceframe)
- [`restart()`](#restart)
- [`changeTag()`](#changetag)
- [`update()`](#update)
- [`render()`](#render-1)
- [`scale()`](#scale-1)
- [`scaleAbsolute()`](#scaleabsolute-1)

### advanceFrame()
#### Description
Moves the animation forward (if `n` is positive) or backward (if `n` is
negative) by `n` frames. If this moves the animation past the first or last
frame, the animation's playback mode is respected.

#### Examples
```js
let spriteLoader, animatedSprite;

function preload() {
  createCanvas(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example animation",
    path: "sprites/animation.json",
  });

  animatedSprite = spriteLoader.makeAnimatedSprite("example animation");
  animatedSprite.render();
  animatedSprite.x = 400;
  animatedSprite.advanceFrame(1);
  animatedSprite.render();
}
```

#### Syntax
`advanceFrame(n)`

#### Parameters
- `n`: (`number`)

### restart()
#### Description
Restarts the animation at the first frame of the current animation tag, or the
last frame if the animation is currently playing in reverse. An optional boolean
can be passed to determine whether the animation is paused after restarting
(the default is `false`).

#### Examples
```js
let spriteLoader, animatedSprite;

function preload() {
  createCanvas(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example animation",
    path: "sprites/animation.json",
  });

  animatedSprite = spriteLoader.makeAnimatedSprite("example animation");
  animatedSprite.render();
  animatedSprite.x = 400;
  animatedSprite.advanceFrame(1);
  animatedSprite.render();
  animatedSprite.position.set(0, 400);
  animatedSprite.restart(true);
  animatedSprite.render();
}
```

#### Syntax
`restart([startPaused])`

#### Parameters
- `startPaused`: (optional `boolean`)

### changeTag()
#### Description
Changes the current animation tag. Animation tags are used to give sprites
multiple animations. When an animation changes, the sprite resets to the first
frame of the animation, or the last frame if the animation is currently playing
in reverse.

#### Examples
```js
let spriteLoader, animatedSprite;

function preload() {
  createCanvas(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example animation",
    path: "sprites/animation.json",
  });

  animatedSprite = spriteLoader.makeAnimatedSprite("example animation");
  animatedSprite.render();
  animatedSprite.x = 400;
  animatedSprite.changeTag("example tag");
  animatedSprite.render();
}
```

#### Syntax
`changeTag(tagname)`

#### Parameters
- `tagname`: (`string`)

### update()
#### Description
Updates the sprite using the current delta time in seconds. This should be
called on every frame, even if the animation is paused (if the animation is
paused, this method will just do nothing).

#### Examples
```js
let spriteLoader, animatedSprite;

function preload() {
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example animation",
    path: "sprites/animation.json",
  });

  animatedSprite = spriteLoader.makeAnimatedSprite("example animation");
}

function setup() {
  createCanvas(800, 800);
}

function draw() {
  let dt = deltaTime * 1000; // p5js measures delta time in milliseconds
  animatedSprite.update(dt);

  background(255);
  animatedSprite.render();
}
```

#### Syntax
`update(deltaTime)`

#### Parameters
- `deltaTime`: (`number`)

### render()
#### Description
Renders the sprite to a canvas. The `renderTarget` parameter is optional and can
be used to draw the collider to an alternate canvas. The default render target
is the sketch object passed to the constructor.

#### Examples
```js
let spriteLoader, animatedSprite, rt;

function preload() {
  createCanvas(800, 800);
  rt = createGraphics(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example animation",
    path: "sprites/animation.json",
  });

  animatedSprite = spriteLoader.makeAnimatedSprite("example animation");
  animatedSprite.render(rt);
  image(rt, 0, 0);
}
```

#### Syntax
`render(renderTarget)`

#### Parameters
- `renderTarget`: (optional `object`)

### scale()
#### Description
Scales the sprite relative to its current size. If a single parameter is passed,
it scales the sprite vertically and horizontally by the same amound.

#### Examples
```js
let spriteLoader, animatedSprite;

function preload() {
  createCanvas(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example animation",
    path: "sprites/animation.json",
  });

  animatedSprite = spriteLoader.makeAnimatedSprite("example animation");
  animatedSprite.scale(0.5, 2);
  animatedSprite.scale(2);
  animatedSprite.render();
}
```

#### Syntax
- `scale(s)`
- `scale(x, y)`

#### Parameters
- `s`: (`number`)
- `x`: (`number`)
- `y`: (`number`)

### scaleAbsolute()
#### Description
Scales the sprite relative to its original size. If a single parameter is
passed, it scales the sprite vertically and horizontally by the same amound.

#### Examples
```js
let spriteLoader, animatedSprite;

function preload() {
  createCanvas(800, 800);
  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSprite({
    name: "example animation",
    path: "sprites/animation.json",
  });

  animatedSprite = spriteLoader.makeAnimatedSprite("example animation");
  animatedSprite.scaleAbsolute(0.5, 2);
  animatedSprite.render();
}
```

#### Syntax
- `scaleAbsolute(s)`
- `scaleAbsolute(x, y)`

#### Parameters
- `s`: (`number`)
- `x`: (`number`)
- `y`: (`number`)

# Animation Data Formatting
Animations in Kepler are stored as a sprite sheet (a single image containing
every frame of the sprite's animations) and an data file, which is a .json file
that contains information on how to break up the sprite sheet.

There are a variety of tools to automatically generate animation data from a
sprite sheet, and many sprite editing programs can also generate it, so you
shouldn't need to write anything manually, but here's the format just in case.

The .json file is an object with 2 main sections: `"frames"` and `"meta"`.


`"frames"` is an object that contains the data for each frame of the animation
(the keys used for each frame don't matter, only the actual frame objects). Each
frame is an object with (at least) 4 properties:
- `"frame"` is an object with the x, y, width, and height of the frame in the
  sprite sheet, stored as `"x"`, `"y"`, `"w"`, and `"h"`.
- `"trimmed"` is a boolean that indicates whether the frame is the entire frame,
  or if it is a smaller section of the sprite that has been trimmed to remove
  transparent or otherwise unnecessary pixels.
- `"spriteSourceSize"` is an object with the x, y, width, and height of the
  frame in the sprite (**not** the sprite sheet), stored as `"x"`, `"y"`, `"w"`,
  and `"h"`. If the sprite is untrimmed, this will always be the same width and
  height as the sprite, and have an x and y of (0, 0).
- `"sourceSize"` is an object that contains the size of the entire sprite. The
  width of the sprite `"w"`, and the height of the sprite is `"h"`.

`"meta"` is an object that contains a lot of things when exported from a sprite
editor, but it only needs 2 things to be used with Kepler:
- `"path"` is the path to the sprite sheet, **relative to the location of the
  data file**.
- `"frameTags"` is an array with all the sprite's animation tags, and is only
  necessary if the sprite has multiple tags (if it doesn't, all the frames are
  treated as a single tag). Each animation tag is stored as an object with 3
  properties:
  - `"name"` is a string containing the name of the tag.
  - `"from"` is the index of the first frame of the tag.
  - `"to"` is the index of the last frame of the tag.

For a simple(ish) example of how the sprite sheet and data file should be 
formatted, see the `json-format-example` folder in the same folder as this
document.