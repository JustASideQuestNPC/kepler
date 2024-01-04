// add input stuff to the Kepler namespace using a "self-executing anonymous
// function" and associated black magic
(function (Kepler) {
  Kepler.INPUT_INCLUDED = true;
  /**
   * "Enum" with codes for every valid keyboard key and mouse button.
   * @enum {number} Key
   */
  Kepler.Key = {
    LEFT_MOUSE: 0,
    RIGHT_MOUSE: 1,
    MIDDLE_MOUSE: 2,
    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CONTROL: 17,
    CTRL: 17,
    ALT: 18,
    PAUSE: 19,
    CAPS_LOCK: 20,
    ESCAPE: 27,
    SPACEBAR: 32,
    SPACE: 32,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    END: 35,
    HOME: 36,
    LEFT_ARROW: 37,
    LEFT: 37,
    UP_ARROW: 38,
    UP: 38,
    RIGHT_ARROW: 39,
    RIGHT: 39,
    DOWN_ARROW: 40,
    DOWN: 40,
    INSERT: 45,
    DELETE: 46,
    ZERO: 48,
    ONE: 49,
    TWO: 50,
    THREE: 51,
    FOUR: 52,
    FIVE: 53,
    SIX: 54,
    SEVEN: 55,
    EIGHT: 56,
    NINE: 57,
    SEMICOLON: 59,
    EQUALS: 61,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    NUMPAD_ZERO: 96,
    NUMPAD_ONE: 97,
    NUMPAD_TWO: 98,
    NUMPAD_THREE: 99,
    NUMPAD_FOUR: 100,
    NUMPAD_FIVE: 101,
    NUMPAD_SIX: 102,
    NUMPAD_SEVEN: 103,
    NUMPAD_EIGHT: 104,
    NUMPAD_NINE: 105,
    NUMPAD_MULTIPLY: 106,
    NUMPAD_ADD: 107,
    NUMPAD_COMMA: 108,
    NUMPAD_SUBTRACT: 109,
    NUMPAD_DECIMAL: 110,
    NUMPAD_DIVIDE: 111,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    NUM_LOCK: 144,
    SCROLL_LOCK: 145,
    DASH: 173,
    MINUS: 173,
    COMMA: 188,
    PERIOD: 190,
    SLASH: 191,
    BACKTICK: 192,
    OPEN_BRACKET: 219,
    BACKSLASH: 220,
    CLOSE_BRACKET: 221,
    SINGLE_QUOTE: 222,
    QUOTE: 222,
  };

  // action activation modes
  Kepler.CONTINUOUS = Symbol();
  Kepler.PRESS = Symbol();
  Kepler.RELEASE = Symbol();

  const CONSTRUCTOR_KEY = Symbol();
  const VALID_KEY_CODES = Object.values(Kepler.Key);

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
     * Holds data for an action that can be bound to multiple keys and/or mouse
     * buttons.
     * @typedef InputAction
     * @property {boolean} active Whether the action is active ("pressed") or
     *    not.
     * @property {Key[]} keys All keys and/or mouse buttons that can activate
     *    the action.
     * @property {(Kepler.CONTINUOUS|Kepler.PRESS|Kepler.RELEASE)} mode
     *    Determines when the action becomes active:
     *    - `CONTINUOUS` actions are active whenever a key or button bound to
     *      them is pressed.
     *    - `PRESS` actions are active for a single frame the first time a key
     *      or button bound to them is pressed.
     *    - `RELEASE` actions are active for a single frame the first time a key
     *      or button bound to them is released.
     *
     *    The default activation mode is `CONTINUOUS`.
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
     * @param {Window | p5} sketch The sketch instance to define input listeners
     *    for. If you're running your code in **global mode**, this should be
     *    `window`. If you're running your code in **instance mode**, this
     *    should be the same object you're defining `setup` and `draw` for.
     * @param {boolean} [f12HotkeyEnabled] If `true`, the auto-defined
     *    `keyPressed` function will still allow F12 to open the debug console
     *    in your browser. The default value is `true`.
     * @returns {Input} The Input object created and referenced in the input
     *    listeners.
     */
    static makeNew(sketch, f12HotkeyEnabled = true) {
      // use the key to create a new Input without throwing an exception
      let obj = new Kepler.Input(CONSTRUCTOR_KEY);

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
    constructor(constructorKey) {
      if (constructorKey !== CONSTRUCTOR_KEY) {
        throw new Error(
          'Input objects cannot be constructed with "new Input" - use ' +
            '"Kepler.Input.makeNew" instead!'
        );
      }

      // populate #keyStates with default values for each key
      for (let k of VALID_KEY_CODES) {
        this.#keyStates[k] = false;
      }
    }

    /**
     * Adds a named action to the manager.
     * @param {Object} action A config object with information about the action.
     * @param {string} action.name The name of the action.
     * @param {Key[]} action.keys All keys and/or mouse buttons that can
     *    activate the action. Can be a single value instead of an array if only
     *    one key/button is bound to the action.
     * @param {(Kepler.CONTINUOUS|Kepler.PRESS|Kepler.RELEASE)} [action.mode]
     *    The action's activation mode, which determines when it becomes active:
     *    - `CONTINUOUS` actions are active whenever a key or button bound to
     *      them is pressed.
     *    - `PRESS` actions are active for a single frame the first time a key
     *      or button bound to them is pressed.
     *    - `RELEASE` actions are active for a single frame the first time a key
     *      or button bound to them is released.
     *
     *    The default activation mode is `CONTINUOUS`.
     * @param {boolean} action.chord If true, the action can only activate when
     *    every key or button bound to it is pressed at the same time.
     *    Otherwise, the action can activate whenever at least one key or button
     *    bound to it is pressed. The default chord setting is `false`.
     * @param {function(): void} action.callback A callback function that runs
     *    automatically on every frame that the action is active. The default
     *    callback does nothing.
     */
    addAction({
      name,
      keys,
      mode = Kepler.CONTINUOUS,
      chord = false,
      callback = () => {},
    }) {
      /* do way too many checks so every argument gets a descriptive error
       * if it's invalid (you're welcome) */

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
          `The input action ${name} requires an array of keys (even if only ` +
            `a single key is bound to it)!`
        );
      }
      if (keys.some((k) => !VALID_KEY_CODES.includes(k))) {
        throw new TypeError(`The input action "${name}" has invalid keys!`);
      }

      // make sure the activation mode is valid
      if (
        mode !== Kepler.CONTINUOUS &&
        mode !== Kepler.PRESS &&
        mode !== Kepler.RELEASE
      ) {
        throw new TypeError(
          `The input action "${name}" has an invalid activation mode ` +
            `(Expected Kepler.CONTINOUS, Kepler.PRESS,  or Kepler.RELEASE, ` +
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
        keys: keys,
        mode: mode,
        chord: chord,
        callback: callback,
      };

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
      if (action.mode === Kepler.CONTINUOUS) {
        action.update = (keyStates) => {
          action.active = action.boundKeyPressed(keyStates);
        };
      } else if (action.mode === Kepler.PRESS) {
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
     * @param {Key} code The key or mouse button to check the state of.
     */
    getKeyState(code) {
      if (!VALID_KEY_CODES.includes(code)) {
        throw new Error(`"${code}" is not a valid key or mouse button!`);
      }
      return this.#keyStates[code];
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
        this.#keyStates[Kepler.Key.LEFT_MOUSE] = true;
      } else if (button === "right") {
        this.#keyStates[Kepler.Key.RIGHT_MOUSE] = true;
      } else {
        this.#keyStates[Kepler.Key.MIDDLE_MOUSE] = true;
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
        this.#keyStates[Kepler.Key.LEFT_MOUSE] = false;
      } else if (button === "right") {
        this.#keyStates[Kepler.Key.RIGHT_MOUSE] = false;
      } else {
        this.#keyStates[Kepler.Key.MIDDLE_MOUSE] = false;
      }
    }
  };
})((window.Kepler = window.Kepler || {}));
