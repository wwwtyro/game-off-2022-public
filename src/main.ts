import { vec2 } from "gl-matrix";
import RAPIER, { ColliderDesc } from "@dimforge/rapier2d-compat";
import { Renderer } from "./renderer";
import { loadResources, Resources, Texture } from "./resources";

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

const colliderDescs = new Map<Texture, ColliderDesc>();

function getColliderDesc(texture: Texture): RAPIER.ColliderDesc {
  if (texture.outline === undefined) {
    throw new Error("No outline available for collider.");
  }
  if (!colliderDescs.has(texture)) {
    const desc = RAPIER.ColliderDesc.polyline(new Float32Array(texture.outline.flat()));
    colliderDescs.set(texture, desc);
  }
  return colliderDescs.get(texture)!;
}

export type State = ReturnType<typeof buildState>;

function buildState(resources: Resources) {
  const playerTexture = resources["playerZero"];

  const playerColliderDesc = getColliderDesc(playerTexture);

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
    camera: {
      position: vec2.fromValues(0, 0),
      fov: 2,
    },
    player: {
      texture: playerTexture,
      position: vec2.fromValues(0, 0),
      rotation: 0,
      velocity: vec2.fromValues(0, 0),
      acceleration: 10.0,
      drag: 2,
      collider: playerCollider,
    },
    beams: [] as Beam[],
    sparks: [] as Spark[],
    keys: {} as Record<string, boolean>,
  };
}

async function main() {
  await RAPIER.init();

  const resources = await loadingScreen();

  const state = buildState(resources);

  window.addEventListener("keydown", (e) => {
    state.keys[e.code] = true;
  });
  window.addEventListener("keyup", (e) => {
    state.keys[e.code] = false;
  });

  const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
  canvas.style.display = "block";
  const renderer = new Renderer(canvas, resources);

  while (true) {
    state.time.dt = 0.001 * performance.now() - state.time.now;
    state.time.now += state.time.dt;

    // Needs to be called after adding colliders and before casting rays against them.
    state.world.step();

    // Update player position.
    const acceleration = vec2.fromValues(0, 0);
    if (state.keys.KeyA) {
      acceleration[0] -= state.player.acceleration;
    }
    if (state.keys.KeyD) {
      acceleration[0] += state.player.acceleration;
    }
    if (state.keys.KeyS) {
      acceleration[1] -= state.player.acceleration;
    }
    if (state.keys.KeyW) {
      acceleration[1] += state.player.acceleration;
    }
    const drag = vec2.scale(vec2.create(), state.player.velocity, -state.player.drag);
    vec2.add(acceleration, acceleration, drag);
    vec2.scaleAndAdd(state.player.velocity, state.player.velocity, acceleration, state.time.dt);
    vec2.scaleAndAdd(state.player.position, state.player.position, state.player.velocity, state.time.dt);

    // Update player rotation.
    state.player.rotation += state.time.dt * 0.2;

    // Update camera position.

    vec2.scaleAndAdd(
      state.camera.position,
      state.camera.position,
      vec2.sub(vec2.create(), state.player.position, state.camera.position),
      0.05
    );

    // Update collider positions.
    state.player.collider.setRotation(state.player.rotation);
    state.player.collider.setTranslation({ x: state.player.position[0], y: state.player.position[1] });

    // Remove all aged beams.
    const MAX_BEAM_AGE = 2;
    state.beams = state.beams.filter((beam) => state.time.now - beam.timestamp < MAX_BEAM_AGE);

    // Remove all tired sparks.
    state.sparks = state.sparks.filter((spark) => {
      spark.energy *= 0.8;
      return spark.energy > 1 / 255;
    });

    // Create new beams
    for (let i = 0; i < 10; i++) {
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
