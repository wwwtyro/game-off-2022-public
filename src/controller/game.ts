import RAPIER from "@dimforge/rapier2d-compat";
import { vec2 } from "gl-matrix";
import { buildState, Drone } from "../model/model";
import { animationFrame, modulo } from "../util";
import { Renderer } from "../view/renderer";
import { Resources } from "./loading";

export async function game(resources: Resources) {
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
    state.time.dt = 1 / 60;
    state.time.now += state.time.dt;

    // Needs to be called after adding colliders and before casting rays against them.
    state.world.step();

    // Update enemy positions.
    for (const enemy of state.enemies) {
      enemy.rotation += 0.1 * state.time.dt;
      enemy.velocity[0] = 1 * Math.cos(enemy.rotation);
      enemy.velocity[1] = 1 * Math.sin(enemy.rotation);
      vec2.scaleAndAdd(enemy.position, enemy.position, enemy.velocity, state.time.dt);
    }

    // Update player position.
    const acceleration = vec2.fromValues(0, 0);
    let accelerated = false;
    if (state.keys.KeyA) {
      acceleration[0] -= state.player.acceleration;
      accelerated = true;
    }
    if (state.keys.KeyD) {
      acceleration[0] += state.player.acceleration;
      accelerated = true;
    }
    if (state.keys.KeyS) {
      acceleration[1] -= state.player.acceleration;
      accelerated = true;
    }
    if (state.keys.KeyW) {
      acceleration[1] += state.player.acceleration;
      accelerated = true;
    }
    const drag = vec2.scale(vec2.create(), state.player.velocity, -state.player.drag);
    vec2.add(acceleration, acceleration, drag);
    vec2.scaleAndAdd(state.player.velocity, state.player.velocity, acceleration, state.time.dt);
    vec2.scaleAndAdd(state.player.position, state.player.position, state.player.velocity, state.time.dt);

    // Update player rotation to point towards the nearest enemy.
    let nearestDrone: Drone | null = null;
    let minDist = Infinity;
    for (const enemy of state.enemies) {
      const dist = vec2.distance(enemy.position, state.player.position);
      if (dist < minDist) {
        minDist = dist;
        nearestDrone = enemy;
      }
    }
    if (nearestDrone !== null) {
      const de = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), nearestDrone.position, state.player.position));
      state.player.targetRotation = Math.atan2(de[1], de[0]);
    }
    state.player.targetRotation = modulo(state.player.targetRotation, 2 * Math.PI);
    state.player.rotation = modulo(state.player.rotation, 2 * Math.PI);
    let dr = state.player.targetRotation - state.player.rotation;
    if (Math.abs(dr) > Math.PI) {
      dr = -Math.sign(dr) * (2 * Math.PI - Math.abs(dr));
    }
    state.player.rotation += 0.1 * dr;

    // Update camera.
    vec2.scaleAndAdd(
      state.camera.position,
      state.camera.position,
      vec2.sub(vec2.create(), state.player.position, state.camera.position),
      0.05
    );
    const targetFov = 2 + 0.1 * vec2.length(state.player.velocity);
    const df = targetFov > state.camera.fov ? 0.1 : 0.001;
    state.camera.fov += df * (targetFov - state.camera.fov);

    // Update collider positions.
    state.player.collider.setRotation(state.player.rotation);
    state.player.collider.setTranslation({ x: state.player.position[0], y: state.player.position[1] });
    for (const enemy of state.enemies) {
      enemy.collider.setRotation(enemy.rotation);
      enemy.collider.setTranslation({ x: enemy.position[0], y: enemy.position[1] });
    }

    // Remove all aged beams.
    const MAX_BEAM_AGE = 2;
    state.beams = state.beams.filter((beam) => state.time.now - beam.timestamp < MAX_BEAM_AGE);

    // Remove all tired sparks.
    state.sparks = state.sparks.filter((spark) => {
      spark.energy *= spark.decay;
      return spark.energy > 1 / 255;
    });

    // Create new beams
    if (!accelerated) {
      const direction = vec2.fromValues(Math.cos(state.player.rotation), Math.sin(state.player.rotation));
      for (let i = 0; i < 1; i++) {
        const position = vec2.add(vec2.create(), state.player.position, vec2.random(vec2.create(), 0.01));
        state.beams.push({
          position,
          direction: vec2.clone(direction),
          velocity: 2 + 2 * Math.random() + vec2.length(state.player.velocity),
          lastPosition: vec2.clone(position),
          timestamp: state.time.now,
        });
      }
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
      if (hit !== null && hit.collider !== state.player.collider && hit.toi < beam.velocity * state.time.dt * 1.5) {
        // We hit something, create some sparks!
        while (Math.random() < 0.99) {
          state.sparks.push({
            position: vec2.clone(beam.position),
            lastPosition: vec2.clone(beam.position),
            direction: vec2.normalize(
              vec2.create(),
              vec2.add(vec2.create(), vec2.fromValues(hit.normal.x, hit.normal.y), vec2.random(vec2.create(), 1.25))
            ),
            velocity: Math.random(),
            energy: 4 * Math.random(),
            decay: 0.2 * Math.random() + 0.7,
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
