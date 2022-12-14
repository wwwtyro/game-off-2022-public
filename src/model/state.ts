import RAPIER from "@dimforge/rapier2d-compat";
import { vec2 } from "gl-matrix";
import { Resources, Sprite } from "../controller/loading";
import { vec2RandomOffset } from "../util";
import { Drone, createDrone } from "./drone";
import { Beam, Spark, Flame, Missile, SparkSource } from "./model";
import { PlayerDrone } from "./player-drones";
import { getPermanentUpgrades, Upgrade, upgradeDrone } from "./upgrades";

export interface Pointer {
  position: vec2;
  down: boolean;
  type?: "mouse" | "touch";
  origin: vec2;
}

export interface Camera {
  position: vec2;
  fov: number;
  shake: number;
}

export interface State {
  time: {
    last: number;
    now: number;
    dt: number;
  };
  world: RAPIER.World;
  camera: Camera;
  player: Drone;
  missiles: Missile[];
  enemies: Drone[];
  beams: Beam[];
  sparks: Spark[];
  flames: Flame[];
  keys: Record<string, boolean>;
  pointer: Pointer;
  level: number;
  levelEndTimestamp: number | null;
  newPermanentUpgrades: Upgrade[];
}

export function buildState(resources: Resources, playerDrone: PlayerDrone): State {
  const world = new RAPIER.World({ x: 0, y: 0 });

  const state = {
    time: {
      last: 0,
      now: 0,
      dt: 0,
    },
    world,
    camera: {
      position: vec2.fromValues(0, 0),
      fov: 2,
      shake: 0,
    },
    player: createDrone(world, (resources.sprites as Record<string, Sprite>)[playerDrone.spriteId]),
    missiles: [],
    enemies: [],
    beams: [],
    sparks: [],
    flames: [],
    keys: {},
    pointer: {
      position: vec2.create(),
      down: false,
      origin: vec2.create(),
    },
    level: 1,
    levelEndTimestamp: null,
    newPermanentUpgrades: [],
  };

  state.player.armor = 5;
  state.player.maxArmor = 5;
  state.player.droidSprite = resources.sprites.playerDroid00;
  for (const upgrade of getPermanentUpgrades()) {
    upgradeDrone(upgrade, state.player);
  }
  for (const upgrade of playerDrone.getUpgrades()) {
    upgradeDrone(upgrade, state.player);
  }

  state.player.team = "player";

  return state;
}

export function addExplosion(state: State, center: vec2, radius: number) {
  for (let i = 0; i < 256; i++) {
    const offset = vec2.random(vec2.create(), Math.random() * radius);
    const direction = vec2.normalize(vec2.create(), offset);
    const position = vec2.add(vec2.create(), center, offset);
    state.sparks.push({
      position,
      lastPosition: vec2.clone(position),
      direction,
      velocity: radius * -4 * Math.log(1 - Math.random()),
      decay: 0.7 + 0.29 * Math.random(),
      source: "armor",
    });
  }
  for (let i = 0; i < 128; i++) {
    state.flames.push({
      position: vec2RandomOffset(center, radius),
      scale: 0.5 * radius + 0.25 * Math.random() * radius,
      age: -0.25 * Math.random(),
    });
  }
}

export function addSparks(state: State, position: vec2, count: number, source: SparkSource, normal?: vec2) {
  for (let i = 0; i < count; i++) {
    state.sparks.push({
      position: vec2.clone(position),
      lastPosition: vec2.clone(position),
      direction: normal
        ? vec2.normalize(vec2.create(), vec2.add(vec2.create(), normal, vec2.random(vec2.create(), 0.5)))
        : vec2.random(vec2.create(), 1),
      velocity: 10 * Math.random(),
      decay: 0.7 + 0.2 * Math.random(),
      source: source,
    });
  }
}
