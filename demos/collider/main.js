/** @type {Kepler.Input} */
let input;

/** @type {Kepler.PointCollider} */
let staticPoint;
/** @type {Kepler.LineCollider} */
let staticLine;
/** @type {Kepler.CircleCollider} */
let staticCircle;
/** @type {Kepler.PolygonCollider} */
let staticPolygon;
/** @type {Kepler.Collider[]} */
let dynamicColliders = [];
/** @type {Kepler.Collider} */
let currentDynamicCollider;
/** @type {number} */
let dcIndex = 0;
/** @type {string[]} */
let colliderNames = [
  "PointCollider",
  "LineCollider",
  "CircleCollider",
  "PolygonCollider",
];

const BLACK = "#1a1c2c";
const RED   = "#b13e53";
const GREEN = "#38b764";
const BLUE  = "#3b5dc9";

function setup() {
  createCanvas(800, 800);
  input = Kepler.Input.makeNew({ sketch: window });
  input.addAction({
    name: "cycle colliders",
    keys: ["left mouse"],
    mode: "press",
    callback: () => {
      dcIndex = (dcIndex + 1) % dynamicColliders.length;
      currentDynamicCollider = dynamicColliders[dcIndex];
    },
  });

  staticPoint = new Kepler.PointCollider({
    x: width / 4,
    y: height / 4,
    sketch: window
  });

  staticLine = new Kepler.LineCollider({
    start: { x: (width * 3) / 4 - 50, y: height / 4 - 50 },
    end: { x: (width * 3) / 4 + 50, y: height / 4 + 50 },
    sketch: window
  });

  staticCircle = new Kepler.CircleCollider({
    x: width / 4,
    y: (height * 3) / 4,
    radius: 75, 
    sketch: window
  });

  staticPolygon = new Kepler.PolygonCollider({
    points: [
      [  0, -114],
      [ 96,  -52],
      [ 96,   52],
      [  0,  114],
      [-96,   52],
      [-96,  -52],
    ],
    x: (width * 3) / 4,
    y: (height * 3) / 4,
    sketch: window
  });

  dynamicColliders[0] = new Kepler.PointCollider({
    x: 0,
    y: 0,
    sketch: window
  });

  dynamicColliders[1] = new Kepler.LineCollider({
    start: { x: -50, y: -30 },
    end: { x: 50, y: 30 },
    sketch: window
  });

  dynamicColliders[2] = new Kepler.CircleCollider({
    x: 0,
    y: 0,
    radius: 40,
    sketch: window
  });

  dynamicColliders[3] = new Kepler.PolygonCollider({
    points: [
      [-50, -20],
      [ 30,   0],
      [-20,  40],
    ],
    sketch: window
  });

  currentDynamicCollider = dynamicColliders[0];

  textFont("monospace", 16);
  textAlign(LEFT, TOP);
}


function draw() {
  input.update();

  if (dcIndex === 0 || dcIndex === 2) {
    // currentDynamicCollider.position.set(mouseX, mouseY);
    currentDynamicCollider.x = mouseX;
    currentDynamicCollider.y = mouseY;
  } else {
    currentDynamicCollider.setPos(mouseX, mouseY);
  }
  staticPolygon.modAngle(0.01);

  background(255);

  noFill();
  strokeWeight(5);
  let colliding = false;
  let name = "";

  if (currentDynamicCollider.isColliding(staticPoint)) {
    stroke(RED);
    colliding = true;
    name = "PointCollider";
  } else {
    stroke(GREEN);
  }
  staticPoint.render();

  if (currentDynamicCollider.isColliding(staticLine)) {
    stroke(RED);
    colliding = true;
    name = "LineCollider";
  } else {
    stroke(GREEN);
  }
  staticLine.render();

  let hasMTV = false;
  let transVec = createVector(0, 0); // trans rights!
  if (currentDynamicCollider.isColliding(staticCircle, transVec)) {
    stroke(RED);
    colliding = true;
    hasMTV = true;
    name = "CircleCollider";
  } else {
    stroke(GREEN);
  }
  staticCircle.render();

  if (currentDynamicCollider.isColliding(staticPolygon, transVec)) {
    stroke(RED);
    colliding = true;
    hasMTV = true;
    name = "PolygonCollider";
  } else {
    stroke(GREEN);
  }
  staticPolygon.render();

  if (colliding) stroke(RED);
  else stroke(GREEN);
  currentDynamicCollider.render();

  if (colliding && hasMTV) {
    stroke(BLUE);
    if (dcIndex === 2) {
      currentDynamicCollider.position.add(transVec);
    } else if (dcIndex === 3) {
      currentDynamicCollider.modPos(transVec);
    }
    currentDynamicCollider.render();
  }

  // find what to display in the top left
  let sidebarText = `Current collider: ${colliderNames[dcIndex]}`;
  if (colliding) {
    sidebarText += `\nColliding with: ${name}`;
    if (hasMTV && dcIndex !== 0 && dcIndex !== 1) {
      sidebarText +=
        `\nTranslation vector: ` +
        `(${Number(transVec.x).toFixed(2)}, ${Number(transVec.y).toFixed(2)})`;
    }
  }

  noStroke();
  fill(BLACK);
  text(sidebarText, 5, 5);
}
