import RAPIER from "@dimforge/rapier2d-compat";
import { vec2 } from "gl-matrix";
import { buildState, createDrone, Drone, State } from "../model/model";
import { animationFrame, modulo } from "../util";
import { Renderer } from "../view/renderer";
import { levelEnd } from "./level-end";
import { Resources } from "./loading";
import { winGame } from "./win-game";

const vec2Origin = vec2.fromValues(0, 0);

function initLevel(state: State, resources: Resources) {
  const enemyCore = createDrone(state.world, resources["core0"]);
  enemyCore.isCore = true;
  enemyCore.armor = 5 * state.level;
  // vec2.random(enemyCore.position, Math.random() * 1);
  vec2.set(enemyCore.position, 0, 2);

  state.enemies.length = 0;
  state.enemies.push(enemyCore);

  for (let i = 0; i < 3; i++) {
    const enemy = createDrone(state.world, resources["ship1"]);
    enemy.armor = 5 * state.level;
    vec2.random(enemy.position, Math.random() * 1);
    vec2.add(enemy.position, enemy.position, enemyCore.position);
    enemy.rotation = Math.random() * 2 * Math.PI;
    state.enemies.push(enemy);
  }
}

export async function game(resources: Resources) {
  const state = buildState(resources);
  initLevel(state, resources);

  (window as any).state = state; // Degub.

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
      if (enemy.isCore) {
        continue;
      }
      vec2.set(enemy.force, 0, 0);
      for (const enemy2 of state.enemies) {
        if (enemy2 === enemy) {
          continue;
        }
        const toEnemy2 = vec2.subtract(vec2.create(), enemy2.position, enemy.position);
        const distToEnemy2 = vec2.length(toEnemy2);
        if (enemy2.isCore && distToEnemy2 > 5) {
          vec2.scaleAndAdd(enemy.force, enemy.force, vec2.normalize(vec2.create(), toEnemy2), enemy.acceleration * 0.125);
        } else if (distToEnemy2 < 2) {
          vec2.scaleAndAdd(enemy.force, enemy.force, vec2.normalize(vec2.create(), toEnemy2), -enemy.acceleration * 0.25);
        }
      }
      const toPlayer = vec2.subtract(vec2.create(), state.player.position, enemy.position);
      const distToPlayer = vec2.length(toPlayer);
      if (distToPlayer < 2 && distToPlayer > 1) {
        vec2.scaleAndAdd(enemy.force, enemy.force, vec2.normalize(vec2.create(), toPlayer), enemy.acceleration * 1);
      }
      if (Math.random() < 1 / 60) {
        vec2.add(enemy.force, enemy.force, vec2.random(vec2.create(), Math.random() * 100));
      }
      const drag = vec2.scale(vec2.create(), enemy.velocity, -enemy.drag);
      const acceleration = vec2.add(vec2.create(), enemy.force, drag);
      vec2.scaleAndAdd(enemy.velocity, enemy.velocity, acceleration, state.time.dt);
      vec2.scaleAndAdd(enemy.position, enemy.position, enemy.velocity, state.time.dt);
    }

    // Update player position.
    const rawAcceleration = vec2.fromValues(0, 0);
    let accelerated = false;
    if (state.keys.KeyA) {
      rawAcceleration[0] -= 1;
      accelerated = true;
    }
    if (state.keys.KeyD) {
      rawAcceleration[0] += 1;
      accelerated = true;
    }
    if (state.keys.KeyS) {
      rawAcceleration[1] -= 1;
      accelerated = true;
    }
    if (state.keys.KeyW) {
      rawAcceleration[1] += 1;
      accelerated = true;
    }
    const acceleration = vec2.normalize(vec2.create(), rawAcceleration);
    vec2.scale(acceleration, acceleration, 5.0 * state.player.acceleration);
    const drag = vec2.scale(vec2.create(), state.player.velocity, -state.player.drag);
    vec2.add(acceleration, acceleration, drag);
    vec2.scaleAndAdd(state.player.velocity, state.player.velocity, acceleration, state.time.dt);
    vec2.scaleAndAdd(state.player.position, state.player.position, state.player.velocity, state.time.dt);

    // Update player rotation to point towards the nearest enemy.
    const playerDirection = vec2.fromValues(Math.cos(state.player.rotation), Math.sin(state.player.rotation));
    let targetedDrone: Drone | null = null;
    let maxScore = -Infinity;
    for (const enemy of state.enemies) {
      const dist = vec2.distance(enemy.position, state.player.position);
      if (dist > 5) {
        continue;
      }
      const de = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), enemy.position, state.player.position));
      const score = (0.75 + 0.25 * vec2.dot(de, playerDirection)) / dist;
      if (score > maxScore) {
        maxScore = score;
        targetedDrone = enemy;
      }
    }
    let playerIsTargetingEnemy = false;
    if (targetedDrone !== null && maxScore < 5) {
      playerIsTargetingEnemy = true;
      const de = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), targetedDrone.position, state.player.position));
      state.player.targetRotation = Math.atan2(de[1], de[0]);
    } else if (accelerated) {
      const q = vec2.normalize(vec2.create(), rawAcceleration);
      state.player.targetRotation = Math.atan2(q[1], q[0]);
    }
    state.player.targetRotation = modulo(state.player.targetRotation, 2 * Math.PI);
    state.player.rotation = modulo(state.player.rotation, 2 * Math.PI);
    let dr = state.player.targetRotation - state.player.rotation;
    if (Math.abs(dr) > Math.PI) {
      dr = -Math.sign(dr) * (2 * Math.PI - Math.abs(dr));
    }
    const maxTurn = 1.0 * state.player.turningSpeed * state.time.dt;
    if (Math.abs(dr) > maxTurn) {
      dr = Math.sign(dr) * maxTurn;
    }
    state.player.rotation += dr;

    // Update enemy rotations.
    for (const enemy of state.enemies) {
      if (enemy.isCore) {
        enemy.rotation += 0.1 * state.time.dt;
        continue;
      }
      const dist = vec2.distance(enemy.position, state.player.position);
      if (dist < 5) {
        const de = vec2.sub(vec2.create(), state.player.position, enemy.position);
        vec2.normalize(de, de);
        enemy.targetRotation = Math.atan2(de[1], de[0]);
      }
      enemy.targetRotation = modulo(enemy.targetRotation, 2 * Math.PI);
      enemy.rotation = modulo(enemy.rotation, 2 * Math.PI);
      let dr = enemy.targetRotation - enemy.rotation;
      if (Math.abs(dr) > Math.PI) {
        dr = -Math.sign(dr) * (2 * Math.PI - Math.abs(dr));
      }
      enemy.rotation += 0.1 * dr;
    }

    // Update camera.
    vec2.scaleAndAdd(
      state.camera.position,
      state.camera.position,
      vec2.sub(vec2.create(), state.player.position, state.camera.position),
      0.05
    );
    const targetFov = 3 + 0.1 * vec2.length(state.player.velocity);
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

    // Update all flames.
    for (const flame of state.flames) {
      flame.age += state.time.dt;
    }

    // Remove all aged flames.
    state.flames = state.flames.filter((f) => f.age < 3.0);

    // Fire player weapons.
    if (!accelerated && playerIsTargetingEnemy && state.time.now - state.player.lastFired > 1 / state.player.firingRate) {
      const direction = vec2.fromValues(Math.cos(state.player.rotation), Math.sin(state.player.rotation));
      for (let i = 0; i < state.player.lasers; i++) {
        const step = (0.25 * state.player.texture.width!) / (state.player.lasers + 1);
        const start = vec2.fromValues(0, -1);
        vec2.rotate(start, start, vec2Origin, state.player.rotation);
        vec2.scaleAndAdd(start, state.player.position, start, 0.5 * 0.25 * state.player.texture.width!);
        const offset = vec2.fromValues(0, 1);
        vec2.rotate(offset, offset, vec2Origin, state.player.rotation);
        const position = vec2.scaleAndAdd(vec2.create(), start, offset, (i + 1) * step);
        state.beams.push({
          position,
          lastPosition: vec2.clone(position),
          direction: vec2.clone(direction),
          velocity: 3 * (0.5 * state.player.beamSpeed + 0.5 * Math.random() * state.player.beamSpeed),
          timestamp: state.time.now,
          power: state.player.weaponPower,
          team: "player",
        });
      }
      state.player.lastFired = state.time.now;
    }

    // Fire enemy weapons.
    for (const enemy of state.enemies) {
      if (enemy.isCore) {
        continue;
      }
      if (state.time.now - enemy.lastFired < 1 / enemy.firingRate) {
        continue;
      }
      const dist = vec2.distance(state.player.position, enemy.position);
      if (dist > 5) {
        continue;
      }
      const direction = vec2.fromValues(Math.cos(enemy.rotation), Math.sin(enemy.rotation));
      for (let i = 0; i < 1; i++) {
        const position = vec2.add(vec2.create(), enemy.position, vec2.random(vec2.create(), 0.01));
        state.beams.push({
          position,
          lastPosition: vec2.clone(position),
          direction: vec2.clone(direction),
          velocity: 2 + 2 * Math.random() + vec2.length(state.player.velocity),
          timestamp: state.time.now,
          power: enemy.weaponPower,
          team: "enemy",
        });
      }
      enemy.lastFired = state.time.now;
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
      if (spark.smokey && Math.random() < 0.1) {
        state.flames.push({
          position: vec2.clone(spark.position), //vec2.add(vec2.create(), spark.position, vec2.random(vec2.create(), Math.random() * 0.05)),
          age: 0,
        });
      }
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
        // Skip friendly fire.
        if (beam.team === "enemy" && hit.collider !== state.player.collider) {
          return true;
        }
        if (beam.team === "player" && hit.collider === state.player.collider) {
          return true;
        }
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
            energy: 2 * -Math.log(1 - Math.random()),
            decay: 0.2 * Math.random() + 0.7,
            smokey: false,
          });
        }
        if (hit.collider === state.player.collider) {
          state.player.armor -= beam.power;
        } else {
          const enemy = state.enemies.find((e) => e.collider === hit.collider);
          if (enemy) {
            enemy.armor -= beam.power;
          }
        }
        return false;
      }
      return true;
    });

    // Remove any dead enemies.
    state.enemies = state.enemies.filter((enemy) => {
      if (enemy.armor > 0) {
        return true;
      }
      for (let i = 0; i < 32; i++) {
        for (const point of enemy.texture.outline!) {
          const p = vec2.clone(point as vec2);
          vec2.rotate(p, p, vec2Origin, enemy.rotation);
          vec2.add(p, p, enemy.position);
          vec2.scaleAndAdd(p, enemy.position, vec2.sub(vec2.create(), p, enemy.position), Math.random());
          state.sparks.push({
            position: p,
            lastPosition: vec2.clone(p),
            direction: vec2.random(vec2.create(), 1),
            velocity: Math.random(),
            energy: 8 * -Math.log(1 - Math.random()),
            decay: 0.9 * Math.random(),
            smokey: true,
          });
          state.flames.push({
            position: vec2.clone(p),
            age: -0 * Math.random(),
          });
        }
      }
      state.world.removeCollider(enemy.collider, false);
      return false;
    });

    // Check to see if we've completed the level.
    if (state.levelEndTimestamp === null) {
      if (state.enemies.length === 0) {
        state.levelEndTimestamp = state.time.now;
      }
    }

    // If the level has ended, handle the necessary updates.
    if (state.levelEndTimestamp !== null && state.time.now - state.levelEndTimestamp > 4.0) {
      if (state.level === 100) {
        await winGame(state);
        return;
      }
      await levelEnd(state);
      state.levelEndTimestamp = null;
      state.level++;
      initLevel(state, resources);
    }

    renderer.render(state);
    await animationFrame();
  }
}
