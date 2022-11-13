import { vec2 } from "gl-matrix";
import RAPIER, { ColliderDesc, Collider } from "@dimforge/rapier2d-compat";
import { Resources, Texture } from "../controller/loading";
import { randomChoice, vec2Origin } from "../util";

export interface Beam {
  position: vec2;
  lastPosition: vec2;
  direction: vec2;
  velocity: number;
  timestamp: number;
  power: number;
  team: "player" | "enemy";
}

export interface Spark {
  position: vec2;
  lastPosition: vec2;
  direction: vec2;
  velocity: number;
  energy: number;
  decay: number;
  smokey: boolean;
}

export interface Flame {
  position: vec2;
  age: number;
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

export interface Drone {
  texture: Texture;
  collider: Collider;
  position: vec2;
  velocity: vec2;
  force: vec2;
  rotation: number;
  targetRotation: number;
  acceleration: number;
  drag: number;
  armor: number;
  shield: number;
  isCore: boolean;
  firingRate: number;
  lastFired: number;
  weaponPower: number;
  lasers: number;
  beamSpeed: number;
  turningSpeed: number;
}

export function createDrone(world: RAPIER.World, texture: Texture): Drone {
  const collider = world.createCollider(getColliderDesc(texture));
  collider.setMass(0);
  return {
    texture,
    collider,
    position: vec2.fromValues(0, 0),
    rotation: 0,
    targetRotation: 0,
    velocity: vec2.fromValues(0, 0),
    force: vec2.fromValues(0, 0),
    acceleration: 1,
    drag: 2,
    armor: 100,
    shield: 0,
    isCore: false,
    firingRate: 1,
    weaponPower: 1,
    lastFired: 0,
    lasers: 1,
    beamSpeed: 1,
    turningSpeed: 1,
  };
}

export function randomInteriorPoint(drone: Drone) {
  const p = vec2.clone(randomChoice(drone.texture.outline!) as vec2);
  vec2.rotate(p, p, vec2Origin, drone.rotation);
  vec2.add(p, p, drone.position);
  vec2.scaleAndAdd(p, drone.position, vec2.sub(vec2.create(), p, drone.position), Math.random());
  return p;
}

export function explodeDrone(drone: Drone, state: State) {
  for (let j = 0; j < drone.texture.outline!.length; j++) {
    const p = randomInteriorPoint(drone);
    for (let i = 0; i < 4; i++) {
      state.sparks.push({
        position: vec2.clone(p),
        lastPosition: vec2.clone(p),
        direction: vec2.random(vec2.create(), 1),
        velocity: Math.random(),
        energy: 8 * -Math.log(1 - Math.random()),
        decay: 0.9 * Math.random(),
        smokey: true,
      });
      state.flames.push({
        position: vec2.clone(p),
        age: 0,
      });
    }
  }
}

export interface State {
  time: {
    now: number;
    dt: number;
  };
  world: RAPIER.World;
  camera: {
    position: vec2;
    fov: number;
  };
  player: Drone;
  enemies: Drone[];
  beams: Beam[];
  sparks: Spark[];
  flames: Flame[];
  keys: Record<string, boolean>;
  level: number;
  levelEndTimestamp: number | null;
}

export function buildState(resources: Resources): State {
  const world = new RAPIER.World({ x: 0, y: 0 });

  const state = {
    time: {
      now: 0,
      dt: 0,
    },
    world,
    camera: {
      position: vec2.fromValues(0, 0),
      fov: 2,
    },
    player: createDrone(world, resources["ship0"]),
    enemies: [],
    beams: [],
    sparks: [],
    flames: [],
    keys: {},
    level: 1,
    levelEndTimestamp: null,
  };

  return state;
}
