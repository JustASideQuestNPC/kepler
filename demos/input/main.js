/**
 * Demo for kepler.input and the action system.
 */

/** @type {KInput} */
let input;

/** @type {number} */
let counter = 0;

function setup() {
  createCanvas(600, 400);

  // create a manager and add some inputs
  input = KInput.makeNew(window);
  input.addAction({
    name: "spacebar continuous",
    keys: [Key.SPACE]
  });
  input.addAction({
    name: "spacebar press",
    keys: [Key.SPACE],
    mode: "press"
  });
  input.addAction({
    name: "spacebar release",
    keys: [Key.SPACE],
    mode: "release"
  });
  input.addAction({
    name: "multiple keys",
    keys: [Key.A, Key.LEFT_MOUSE],
  });
  input.addAction({
    name: "chord action",
    keys: [Key.SHIFT, Key.D],
    chord: true
  });
  input.addAction({
    name: "callback counter",
    keys: [Key.ENTER],
    mode: "press",
    callback: () => {
      ++counter;
    }
  });

  textSize(16);
  textAlign(CENTER, CENTER);
}

function draw() {
  input.update();
  background("#ffffff");

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

  fill("#000000");
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
  if (input.isActive(name)) fill("#56e949");
  else fill("#f33b3b");
}