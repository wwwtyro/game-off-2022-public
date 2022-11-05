import { vec2 } from "gl-matrix";
import RAPIER from "@dimforge/rapier2d-compat";
import { generateOutline } from "./outline";
import { Renderer } from "./renderer";
import { loadResources, Resources, Texture } from "./resources";

export interface Sprite {
  texture: Texture;
  location: vec2;
  rotation: number;
}

export interface Beam {
  position: vec2;
  lastPosition: vec2;
  direction: vec2;
  velocity: number;
  timestamp: number;
}

export interface Spark {
  position: vec2;
  lastPosition: vec2;
  direction: vec2;
  velocity: number;
  energy: number;
}

export type State = ReturnType<typeof buildState>;

function buildState(resources: Resources) {
  const playerSprite: Sprite = {
    texture: resources["ship0"],
    location: vec2.fromValues(0, 0),
    rotation: 0,
  };

  const playerOutline = generateOutline(playerSprite.texture);

  const playerColliderDesc = RAPIER.ColliderDesc.polyline(new Float32Array(playerOutline.flat()));

  const world = new RAPIER.World({ x: 0, y: 0 });
  const playerCollider = world.createCollider(playerColliderDesc);

  console.log(playerColliderDesc);
  console.log("playerCollider", playerCollider);

  return {
    time: {
      now: 0,
      dt: 0,
    },
    world,
    player: {
      sprite: playerSprite,
      collider: playerCollider,
      outline: playerOutline,
    },
    beams: [] as Beam[],
    sparks: [] as Spark[],
  };
}

async function main() {
  await RAPIER.init();

  const resources = await loadingScreen();

  const state = buildState(resources);

  // const outline = await generateOutline(resources["enemyZero"]);

  const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
  canvas.style.display = "block";
  const renderer = new Renderer(canvas, resources);

  while (true) {
    state.time.dt = 0.001 * performance.now() - state.time.now;
    state.time.now += state.time.dt;

    state.world.step();

    // Update player rotation.
    state.player.sprite.rotation += state.time.dt * 0.2;

    // Update collider positions.
    state.player.collider.setRotation(state.player.sprite.rotation);
    state.player.collider.setTranslation({ x: state.player.sprite.location[0], y: state.player.sprite.location[1] });

    // Remove all aged beams.
    const MAX_BEAM_AGE = 2;
    state.beams = state.beams.filter((beam) => state.time.now - beam.timestamp < MAX_BEAM_AGE);

    // Remove all tired sparks.
    state.sparks = state.sparks.filter((spark) => {
      spark.energy *= 0.8;
      return spark.energy > 1 / 255;
    });

    // Create new beams
    for (let i = 0; i < 2; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const radius = 2 + 1 * Math.random();
      state.beams.push({
        position: vec2.fromValues(radius * Math.cos(theta), radius * Math.sin(theta)),
        direction: vec2.fromValues(-Math.cos(theta), -Math.sin(theta)),
        velocity: 2 + 2 * Math.random(),
        lastPosition: vec2.fromValues(radius * Math.cos(theta), radius * Math.sin(theta)),
        timestamp: state.time.now,
      });
    }

    // Update all beams.
    for (const beam of state.beams) {
      vec2.copy(beam.lastPosition, beam.position);
      vec2.scaleAndAdd(beam.position, beam.position, beam.direction, state.time.dt * beam.velocity);
    }

    // Update all sparks.
    for (const spark of state.sparks) {
      vec2.copy(spark.lastPosition, spark.position);
      vec2.scaleAndAdd(spark.position, spark.position, spark.direction, state.time.dt * spark.velocity * spark.energy);
    }

    // Get rid of any beams that hit something.
    const ray = new RAPIER.Ray({ x: 0, y: 0 }, { x: 0, y: 0 });
    state.beams = state.beams.filter((beam) => {
      ray.origin.x = beam.lastPosition[0];
      ray.origin.y = beam.lastPosition[1];
      ray.dir.x = beam.direction[0];
      ray.dir.y = beam.direction[1];
      const hit = state.world.castRayAndGetNormal(ray, 100, true);
      if (hit !== null && hit.toi < beam.velocity * state.time.dt * 1.5) {
        // We hit something, create some sparks!
        while (Math.random() < 0.9) {
          state.sparks.push({
            position: vec2.clone(beam.position),
            lastPosition: vec2.clone(beam.position),
            direction: vec2.normalize(
              vec2.create(),
              vec2.add(vec2.create(), vec2.fromValues(hit.normal.x, hit.normal.y), vec2.random(vec2.create(), 1))
            ),
            velocity: Math.random(),
            energy: 4 * Math.random(),
          });
        }
        return false;
      }
      return true;
    });

    renderer.render(state);
    await animationFrame();
  }
}

async function loadingScreen() {
  const loadingDiv = document.getElementById("loading")!;
  loadingDiv.style.display = "block";
  const resources = await loadResources((fraction: number) => {
    loadingDiv.innerText = `Loading ${Math.round(100 * fraction)}%`;
  });
  loadingDiv.style.display = "none";
  return resources;
}

function animationFrame() {
  return new Promise((accept) => {
    requestAnimationFrame(accept);
  });
}

main();

export {};
