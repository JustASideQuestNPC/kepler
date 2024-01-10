# kepler.input Reference
***Note:** This is a language reference, not a tutorial. For a tutorial, see
the quickstart guide.*

# Contents:
- [**Kepler.Input:**](#keplerinput) Main class that manages the input system.

# Kepler.Input
## Description
A class that handles inputs for an entire sketch.

## Static Methods
- [`makeNew()`](#makenew)

## Instance Methods
- [`addAction()`](#addaction)
- [`loadActionList()`](#loadactionlist)
- [`update()`](#update)
- [`isActive()`](#isactive)
- [`getKeyState()`](#getkeystate)
- [`pressKey()`](#presskey)
- [`releaseKey()`](#releasekey)
- [`pressMouse()`](#pressmouse)
- [`releaseMouse()`](#releasemouse)


### makeNew()
#### Description
A static method that constructs and returns a new `Kepler.Input` object. If any 
of the sketch's main input listeners (`keyPressed()`, `keyReleased()`,
`mousePressed()`, and `mouseReleased()`) haven't already been defined, it
defines versions of them that update the created instance. `Kepler.Input`
objects can only be created using `makeNew()`, *not* `new Kepler.Input()`.

The first parameter in `makeNew`, `sketch`, is the sketch or window to define
input listeners for. The second, `f12HotkeyEnabled`, is an optional boolean that
determines whether the created input listeners should override the browser's
default behavior when the F12 key is pressed. In most browsers, F12 opens the
debug console. The default value is for `f12HotkeyEnabled` is `true`.

The automatically defined input listeners should be enough for most
applications. If you decide to define them yourself, you'll need to call
[`pressKey()`](#presskey), [`releaseKey()`](#releasekey),
[`pressMouse()`](#pressmouse), and [`releaseMouse()`](#releasemouse) in their
respective listeners.

#### Examples
```js
let input;

// global mode
function setup() {
  input = Kepler.Input.makeNew(window);
}
```

```js
// instance mode
const s = (sketch) => {
  let input;
  
  sketch.setup = () => {
    // disable the F12 hotkey
    input = Kepler.Input.makeNew(window, false);
  };
}

let sp = new p5(s);
```

#### Syntax
`KInput.makeNew(sketch, [f12HotkeyEnabled])`

#### Parameters
- `sketch`: (`p5` | `Window`) The sketch (or window if in global mode) that
    the instance is being constructed in.
- `[f12HotkeyEnabled]`: (optional `boolean`) Whether to enable or disable the F12
    hotkeys in the created`keyPressed()` function. In most browsers, this
    hotkey opens the debug console. The default value is `true`.

#### Returns
`KInput`: The instance constructed by the function, and that the created input
    listeners will update.


### addAction()
#### Description
Adds an input action to the manager. This function can take up to 5 parameters,
but it takes them in the form of a configuration object, which allows you to
refer to them by name and only use the ones you need.

The only 2 parameters that are required are `name` and `keys`. `name` is a
string with the name of the action, which you'll use when you check its state.
`keys` is an array containing the names of every key or mouse button that can
trigger the action. See the [key list](#key-list) for a list of valid key names.

The third parameter, `mode`, determines the action's activation mode, which can
be either `"continuous"`, `"press"`, or `"release"`:
- `"continuous"` actions are active on every frame that a key bound to them is
  pressed.
- `"press"` actions are active for a single frame when a key bound to them is
  initially pressed. After activating, they won't activate again until every key
  bound to them is released for at least one frame.
- `"release"` actions are active for a single frame when every key bound to them
  is initially released. After activating, they won't activate again until at
  least one key bound to them is released for at least one frame.

The default activation mode is `"continuous"`.

The fourth parameter, `chord`, is a boolean that sets whether the action is a
chord. Chord actions can only become active when every key bound to them is
pressed at the same time, while non-chord actions can become active whenever at
least one key bound to them is pressed. The default chord setting is `false`.

The fifth parameter, `callback`, is a function that is automatically called once
on every frame that the action is active. This function can do whatever you want
it to, as long as it takes no parameters and returns nothing. If you don't
specify a callback function, it does nothing.

#### Examples
```js
let input;
let counter = 0;

function setup() {
  input = Kepler.Input.makeNew(window);
  input.addAction({
    name: "a basic action",
    keys: ["spacebar"]
  });
  input.addAction({
    name: "a press action with multiple keys",
    keys: ["shift", "left mouse"],
    mode: "press"
  });
  input.addAction({
    name: "a chord action with a callback function",
    keys: ["a", "s", "d", "f"],
    chord: true,
    callback: () => {
      ++counter;
    }
  });
}
```

#### Syntax
`addAction({name, keys, [mode], [chord], [callback]})`

#### Parameters
- `name`: (`string`) The name of the action.
- `keys`: (`string[]`) An array containing all keys or mouse buttons that can
    activate the action.
- `mode`: (optional `string`) The action's activation mode, either
    `"continuous"`, `"press"`, or `"release"` (any other values will cause an
    error). The default value is `"continuous"`.
- `chord`: (optional `boolean`) If `true`, the action can only activate whenever
    every key or button bound to it is pressed at the same time. The default
    value is `false`.
- `callback`: (optional `function(): void`) The action's callback function. The
    default value is a function that does nothing.

### loadActionList()
#### Description
Loads one or more actions from a .json file. This method is asynchronous,
meaning it may not finish before the next line in your sketch is executed. To
prevent this from causing problems, call [`makeNew()`](#makenew) and
`loadActionList()` in `preload()`, instead of in `setup()`.

An optional second parameter, `verboseLogging`, is a boolean that enables or
disables logging, which prints some status updates to the console while loading
each action. Logging is enabled by default. Note that for performance reasons,
logging is disabled in the minified files for kepler.input.

An example of how to format the .json file can be found below. Note that for
technical reasons, actions with a callback function cannot be stored in a file.

#### Examples
```js
let input;

function preload() {
  input = Kepler.Input.makeNew(window);
  input.loadActionList("action-list.json");
}
```
##### `action-list.json`
```json
{
  "example action": {
    "keys": ["space"],
    "mode": "press",
    "chord": true
  }
}
```

#### Syntax
`loadActionList(path, [verboseLogging])`

#### Parameters
- `path`: (`string`) The path to the .json file.
- `verboseLogging`: (optional `boolean`) Enables or disables logging.

### update()
#### Description
Updates the manager and all actions inside it. This needs to be called once in
`draw` function for the manager to work correctly.

#### Examples
```js
let input;

function setup() {
  input = Kepler.Input.makeNew(window);
}

function draw() {
  input.update();
}
```

#### Syntax
`update()`

### isActive()
#### Description
Returns whether an action is active ("pressed") or not. This function takes a
single parameter, which is a string containing the name of the action (this is
the `name` parameter in `addAction`). Names are case-sensitive, and an error is
throw if the name is incorrect.

#### Examples
```js
// Note: This example assumes that a KInput instance named "input" was created
// in setup(), and that an action named "change color" was added to it.

function draw() {
  input.update();

  if (input.isActive("change color")) background(250, 65, 65);
  else background(235, 64, 52);
}
```

#### Syntax
`isActive(name)`

#### Parameters
- `name`: (`string`) The name of the action.

#### Returns
`boolean`: `true` if the action is active, `false` if it is not.


### getKeyState()
#### Description
Returns whether a specific key or mouse button is pressed. This function takes
a single parameter, which is the key to check the state of.

#### Examples
```js
// Note: This example assumes that a KInput instance named "input" was created
// in setup().

function draw() {
  input.update();

  if (input.getKeyState("spacebar")) background(250, 65, 65);
  else background(235, 64, 52);
}
```

#### Syntax
`getKeyState(key)`

#### Parameters
- `key`: (`string`) The key/button to get the state of.

#### Returns
`boolean`: `true` if the key is pressed, `false` if it is not.

### pressKey()
#### Description
Updates the internal state when a key is pressed. This is automatically added to
`keyPressed()` by `makeNew()`, so you only need to use it if you're defining
`keyPressed()` yourself for some reason.

#### Examples
```js
// Note: This example assumes that a KInput instance named "input" was created
// in setup().

function keyPressed() {
  input.pressKey(keyCode);
}
```

#### Syntax
`pressKey(code)`

#### Parameters
- `code`: (`number`) The code for the key that was pressed; should be `keyCode`.


### releaseKey()
Updates the internal state when a key is released. This is automatically added
to `keyReleased()` by `makeNew()`, so you only need to use it if you're defining
`keyReleased()` yourself for some reason.

#### Examples
```js
// Note: This example assumes that a KInput instance named "input" was created
// in setup().

function keyReleased() {
  input.releaseKey(keyCode);
}
```

#### Syntax
`releaseKey(code)`

#### Parameters
- `code`: (`number`) The code for the key that was released; should be
    `keyCode`.


### pressMouse()
Updates the internal state when a mouse button is pressed. This is automatically
added to `mousePressed()` by `makeNew()`, so you only need to use it if you're
defining `mousePressed()` yourself for some reason.

#### Examples
```js
// Note: This example assumes that a KInput instance named "input" was created
// in setup().

function mousePressed() {
  input.pressMouse(mouseButton);
}
```

#### Syntax
`pressMouse(button)`

#### Parameters
- `button`: (`string`) The mouse button that was pressed; should be
    `mouseButton`.


### releaseMouse()
Updates the internal state when a mouse button is released. This is
automatically added to `mouseReleased()` by `makeNew()`, so you only need to use
it if you're defining `mouseReleased()` yourself for some reason.

#### Examples
```js
// Note: This example assumes that a KInput instance named "input" was created
// in setup().

function mouseReleased() {
  input.releaseMouse(mouseButton);
}
```

#### Syntax
`releaseMouse(button)`

#### Parameters
- `button`: (`string`) The mouse button that was released; should be
    `mouseButton`.


# Key List
- `"left mouse"`
- `"right mouse"`
- `"middle mouse"`
- `"backspace"`
- `"tab"`
- `"enter"`
- `"shift"`
- `"control"`
- `"alt"`
- `"pause"`
- `"caps lock"`
- `"escape"`
- `"spacebar"`
- `"space"`
- `" "`
- `"page up"`
- `"page down"`
- `"end"`
- `"home"`
- `"left arrow"`
- `"left"`
- `"up arrow"`
- `"up"`
- `"right arrow"`
- `"right"`
- `"down arrow"`
- `"down"`
- `"insert"`
- `"delete"`
- `"0"`
- `"1"`
- `"2"`
- `"3"`
- `"4"`
- `"6"`
- `"7"`
- `"8"`
- `"9"`
- `";"`
- `"="`
- `"a"`
- `"b"`
- `"c"`
- `"d"`
- `"e"`
- `"f"`
- `"g"`
- `"h"`
- `"i"`
- `"j"`
- `"k"`
- `"l"`
- `"m"`
- `"n"`
- `"o"`
- `"p"`
- `"q"`
- `"r"`
- `"s"`
- `"t"`
- `"u"`
- `"v"`
- `"w"`
- `"x"`
- `"y"`
- `"z"`
- `"numpad 0"`
- `"numpad 1"`
- `"numpad 2"`
- `"numpad 3"`
- `"numpad 4"`
- `"numpad 5"`
- `"numpad 6"`
- `"numpad 7"`
- `"numpad 8"`
- `"numpad 9"`
- `"numpad *"`
- `"numpad +"`
- `"numpad ,"`
- `"numpad -"`
- `"numpad ."`
- `"numpad /"`
- `"f1"`
- `"f2"`
- `"f3"`
- `"f4"`
- `"f5"`
- `"f6"`
- `"f7"`
- `"f8"`
- `"f9"`
- `"f10"`
- `"f11"`
- `"f12"`
- `"num lock"`
- `"scroll lock"`
- `"-"`
- `","`
- `"."`
- `"/"`
- ``"`"``
- `"["`
- `"\\"`
- `"]"`
- `"'"`