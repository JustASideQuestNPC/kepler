/*
 *   _                 _              _                       _   
 *  | | __ ___  _ __  | |  ___  _ __ (_) _ __   _ __   _   _ | |_ 
 *  | |/ // _ \| '_ \ | | / _ \| '__|| || '_ \ | '_ \ | | | || __|
 *  |   <|  __/| |_) || ||  __/| | _ | || | | || |_) || |_| || |_ 
 *  |_|\_\\___|| .__/ |_| \___||_|(_)|_||_| |_|| .__/  \__,_| \__|
 *             |_|                             |_|                   
 * 
 *  Part of Kepler, a 2d game engine for p5.js
 *  https://github.com/JustASideQuestNPC/kepler
 */
(function (Kepler) {
  Kepler.INPUT_INCLUDED = true;
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
  Kepler.Input = class {
    static makeNew(sketch, f12HotkeyEnabled = true) {
      if (sketch == null) {
        throw new Error(
            "Kepler.Input.makeNew() requires a sketch! (if you're running " +
              'in global mode, use "window")'
        );
      }
      let obj = new Kepler.Input(CONSTRUCTOR_KEY, sketch);
      if (typeof sketch.keyPressed !== "function") {
        if (f12HotkeyEnabled) {
          sketch.keyPressed = () => {
            obj.pressKey(sketch.keyCode);
            if (sketch.keyCode !== Kepler.Key["f12"]) {
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
    constructor(constructorKey, sketch) {
      if (constructorKey !== CONSTRUCTOR_KEY) {
        throw new Error(
          'Input objects cannot be constructed with "new Input" - use ' +
            '"Kepler.Input.makeNew" instead!'
        );
      }
      this._sketch = sketch;
      this._keyStates = [];
      this._inputActions = {};
      for (let k of VALID_KEY_CODES) {
        this._keyStates[k] = false;
      }
    }
    addAction({
      name,
      keys,
      mode = "continuous",
      chord = false,
      callback = () => {},
    }) {
      if (name == null) {
        throw new TypeError("Input actions require a name!");
      }
      if (keys == null) {
        throw new TypeError(
          `The input action "${name}" has no keys or mouse buttons assigned `
            `to it!`
        );
      }
      if (keys.constructor !== Array) {
        throw new TypeError(
          `The input action "${name}" requires an array of keys (even if ` +
            `only a single key is bound to it)!`
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
      if (typeof chord !== "boolean") {
        throw new TypeError(
          `The input action "${name}" has an invalid chord setting (expected ` +
            `true or false, received "${chord}")!`
        );
      }
      if (typeof callback !== "function") {
        throw new TypeError(
          `The input action "${name}" has an invalid callback (expected a ` +
            `function, recieved a(n) ${typeof callback})!`
        );
      }
      if (this._inputActions[name] !== undefined) {
        console.warn(
          `The input action "${name}" already exists, did you mean to ` +
            `overwrite it?`
        );
      }
      let action = {
        active: false,
        mode: mode,
        chord: chord,
        callback: callback,
      };
      action.keys = Array.from(keys, (k) => Kepler.Key[k]);
      if (action.chord) {
        action.boundKeyPressed = (keyStates) => {
          return action.keys.every((k) => keyStates[k]);
        };
      } else {
        action.boundKeyPressed = (keyStates) => {
          return action.keys.some((k) => keyStates[k]);
        };
      }
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
      this._inputActions[name] = action;
    }
    loadActionList(path, verboseLogging=true) {
      let startTime;
      if (verboseLogging) {
        console.log(
          "%cKepler.Input: " + `%cLoading actions from ${path}`,
            "color: #30D6FF", "color:default"
        );
        startTime = window.performance.now();
      }

      this._sketch.loadJSON(
        path,
        (json) => {
          if (json.constructor === Array) {
            throw new Error("Action list must be an object!");
          }

          for (let [name, action] of Object.entries(json)) {
            action.name = name;
            this.addAction(action);
            if (verboseLogging) {
              console.log(
                "%cKepler.Input: " + `%cLoaded action "${name}"`,
                  "color: #30D6FF", "color: default"
              );
            }
          }
          if (verboseLogging) {
            let duration = window.performance.now() - startTime;
            console.log(
              "%cKepler.Input: " + `%cLoaded ${Object.values(json).length} ` +
                `action(s) in ${duration} ms`,
                "color: #30D6FF", "color: #23D18B"
            );
          }
        },
        (event) => {
          console.error(
            "%cKepler.Input: " + `%cThe action list at "${path}" does not ` +
              `exist!`, "color: #30D6FF", "color: default", event
          );
        }
      );
    }
    update() {
      for (let action of Object.values(this._inputActions)) {
        action.update(this._keyStates);
        if (action.active) action.callback();
      }
    }
    isActive(name) {
      if (Object.hasOwn(this._inputActions, name)) {
        return this._inputActions[name].active;
      }
      throw new Error(`The input action "${name}" does not exist!`);
    }
    getKeyState(key) {
      if (Kepler.Key.hasOwnProperty(key)) {
        return this._keyStates[key];
      }
      throw new Error(`"${key}" is not a valid key or mouse button!`);
    }
    pressKey(code) {
      this._keyStates[code] = true;
    }
    releaseKey(code) {
      this._keyStates[code] = false;
    }
    pressMouse(button) {
      if (button === "left") {
        this._keyStates[Kepler.Key["left mouse"]] = true;
      } else if (button === "right") {
        this._keyStates[Kepler.Key["right mouse"]] = true;
      } else {
        this._keyStates[Kepler.Key["middle mouse"]] = true;
      }
    }
    releaseMouse(button) {
      if (button === "left") {
        this._keyStates[Kepler.Key["left mouse"]] = false;
      } else if (button === "right") {
        this._keyStates[Kepler.Key["right mouse"]] = false;
      } else {
        this._keyStates[Kepler.Key["middle mouse"]] = false;
      }
    }
  };
})((window.Kepler = window.Kepler || {}));
