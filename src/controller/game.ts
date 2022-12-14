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
import { State, buildState, addExplosion, addSparks } from "../model/state";
import { applyRandomUpgrade } from "../model/upgrades";
import { animationFrame, randomChoice, vec2RandomOffset } from "../util";
import { Renderer } from "../view/renderer";
import { inGameOptionsMenu } from "./in-game-options-menu";
import { levelEnd } from "./level-end";
import { Resources, Sprite } from "./loading";
import { loseGame } from "./lose-game";
import { permanentUpgrade } from "./permanent-upgrade";
import { winGame } from "./win-game";

const PLAYER_TARGETTING_DISTANCE = 6;

function initLevel(state: State, resources: Resources) {
  const bossLevels = 5;
  const coreCount = state.level % bossLevels === 0 ? Math.floor(state.level / bossLevels) + 1 : 1;
  const coreSprite = resources.sprites.enemyCore00;
  const coreRadius = 0.5 * coreCount * coreSprite.radius;
  const coreCenter = vec2.random(vec2.create(), Math.random() * 32);
  while (vec2.distance(coreCenter, state.player.position) < 16 + coreRadius) {
    vec2.random(coreCenter, Math.random() * (32 + coreRadius));
  }
  state.enemies.length = 0;
  for (let i = 0; i < coreCount; i++) {
    const enemyCore = createDrone(state.world, resources.sprites.enemyCore00);
    enemyCore.isCore = true;
    enemyCore.maxArmor = 10 + state.level * state.level;
    enemyCore.armor = enemyCore.maxArmor;
    const angle = (2 * Math.PI * i) / coreCount;
    vec2.set(enemyCore.position, coreRadius * Math.cos(angle), coreRadius * Math.sin(angle));
    vec2.add(enemyCore.position, enemyCore.position, coreCenter);
    state.enemies.push(enemyCore);
    const children: Drone[] = [];
    let pointsLeft = state.level;
    if (state.level === 100) {
      pointsLeft = 400;
    }
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

  let openMenuRequest = false;
  const menubutton = document.getElementById("game-menu-button");
  if (!menubutton) {
    throw new Error("Couldn't find menu button.");
  }
  menubutton.style.display = "block";
  eventManager.addEventListener(menubutton, "click", () => {
    resources.sounds.click0.play();
    openMenuRequest = true;
  });

  const canvas = document.getElementById("render-canvas") as HTMLCanvasElement;
  canvas.style.display = "block";
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  const renderer = new Renderer(canvas, resources);

  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.style.pointerEvents = "none";
  thumbCanvas.style.position = "fixed";
  thumbCanvas.style.top = "0px";
  thumbCanvas.style.left = "0px";
  const thumbCtx = thumbCanvas.getContext("2d");

  function removeThumb() {
    if (thumbCanvas.parentElement !== null) {
      document.body.removeChild(thumbCanvas);
    }
  }

  function renderThumb() {
    if (!thumbCtx) {
      return;
    }
    document.body.appendChild(thumbCanvas);
    thumbCanvas.height = thumbCanvas.width = Math.round(0.5 * Math.min(canvas.width, canvas.height));
    const w = thumbCanvas.width;
    const h = thumbCanvas.height;
    thumbCtx.strokeStyle = "rgba(255,255,255,0.5)";
    thumbCtx.beginPath();
    thumbCtx.arc(0.5 * w, 0.5 * h, 0.5 * w - 1, 0, 2 * Math.PI);
    thumbCtx.stroke();
    const delta = vec2.subtract(vec2.create(), state.pointer.position, state.pointer.origin);
    if (vec2.length(delta) > 0.25 * w) {
      vec2.normalize(delta, delta);
      vec2.scale(delta, delta, 0.25 * w);
    }
    thumbCtx.beginPath();
    thumbCtx.arc(0.5 * w + delta[0], 0.5 * h + delta[1], 0.25 * w, 0, 2 * Math.PI);
    thumbCtx.stroke();

    thumbCanvas.style.left = `${state.pointer.origin[0] - 0.5 * w}px`;
    thumbCanvas.style.top = `${state.pointer.origin[1] - 0.5 * h}px`;
  }

  eventManager.addEventListener(window, "keydown", (e) => {
    state.keys[e.code] = true;
  });

  eventManager.addEventListener(window, "keyup", (e) => {
    state.keys[e.code] = false;
  });

  eventManager.addEventListener(canvas, "pointerdown", (e) => {
    vec2.set(state.pointer.position, e.offsetX, e.offsetY);
    vec2.copy(state.pointer.origin, state.pointer.position);
    state.pointer.type = e.pointerType;
    state.pointer.down = true;
  });

  eventManager.addEventListener(canvas, "pointerup", (e) => {
    state.pointer.type = e.pointerType;
    state.pointer.down = false;
  });

  eventManager.addEventListener(canvas, "pointerleave", (e) => {
    state.pointer.type = e.pointerType;
    state.pointer.down = false;
  });

  eventManager.addEventListener(canvas, "pointerout", (e) => {
    state.pointer.type = e.pointerType;
    state.pointer.down = false;
  });

  eventManager.addEventListener(canvas, "pointermove", (e) => {
    state.pointer.type = e.pointerType;
    vec2.set(state.pointer.position, e.offsetX, e.offsetY);
  });

  const stats = document.getElementById("game-stats") as HTMLElement;
  stats.style.display = "block";
  stats.innerText = "";

  function exit() {
    removeThumb();
    eventManager.dispose();
    canvas.style.opacity = "100%";
    document.getElementById("game-menu-button")!.style.display = "none";
  }

  while (true) {
    const timestamp = performance.now() / 1000;
    state.time.dt = Math.min(timestamp - state.time.last, 1 / 30);
    state.time.now += state.time.dt;
    state.time.last = timestamp;

    stats.innerHTML = `Level ${state.level} / Elapsed time: ${new Date(state.time.now * 1000).toISOString().substring(11, 19)}`;
    removeThumb();

    if (state.keys["Escape"] || openMenuRequest) {
      resources.sounds.engine0.mute(true);
      await inGameOptionsMenu(state, resources);
      resources.sounds.engine0.mute(false);
      openMenuRequest = false;
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
    if (!state.player.dead) {
      const rawAcceleration = vec2.fromValues(0, 0);
      let accelerated = false;
      if (state.keys.KeyA || state.keys.ArrowLeft) {
        rawAcceleration[0] -= 1;
        accelerated = true;
      }
      if (state.keys.KeyD || state.keys.ArrowRight) {
        rawAcceleration[0] += 1;
        accelerated = true;
      }
      if (state.keys.KeyS || state.keys.ArrowDown) {
        rawAcceleration[1] -= 1;
        accelerated = true;
      }
      if (state.keys.KeyW || state.keys.ArrowUp) {
        rawAcceleration[1] += 1;
        accelerated = true;
      }
      if (state.pointer.down) {
        if (state.pointer.type === "mouse") {
          const uvx = state.pointer.position[0] / canvas.width;
          const uvy = 1 - state.pointer.position[1] / canvas.height;
          const fov = renderer.getFov(state.camera);
          const px = state.camera.position[0] - fov.x + uvx * 2 * fov.x;
          const py = state.camera.position[1] - fov.y + uvy * 2 * fov.y;
          vec2.subtract(rawAcceleration, vec2.fromValues(px, py), state.player.position);
        } else {
          vec2.subtract(rawAcceleration, state.pointer.position, state.pointer.origin);
          rawAcceleration[1] *= -1;
          renderThumb();
        }
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
      !state.player.dead &&
      playerIsTargetingEnemy &&
      state.time.now - state.player.ionCannonLastFired > 1 / state.player.ionCannonFiringRate
    ) {
      fireDroneWeapons(state.player, state);
      const id = resources.sounds.shoot0.play();
      resources.sounds.shoot0.rate(Math.random() * 0.5 + 0.75, id);
      resources.sounds.shoot0.volume(0.125, id);
    }
    if (!state.player.dead) {
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
    if (!state.player.dead && state.time.now - state.player.missileLastFired > 10 / state.player.missileFiringRate) {
      const target = randomChoice(state.enemies);
      if (target && vec2.distance(state.player.position, target.position) < 1.5 * PLAYER_TARGETTING_DISTANCE) {
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
    if (!state.player.dead) {
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
      if (missile.target.dead) {
        addExplosion(state, missile.position, 0.25);
        missilesToRemove.push(missile);
        continue;
      }
      if (state.time.now - missile.timestamp > 10) {
        addExplosion(state, missile.position, 0.25);
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
        const damage = missile.parent.missilePower * 10;
        addExplosion(state, missile.position, 0.25);
        damageDrone(missile.target, damage);
        const id = resources.sounds.explode0.play();
        resources.sounds.explode0.volume(1 / vec2.dist(state.player.position, missile.position), id);
        if (state.player.splash) {
          for (const enemy of state.enemies) {
            if (enemy === missile.target) {
              continue;
            }
            const dist = vec2.distance(missile.position, enemy.position);
            const splashDamage = damage * Math.exp(-dist);
            damageDrone(enemy, splashDamage);
          }
        }
        missilesToRemove.push(missile);
      }
    }

    // Remove dead missiles.
    state.missiles = state.missiles.filter((m) => !missilesToRemove.includes(m));

    // If the player has the droid deflection upgrade, deflect beams.
    if (!state.player.dead && state.player.deflect) {
      state.beams = state.beams.filter((beam) => {
        if (beam.team === "player") {
          return true;
        }
        for (const droid of state.player.droids) {
          if (vec2.distance(droid.position, beam.position) <= droid.sprite.radius) {
            // Create some sparks.
            const normal = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), beam.position, droid.position));
            addSparks(state, beam.position, 32, "shields", normal);
            return false;
          }
        }
        return true;
      });
    }

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
          const normal = vec2.fromValues(hit.normal.x, hit.normal.y);
          addSparks(state, beam.position, 32, target.shields > beam.power ? "shields" : "armor", normal);

          // Handle impact.
          const IMPACT_SCALE = 1;
          if (state.player.impact && target != state.player && !target.isCore) {
            target.rotation += IMPACT_SCALE * Math.random() - 0.5 * IMPACT_SCALE;
            vec2.scaleAndAdd(target.velocity, target.velocity, beam.direction, 0.1 * beam.power);
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
      if (e.parent && e.parent.dead && Math.random() < 1 / 60) {
        e.armor = -1;
        e.dead = true;
      }
    });

    // Remove any dead enemies.
    state.enemies = state.enemies.filter((enemy) => {
      if (enemy.armor <= 0) {
        enemy.dead = true;
      }
      if (!enemy.dead) {
        return true;
      }
      explodeDrone(enemy, state);
      state.camera.shake = 2 * enemy.sprite.radius;
      const id = resources.sounds.explode0.play();
      resources.sounds.explode0.volume(enemy.sprite.radius / vec2.distance(state.player.position, enemy.position), id);
      return false;
    });

    if (state.player.armor <= 0) {
      if (!state.player.dead) {
        state.player.dead = true;
        state.levelEndTimestamp = state.time.now;
        explodeDrone(state.player, state);
        state.camera.shake = 3;
        resources.sounds.explode0.play();
        resources.sounds.engine0.volume(0);
      }
    }

    // Check to see if we've completed the level.
    if (state.levelEndTimestamp === null) {
      if (state.enemies.length === 0) {
        state.levelEndTimestamp = state.time.now;
      }
    }

    // If the level has ended, handle the necessary updates.
    if (state.levelEndTimestamp !== null && state.time.now - state.levelEndTimestamp > 2.0) {
      if (state.player.dead) {
        resources.sounds.engine0.mute(true);
        await loseGame(state);
        resources.sounds.engine0.mute(false);
        exit();
        return;
      }
      if (state.level === 100) {
        resources.sounds.engine0.mute(true);
        await winGame(state);
        const t0 = performance.now();
        while (performance.now() - t0 < 10000) {
          const timestamp = performance.now() / 1000;
          state.time.dt = Math.min(timestamp - state.time.last, 1 / 30);
          state.time.now += state.time.dt;
          state.time.last = timestamp;

          const dt = performance.now() - t0;
          canvas.style.opacity = "100%";
          if (dt > 7000) {
            canvas.style.opacity = `${100 * (1.0 - (dt - 7000) / 3000)}%`;
          }
          if (Math.random() < 1 / 5) {
            addExplosion(state, vec2RandomOffset(state.player.position, 1 * state.camera.fov), 0.1 + Math.random());
            state.camera.shake = 1;
            resources.sounds.explode0.play();
          }
          for (const spark of state.sparks) {
            spark.velocity *= spark.decay;
            vec2.copy(spark.lastPosition, spark.position);
            vec2.scaleAndAdd(spark.position, spark.position, spark.direction, state.time.dt * spark.velocity);
          }
          for (const flame of state.flames) {
            flame.age += state.time.dt;
          }
          state.flames = state.flames.filter((f) => f.age < 6.0);
          renderer.render(state);
          await animationFrame();
        }
        exit();
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
