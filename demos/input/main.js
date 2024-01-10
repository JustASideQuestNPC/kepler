/**
 * Demo for kepler.input and the action system.
 */

/** @type {Kepler.Input} */
let input;

/** @type {number} */
let counter = 0;

const BLACK = "#1a1c2c";
const RED   = "#b13e53";
const GREEN = "#38b764";

function preload() {
  input = Kepler.Input.makeNew(window);
  input.loadActionList("action-list.json");
}

function setup() {
  createCanvas(600, 400);

  // actions with callbacks can't be loaded from json for technical reasons
  input.addAction({
    name: "callback counter",
    keys: ["enter"],
    mode: "press",
    callback: () => {
      ++counter;
    },
  });

  textSize(16);
  textAlign(CENTER, CENTER);
}

function draw() {
  input.update();
  background(255);

  noStroke();
  setFillColor("spacebar continuous");
  ellipse(100, 100, 150, 150);

  setFillColor("spacebar press");
  ellipse(300, 100, 150, 150);

  setFillColor("spacebar release");
  ellipse(500, 100, 150, 150);

  setFillColor("multiple keys");
  ellipse(100, 300, 150, 150);

  setFillColor("chord action");
  ellipse(300, 300, 150, 150);

  setFillColor("callback counter");
  ellipse(500, 300, 150, 150);

  fill(BLACK);
  text("Spacebar\n(continuous)", 100, 100);
  text("Spacebar\n(press only)", 300, 100);
  text("Spacebar\n(release only)", 500, 100);
  text("A or Left Mouse", 100, 300);
  text("Shift + D", 300, 300);
  text(`Enter\nTimes Pressed: ${counter}`, 500, 300);
}

/**
 * Checks whether the named input action is active, then sets the fill color
 * based on it.
 * @function
 * @param {string} name
 */
function setFillColor(name) {
  if (input.isActive(name)) fill(GREEN);
  else fill(RED);
}
