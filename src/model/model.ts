import { vec2 } from "gl-matrix";
import RAPIER, { ColliderDesc, Collider } from "@dimforge/rapier2d-compat";
import { Resources, Texture } from "../controller/loading";

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
  decay: number;
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

export interface Drone {
  texture: Texture;
  collider: Collider;
  position: vec2;
  velocity: vec2;
  rotation: number;
  targetRotation: number;
  acceleration: number;
  drag: number;
}

function createDrone(world: RAPIER.World, texture: Texture): Drone {
  const collider = world.createCollider(getColliderDesc(texture));
  collider.setMass(0);
  return {
    texture,
    collider,
    position: vec2.fromValues(0, 0),
    rotation: 0,
    targetRotation: 0,
    velocity: vec2.fromValues(0, 0),
    acceleration: 10,
    drag: 2,
  };
}

export function buildState(resources: Resources) {
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
    enemies: [] as Drone[],
    beams: [] as Beam[],
    sparks: [] as Spark[],
    keys: {} as Record<string, boolean>,
  };

  for (let i = 0; i < 100; i++) {
    const enemy = createDrone(world, resources["ship1"]);
    vec2.random(enemy.position, Math.random() * 64);
    enemy.rotation = Math.random() * 2 * Math.PI;
    state.enemies.push(enemy);
  }

  return state;
}
