/** @type {Kepler.Engine} */
let engine;

/** @type {Kepler.Input} */
let input;

/** @type {Kepler.SpriteLoader} */
let spriteLoader;

/** @type {p5.Graphics} */
let pg;

/** @type {TestEntity} */
let entity;

/** @type {string[]} */
let tagNames;

/** @type {number} */
let tagIndex = 0;

/** @type {Symbol[]} */
let playbackModes = [Kepler.PLAY_ONCE, Kepler.PING_PONG, Kepler.LOOP];

/** @type {number} */
let pbModeIndex = 2;

/**
 * Size of each pixel on the upscaled canvas.
 * @number
 */
const UPSCALE_FACTOR = 10;

function preload() {
  loadJSON("../../extras/color-palette.json", loadPalette);

  spriteLoader = new Kepler.SpriteLoader();
  spriteLoader.preload([
    {
      name: "animation test",
      path: "sprites/animation-test.json",
      position: { x: 40, y: 40 },
      paused: false,
    },
  ]);
}

function setup() {
  createCanvas(800, 800);
  noSmooth();

  pg = createGraphics(width / UPSCALE_FACTOR, height / UPSCALE_FACTOR);

  engine = new Kepler.Engine();
  entity = engine.addEntity(new TestEntity(pg.width / 2, pg.height / 2));
  tagNames = entity.sprite.tagNames;

  input = Kepler.Input.makeNew(window);
  input.addAction({
    name: "step forward",
    keys: [Kepler.Key.RIGHT],
    mode: Kepler.PRESS,
  });
  input.addAction({
    name: "step back",
    keys: [Kepler.Key.LEFT],
    mode: Kepler.PRESS,
  });
  input.addAction({
    name: "pause",
    keys: [Kepler.Key.SPACE],
    mode: Kepler.PRESS,
  });
  input.addAction({
    name: "restart",
    keys: [Kepler.Key.R],
    mode: Kepler.PRESS,
  });
  input.addAction({
    name: "tag up",
    keys: [Kepler.Key.UP],
    mode: Kepler.PRESS,
  });
  input.addAction({
    name: "tag down",
    keys: [Kepler.Key.DOWN],
    mode: Kepler.PRESS,
  });
  input.addAction({
    name: "cycle playback mode",
    keys: [Kepler.Key.P],
    mode: Kepler.PRESS,
  });

  textAlign(LEFT, TOP);
  textFont("monospace");
  textSize(16);
}

function draw() {
  input.update();
  engine.update();

  pg.background(WHITE);
  engine.render();

  background(WHITE);
  image(pg, 0, 0, width, height);

  let playModeString;
  if (entity.sprite.playbackMode === Kepler.PLAY_ONCE) {
    playModeString = "PLAY_ONCE";
  } else if (entity.sprite.playbackMode === Kepler.PING_PONG) {
    playModeString = "PING_PONG";
  } else {
    playModeString = "LOOP";
  }

  fill(BLACK);
  text(
    `Tag: "${entity.sprite.currentTag}"\n` +
      `Frame: ${entity.sprite.currentFrame}\n` +
      `Playback mode: ${playModeString}\n` +
      `Paused: ${entity.sprite.paused}\n` +
      `      to pause/unpause\n` + // spacing to make highlighted text line up
      `  /     to cycle tags\n` +
      `  to restart\n` +
      `  to cycle playback mode`,
    5,
    5
  );

  fill(LIGHT_BLUE);
  text("Space", 5, 85);
  text("Up Down", 5, 105);
  text("R", 5, 125);
  text("P", 5, 145);

  if (entity.sprite.paused) {
    fill(RED);
    text("PAUSED:", 5, 165);
    fill(BLACK);
    text("            /      for frame advance", 5, 165);
    fill(LIGHT_BLUE);
    text("        Left Right", 5, 165);
  }
}

/**
 * Test entity that displays a sprite.
 * @class
 */
class TestEntity extends Kepler.Entity {
  /** @type {p5.Vector} */
  position;

  /** @type {Kepler.AnimatedSprite} */
  sprite;

  /**
   * @constructor
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.position = createVector(x, y);
    this.sprite = spriteLoader.makeAnimatedSprite("animation test");
  }

  /** @override */
  update(dt) {
    this.sprite.update(dt);

    if (input.isActive("pause")) this.sprite.paused = !this.sprite.paused;
    if (input.isActive("restart")) this.sprite.restart();
    if (input.isActive("tag up")) {
      --tagIndex;
      if (tagIndex < 0) tagIndex = tagNames.length - 1;
      this.sprite.changeTag(tagNames[tagIndex]);
    }
    if (input.isActive("tag down")) {
      ++tagIndex;
      if (tagIndex >= tagNames.length) tagIndex = 0;
      this.sprite.changeTag(tagNames[tagIndex]);
    }
    if (input.isActive("cycle playback mode")) {
      pbModeIndex = ++pbModeIndex % playbackModes.length;
      this.sprite.playbackMode = playbackModes[pbModeIndex];
    }
    if (this.sprite.paused) {
      if (input.isActive("step forward")) this.sprite.advanceFrame(1);
      if (input.isActive("step back")) this.sprite.advanceFrame(-1);
    }
  }

  /** @override */
  render(rt) {
    this.sprite.render(rt);
  }
}
