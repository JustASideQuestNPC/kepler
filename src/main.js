/**
 * Global handler for the input system.
 * @type {KInput}
 */
let input;

/** @type {number} */
let timesClicked = 0;

/**
 * Automatically runs once when the webpage is loaded.
 * @function
 */
function setup() {
  createCanvas(600, 600);

  input = KInput.makeNew(window);
  input.addAction({
    name: "spacebar continuous",
    keys: Key.SPACE
  });
  input.addAction({
    name: "spacebar press",
    keys: Key.SPACE,
    mode: "press"
  });
  input.addAction({
    name: "spacebar release",
    keys: Key.SPACE,
    mode: "release"
  });
  input.addAction({
    name: "multiple buttons",
    keys: [Key.SHIFT, Key.LEFT_MOUSE],
  });
  input.addAction({
    name: "chord action",
    keys: [Key.A, Key.S, Key.D],
    chord: true
  });
  input.addAction({
    name: "callback counter",
    keys: Key.ENTER,
    mode: "press",
    callback: () => {
      ++timesClicked;
    }
  });

  textSize(18);
  textAlign(CENTER, CENTER);
}


/**
 * Automatically runs once per frame after `setup` finishes.
 * @function
 */
function draw() {
  // update input handler
  input.updateAll();

  background(255);
  noStroke();

  setFillColor("spacebar continuous");  
  ellipse(100, 100, 150, 150);

  setFillColor("spacebar press");
  ellipse(300, 100, 150, 150);

  setFillColor("spacebar release");
  ellipse(500, 100, 150, 150);

  setFillColor("multiple buttons");
  ellipse(100, 300, 150, 150);

  setFillColor("chord action");
  ellipse(300, 300, 150, 150);

  setFillColor("callback counter");
  ellipse(500, 300, 150, 150);

  fill(0);
  text("Spacebar\n(continuous)", 100, 100);
  text("Spacebar\n(press)", 300, 100);
  text("Spacebar\n(release)", 500, 100);
  text("Shift or\nLeft Mouse", 100, 300);
  text("A + S + D", 300, 300);
  text(`Enter\nTimes Pressed:\n${timesClicked}`, 500, 300);
}


/**
 * Sets the fill color to green if the named input action is active, and red if
 * it is inactive.
 * @function
 * @param {string} name - The name of the input action.
 */
function setFillColor(name) {
  if (input.isActive(name)) fill(64, 237, 64);
  else fill(250, 50, 50);
}