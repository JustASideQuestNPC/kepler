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

function preload() {
  loadJSON("../../extras/color-palette.json", loadPalette);
}


function setup() {
  createCanvas(800, 800);
  input = Kepler.Input.makeNew(window);
  input.addAction({
    name: "cycle colliders",
    keys: [Kepler.Key.LEFT_MOUSE],
    mode: Kepler.PRESS,
    callback: () => {
      dcIndex = (dcIndex + 1) % dynamicColliders.length;
      currentDynamicCollider = dynamicColliders[dcIndex];
    },
  });

  staticPoint = new Kepler.PointCollider(width / 4, height / 4);

  staticLine = new Kepler.LineCollider(
    (width * 3) / 4 - 50,
    height / 4 - 50,
    (width * 3) / 4 + 50,
    height / 4 + 50
  );

  staticCircle = new Kepler.CircleCollider(width / 4, (height * 3) / 4, 75);

  staticPolygon = new Kepler.PolygonCollider({
    points: [
      [0, -114],
      [96, -52],
      [96, 52],
      [0, 114],
      [-96, 52],
      [-96, -52],
    ],
    x: (width * 3) / 4,
    y: (height * 3) / 4,
  });

  dynamicColliders[0] = new Kepler.PointCollider(0, 0);
  dynamicColliders[1] = new Kepler.LineCollider(-50, -30, 50, 30);
  dynamicColliders[2] = new Kepler.CircleCollider(0, 0, 40);
  dynamicColliders[3] = new Kepler.PolygonCollider({
    points: [
      [-50, -20],
      [30, 0],
      [-20, 40],
    ],
  });

  currentDynamicCollider = dynamicColliders[0];

  textFont("monospace", 16);
  textAlign(LEFT, TOP);
}


function draw() {
  input.update();

  if (dcIndex === 0) {
    currentDynamicCollider.position.set(mouseX, mouseY);
  } else {
    currentDynamicCollider.setPos(mouseX, mouseY);
  }
  staticPolygon.modAngle(0.01);

  background(WHITE);

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
  let transVec = createVector(0, 0);
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

  if (colliding && hasMTV && (dcIndex === 2 || dcIndex === 3)) {
    stroke(BLUE);
    currentDynamicCollider.modPos(transVec);
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
