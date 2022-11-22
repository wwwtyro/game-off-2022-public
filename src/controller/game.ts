import RAPIER from "@dimforge/rapier2d-compat";
import { vec2 } from "gl-matrix";
import { EventManager } from "../event-manager";
import {
  createDrone,
  Drone,
  chargeDroneShields,
  accelerateDrone,
  droneTargetPoint,
  droneTargetDirection,
  rotateDrone,
  fireDroneWeapons,
  explodeDrone,
  damageDrone,
} from "../model/drone";
import { Beam, Missile } from "../model/model";
import { PlayerDrone } from "../model/player-drones";
import { State, buildState, addExplosion } from "../model/state";
import { applyRandomUpgrade } from "../model/upgrades";
import { animationFrame, randomChoice } from "../util";
import { Renderer } from "../view/renderer";
import { inGameOptionsMenu } from "./in-game-options-menu";
import { levelEnd } from "./level-end";
import { Resources, Sprite } from "./loading";
import { loseGame } from "./lose-game";
import { permanentUpgrade } from "./permanent-upgrade";
import { winGame } from "./win-game";

const PLAYER_TARGETTING_DISTANCE = 6;

function initLevel(state: State, resources: Resources) {
  const bossLevels = 10;
  const coreCount = state.level % bossLevels === 0 ? Math.floor(state.level / bossLevels) + 1 : 1;
  const coreSprite = resources.sprites.enemyCore00;
  const coreRadius = 0.5 * coreCount * coreSprite.radius;
  const coreCenter = vec2.random(vec2.create(), Math.random() * 32);
  while (vec2.distance(coreCenter, state.player.position) < 16) {
    vec2.random(coreCenter, Math.random() * 32);
  }
  state.enemies.length = 0;
  for (let i = 0; i < coreCount; i++) {
    const enemyCore = createDrone(state.world, resources.sprites.enemyCore00);
    enemyCore.isCore = true;
    enemyCore.maxArmor = 10 * state.level;
    enemyCore.armor = enemyCore.maxArmor;
    const angle = (2 * Math.PI * i) / coreCount;
    vec2.set(enemyCore.position, coreRadius * Math.cos(angle), coreRadius * Math.sin(angle));
    vec2.add(enemyCore.position, enemyCore.position, coreCenter);
    state.enemies.push(enemyCore);
    const children: Drone[] = [];
    let pointsLeft = state.level;
    while (pointsLeft > 0) {
      const points = Math.max(1, Math.round(Math.random() * pointsLeft));
      pointsLeft -= points;
      let sprite = "enemy00";
      if (points > 5) {
        sprite = "enemy01";
      }
      if (points > 10) {
        sprite = "enemy02";
      }
      if (points > 20) {
        sprite = "enemy03";
      }
      if (points > 50) {
        sprite = "enemy04";
      }
      const child = createDrone(state.world, (resources.sprites as Record<string, Sprite>)[sprite]);
      child.parent = enemyCore;
      vec2.random(child.position, Math.random() * 1);
      vec2.add(child.position, child.position, enemyCore.position);
      child.rotation = Math.random() * 2 * Math.PI;
      child.maxArmor = 5 * state.level;
      child.armor = child.maxArmor;
      for (let i = 0; i < points * 2; i++) {
        applyRandomUpgrade(child);
      }
      children.push(child);
    }
    state.enemies.push(...children);
  }
}

export async function game(resources: Resources, playerDrone: PlayerDrone) {
  resources.sounds.engine0.play();
  resources.sounds.engine0.volume(0);
  const state = buildState(resources, playerDrone);
  initLevel(state, resources);

  (window as any).state = state; // Degub.

  const eventManager = new EventManager();

  const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
  canvas.style.display = "block";
  const renderer = new Renderer(canvas, resources);

  eventManager.addEventListener(window, "keydown", (e) => {
    state.keys[e.code] = true;
  });

  eventManager.addEventListener(window, "keyup", (e) => {
    state.keys[e.code] = false;
  });

  eventManager.addEventListener(canvas, "pointerdown", (e) => {
    state.pointer.x = e.offsetX;
    state.pointer.y = e.offsetY;
    state.pointer.down = true;
  });

  eventManager.addEventListener(canvas, "pointerup", () => {
    state.pointer.down = false;
  });

  eventManager.addEventListener(canvas, "pointerleave", () => {
    state.pointer.down = false;
  });

  eventManager.addEventListener(canvas, "pointerout", () => {
    state.pointer.down = false;
  });

  eventManager.addEventListener(canvas, "pointermove", (e) => {
    state.pointer.x = e.offsetX;
    state.pointer.y = e.offsetY;
  });

  const stats = document.getElementById("game-stats") as HTMLElement;
  stats.style.display = "block";
  stats.innerText = "";

  while (true) {
    const timestamp = performance.now() / 1000;
    state.time.dt = Math.min(timestamp - state.time.last, 1 / 30);
    state.time.now += state.time.dt;
    state.time.last = timestamp;

    stats.innerHTML = `Level ${state.level} / Elapsed time: ${new Date(state.time.now * 1000).toISOString().substring(11, 19)}`;

    if (state.keys["Escape"]) {
      resources.sounds.engine0.mute(true);
      await inGameOptionsMenu(state, resources);
      resources.sounds.engine0.mute(false);
    }

    // Needs to be called after adding colliders and before casting rays against them.
    state.world.step();

    // Charge all shields.
    chargeDroneShields(state.player, state.time.dt);
    for (const enemy of state.enemies) {
      chargeDroneShields(enemy, state.time.dt);
    }

    // Reduce all slow effects.
    for (const enemy of state.enemies) {
      enemy.slow = Math.min(1, Math.max(0.01, enemy.slow * 1.01));
    }

    // Update enemy positions.
    for (const enemy of state.enemies) {
      if (enemy.isCore) {
        continue;
      }
      const acceleration = vec2.fromValues(0, 0);
      const toPlayer = vec2.subtract(vec2.create(), state.player.position, enemy.position);
      const distToPlayer = vec2.length(toPlayer);
      for (const enemy2 of state.enemies) {
        if (enemy2 === enemy) {
          continue;
        }
        const toEnemy2 = vec2.subtract(vec2.create(), enemy2.position, enemy.position);
        const distToEnemy2 = vec2.length(toEnemy2);
        if (enemy.parent === enemy2 && distToEnemy2 > 5 && distToPlayer > 10) {
          vec2.scaleAndAdd(acceleration, acceleration, vec2.normalize(vec2.create(), toEnemy2), 0.5);
        } else if (distToEnemy2 < enemy.sprite.radius + enemy2.sprite.radius) {
          vec2.scaleAndAdd(acceleration, acceleration, vec2.normalize(vec2.create(), toEnemy2), -0.5);
        }
      }
      if (distToPlayer < 1 + state.player.sprite.radius + enemy.sprite.radius) {
        vec2.scaleAndAdd(acceleration, acceleration, vec2.normalize(vec2.create(), toPlayer), -1.0);
      }
      if (distToPlayer < 10 && distToPlayer > 3 + state.player.sprite.radius + enemy.sprite.radius) {
        vec2.scaleAndAdd(acceleration, acceleration, vec2.normalize(vec2.create(), toPlayer), 1.0);
      }
      if (Math.random() < 1 / 60) {
        vec2.add(acceleration, acceleration, vec2.random(vec2.create(), enemy.acceleration));
      }
      accelerateDrone(enemy, acceleration, state.time.dt);
    }

    // Update player position.
    let playerIsTargetingEnemy = false;
    if (state.player.armor > 0) {
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
      if (state.pointer.down) {
        const uvx = state.pointer.x / canvas.width;
        const uvy = 1 - state.pointer.y / canvas.height;
        const fovv = state.camera.fov;
        const fovh = (fovv * canvas.width) / canvas.height;
        const px = state.camera.position[0] - fovh + uvx * 2 * fovh;
        const py = state.camera.position[1] - fovv + uvy * 2 * fovv;
        vec2.subtract(rawAcceleration, vec2.fromValues(px, py), state.player.position);
        accelerated = true;
      }
      accelerateDrone(state.player, rawAcceleration, state.time.dt);
      resources.sounds.engine0.volume(vec2.length(state.player.velocity) * 0.25);
      resources.sounds.engine0.rate(1 + vec2.length(state.player.velocity) * 0.2);

      // Update player rotation to point towards the nearest enemy.
      const playerDirection = vec2.fromValues(Math.cos(state.player.rotation), Math.sin(state.player.rotation));
      let targetedDrone: Drone | null = null;
      let maxScore = -Infinity;
      for (const enemy of state.enemies) {
        const dist = vec2.distance(enemy.position, state.player.position);
        if (dist > PLAYER_TARGETTING_DISTANCE) {
          continue;
        }
        const de = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), enemy.position, state.player.position));
        const score = (0.75 + 0.25 * vec2.dot(de, playerDirection)) / dist;
        if (score > maxScore) {
          maxScore = score;
          targetedDrone = enemy;
        }
      }
      if (targetedDrone !== null && maxScore < 5) {
        playerIsTargetingEnemy = true;
        droneTargetPoint(state.player, targetedDrone.position);
      } else if (accelerated) {
        droneTargetDirection(state.player, rawAcceleration);
      }
      rotateDrone(state.player, state.time.dt);

      // Update droid positions and rotations.
      for (const droid of state.player.droids) {
        if (Math.random() < 1 / 120) {
          droid.targetRotation = 2 * Math.PI * Math.random();
        }
        droid.targetRotation += 1 * state.time.dt;
        droid.rotation += 0.1 * (droid.targetRotation - droid.rotation);
        if (Math.random() < 1 / 120) {
          vec2.random(droid.offset, 3 * Math.random());
        }
        const targetPosition = vec2.create();
        vec2.add(targetPosition, state.player.position, droid.offset);
        vec2.scaleAndAdd(droid.position, droid.position, vec2.sub(vec2.create(), targetPosition, droid.position), 0.1);
      }
    }

    // Update enemy rotations.
    for (const enemy of state.enemies) {
      if (enemy.isCore) {
        enemy.rotation += 0.1 * state.time.dt;
        continue;
      }
      const dist = vec2.distance(enemy.position, state.player.position);
      if (dist < 10) {
        droneTargetPoint(enemy, state.player.position);
      }
      rotateDrone(enemy, state.time.dt);
    }

    // Update camera.
    state.camera.shake *= 0.9;
    vec2.scaleAndAdd(
      state.camera.position,
      state.camera.position,
      vec2.sub(vec2.create(), state.player.position, state.camera.position),
      0.125
    );
    const targetFov = 3 + 0.4 * vec2.length(state.player.velocity);
    const df = targetFov > state.camera.fov ? 0.1 : 0.01;
    state.camera.fov += df * (targetFov - state.camera.fov);

    // Update collider positions.
    state.player.collider?.setRotation(state.player.rotation);
    state.player.collider?.setTranslation({ x: state.player.position[0], y: state.player.position[1] });
    for (const enemy of state.enemies) {
      enemy.collider?.setRotation(enemy.rotation);
      enemy.collider?.setTranslation({ x: enemy.position[0], y: enemy.position[1] });
    }

    // Remove all aged beams.
    const MAX_BEAM_AGE = 2;
    state.beams = state.beams.filter((beam) => state.time.now - beam.timestamp < MAX_BEAM_AGE);

    // Remove all tired sparks.
    state.sparks = state.sparks.filter((spark) => {
      return spark.velocity > 1 / 255;
    });

    // Update all flames.
    for (const flame of state.flames) {
      flame.age += state.time.dt;
    }

    // Remove all aged flames.
    state.flames = state.flames.filter((f) => f.age < 6.0);

    // Fire player ion cannons.
    if (
      state.player.armor > 0 &&
      playerIsTargetingEnemy &&
      state.time.now - state.player.ionCannonLastFired > 1 / state.player.ionCannonFiringRate
    ) {
      fireDroneWeapons(state.player, state);
      const id = resources.sounds.shoot0.play();
      resources.sounds.shoot0.rate(Math.random() * 0.5 + 0.75, id);
      resources.sounds.shoot0.volume(0.125, id);
    }
    if (state.player.armor > 0) {
      for (const droid of state.player.droids) {
        if (state.time.now - droid.ionCannonLastFired > 1 / state.player.ionCannonFiringRate) {
          const target = randomChoice(state.enemies);
          if (target && vec2.distance(target.position, droid.position) < PLAYER_TARGETTING_DISTANCE) {
            const direction = vec2.sub(vec2.create(), target.position, droid.position);
            vec2.normalize(direction, direction);
            state.beams.push({
              position: vec2.clone(droid.position),
              lastPosition: vec2.clone(droid.position),
              direction,
              velocity: 3 * (0.5 * state.player.ionCannonBeamSpeed + 0.5 * Math.random() * state.player.ionCannonBeamSpeed),
              timestamp: state.time.now,
              power: state.player.ionCannonPower * 0.1,
              team: state.player.team,
            });
            droid.ionCannonLastFired = state.time.now;
          }
        }
      }
    }

    // Fire player missiles.
    if (state.player.armor > 0 && state.time.now - state.player.missileLastFired > 10 / state.player.missileFiringRate) {
      const target = randomChoice(state.enemies);
      if (target && vec2.distance(state.player.position, target.position) < PLAYER_TARGETTING_DISTANCE) {
        state.missiles.push({
          position: vec2.clone(state.player.position),
          velocity: vec2.create(),
          target,
          parent: state.player,
          timestamp: state.time.now,
        });
        state.player.missileLastFired = state.time.now;
      }
    }

    // Fire enemy weapons.
    if (state.player.armor > 0) {
      for (const enemy of state.enemies) {
        if (enemy.isCore) {
          continue;
        }
        if (state.time.now - enemy.ionCannonLastFired < 1 / enemy.ionCannonFiringRate) {
          continue;
        }
        const dist = vec2.distance(state.player.position, enemy.position);
        if (dist > 5) {
          continue;
        }
        fireDroneWeapons(enemy, state);
        const id = resources.sounds.shoot0.play();
        resources.sounds.shoot0.rate(Math.random() * 0.5 + 0.75, id);
        resources.sounds.shoot0.volume(0.125 / vec2.distance(state.player.position, enemy.position), id);
      }
    }

    // Update all beams.
    for (const beam of state.beams) {
      vec2.copy(beam.lastPosition, beam.position);
      vec2.scaleAndAdd(beam.position, beam.position, beam.direction, state.time.dt * beam.velocity);
    }

    // Update all sparks.
    for (const spark of state.sparks) {
      spark.velocity *= spark.decay;
      vec2.copy(spark.lastPosition, spark.position);
      vec2.scaleAndAdd(spark.position, spark.position, spark.direction, state.time.dt * spark.velocity);
    }

    // Update all missiles.
    const missilesToRemove: Missile[] = [];
    for (const missile of state.missiles) {
      if (missile.target.armor < 0) {
        missilesToRemove.push(missile);
        continue;
      }
      if (state.time.now - missile.timestamp > 10) {
        missilesToRemove.push(missile);
        continue;
      }
      state.flames.push({
        position: vec2.clone(missile.position),
        scale: 0.25,
        age: 0,
      });
      const accel = vec2.sub(vec2.create(), missile.target.position, missile.position);
      vec2.normalize(accel, accel);
      vec2.scale(accel, accel, 100.0);
      vec2.scaleAndAdd(accel, accel, missile.velocity, -10.0); // drag
      vec2.scaleAndAdd(missile.velocity, missile.velocity, accel, state.time.dt);
      vec2.scaleAndAdd(missile.position, missile.position, missile.velocity, state.time.dt);
      if (vec2.distance(missile.position, missile.target.position) < missile.target.sprite.radius) {
        addExplosion(state, missile.position, 0.25);
        damageDrone(missile.target, missile.parent.missilePower * 10.0);
        const id = resources.sounds.explode0.play();
        resources.sounds.explode0.volume(1 / vec2.dist(state.player.position, missile.position), id);
        missilesToRemove.push(missile);
      }
    }

    state.missiles = state.missiles.filter((m) => !missilesToRemove.includes(m));

    // Handle any beams that hit something.
    const ray = new RAPIER.Ray({ x: 0, y: 0 }, { x: 0, y: 0 });
    const newBeams: Beam[] = [];
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
        // Get the target we hit.
        let target: Drone | undefined = state.player;
        if (hit.collider !== state.player.collider) {
          target = state.enemies.find((e) => e.collider === hit.collider);
        }
        if (target) {
          // We hit something!
          // Make a sound.
          if (target === state.player) {
            const id = resources.sounds.hit0.play();
            resources.sounds.hit0.rate(Math.random() * 0.5 + 0.75, id);
            resources.sounds.hit0.volume(0.25, id);
            state.camera.shake = 0.5;
          } else {
            const id = resources.sounds.hit0.play();
            resources.sounds.hit0.rate(Math.random() * 0.5 + 0.75, id);
            resources.sounds.hit0.volume(0.25 / vec2.distance(state.player.position, target.position), id);
          }

          // Create some sparks.
          for (let i = 0; i < 32; i++) {
            state.sparks.push({
              position: vec2.clone(beam.position),
              lastPosition: vec2.clone(beam.position),
              direction: vec2.normalize(
                vec2.create(),
                vec2.add(vec2.create(), vec2.fromValues(hit.normal.x, hit.normal.y), vec2.random(vec2.create(), 0.5))
              ),
              velocity: 10 * Math.random(),
              decay: 0.7 + 0.2 * Math.random(),
              source: target.shields > beam.power ? "shields" : "armor",
            });
          }

          // Handle impact.
          const IMPACT_SCALE = 1;
          if (state.player.impact && target != state.player && !target.isCore) {
            target.rotation += IMPACT_SCALE * Math.random() - 0.5 * IMPACT_SCALE;
          }

          // Handle stun.
          if (state.player.stun && target != state.player) {
            target.slow *= 0.9;
          }

          // Handle ricochet.
          if (state.player.ricochet && target !== state.player) {
            if (Math.random() < 0.5) {
              const nextTarget = randomChoice(state.enemies);
              if (nextTarget && nextTarget !== target) {
                const direction = vec2.sub(vec2.create(), nextTarget.position, target.position);
                vec2.normalize(direction, direction);
                const position = vec2.scaleAndAdd(vec2.create(), target.position, direction, target.sprite.radius);
                newBeams.push({
                  position,
                  lastPosition: vec2.clone(position),
                  direction,
                  velocity: beam.velocity,
                  timestamp: state.time.now,
                  power: beam.power,
                  team: beam.team,
                });
              }
            }
          }
          damageDrone(target, beam.power);
        }
        return false;
      }
      return true;
    });

    // Add ricochet beams to beam list.
    state.beams.push(...newBeams);

    // If a core dies, kill its children.
    state.enemies.forEach((e) => {
      if (e.parent && e.parent.armor <= 0 && Math.random() < 1 / 60) {
        e.armor = -1;
      }
    });

    // Remove any dead enemies.
    state.enemies = state.enemies.filter((enemy) => {
      if (enemy.armor > 0) {
        return true;
      }
      explodeDrone(enemy, state);
      state.camera.shake = 2 * enemy.sprite.radius;
      const id = resources.sounds.explode0.play();
      resources.sounds.explode0.volume(enemy.sprite.radius / vec2.distance(state.player.position, enemy.position), id);
      return false;
    });

    // Check to see if we've completed the level.
    if (state.levelEndTimestamp === null) {
      if (state.player.armor <= 0) {
        state.levelEndTimestamp = state.time.now;
        explodeDrone(state.player, state);
        state.camera.shake = 3;
        resources.sounds.explode0.play();
        resources.sounds.engine0.volume(0);
      }
      if (state.enemies.length === 0) {
        state.levelEndTimestamp = state.time.now;
      }
    }

    // If the level has ended, handle the necessary updates.
    if (state.levelEndTimestamp !== null && state.time.now - state.levelEndTimestamp > 2.0) {
      if (state.player.armor <= 0) {
        resources.sounds.engine0.mute(true);
        await loseGame();
        resources.sounds.engine0.mute(false);
        eventManager.dispose();
        return;
      }
      if (state.level === 100) {
        resources.sounds.engine0.mute(true);
        await winGame();
        resources.sounds.engine0.mute(false);
        eventManager.dispose();
        return;
      }
      resources.sounds.engine0.mute(true);
      await levelEnd(state, resources);
      resources.sounds.engine0.mute(false);
      if (Math.random() < 0.1) {
        resources.sounds.engine0.mute(true);
        await permanentUpgrade(state, resources);
        resources.sounds.engine0.mute(false);
      }
      state.levelEndTimestamp = null;
      state.level++;
      initLevel(state, resources);
    }

    renderer.render(state);
    await animationFrame();
  }
}
