import { vec2 } from "gl-matrix";
import RAPIER, { ColliderDesc, Collider } from "@dimforge/rapier2d-compat";
import { Resources, Sprite } from "../controller/loading";
import { modulo, randomChoice, vec2Origin } from "../util";

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

export interface Positioned {
  position: vec2;
}

const colliderDescs = new Map<Sprite, ColliderDesc>();

function getColliderDesc(sprite: Sprite): RAPIER.ColliderDesc {
  if (sprite.outline === undefined) {
    throw new Error("No outline available for collider.");
  }
  if (!colliderDescs.has(sprite)) {
    const desc = RAPIER.ColliderDesc.polyline(new Float32Array((sprite.outline as number[][]).flat()));
    colliderDescs.set(sprite, desc);
  }
  return colliderDescs.get(sprite)!;
}

export interface Drone {
  sprite: Sprite;
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
  maxArmor: number;
}

export function createDrone(world: RAPIER.World, sprite: Sprite): Drone {
  const collider = world.createCollider(getColliderDesc(sprite));
  collider.setMass(0);
  return {
    sprite: sprite,
    collider,
    position: vec2.fromValues(0, 0),
    rotation: 0,
    targetRotation: 0,
    velocity: vec2.fromValues(0, 0),
    force: vec2.fromValues(0, 0),
    acceleration: 1,
    drag: 2,
    armor: 1,
    shield: 0,
    isCore: false,
    firingRate: 1,
    weaponPower: 1,
    lastFired: 0,
    lasers: 1,
    beamSpeed: 1,
    turningSpeed: 1,
    maxArmor: 1,
  };
}

export function randomInteriorPoint(drone: Drone) {
  const p = vec2.clone(randomChoice(drone.sprite.outline!) as vec2);
  vec2.rotate(p, p, vec2Origin, drone.rotation);
  vec2.add(p, p, drone.position);
  vec2.scaleAndAdd(p, drone.position, vec2.sub(vec2.create(), p, drone.position), Math.random());
  return p;
}

export function explodeDrone(drone: Drone, state: State) {
  for (let j = 0; j < drone.sprite.outline!.length; j++) {
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

export function rotateDrone(drone: Drone, dt: number) {
  drone.targetRotation = modulo(drone.targetRotation, 2 * Math.PI);
  drone.rotation = modulo(drone.rotation, 2 * Math.PI);
  let dr = drone.targetRotation - drone.rotation;
  if (Math.abs(dr) > Math.PI) {
    dr = -Math.sign(dr) * (2 * Math.PI - Math.abs(dr));
  }
  const maxTurn = 1.0 * drone.turningSpeed * dt;
  if (Math.abs(dr) > maxTurn) {
    dr = Math.sign(dr) * maxTurn;
  }
  drone.rotation += dr;
}

export function accelerateDrone(drone: Drone, rawAcceleration: vec2, dt: number) {
  const accel = vec2.normalize(vec2.create(), rawAcceleration);
  vec2.scale(accel, accel, 5.0 * drone.acceleration);
  const drag = vec2.scale(vec2.create(), drone.velocity, -drone.drag);
  vec2.add(accel, accel, drag);
  vec2.scaleAndAdd(drone.velocity, drone.velocity, accel, dt);
  vec2.scaleAndAdd(drone.position, drone.position, drone.velocity, dt);
}

export function droneTargetDirection(drone: Drone, direction: vec2) {
  const q = vec2.normalize(vec2.create(), direction);
  drone.targetRotation = Math.atan2(q[1], q[0]);
}

export function droneTargetPoint(drone: Drone, point: vec2) {
  const de = vec2.sub(vec2.create(), point, drone.position);
  droneTargetDirection(drone, de);
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
    player: createDrone(world, resources["ship0"] as Sprite),
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
