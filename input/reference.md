# KInput Reference
***Note:** This is a language reference, not a tutorial. For a tutorial, see the
readme...which doesn't currently exist.*

# Contents:
- **[Key:](#key)** Enum for keyboard keys and mouse buttons.
- **[KInput:](#kinput)** Main class that manages the input system.

# Key
### Description
A datatype/enum that stores keyboard keys and mouse buttons. `Key` is used by
any function and method that takes a key or button as a parameter.

## Values
Keys are formatted as `Key.KEY_NAME`, where `KEY_NAME` is the name of the
key/mouse button formatted in SCREAMING_SNAKE_CASE. A list of all keys can be
found at [the bottom of this file](#key-list).

# KInput
## Description
A class that handles inputs for an entire sketch.

## Static Methods
- [**makeNew()**](#makenew)

## Instance Methods
- [**addAction()**](#addaction)
- [**update()**](#update)
- [**isActive()**](#isactive)
- [**getKeyState()**](#getkeystate)
- [**pressKey()**](#presskey)
- [**releaseKey()**](#releasekey)
- [**pressMouse()**](#pressmouse)
- [**releaseMouse()**](#releasemouse)


### makeNew()
#### Description
A static method that constructs and returns a new `KInput` object. If any of the
sketch's main input listeners (`keyPressed()`, `keyReleased()`,
`mousePressed()`, and `mouseReleased()`) haven't already been defined, it
defines versions of them that update the created instance. `KInput` objects 
hould only be created using `makeNew()`, *not* `new KInput()`.

The first parameter is the sketch that the object is being constructed in and
that the input listeners will be defined for. If you're running your sketch in
global mode, use `window` for this parameter. If you're using it in instance
mode, use whatever you're defining `setup` and `draw` for.

The optional second parameter is a boolean that enables or disables the F12
hotkey, which on most browsers opens the debugging console. The default value
is `true`.

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
  input = KInput.makeNew(window);
}
```

```js
// instance mode
const s = (sketch) => {
  let input;
  
  sketch.setup = () => {
    // disable the F12 hotkey
    input = KInput.makeNew(window, false);
  }
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
`keys` is an array containing every key or mouse button that can trigger the
action.

The third parameter, `mode`, is a string that determines the action's activation
mode, which can be either `"continuous"`, `"press"`, or `"release"`:
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
  input = KInput.makeNew();
  input.addAction({
    name: "a basic action",
    keys: [Key.SPACEBAR]
  });
  input.addAction({
    name: "a press action with multiple keys",
    keys: [Key.SHIFT, Key.LEFT_MOUSE],
    mode: "press"
  });
  input.addAction({
    name: "a chord action with a callback function",
    keys: [Key.A, Key.S, Key.D, Key.F],
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
- `keys`: (`Key[]`) An array containing all keys or mouse buttons that can
    activate the action.
- `mode`: (optional `string`) The action's activation mode, either
    `"continuous"`, `"press"`, or `"release"` (any other values will cause an
    error). The default value is `"continuous"`.
- `chord`: (optional `boolean`) If `true`, the action can only activate whenever
    every key or button bound to it is pressed at the same time. The default
    value is `false`.
- `callback`: (optional `function(): void`) The action's callback function. The
    default value is a function that does nothing.

### update()
#### Description
Updates the manager and all actions inside it. This needs to be called once in
your `draw` function for the manager to work correctly, but aside from that you
don't need to do anything special with it.

#### Examples
```js
let input;

function setup() {
  input = KInput.makeNew();
}

function draw() {
  input.update();

  // do stuff with actions here
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
a single parameter, which is the `Key` enum value to check the state of.

#### Examples
```js
// Note: This example assumes that a KInput instance named "input" was created
// in setup().

function draw() {
  input.update();

  if (input.getKeyState(Key.SPACEBAR)) background(250, 65, 65);
  else background(235, 64, 52);
}
```

#### Syntax
`getKeyState(code)`

#### Parameters
- `code`: (`Key`) The key/button to get the state of.

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
*Note: Most names are self-explanatory, but descriptions have been added to ones that may be unclear.*
- `Key.LEFT_MOUSE`
- `Key.RIGHT_MOUSE`
- `Key.MIDDLE_MOUSE`
- `Key.TAB`
- `Key.ENTER`
- `Key.SHIFT`
- `Key.CONTROL`
- `Key.CTRL` - Alias of `CONTROL`
- `Key.ALT`
- `Key.PAUSE`
- `Key.CAPS_LOCK`
- `Key.ESCAPE`
- `Key.SPACEBAR`
- `Key.SPACE` - Alias of `SPACEBAR`
- `Key.PAGE_UP`
- `Key.PAGE_DOWN`
- `Key.END`
- `Key.HOME`
- `Key.LEFT_ARROW`
- `Key.LEFT` - Alias of `LEFT_ARROW`
- `Key.UP_ARROW`
- `Key.UP` - Alias of `UP_ARROW`
- `Key.RIGHT_ARROW`
- `Key.RIGHT` - Alias of `RIGHT_ARROW`
- `Key.DOWN_ARROW`
- `Key.DOWN` - Alias of `DOWN_ARROW`
- `Key.INSERT`
- `Key.DELETE`
- `Key.ZERO`
- `Key.ONE`
- `Key.TWO`
- `Key.THREE`
- `Key.FOUR`
- `Key.FIVE`
- `Key.SIX`
- `Key.SEVEN`
- `Key.EIGHT`
- `Key.NINE`
- `Key.SEMICOLON`
- `Key.EQUALS`
- `Key.A`
- `Key.B`
- `Key.C`
- `Key.D`
- `Key.E`
- `Key.F`
- `Key.G`
- `Key.H`
- `Key.I`
- `Key.J`
- `Key.K`
- `Key.L`
- `Key.M`
- `Key.N`
- `Key.O`
- `Key.P`
- `Key.Q`
- `Key.R`
- `Key.S`
- `Key.T`
- `Key.U`
- `Key.V`
- `Key.W`
- `Key.X`
- `Key.Y`
- `Key.Z`
- `Key.NUMPAD_ZERO`
- `Key.NUMPAD_ONE`
- `Key.NUMPAD_TWO`
- `Key.NUMPAD_THREE`
- `Key.NUMPAD_FOUR`
- `Key.NUMPAD_FIVE`
- `Key.NUMPAD_SIX`
- `Key.NUMPAD_SEVEN`
- `Key.NUMPAD_EIGHT`
- `Key.NUMPAD_NINE`
- `Key.NUMPAD_MULTIPLY`
- `Key.NUMPAD_ADD`
- `Key.NUMPAD_COMMA`
- `Key.NUMPAD_SUBTRACT`
- `Key.NUMPAD_DECIMAL`
- `Key.NUMPAD_DIVIDE`
- `Key.F1`
- `Key.F2`
- `Key.F3`
- `Key.F4`
- `Key.F5`
- `Key.F6`
- `Key.F7`
- `Key.F8`
- `Key.F9`
- `Key.F10`
- `Key.F11`
- `Key.F12`
- `Key.NUM_LOCK`
- `Key.SCROLL_LOCK`
- `Key.DASH`
- `Key.MINUS` - Alias of `DASH`
- `Key.COMMA`
- `Key.PERIOD`
- `Key.SLASH`
- `Key.BACKTICK` - ` Key
- `Key.OPEN_BRACKET`
- `Key.BACKSLASH`
- `Key.CLOSE_BRACKET`
- `Key.SINGLE_QUOTE`
- `Key.QUOTE` - Alias of `SINGLE_QUOTE`