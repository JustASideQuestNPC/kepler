# kepler.input Quickstart Guide
***Note:** This is a tutorial for how to quickly get kepler.input up and running. If
you're looking for a list of all the functionality in this module, see the
language reference.*

# Contents
- [Overview](#overview)
- [Installation](#installation)
- [Creating an Action Manager](#creating-an-action-manager)
- [Using Actions](#using-actions)

# Overview
Most input systems only allow you to check if a certain key is pressed, which
works but leads to more complex code like this:
```js
if (keyIsPressed && (key === "w" || keyCode === UP_ARROW)) {
  movePlayerUp();
}
```
Instead, kepler.input system is based around the concept of **actions**, which
are names that can have any number of keys bound to them. This requires a bit
more code at the beginning of your program to set up, but makes your code much
more readable everywhere else:
```js
if (input.isActive("move up")) {
  movePlayerUp();
}
```
Actions can also be set to only activate once when pressed or released, or to
only activate when multiple keys are pressed at the same time, both of which are
significantly harder with a traditional input system

# Installation
To start using kepler.input, start by downloading `kepler.input.zip` from the
[latest release](https://github.com/JustASideQuestNPC/kepler/releases/latest),
and unzip it to whatever folder you feel like. If you're using the [web
editor](https://editor.p5js.org/), add `kepler.input_webEditorSafe.js` to your
project - it's a modified version that plays nice with the library (everything
else is the same, though). Otherwise, add `kepler.input.js` to whatever you're
using to write your code.

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
  console.log(Kepler.INPUT_INCLUDED);
}
```
If you see `true` in the debug console, congratulations!

# Creating an Action Manager
The core of kepler.input is the Input class, also called the "action manager".
This is a single class that manages all the actions for a program. To create
one, call `Kepler.Input.makeNew()` (*not* `new Kepler.Input()`), and pass it
whatever sketch you're creating it in. If you're running in global mode (which
the web editor uses), this sketch is the window:
```js
let input;
function setup() {
  input = Kepler.Input.makeNew(window);
}
```
If you're running in [instance mode](https://github.com/processing/p5.js/wiki/Global-and-instance-mode), it's whatever you're passing to the closure:
```js
const s = (sketch) {
  let input;
  sketch.setup = () => {
    input = Kepler.Input.makeNew(sketch);
  }
}
```

Assuming that you haven't defined any of the sketch's input listeners
([keyPressed](https://p5js.org/reference/#/p5/keyPressed),
[keyReleased](https://p5js.org/reference/#/p5/keyReleased),
[mousePressed](https://p5js.org/reference/#/p5.Element/mousePressed), and
[mouseReleased](https://p5js.org/reference/#/p5/mouseReleased)), `makeNew()`
will automatically add ones that update the new action manager. If you define
any of the input listeners yourself, you'll also need to manually update the
manager in them (see
[the reference](https://github.com/JustASideQuestNPC/kepler/blob/main/src/input/reference.md#presskey)
for how to do that), so don't do it unless you need to.

# Using Actions
To use your action manager, you'll obviously need to add some actions to it.
This is done by using its `addAction()`, method. Like many methods in Kepler,
`addAction()` takes a "configuration object", which allows you to specify the
name of each parameter and only use the ones you need to. There are only 2
parameters that are always required: `name` and `keys`. `name` is the name of
the action, which you'll use when you check if it's active. `keys` is an array
containing every key or mouse button (yes, they can be used together) that can
activate the input - for a list of every key that can be used, see
[the reference](https://github.com/JustASideQuestNPC/kepler/blob/main/src/input/reference.md#key-list).
A sinple action could look something like this:
```js
let input;
function setup() {
  // create a slightly bigger canvas - this isn't required, but it makes it
  // easier to see what we'll draw in a bit
  createCanvas(200, 200);

  input = Kepler.Input.makeNew(window);

  input.addAction({ // don't forget the curly braces!
    name: "example action",
    keys: ["shift", "spacebar", "left mouse"]
  });
}
```
Before you can use that action to trigger something, you'll need to define a
`draw()` function, and call the manager's `update()` method inside it:
```js
function draw() {
  input.update();
}
```
Then all you have to do is call the manager's `isActive()` method, and pass it
the name of the input (along with some code to draw things):
```js
// store colors in variables for readablity
const GREEN = "#38b764";
const RED   = "#b13e53";
function draw() {
  input.update();
  
  noStroke();
  if (input.isActive("example action")) {
    fill(GREEN);
  } else {
    fill(RED);
  }
  rect(0, 0, 100, 100);
}
```
If your `setup()` function is the same as the one from a few examples ago,
you should have a red square that turns green when you press shift, the
spacebar, or the left mouse button.

There are also a few other parameters that you can use with `addAction()`. The
first is `chord`, which sets whether the action should only activate when all
of its keys are pressed at the same time. The default is `false`, which means
it activates whenever any of its keys are pressed. If you create one in
`setup()`...
```js
input.addAction({
  name: "chord action",
  keys: ["shift", "spacebar", "left mouse"],
  chord: true
});
```
...and then check it in `draw()`...
```js
if (input.isActive("chord action")) {
  fill(GREEN);
} else {
  fill(RED);
}
rect(100, 0, 100, 100);
```
...you should have a second square that only turns green when shift, the
spacebar, *and* the left mouse button are pressed.

The second optional parameter is `mode`, which determines when the action
activates, and for how long it activates. There are three possible modes, which
each behave differently:
- `"continuous"` actions are active whenever any of their keys are pressed.
- `"press"` actions are active for a single frame when one of their keys is
  initially pressed.
- `"release"` actions are active for a single frame when one of their keys is
  initially released.
The default mode is `continuous`. If you create a press and a release action
in `setup()`...
```js
input.addAction({
  name: "press action",
  keys: ["shift", "spacebar", "left mouse"],
  mode: "press"
});
// repeat for a release action...
```
...and then check them in `draw()`...
```js
// use the same code from the other examples to check the press action...
rect(0, 100, 100, 100);
// use the same code from the other examples to check the release action...
rect(100, 100, 100, 100);
```
...you should have a square that turns green for one frame when you press a key,
and another square that only turns green when you release a key.

The final parameter that you can use with `addAction()` is `callback`. This is a
function that gets called every frame when the input is active, without you
having to check whether the action is active. The default callback does nothing,
and you can add one like this:
```js
let i = 0;
input.addAction({
  name: "callback counter",
  keys: ["enter"], // single keys still require an array
  mode: "press",
  callback: () => {
    ++i; // add 1 to i
    console.log(`Pressed enter ${i} time(s)`);
  }
});
```
Each time you press Enter, you should now see a counter print out in the debug
console (if you're not using the web editor, you can open the console by
pressing F12, or by right clicking and selecting "inspect").

In addition to `addAction()`, you can also load actions by placing them in a
.json file, then loading that file by using the `loadActionList()` method. The
file is formatted mostly the same as the objects used in `addAction()`, but the
name of the action is used as a key in the file, instead of a property:
```json
{
  "json-formatted action": {
    "keys": ["shift", "spacebar", "left mouse"],
    "chord": true,
    "mode": "press"
  }
}
```
Note that the keys for each property must be in quotation marks. Additonally,
actions with callback functions *cannot* be stored in a .json file for technical
reasons.

If you add all the actions from the examples above (minus the one with a
callback) to a file called `action-list.json`, you can then remove all of the
`addAction()` calls to add them, and just call `loadActionList()` once. Note
that because of how p5.js loads files, both `makeNew()` and `loadActionList()`
must be called in `preload()`, not `setup()`:
```js
let input;
function preload() {
  input = Kepler.Input.makeNew(window);
  // this assumes that action-list.json is in the same folder as this file
  input.loadActionList("action-list.json");
}

function setup() {
  // this action could be added in either setup() or preload()
  let i = 0;
  input.addAction({
    name: "callback counter",
    keys: ["enter"], // single keys still require an array
    mode: "press",
    callback: () => {
      ++i; // add 1 to i
      console.log(`Pressed enter ${i} time(s)`);
    }
  });
}
```