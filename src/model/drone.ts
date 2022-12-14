import RAPIER, { Collider, ColliderDesc } from "@dimforge/rapier2d-compat";
import { vec2 } from "gl-matrix";
import { Sprite } from "../controller/loading";
import { randomChoice, vec2Origin, modulo } from "../util";
import { Droid } from "./droid";
import { Team } from "./model";
import { addExplosion, State } from "./state";
import { Upgrade } from "./upgrades";

export interface Drone {
  tempUpgrades: Upgrade[];
  droids: Droid[];
  droidSprite?: Sprite;
  parent?: Drone;
  sprite: Sprite;
  collider: Collider | null;
  position: vec2;
  velocity: vec2;
  rotation: number;
  targetRotation: number;
  acceleration: number;
  drag: number;
  armor: number;
  maxArmor: number;
  shields: number;
  maxShields: number;
  shieldRecharge: number;
  isCore: boolean;
  ionCannonFiringRate: number;
  ionCannonLastFired: number;
  ionCannonPower: number;
  ionCannons: number;
  missileFiringRate: number;
  missileLastFired: number;
  missilePower: number;
  ionCannonBeamSpeed: number;
  turningSpeed: number;
  ricochet: boolean;
  team: Team;
  stun: boolean;
  impact: boolean;
  slow: number;
  dead: boolean;
  splash: boolean;
  deflect: boolean;
}

export function createDrone(world: RAPIER.World, sprite: Sprite): Drone {
  const collider = world.createCollider(getColliderDesc(sprite));
  collider.setMass(0);
  return {
    tempUpgrades: [],
    droids: [],
    sprite: sprite,
    collider,
    position: vec2.fromValues(0, 0),
    rotation: 0,
    targetRotation: 0,
    velocity: vec2.fromValues(0, 0),
    acceleration: 1,
    drag: 2,
    armor: 1,
    maxArmor: 1,
    shields: 0,
    maxShields: 0,
    shieldRecharge: 1,
    isCore: false,
    ionCannonFiringRate: 1,
    ionCannonPower: 1,
    ionCannonLastFired: 0,
    ionCannons: 1,
    ionCannonBeamSpeed: 1,
    missileFiringRate: 0,
    missileLastFired: 0,
    missilePower: 1,
    turningSpeed: 1,
    ricochet: false,
    team: "enemy",
    stun: false,
    impact: false,
    slow: 1,
    dead: false,
    splash: false,
    deflect: false,
  };
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

export function randomInteriorPoint(drone: Drone) {
  const p = vec2.clone(randomChoice(drone.sprite.outline!) as vec2);
  vec2.rotate(p, p, vec2Origin, drone.rotation);
  vec2.add(p, p, drone.position);
  vec2.scaleAndAdd(p, drone.position, vec2.sub(vec2.create(), p, drone.position), Math.random());
  return p;
}

export function chargeDroneShields(drone: Drone, dt: number) {
  drone.shields += dt * drone.shieldRecharge;
  drone.shields = Math.min(drone.shields, drone.maxShields);
  drone.shields = Math.max(drone.shields, 0.0);
}

export function explodeDrone(drone: Drone, state: State) {
  if (drone.collider) {
    state.world.removeCollider(drone.collider, false);
    drone.collider = null;
  }
  addExplosion(state, drone.position, drone.sprite.radius);
}

export function fireDroneWeapons(drone: Drone, state: State) {
  const direction = vec2.fromValues(Math.cos(drone.rotation), Math.sin(drone.rotation));
  for (let i = 0; i < drone.ionCannons; i++) {
    const step = (0.25 * drone.sprite.width!) / (drone.ionCannons + 1);
    const start = vec2.fromValues(0, -1);
    vec2.rotate(start, start, vec2Origin, drone.rotation);
    vec2.scaleAndAdd(start, drone.position, start, 0.5 * 0.25 * drone.sprite.width!);
    const offset = vec2.fromValues(0, 1);
    vec2.rotate(offset, offset, vec2Origin, drone.rotation);
    const position = vec2.scaleAndAdd(vec2.create(), start, offset, (i + 1) * step);
    state.beams.push({
      position,
      lastPosition: vec2.clone(position),
      direction: vec2.clone(direction),
      velocity: drone.slow * 3 * (0.5 * drone.ionCannonBeamSpeed + 0.5 * Math.random() * drone.ionCannonBeamSpeed),
      timestamp: state.time.now,
      power: state.player.ionCannonPower,
      team: drone.team,
    });
  }
  drone.ionCannonLastFired = state.time.now;
}

export function rotateDrone(drone: Drone, dt: number) {
  drone.targetRotation = modulo(drone.targetRotation, 2 * Math.PI);
  drone.rotation = modulo(drone.rotation, 2 * Math.PI);
  let dr = drone.targetRotation - drone.rotation;
  if (Math.abs(dr) > Math.PI) {
    dr = -Math.sign(dr) * (2 * Math.PI - Math.abs(dr));
  }
  const maxTurn = 1.0 * drone.slow * drone.turningSpeed * dt;
  if (Math.abs(dr) > maxTurn) {
    dr = Math.sign(dr) * maxTurn;
  }
  drone.rotation += dr;
}

export function damageDrone(drone: Drone, damage: number) {
  const shieldDamage = Math.min(drone.shields, damage);
  const armorDamage = damage - shieldDamage;
  drone.shields -= shieldDamage;
  drone.armor -= armorDamage;
}

export function accelerateDrone(drone: Drone, rawAcceleration: vec2, dt: number) {
  const accel = vec2.normalize(vec2.create(), rawAcceleration);
  vec2.scale(accel, accel, 5 * drone.slow * drone.acceleration);
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
