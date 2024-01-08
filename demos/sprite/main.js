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
let playbackModes = ["play once", "ping pong", "loop"];

/** @type {number} */
let pbModeIndex = 2;

/**
 * Size of each pixel on the upscaled canvas.
 * @number
 */
const UPSCALE_FACTOR = 10;

const BLACK      = "#1a1c2c";
const RED        = "#b13e53";
const LIGHT_BLUE = "#41a6f6";

function preload() {
  input = Kepler.Input.makeNew({ sketch: window });
  input.loadActionList("action-list.json");

  spriteLoader = new Kepler.SpriteLoader(window);
  spriteLoader.loadSpriteList("sprite-list.json");
}

function setup() {
  createCanvas(800, 800);
  noSmooth();

  pg = createGraphics(width / UPSCALE_FACTOR, height / UPSCALE_FACTOR);

  engine = new Kepler.Engine({
    sketch: window,
    renderTarget: pg
  });
  entity = engine.addEntity(new TestEntity(pg.width / 2, pg.height / 2));
  tagNames = entity.sprite.tagNames;

  textAlign(LEFT, TOP);
  textFont("monospace");
  textSize(16);
}

function draw() {
  input.update();
  engine.update();

  pg.background(255);
  engine.render();

  background(255);
  image(pg, 0, 0, width, height);

  fill(BLACK);
  text(
    `Tag: "${entity.sprite.currentTag}"\n` +
      `Frame: ${entity.sprite.currentFrame}\n` +
      `Playback mode: "${entity.sprite.playbackMode}"\n` +
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
  sprite = spriteLoader.makeAnimatedSprite("animation test");

  /**
   * @constructor
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super();
    this.position = createVector(x, y);
    //this.sprite = spriteLoader.makeAnimatedSprite("animation test");
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
