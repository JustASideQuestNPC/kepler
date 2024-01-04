// add input stuff to the Kepler namespace using a "self-executing anonymous
// function" and associated black magic
(function (Kepler) {
  Kepler.INPUT_INCLUDED = true;
  /**
   * codes for every valid keyboard key and mouse button.
   * @enum {number} Key
   */
  Kepler.Key = {
    "left mouse": 0,
    "right mouse": 1,
    "middle mouse": 2,
    "backspace": 8,
    "tab": 9,
    "enter": 13,
    "shift": 16,
    "control": 17,
    "alt": 18,
    "pause": 19,
    "caps lock": 20,
    "escape": 27,
    "spacebar": 32,
    "space": 32,
    " ": 32,
    "page up": 33,
    "page down": 34,
    "end": 35,
    "home": 36,
    "left arrow": 37,
    "left": 37,
    "up arrow": 38,
    "up": 38,
    "right arrow": 39,
    "right": 39,
    "down arrow": 40,
    "down": 40,
    "insert": 45,
    "delete": 46,
    "0": 48,
    "1": 49,
    "2": 50,
    "3": 51,
    "4": 52,
    "6": 54,
    "7": 55,
    "8": 56,
    "9": 57,
    ";": 59,
    "=": 61,
    "a": 65,
    "b": 66,
    "c": 67,
    "d": 68,
    "e": 69,
    "f": 70,
    "g": 71,
    "h": 72,
    "i": 73,
    "j": 74,
    "k": 75,
    "l": 76,
    "m": 77,
    "n": 78,
    "o": 79,
    "p": 80,
    "q": 81,
    "r": 82,
    "s": 83,
    "t": 84,
    "u": 85,
    "v": 86,
    "w": 87,
    "x": 88,
    "y": 89,
    "z": 90,
    "numpad 0": 96,
    "numpad 1": 97,
    "numpad 2": 98,
    "numpad 3": 99,
    "numpad 4": 100,
    "numpad 5": 101,
    "numpad 6": 102,
    "numpad 7": 103,
    "numpad 8": 104,
    "numpad 9": 105,
    "numpad *": 106,
    "numpad +": 107,
    "numpad ,": 108,
    "numpad -": 109,
    "numpad .": 110,
    "numpad /": 111,
    "f1": 112,
    "f2": 113,
    "f3": 114,
    "f4": 115,
    "f5": 116,
    "f6": 117,
    "f7": 118,
    "f8": 119,
    "f9": 120,
    "f10": 121,
    "f11": 122,
    "f12": 123,
    "num lock": 144,
    "scroll lock": 145,
    "-": 173,
    ",": 188,
    ".": 190,
    "/": 191,
    "`": 192,
    "[": 219,
    "\\": 220,
    "]": 221,
    "'": 222,
  };

  const CONSTRUCTOR_KEY = Symbol();
  const VALID_KEY_CODES = Object.keys(Kepler.Key);

  /**
   * Class that handles the improved (read: useable) input system.
   * @class
   */
  Kepler.Input = class {
    /**
     * Holds whether each keyboard or mouse key is currently pressed.
     * @private
     * @type {boolean[]}
     */
    #keyStates = [];

    /**
     * The sketch containing the instance.
     * @private
     * @type {Window | p5}
     */
    #sketch;

    /**
     * Holds data for an action that can be bound to multiple keys and/or mouse
     * buttons.
     * @typedef InputAction
     * @property {boolean} active Whether the action is active ("pressed") or
     *    not.
     * @property {Key[]} keys All keys and/or mouse buttons that can activate
     *    the action.
     * @property {("continuous" | "press" | "release")} mode
     *    Determines when the action becomes active:
     *    - `"continuous"` actions are active whenever a key or button bound to
     *      them is pressed.
     *    - `"press"` actions are active for a single frame the first time a key
     *      or button bound to them is pressed.
     *    - `"release"` actions are active for a single frame the first time a
     *      key or button bound to them is released.
     *
     *    The default activation mode is `"continuous"`.
     * @property {boolean} chord If true, the action can only activate when
     *    every key or button bound to it is pressed at the same time.
     *    Otherwise, the action can activate whenever at least one key or button
     *    bound to it is pressed. The default chord setting is `false`.
     * @property {function(): void} callback A callback function that runs
     *    automatically on every frame that the action is active. The default
     *    callback does nothing.
     * @property {function(boolean[]): boolean} boundKeyPressed Internal
     *    function that determines whether at least one key or button bound to
     *    the input is pressed (unless the action is a chord, in which case it
     *    determines whether all of them are pressed).
     * @property {function(boolean[]): void} update Internal function that
     *    updates whether the action is active based on its activation mode and
     *    what keys or buttons are currently pressed.
     * @property {boolean} [wasActive] Internal value used to only activate
     *    `press` and `release` actions for a single frame.
     */

    /**
     * Holds all actions currently being updated.
     * @private
     * @type {Map<string, InputAction>}
     */
    #inputActions = {};

    /**
     * Creates a new Input object and defines `keyPressed`, `keyReleased`,
     * `mousePressed`, and `mouseReleased` for it if they aren't already
     * defined. Use this to create Input objects, **not** `new Input()`!
     * @static
     * @method
     * @param {Object} args
     * @param {Window | p5} args.sketch The sketch instance to define input
     *    listeners for. If you're running your code in global mode, this should
     *    be `window`. If you're running your code in instance mode, this should
     *    be the sketch object you're defining `setup` and `draw` for.
     * @param {boolean} [args.f12HotkeyEnabled] If `true`, the auto-defined
     *    `keyPressed` function will still allow F12 to open the debug console
     *    in your browser. The default value is `true`.
     * @returns {Kepler.Input} The Input object created and referenced in the 
     *    input listeners.
     */
    static makeNew({sketch, f12HotkeyEnabled = true} = {}) {
      if (sketch == null) {
        throw new Error(
            "Kepler.Input.makeNew() requires a sketch! (if you're running " +
              'in global mode, use "window")'
        );
      }

      // use the key to create a new Input without throwing an error
      let obj = new Kepler.Input(CONSTRUCTOR_KEY, sketch);

      // auto-define any undefined input listeners
      if (typeof sketch.keyPressed !== "function") {
        if (f12HotkeyEnabled) {
          sketch.keyPressed = () => {
            obj.pressKey(sketch.keyCode);
            if (sketch.keyCode !== Kepler.Key.F12) {
              return false;
            }
          };
        } else {
          sketch.keyPressed = () => {
            obj.pressKey(sketch.keyCode);
            return false;
          };
        }
      }
      if (typeof sketch.keyReleased !== "function") {
        sketch.keyReleased = () => {
          obj.releaseKey(sketch.keyCode);
          return false;
        };
      }
      if (typeof sketch.mousePressed !== "function") {
        sketch.mousePressed = () => {
          obj.pressMouse(sketch.mouseButton);
          return false;
        };
      }
      if (typeof sketch.mouseReleased !== "function") {
        sketch.mouseReleased = () => {
          obj.releaseMouse(sketch.mouseButton);
          return false;
        };
      }

      return obj;
    }

    // constructors can't be private because this is javascript...but this is
    // javascript, so we can just hack one in anyway :)
    constructor(constructorKey, sketch) {
      if (constructorKey !== CONSTRUCTOR_KEY) {
        throw new Error(
          'Input objects cannot be constructed with "new Input" - use ' +
            '"Kepler.Input.makeNew" instead!'
        );
      }

      this.#sketch = sketch;

      // populate #keyStates with default values for each key
      for (let k of VALID_KEY_CODES) {
        this.#keyStates[k] = false;
      }
    }

    /**
     * Adds a named action to the manager.
     * @param {Object} args
     * @param {string} args.name The name of the action.
     * @param {Key[]} args.keys All keys and/or mouse buttons that can
     *    activate the action. Can be a single value instead of an array if only
     *    one key/button is bound to the action.
     * @param {("continuous" | "press" | "release")} [args.mode]
     *    Determines when the action becomes active:
     *    - `"continuous"` actions are active whenever a key or button bound to
     *      them is pressed.
     *    - `"press"` actions are active for a single frame the first time a key
     *      or button bound to them is pressed.
     *    - `"release"` actions are active for a single frame the first time a
     *      key or button bound to them is released.
     *
     *    The default activation mode is `"continuous"`.
     * @param {boolean} args.chord If true, the action can only activate when
     *    every key or button bound to it is pressed at the same time.
     *    Otherwise, the action can activate whenever at least one key or button
     *    bound to it is pressed. The default chord setting is `false`.
     * @param {function(): void} args.callback A callback function that runs
     *    automatically on every frame that the action is active. The default
     *    callback does nothing.
     */
    addAction({
      name,
      keys,
      mode = "continuous",
      chord = false,
      callback = () => {},
    }) {
      // make sure the action has a name and keys (everything else is optional)
      if (name == null) {
        throw new TypeError("Input actions require a name!");
      }
      if (keys == null) {
        throw new TypeError(
          `The input action "${name}" has no keys or mouse buttons assigned `
            `to it!`
        );
      }

      // single keys still need to be in an array
      if (keys.constructor !== Array) {
        throw new TypeError(
          `The input action "${name}" requires an array of keys (even if ` +
            `only oa single key is bound to it)!`
        );
      }
      if (keys.length === 0) {
        throw new Error(
          `The input action "${name}" has no keys assigned to it!`
        );
      }
      if (keys.some((k) => !Kepler.Key.hasOwnProperty(k))) {
        throw new TypeError(`The input action "${name}" has invalid keys!`);
      }

      // make sure the activation mode is valid
      if (
        mode !== "continuous" &&
        mode !== "press" &&
        mode !== "release"
      ) {
        throw new TypeError(
          `The input action "${name}" has an invalid activation mode ` +
            `(Expected "continuous", "press",  or "release", ` +
            `received "${mode}")!`
        );
      }

      // make sure the chord mode is valid
      if (typeof chord !== "boolean") {
        throw new TypeError(
          `The input action "${name}" has an invalid chord setting (expected ` +
            `true or false, received "${chord}")!`
        );
      }

      // make sure the callback is valid
      if (typeof callback !== "function") {
        throw new TypeError(
          `The input action "${name}" has an invalid callback (expected a ` +
            `function, recieved a(n) ${typeof callback})!`
        );
      }

      // overwriting an input won't break anything, but you probably don't want
      // to do it by accident either
      if (this.#inputActions[name] !== undefined) {
        console.warn(
          `The input action "${name}" already exists, did you mean to ` +
            `overwrite it?`
        );
      }

      // create the new action and give it all of the easy properties
      /** @type {InputAction} */
      let action = {
        active: false,
        mode: mode,
        chord: chord,
        callback: callback,
      };
      
      // convert keys from strings
      action.keys = Array.from(keys, (k) => Kepler.Key[k]);

      // set boundKeyPressed based on chord mode
      if (action.chord) {
        action.boundKeyPressed = (keyStates) => {
          return action.keys.every((k) => keyStates[k]);
        };
      } else {
        action.boundKeyPressed = (keyStates) => {
          return action.keys.some((k) => keyStates[k]);
        };
      }

      // set update method based on activation mode
      if (action.mode === "continuous") {
        action.update = (keyStates) => {
          action.active = action.boundKeyPressed(keyStates);
        };
      } else if (action.mode === "press") {
        action.wasActive = false;
        action.update = (keyStates) => {
          if (action.boundKeyPressed(keyStates)) {
            if (action.wasActive) {
              action.active = false;
            } else {
              action.active = true;
              action.wasActive = true;
            }
          } else {
            action.active = false;
            action.wasActive = false;
          }
        };
      } else {
        action.wasActive = true;
        action.update = (keyStates) => {
          if (!action.boundKeyPressed(keyStates)) {
            if (action.wasActive) {
              action.active = false;
            } else {
              action.active = true;
              action.wasActive = true;
            }
          } else {
            action.active = false;
            action.wasActive = false;
          }
        };
      }

      // add the action to the action list
      this.#inputActions[name] = action;
    }

    /**
     * Loads an array of actions from a json file.
     * @method
     * @async
     * @param {string} path
     * @param {boolean} [verboseLogging] If `true`, prints status updates to the
     *    console. Does nothing in the minified version of the library.
     */
    async loadActionList(path, verboseLogging=true) {
      let startTime;
      if (verboseLogging) {
        console.log(`%cLoading actions from ${path}`, "color:#30D6FF");
        startTime = window.performance.now();
      }

      await this.#sketch.loadJSON(
        path,
        // success callback
        (json) => {
          // the root of a json file can only be an object or an array
          if (json.constructor === Array) {
            throw new Error("Action list must be an object!");
          }

          for (let [name, action] of Object.entries(json)) {
            action.name = name;
            this.addAction(action);
            if (verboseLogging) {
              console.log(`┃ Loaded action "${name}"`);
            }
          }

          if (verboseLogging) {
            let duration = window.performance.now() - startTime;
            console.log(
              "┗ " + `%cLoaded ${Object.values(json).length} action(s) in ` +
                `${duration} ms`, "color: #23D18B"
            );
          }
        },
        // failure callback
        (event) => {
          console.error(`The action list at "${path}" does not exist!`, event);
        }
      );
    }

    /**
     * Updates all actions - call this once at the top of your `draw` loop.
     * @method
     */
    update() {
      for (let action of Object.values(this.#inputActions)) {
        action.update(this.#keyStates);
        if (action.active) action.callback();
      }
    }

    /**
     * Returns whether an action is active.
     * @method
     * @param {string} name The name of the action. Names are case-sensitive and
     *    an error is thrown if the named action doesn't exist.
     * @returns {boolean}
     */
    isActive(name) {
      if (!Object.hasOwn(this.#inputActions, name)) {
        throw new Error(`The input action "${name}" does not exist!`);
      }
      return this.#inputActions[name].active;
    }

    /**
     * Returns whether a key or mouse button is pressed.
     * @method
     * @param {string} key The key or mouse button to check the state of.
     */
    getKeyState(key) {
      if (Kepler.Key.hasOwnProperty(key)) {
        return this.#keyStates[key];
      }
      throw new Error(`"${key}" is not a valid key or mouse button!`);
    }

    /**
     * Updates the internal state when a key is pressed. If you're defining
     * input listeners yourself, this should be called in `keyPressed` as
     * `pressKey(keyCode)`.
     * @method
     * @param {number} code The key that triggered the listener; should be
     *    `keyCode`.
     */
    pressKey(code) {
      this.#keyStates[code] = true;
    }

    /**
     * Updates the internal state when a key is released. If you're defining
     * input listeners yourself, this should be called in `keyReleased` as
     * `releaseKey(keyCode)`.
     * @method
     * @param {number} code The key that triggered the listener; should be
     *    `keyCode`.
     */
    releaseKey(code) {
      this.#keyStates[code] = false;
    }

    /**
     * Updates the internal state when a mouse button is pressed. If you're
     * defining input listeners yourself, this should be called in
     * `mousePressed` as `pressMouse(mouseButton)`.
     * @method
     * @param {("left" | "right" | "center")} button The mouse button that
     *    triggered the listener; should be `mouseButton`.
     */
    pressMouse(button) {
      if (button === "left") {
        this.#keyStates[Kepler.Key["left mouse"]] = true;
      } else if (button === "right") {
        this.#keyStates[Kepler.Key["right mouse"]] = true;
      } else {
        this.#keyStates[Kepler.Key["middle mouse"]] = true;
      }
    }

    /**
     * Updates the internal state when a mouse button is released. If you're
     * defining input listeners yourself, this should be called in
     * `mouseReleased` as `releaseMouse(mouseButton)`.
     * @method
     * @param {("left" | "right" | "center")} button The mouse button that
     *    triggered the listener; should be `mouseButton`.
     */
    releaseMouse(button) {
      if (button === "left") {
        this.#keyStates[Kepler.Key["left mouse"]] = false;
      } else if (button === "right") {
        this.#keyStates[Kepler.Key["right mouse"]] = false;
      } else {
        this.#keyStates[Kepler.Key["middle mouse"]] = false;
      }
    }
  };
})((window.Kepler = window.Kepler || {}));
